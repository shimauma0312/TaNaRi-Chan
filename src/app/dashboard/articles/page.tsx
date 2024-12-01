"use client"

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

  if (!user) {
    return <div>Loading...</div>
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Articles</h1>
      {articles.length === 0 ? (
        <p>記事が見つかりません</p>
      ) : (
        <ul className="space-y-4">
          {articles.map((article) => (
            <li
              key={article.article_id}
              className="p-4 border rounded-lg shadow-md"
            >
              <h2 className="text-xl font-semibold">{article.title}</h2>
              <p className="text-white">{article.content}</p>
              <p className="text-white">
                Published: {new Date(article.published_at).toLocaleDateString()}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default ArticlesPage
