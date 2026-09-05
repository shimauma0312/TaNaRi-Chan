"use client"

import ArticleForm from "@/components/ArticleForm"
import MinLoader from "@/components/MinLoader"
import useAuth from "@/hooks/useAuth"
import Alert from "@mui/material/Alert"
import Button from "@mui/material/Button"
import Container from "@mui/material/Container"
import Stack from "@mui/material/Stack"
import { useRouter, useSearchParams } from "next/navigation"
import { Suspense, useEffect, useState } from "react"

async function fetchArticleData(postId: number) {
  const response = await fetch(`/api/articles?post_id=${postId}`)
  const data = await response.json().catch(() => null)
  if (!response.ok) throw new Error(data?.error || "記事の取得に失敗しました")
  return { title: data.title, content: data.content }
}

function EditArticleContent({ postId }: { postId: number | null }) {
  const router = useRouter()
  const [articleData, setArticleData] = useState({ title: "", content: "" })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (postId === null) {
      setLoading(false)
      return
    }

    const loadArticleData = async () => {
      setLoading(true)
      try {
        setArticleData(await fetchArticleData(postId))
      } catch (error) {
        console.error("Failed to load article:", error)
        setError(error instanceof Error ? error.message : "記事の取得に失敗しました")
      } finally {
        setLoading(false)
      }
    }

    void loadArticleData()
  }, [postId])

  if (postId === null) {
    return <Alert severity="error">Invalid article ID.</Alert>
  }
  if (loading) return <MinLoader />
  if (error) {
    return (
      <Container maxWidth="md">
        <Stack spacing={2}>
          <Alert severity="error">{error}</Alert>
          <Button
            sx={{ alignSelf: "flex-start" }}
            onClick={() => router.push("/dashboard/articles")}
          >
            記事一覧へ戻る
          </Button>
        </Stack>
      </Container>
    )
  }

  return (
    <ArticleForm
      postId={postId}
      initialTitle={articleData.title}
      initialContent={articleData.content}
      onSuccess={() => router.push("/dashboard/articles")}
    />
  )
}

function EditArticlePageInner() {
  const { user, loading } = useAuth()
  const searchParams = useSearchParams()
  const postIdParam = searchParams.get("post_id")
  const numericId = postIdParam ? Number(postIdParam) : null
  const postId =
    numericId !== null && Number.isSafeInteger(numericId) && numericId > 0 ? numericId : null

  if (loading || !user) return <MinLoader />
  return <EditArticleContent postId={postId} />
}

export default function EditArticlePage() {
  return (
    <Suspense fallback={<MinLoader />}>
      <EditArticlePageInner />
    </Suspense>
  )
}
