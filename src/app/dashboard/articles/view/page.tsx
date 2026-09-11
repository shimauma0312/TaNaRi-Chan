"use client"

import MinLoader from "@/components/MinLoader"
import NextLink from "@/components/NextLink"
import MarkdownPreview from "@/components/markdown/markdownPreveiw"
import useAuth from "@/hooks/useAuth"
import Alert from "@mui/material/Alert"
import Box from "@mui/material/Box"
import Container from "@mui/material/Container"
import Divider from "@mui/material/Divider"
import Link from "@mui/material/Link"
import Stack from "@mui/material/Stack"
import Typography from "@mui/material/Typography"
import { useSearchParams } from "next/navigation"
import { Suspense, useEffect, useState } from "react"

type Article = { title: string; content: string; createdAt: string }

function ArticleViewContent() {
  const { user, loading: authLoading } = useAuth()
  const searchParams = useSearchParams()
  const postId = searchParams.get("post_id")
  const [article, setArticle] = useState<Article | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const numericId = Number(postId)
    if (!Number.isSafeInteger(numericId) || numericId <= 0) {
      setError("記事IDが不正です")
      setLoading(false)
      return
    }

    const load = async () => {
      try {
        const response = await fetch(`/api/articles?post_id=${numericId}`)
        const data = await response.json().catch(() => null)
        if (!response.ok) throw new Error(data?.error || "記事の取得に失敗しました")
        setArticle(data)
      } catch (error) {
        setError(error instanceof Error ? error.message : "記事の取得に失敗しました")
      } finally {
        setLoading(false)
      }
    }

    void load()
  }, [postId])

  if (authLoading || !user || loading) return <MinLoader />

  return (
    <Container maxWidth="md">
      <Stack spacing={3}>
        <Link component={NextLink} href="/dashboard">
          ダッシュボードへ戻る
        </Link>
        {error ? (
          <Alert severity="error">{error}</Alert>
        ) : article ? (
          <Box component="article">
            <Typography component="h1" variant="h3" sx={{ mb: 1 }}>
              {article.title}
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 4 }} variant="body2">
              {new Date(article.createdAt).toLocaleDateString("ja-JP")}
            </Typography>
            <Divider sx={{ mb: 4 }} />
            <MarkdownPreview markdown={article.content} />
          </Box>
        ) : null}
      </Stack>
    </Container>
  )
}

export default function ArticleViewPage() {
  return (
    <Suspense fallback={<MinLoader />}>
      <ArticleViewContent />
    </Suspense>
  )
}
