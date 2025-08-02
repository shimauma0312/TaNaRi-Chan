"use client"

import MarkdownEditor from "@/components/markdown/markdownEditor"
import MinLoader from "@/components/MinLoader"
import useAuth from "@/hooks/useAuth"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

const EditArticlePage = () => {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [postId, setPostId] = useState<number | null>(null)

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const postIdParam = urlParams.get("post_id")
    if (postIdParam) {
      setPostId(Number(postIdParam))
    }
  }, [])
  
  useEffect(() => {
    if (postId !== null) {
      fetchArticle(postId)
    }
  }, [postId])

  if (loading || !user) {
    return <MinLoader />
  }
  const fetchArticle = async (postId: number) => {
    try {
      const response = await fetch(`/api/articles?post_id=${postId}`)
      const data = await response.json()
      setTitle(data.title)
      setContent(data.content)
    } catch (error) {
      console.error("Error fetching article:", error)
    }
  }

  /**
   * 記事を更新する
   * @param event : React.FormEvent
   */
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!postId) {
      alert("Invalid post ID.")
      return
    }

    const updatedPost = {
      post_id: postId,
      title,
      content,
    }

    try {
      const response = await fetch("/api/articles", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedPost),
      })

      if (response.ok) {
        router.push("/dashboard/articles")
      } else {
        alert("Failed to update article.")
      }
    } catch (error) {
      console.error("Error:", error)
      alert("An error occurred while updating the article.")
    }
  }

  if (!user) {
    return <MinLoader />
  }

  return (
    <div className="max-w-md mx-auto p-8 rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6">Edit Article</h1>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label
            htmlFor="title"
            className="block text-gray-700 font-semibold mb-2"
          >
            Title:
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="bg-slate-800 w-full px-3 py-2 border rounded-lg focus:outline-none"
          />
        </div>
        <div className="mb-4">
          <label
            htmlFor="content"
            className="block text-gray-700 font-semibold mb-2"
          >
            Content:
          </label>
          <MarkdownEditor initialMarkdown={content} onChange={setContent} />
        </div>
        <button
          type="submit"
          className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Update Article
        </button>
      </form>
    </div>
  )
}

export default EditArticlePage
