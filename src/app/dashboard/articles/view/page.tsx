"use client"

import LikeBurst, { type BurstOrigin, likeButtonBounceSx } from "@/components/LikeBurst"
import MinLoader from "@/components/MinLoader"
import NextLink from "@/components/NextLink"
import MarkdownPreview from "@/components/markdown/markdownPreveiw"
import useAuth from "@/hooks/useAuth"
import FavoriteIcon from "@mui/icons-material/Favorite"
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder"
import Alert from "@mui/material/Alert"
import Box from "@mui/material/Box"
import Button from "@mui/material/Button"
import Container from "@mui/material/Container"
import Divider from "@mui/material/Divider"
import Link from "@mui/material/Link"
import List from "@mui/material/List"
import ListItem from "@mui/material/ListItem"
import Stack from "@mui/material/Stack"
import TextField from "@mui/material/TextField"
import Typography from "@mui/material/Typography"
import { useSearchParams } from "next/navigation"
import { Suspense, useEffect, useState } from "react"

type Article = { title: string; content: string; createdAt: string }

type LikeStatus = { post_id: number; count: number; liked: boolean }

type ArticleComment = {
  comment_id: number
  content: string
  createdAt: string
  author: { id: string; user_name: string }
}

function ArticleViewContent() {
  const { user, loading: authLoading } = useAuth()
  const searchParams = useSearchParams()
  const postId = searchParams.get("post_id")
  const [article, setArticle] = useState<Article | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [comments, setComments] = useState<ArticleComment[]>([])
  const [newComment, setNewComment] = useState("")
  const [commentError, setCommentError] = useState<string | null>(null)
  const [posting, setPosting] = useState(false)
  const [like, setLike] = useState<LikeStatus | null>(null)
  const [liking, setLiking] = useState(false)
  const [likeError, setLikeError] = useState<string | null>(null)
  const [burstKey, setBurstKey] = useState(0)
  const [burstOrigin, setBurstOrigin] = useState<BurstOrigin | null>(null)

  const numericId = Number(postId)
  const validId = Number.isSafeInteger(numericId) && numericId > 0

  useEffect(() => {
    if (!validId) {
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

    const loadComments = async () => {
      try {
        const response = await fetch(`/api/articles/comments?post_id=${numericId}`)
        const data = await response.json().catch(() => null)
        if (!response.ok || !Array.isArray(data)) {
          throw new Error(data?.error || "コメントの取得に失敗しました")
        }
        setComments(data)
      } catch (error) {
        setCommentError(error instanceof Error ? error.message : "コメントの取得に失敗しました")
      }
    }

    const loadLikes = async () => {
      try {
        const response = await fetch(`/api/articles/likes?post_id=${numericId}`)
        const data = await response.json().catch(() => null)
        if (!response.ok) throw new Error(data?.error || "いいねの取得に失敗しました")
        setLike(data)
      } catch (error) {
        setLikeError(error instanceof Error ? error.message : "いいねの取得に失敗しました")
      }
    }

    void load()
    void loadComments()
    void loadLikes()
  }, [postId])

  const handlePostComment = async () => {
    if (!newComment.trim()) return
    setPosting(true)
    setCommentError(null)
    try {
      const response = await fetch("/api/articles/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ post_id: numericId, content: newComment }),
      })
      const data = await response.json().catch(() => null)
      if (!response.ok) throw new Error(data?.error || "コメントの投稿に失敗しました")
      setComments((previous) => [...previous, data])
      setNewComment("")
    } catch (error) {
      setCommentError(error instanceof Error ? error.message : "コメントの投稿に失敗しました")
    } finally {
      setPosting(false)
    }
  }

  const handleToggleLike = async (buttonRect: DOMRect) => {
    if (!like || liking) return
    setLiking(true)
    setLikeError(null)
    if (!like.liked) {
      setBurstOrigin({
        x: buttonRect.left + buttonRect.width / 2,
        y: buttonRect.top + buttonRect.height / 2,
      })
      setBurstKey((previous) => previous + 1)
    }
    try {
      const response = await fetch("/api/articles/likes", {
        method: like.liked ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ post_id: numericId }),
      })
      const data = await response.json().catch(() => null)
      if (!response.ok) throw new Error(data?.error || "いいねの更新に失敗しました")
      setLike(data)
    } catch (error) {
      setLikeError(error instanceof Error ? error.message : "いいねの更新に失敗しました")
    } finally {
      setLiking(false)
    }
  }

  const handleDeleteComment = async (commentId: number) => {
    setCommentError(null)
    try {
      const response = await fetch(`/api/articles/comments/${commentId}`, { method: "DELETE" })
      const data = await response.json().catch(() => null)
      if (!response.ok) throw new Error(data?.error || "コメントの削除に失敗しました")
      setComments((previous) => previous.filter((comment) => comment.comment_id !== commentId))
    } catch (error) {
      setCommentError(error instanceof Error ? error.message : "コメントの削除に失敗しました")
    }
  }

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
          <>
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

            {(like || likeError) && (
              <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                {like && (
                  <Box sx={{ display: "inline-flex", ...likeButtonBounceSx(burstKey) }}>
                    <Button
                      aria-pressed={like.liked}
                      color="error"
                      disabled={liking}
                      startIcon={like.liked ? <FavoriteIcon /> : <FavoriteBorderIcon />}
                      variant={like.liked ? "contained" : "outlined"}
                      onClick={(event) =>
                        void handleToggleLike(event.currentTarget.getBoundingClientRect())
                      }
                    >
                      いいね！ {like.count}
                    </Button>
                    <LikeBurst burstKey={burstKey} origin={burstOrigin} />
                  </Box>
                )}
                {likeError && <Alert severity="error">{likeError}</Alert>}
              </Stack>
            )}

            <Divider />
            <Box>
              <Typography component="h2" variant="h5" sx={{ mb: 2 }}>
                コメント
              </Typography>
              {commentError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {commentError}
                </Alert>
              )}
              {comments.length === 0 ? (
                <Typography color="text.secondary">コメントはまだありません</Typography>
              ) : (
                <List disablePadding>
                  {comments.map((comment) => (
                    <ListItem
                      key={comment.comment_id}
                      sx={{
                        alignItems: "flex-start",
                        flexDirection: "column",
                        gap: 0.5,
                        px: 0,
                      }}
                    >
                      <Typography variant="body2" color="text.secondary">
                        {comment.author.user_name} ・{" "}
                        {new Date(comment.createdAt).toLocaleDateString("ja-JP")}
                      </Typography>
                      <Typography sx={{ whiteSpace: "pre-wrap" }}>{comment.content}</Typography>
                      {comment.author.id === user.id && (
                        <Button
                          color="error"
                          size="small"
                          onClick={() => void handleDeleteComment(comment.comment_id)}
                        >
                          削除
                        </Button>
                      )}
                    </ListItem>
                  ))}
                </List>
              )}
              <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                <TextField
                  fullWidth
                  multiline
                  minRows={2}
                  placeholder="コメントを書く"
                  value={newComment}
                  onChange={(event) => setNewComment(event.target.value)}
                />
                <Button
                  variant="contained"
                  disabled={posting || !newComment.trim()}
                  onClick={() => void handlePostComment()}
                >
                  投稿
                </Button>
              </Stack>
            </Box>
          </>
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
