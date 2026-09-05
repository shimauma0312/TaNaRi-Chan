"use client"

import MinLoader from "@/components/MinLoader"
import useAuth from "@/hooks/useAuth"
import { handleClientError } from "@/utils/errorHandler.client"
import Alert from "@mui/material/Alert"
import Box from "@mui/material/Box"
import Button from "@mui/material/Button"
import Container from "@mui/material/Container"
import Dialog from "@mui/material/Dialog"
import DialogActions from "@mui/material/DialogActions"
import DialogContent from "@mui/material/DialogContent"
import DialogContentText from "@mui/material/DialogContentText"
import DialogTitle from "@mui/material/DialogTitle"
import List from "@mui/material/List"
import ListItem from "@mui/material/ListItem"
import Snackbar from "@mui/material/Snackbar"
import Stack from "@mui/material/Stack"
import Typography from "@mui/material/Typography"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

interface Article {
  post_id: number
  title: string
  createdAt: string
}

const getArticles = async (cursor?: string) => {
  const response = await fetch(
    `/api/articles?mine=true&limit=20${cursor ? `&cursor=${cursor}` : ""}`,
  )
  const data = await response.json().catch(() => null)
  if (!response.ok) throw new Error(data?.error || "記事の取得に失敗しました")
  if (!Array.isArray(data)) throw new Error("記事一覧の応答形式が不正です")
  return { articles: data as Article[], nextCursor: response.headers.get("X-Next-Cursor") }
}

const ArticlesPage = () => {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [articles, setArticles] = useState<Article[]>([])
  const [dataLoading, setDataLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [articleToDelete, setArticleToDelete] = useState<Article | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return

    const fetchData = async () => {
      setDataLoading(true)
      setError(null)
      try {
        const page = await getArticles()
        setArticles(page.articles)
        setNextCursor(page.nextCursor)
      } catch (error) {
        setError(handleClientError(error, "記事の取得に失敗しました"))
      } finally {
        setDataLoading(false)
      }
    }

    void fetchData()
  }, [user])

  if (loading || !user) return <MinLoader />

  const handleDelete = async () => {
    if (!articleToDelete || deleting) return

    setDeleting(true)
    try {
      const response = await fetch("/api/articles", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ post_id: articleToDelete.post_id }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        throw new Error(errorData?.error || "Failed to delete article")
      }

      setArticles((previous) =>
        previous.filter((article) => article.post_id !== articleToDelete.post_id),
      )
      setArticleToDelete(null)
      setNotice("記事を削除しました")
    } catch (error) {
      setNotice(handleClientError(error, "An error occurred while deleting the article"))
    } finally {
      setDeleting(false)
    }
  }

  const loadMore = async () => {
    if (!nextCursor || dataLoading) return
    setDataLoading(true)
    setError(null)
    try {
      const page = await getArticles(nextCursor)
      setArticles((previous) => [...previous, ...page.articles])
      setNextCursor(page.nextCursor)
    } catch (error) {
      setError(handleClientError(error, "記事の取得に失敗しました"))
    } finally {
      setDataLoading(false)
    }
  }

  return (
    <Container maxWidth="lg">
      <Stack spacing={3}>
        <Box
          sx={{
            alignItems: { sm: "center" },
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            gap: 2,
            justifyContent: "space-between",
          }}
        >
          <Typography component="h1" variant="h4">
            Articles
          </Typography>
          <Button variant="contained" onClick={() => router.push("/dashboard/articles/register")}>
            New Article
          </Button>
        </Box>

        {error && <Alert severity="error">{error}</Alert>}

        {dataLoading && articles.length === 0 ? (
          <MinLoader />
        ) : articles.length === 0 && !error ? (
          <Typography color="text.secondary">記事が見つかりません</Typography>
        ) : (
          <List disablePadding>
            {articles.map((article, index) => (
              <ListItem
                divider={index < articles.length - 1}
                key={article.post_id}
                sx={{ alignItems: { xs: "flex-start", sm: "center" }, flexDirection: { xs: "column", sm: "row" }, gap: 2, py: 2 }}
              >
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography component="h2" variant="h6">
                    {article.title}
                  </Typography>
                  <Typography color="text.secondary" variant="body2">
                    Published: {new Date(article.createdAt).toLocaleDateString("ja-JP")}
                  </Typography>
                </Box>
                <Stack direction="row" spacing={1}>
                  <Button
                    onClick={() =>
                      router.push(`/dashboard/articles/edit?post_id=${article.post_id}`)
                    }
                  >
                    Edit
                  </Button>
                  <Button color="error" onClick={() => setArticleToDelete(article)}>
                    Delete
                  </Button>
                </Stack>
              </ListItem>
            ))}
          </List>
        )}

        {nextCursor && (
          <Box sx={{ textAlign: "center" }}>
            <Button disabled={dataLoading} variant="outlined" onClick={() => void loadMore()}>
              {dataLoading ? "読み込み中..." : "さらに読み込む"}
            </Button>
          </Box>
        )}
      </Stack>

      <Dialog open={articleToDelete !== null} onClose={() => !deleting && setArticleToDelete(null)}>
        <DialogTitle>記事を削除しますか？</DialogTitle>
        <DialogContent>
          <DialogContentText>
            「{articleToDelete?.title}」を削除します。この操作は取り消せません。
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button disabled={deleting} onClick={() => setArticleToDelete(null)}>
            キャンセル
          </Button>
          <Button
            color="error"
            disabled={deleting}
            variant="contained"
            onClick={() => void handleDelete()}
          >
            {deleting ? "削除中..." : "削除"}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={notice !== null} autoHideDuration={5000} onClose={() => setNotice(null)}>
        <Alert
          severity={notice === "記事を削除しました" ? "success" : "error"}
          onClose={() => setNotice(null)}
        >
          {notice}
        </Alert>
      </Snackbar>
    </Container>
  )
}

export default ArticlesPage
