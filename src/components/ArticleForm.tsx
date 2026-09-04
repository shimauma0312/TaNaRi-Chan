"use client"

import MarkdownEditor from "@/components/markdown/markdownEditor"
import useAuth from "@/hooks/useAuth"
import { AppError, ErrorType, handleClientError } from "@/utils/errorHandler.client"
import Alert from "@mui/material/Alert"
import Box from "@mui/material/Box"
import Button from "@mui/material/Button"
import CircularProgress from "@mui/material/CircularProgress"
import FormControl from "@mui/material/FormControl"
import FormLabel from "@mui/material/FormLabel"
import Paper from "@mui/material/Paper"
import Stack from "@mui/material/Stack"
import TextField from "@mui/material/TextField"
import Typography from "@mui/material/Typography"
import { useRouter } from "next/navigation"
import { useEffect, useState, type FormEvent } from "react"

interface ArticleFormProps {
  postId?: number
  initialTitle?: string
  initialContent?: string
  onSuccess?: () => void
}

const ArticleForm = ({
  postId,
  initialTitle = "",
  initialContent = "",
  onSuccess,
}: ArticleFormProps) => {
  const { user, loading } = useAuth()
  const router = useRouter()
  const isEditMode = postId !== undefined
  const [title, setTitle] = useState(initialTitle)
  const [content, setContent] = useState(initialContent)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    setTitle(initialTitle)
    setContent(initialContent)
  }, [initialTitle, initialContent])

  if (loading || !user) {
    return (
      <Box
        sx={{ display: "grid", minHeight: 320, placeItems: "center" }}
        role="status"
        aria-label="読み込み中"
      >
        <CircularProgress />
      </Box>
    )
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (isSubmitting) return

    setError("")
    setIsSubmitting(true)

    try {
      if (isEditMode && !postId) {
        throw new AppError("Invalid post ID", ErrorType.VALIDATION, 400)
      }

      const articleData = isEditMode
        ? { post_id: postId, title, content }
        : { title, content, author_id: user.id }

      const response = await fetch("/api/articles", {
        method: isEditMode ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(articleData),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        throw new Error(errorData?.error || `Failed to ${isEditMode ? "update" : "create"} article`)
      }

      if (!isEditMode) {
        setTitle("")
        setContent("")
      }

      if (onSuccess) {
        onSuccess()
      } else {
        router.push("/dashboard/articles")
      }
    } catch (error) {
      setError(
        handleClientError(
          error,
          `An error occurred while ${isEditMode ? "updating" : "creating"} the article`,
        ),
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const formTitle = isEditMode ? "Edit Article" : "Create New Article"
  const buttonText = isEditMode ? "Update Article" : "Create Article"
  const contentLabelId = "article-content-label"

  return (
    <Box sx={{ mx: "auto", p: { xs: 0, sm: 2 }, width: "100%" }}>
      <Paper component="section" sx={{ mx: "auto", maxWidth: 960, p: { xs: 2, sm: 4 } }}>
        <Typography component="h1" variant="h4" sx={{ mb: 3 }}>
          {formTitle}
        </Typography>

        <Box component="form" onSubmit={handleSubmit} noValidate>
          <Stack spacing={3}>
            <TextField
              id="article-title"
              label="Title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              required
              disabled={isSubmitting}
              placeholder="記事のタイトルを入力してください"
              slotProps={{ htmlInput: { maxLength: 200 } }}
            />

            <FormControl required disabled={isSubmitting}>
              <FormLabel id={contentLabelId} htmlFor="article-content" sx={{ mb: 1 }}>
                Content
              </FormLabel>
              <MarkdownEditor
                disabled={isSubmitting}
                id="article-content"
                labelledBy={contentLabelId}
                initialMarkdown={content}
                onChange={setContent}
                required
              />
            </FormControl>

            {error && <Alert severity="error">{error}</Alert>}

            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={isSubmitting || !title.trim() || !content.trim()}
              startIcon={isSubmitting ? <CircularProgress color="inherit" size={18} /> : undefined}
            >
              {isSubmitting ? "Processing..." : buttonText}
            </Button>
          </Stack>
        </Box>
      </Paper>
    </Box>
  )
}

export default ArticleForm
