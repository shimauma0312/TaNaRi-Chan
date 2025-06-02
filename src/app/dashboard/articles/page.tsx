"use client"

import MinLoader from "@/components/MinLoader"
import useAuth from "@/hooks/useAuth"
import { useEffect, useState } from "react"

const getArticles = async () => {
  const response = await fetch("/api/articles")
  const data = await response.json()
  return data
}

const ArticlesPage = () => {
  const user = useAuth()
  const [articles, setArticles] = useState<any[]>([]) // 記事データの状態を追加

  useEffect(() => {
    if (user) {
      const fetchData = async () => {
        const articlesData = await getArticles() // 記事データを取得
        setArticles(articlesData) // 記事データを状態に設定
      }

      fetchData()
    }
  }, [user])

  /**
   * 記事を編集する
   * @param postId : number
   */
  const handleEdit = (postId: number) => {
    window.location.href = `/dashboard/articles/edit?post_id=${postId}`
  }

  /**
   * 記事を削除する
   * @param postId : number
   */
  const handleDelete = async (postId: number) => {
    try {
      const response = await fetch(`/api/articles`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ post_id: postId }),
      })

      if (response.ok) {
        setArticles(articles.filter((article) => article.post_id !== postId))
      } else {
        alert("Failed to delete article.")
      }
    } catch (error) {
      console.error("Error:", error)
      alert("An error occurred while deleting the article.")
    }
  }

  if (!user) {
    return <MinLoader />
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Articles</h1>
        <a
          href="/dashboard/articles/register"
          className="inline-block px-4 py-2 bg-blue-500 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700"
        >
          New Article
        </a>
      </div>
      {articles.length === 0 ? (
        <p>記事が見つかりません</p>
      ) : (
        <ul className="space-y-4">
          {articles.map((article) => (
            <li
              key={article.post_id}
              className="p-4 border rounded-lg shadow-md"
            >
              <h2 className="text-xl font-semibold">{article.title}</h2>
              <p className="text-white">
                Published: {new Date(article.createdAt).toLocaleDateString()}
              </p>
              <div className="flex space-x-2 mt-2">
                <button
                  onClick={() => handleEdit(article.post_id)}
                  className="px-4 py-2 bg-yellow-500 text-white font-semibold rounded-lg shadow-md hover:bg-yellow-700"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(article.post_id)}
                  className="px-4 py-2 bg-red-500 text-white font-semibold rounded-lg shadow-md hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default ArticlesPage
