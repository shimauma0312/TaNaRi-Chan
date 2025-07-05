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
  const [articles, setArticles] = useState<any[]>([])

  useEffect(() => {
    if (user) {
      const fetchData = async () => {
        const articlesData = await getArticles()
        setArticles(articlesData)
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
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto p-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Articles</h1>
          <a
            href="/dashboard/articles/register"
            className="inline-block px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition duration-300"
          >
            New Article
          </a>
        </div>
        
        {articles.length === 0 ? (
          <div className="p-6 border border-gray-800 rounded-lg text-center">
            <p className="text-xl text-gray-400">記事が見つかりません</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {articles.map((article) => (
              <div
                key={article.post_id}
                className="p-6 border border-gray-800 rounded-lg hover:border-gray-700 transition duration-300"
              >
                <h2 className="text-2xl font-bold mb-3">{article.title}</h2>
                <p className="text-gray-400 mb-4">{article.content}</p>
                <p className="text-gray-500 mb-4">
                  Published: {new Date(article.published_at).toLocaleDateString('ja-JP', { 
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit'
                  }).replace(/\//g, '-')}
                </p>
                <div className="flex space-x-4 mt-4">
                  <button
                    onClick={() => handleEdit(article.post_id)}
                    className="px-4 py-2 bg-gray-800 text-white font-medium rounded-lg hover:bg-gray-700 transition duration-300"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(article.post_id)}
                    className="px-4 py-2 bg-red-900 text-white font-medium rounded-lg hover:bg-red-800 transition duration-300"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default ArticlesPage
