"use client"

import MarkdownPreview from "@/components/markdown/markdownPreveiw"
import MinLoader from "@/components/MinLoader"
import SideMenu from "@/components/SideMenu"
import useAuth, { AuthUser } from "@/hooks/useAuth"
import { handleClientError } from "@/utils/errorHandler.client"
import { useRouter, useSearchParams } from "next/navigation"
import { Suspense, useEffect, useState } from "react"

interface Article {
  post_id: number
  title: string
  content: string
  createdAt: string
}

interface CommentAuthor {
  id: string
  user_name: string
}

interface Comment {
  comment_id: number
  content: string
  createdAt: string
  author: CommentAuthor
}

async function fetchArticleData(postId: number): Promise<Article | null> {
  try {
    const response = await fetch(`/api/articles?post_id=${postId}`)
    if (!response.ok) {
      return null
    }
    return await response.json()
  } catch (error) {
    console.error("Error fetching article:", error)
    return null
  }
}

async function fetchComments(postId: number): Promise<Comment[]> {
  try {
    const response = await fetch(`/api/articles/comments?post_id=${postId}`)
    if (!response.ok) {
      return []
    }
    return await response.json()
  } catch (error) {
    console.error("Error fetching comments:", error)
    return []
  }
}

function ViewArticleContent({
  postId,
  user,
}: {
  postId: number | null
  user: AuthUser
}) {
  const router = useRouter()
  const [article, setArticle] = useState<Article | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [newComment, setNewComment] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (postId === null) {
      setLoading(false)
      return
    }

    const loadData = async () => {
      setLoading(true)
      try {
        const [articleData, commentsData] = await Promise.all([
          fetchArticleData(postId),
          fetchComments(postId),
        ])
        setArticle(articleData)
        setComments(commentsData)
      } catch (err) {
        console.error("Failed to load article:", err)
        setArticle(null)
        setComments([])
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [postId])

  /**
   * コメントを削除する
   * @param commentId : number
   */
  const handleDeleteComment = async (commentId: number) => {
    if (!confirm("Are you sure you want to delete this comment?")) {
      return
    }

    try {
      const response = await fetch(`/api/articles/comments/${commentId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setComments((prev) => prev.filter((comment) => comment.comment_id !== commentId))
      } else {
        const errorData = await response.json()
        const errorMessage = errorData.error || "Failed to delete comment"
        alert(errorMessage)
      }
    } catch (err) {
      const errorMessage = handleClientError(err, "An error occurred while deleting the comment")
      alert(errorMessage)
    }
  }

  /**
   * コメントを投稿する
   */
  const handlePostComment = async () => {
    if (postId === null || !newComment.trim()) {
      return
    }

    setError("")
    setIsSubmitting(true)

    try {
      const response = await fetch("/api/articles/comments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ post_id: postId, content: newComment }),
      })

      if (response.ok) {
        const created = await response.json()
        setComments((prev) => [
          ...prev,
          {
            comment_id: created.comment_id,
            content: created.content,
            createdAt: created.createdAt,
            author: created.author,
          },
        ])
        setNewComment("")
      } else {
        const errorData = await response.json()
        setError(errorData.error || "Failed to post comment")
      }
    } catch (err) {
      const errorMessage = handleClientError(err, "An error occurred while posting the comment")
      setError(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (postId === null) {
    return <div className="text-center p-8">Invalid article ID.</div>
  }

  if (loading) {
    return <MinLoader />
  }

  if (!article) {
    return (
      <div className="min-h-screen text-white p-4 flex">
        <SideMenu />
        <div className="w-4/5 p-4">
          <p>記事が見つかりません</p>
          <button
            onClick={() => router.push("/dashboard/articles")}
            className="mt-4 px-4 py-2 bg-red-500 text-white font-semibold rounded-md hover:bg-red-600"
          >
            Back to Articles
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen text-white p-4 flex">
      <SideMenu />
      <div className="w-4/5 p-4">
        <div className="container mx-auto">
          <button
            onClick={() => router.push("/dashboard/articles")}
            className="mb-4 px-4 py-2 bg-red-500 text-white font-semibold rounded-md hover:bg-red-600"
          >
            Back to Articles
          </button>

          <div className="bg-transparent p-4 rounded-lg shadow-md backdrop-filter backdrop-blur-lg bg-opacity-30 border border-gray-300 mb-6">
            <h1 className="text-2xl font-bold mb-2">{article.title}</h1>
            <p className="text-white mb-4">
              Published: {new Date(article.createdAt).toLocaleDateString()}
            </p>
            <MarkdownPreview markdown={article.content} />
          </div>

          <div className="bg-transparent p-4 rounded-lg shadow-md backdrop-filter backdrop-blur-lg bg-opacity-30 border border-gray-300">
            <h2 className="text-xl font-semibold mb-4">Comments</h2>

            {comments.length === 0 ? (
              <p className="text-gray-300 mb-4">まだコメントはありません</p>
            ) : (
              <ul className="space-y-3 mb-4">
                {comments.map((comment) => (
                  <li key={comment.comment_id} className="p-3 border border-gray-300 rounded-lg">
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <span className="font-bold">{comment.author.user_name}</span>{" "}
                        <span className="text-sm text-gray-300">
                          {new Date(comment.createdAt).toLocaleString()}
                        </span>
                        <p className="mt-1 whitespace-pre-wrap">{comment.content}</p>
                      </div>
                      {comment.author.id === user.id && (
                        <button
                          onClick={() => handleDeleteComment(comment.comment_id)}
                          className="shrink-0 px-3 py-1 bg-red-500 text-white text-sm font-semibold rounded-lg shadow-md hover:bg-red-700"
                        >
                          削除
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}

            {error && <p className="text-red-500 text-sm mb-2">{error}</p>}

            <div className="mt-2">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                rows={3}
                placeholder="コメントを入力してください"
                className="bg-slate-700 border border-slate-600 w-full px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-slate-400"
              />
              <button
                onClick={handlePostComment}
                disabled={isSubmitting || !newComment.trim()}
                className={`mt-2 px-4 py-2 rounded-lg font-semibold shadow-md text-white ${
                  isSubmitting || !newComment.trim()
                    ? "bg-gray-600 cursor-not-allowed"
                    : "bg-blue-500 hover:bg-blue-700"
                }`}
              >
                {isSubmitting ? "投稿中..." : "投稿"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const ViewArticlePageInner = () => {
  const { user, loading } = useAuth()
  const [postId, setPostId] = useState<number | null>(null)
  const searchParams = useSearchParams()

  useEffect(() => {
    const postIdParam = searchParams.get("post_id")
    if (postIdParam) {
      setPostId(Number(postIdParam))
    }
  }, [searchParams])

  if (loading || !user) {
    return <MinLoader />
  }

  return <ViewArticleContent postId={postId} user={user} />
}

const ViewArticlePage = () => {
  return (
    <Suspense fallback={<MinLoader />}>
      <ViewArticlePageInner />
    </Suspense>
  )
}

export default ViewArticlePage
