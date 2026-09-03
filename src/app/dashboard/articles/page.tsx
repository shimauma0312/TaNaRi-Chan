"use client"

import MinLoader from "@/components/MinLoader"
import SideMenu from "@/components/SideMenu"
import useAuth from "@/hooks/useAuth"
import { handleClientError } from "@/utils/errorHandler.client"
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
  if (!response.ok) {
    throw new Error(data?.error || "記事の取得に失敗しました")
  }
  if (!Array.isArray(data)) {
    throw new Error("記事一覧の応答形式が不正です")
  }
  return { articles: data as Article[], nextCursor: response.headers.get("X-Next-Cursor") }
}

const ArticlesPage = () => {
  const { user, loading } = useAuth()
  const [articles, setArticles] = useState<Article[]>([])
  const [dataLoading, setDataLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    if (user) {
      const fetchData = async (append = false) => {
        setDataLoading(true)
        setError(null)
        try {
          const page = await getArticles(append ? (nextCursor ?? undefined) : undefined)
          setArticles((previous) => (append ? [...previous, ...page.articles] : page.articles))
          setNextCursor(page.nextCursor)
        } catch (error) {
          setError(handleClientError(error, "記事の取得に失敗しました"))
        } finally {
          setDataLoading(false)
        }
      }

      fetchData()
    }
  }, [user])

  if (loading || !user) {
    return <MinLoader />
  }

  /**
   * 記事を編集する
   * @param postId : number
   */
  const handleEdit = (postId: number) => {
    router.push(`/dashboard/articles/edit?post_id=${postId}`)
  }

  /**
   * 記事を削除する
   * @param postId : number
   */
  const handleDelete = async (postId: number) => {
    if (!confirm("Are you sure you want to delete this article?")) {
      return
    }

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
        const errorData = await response.json()
        const errorMessage = errorData.error || "Failed to delete article"
        alert(errorMessage)
      }
    } catch (error) {
      const errorMessage = handleClientError(error, "An error occurred while deleting the article")
      alert(errorMessage)
    }
  }

  if (!user) {
    return <MinLoader />
  }

  return (
    <div className="min-h-screen text-white p-4 flex flex-col md:flex-row">
      <SideMenu />
      <div className="w-full md:w-4/5 p-4">
        <div className="container mx-auto">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold">Articles</h1>
            <button
              onClick={() => router.push("/dashboard/articles/register")}
              className="inline-block px-4 py-2 bg-blue-500 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700"
            >
              New Article
            </button>
          </div>
          {error && (
            <p role="alert" className="mb-4 text-red-300">
              {error}
            </p>
          )}
          {dataLoading ? (
            <MinLoader />
          ) : articles.length === 0 && !error ? (
            <p>記事が見つかりません</p>
          ) : (
            <ul className="space-y-4">
              {articles.map((article) => (
                <li key={article.post_id} className="p-4 border rounded-lg shadow-md">
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
          {!dataLoading && nextCursor && (
            <button
              onClick={async () => {
                setDataLoading(true)
                try {
                  const page = await getArticles(nextCursor)
                  setArticles((previous) => [...previous, ...page.articles])
                  setNextCursor(page.nextCursor)
                } catch (error) {
                  setError(handleClientError(error, "記事の取得に失敗しました"))
                } finally {
                  setDataLoading(false)
                }
              }}
              className="mt-6 px-5 py-2 bg-indigo-500 rounded-md hover:bg-indigo-600"
            >
              さらに読み込む
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default ArticlesPage
