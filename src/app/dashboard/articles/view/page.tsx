"use client"

import MinLoader from "@/components/MinLoader"
import SideMenu from "@/components/SideMenu"
import MarkdownPreview from "@/components/markdown/markdownPreveiw"
import useAuth from "@/hooks/useAuth"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Suspense, useEffect, useState } from "react"

type Article = {
  title: string
  content: string
  createdAt: string
}

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

    load()
  }, [postId])

  if (authLoading || !user || loading) return <MinLoader />

  return (
    <div className="min-h-screen text-white p-4 flex flex-col md:flex-row">
      <SideMenu />
      <main className="w-full md:w-4/5 p-4">
        <Link href="/dashboard" className="text-indigo-300 underline">
          ダッシュボードへ戻る
        </Link>
        {error ? (
          <p role="alert" className="mt-6 text-red-300">
            {error}
          </p>
        ) : article ? (
          <article className="mt-6">
            <h1 className="text-3xl font-bold mb-2">{article.title}</h1>
            <p className="text-sm text-gray-400 mb-6">
              {new Date(article.createdAt).toLocaleDateString()}
            </p>
            <MarkdownPreview markdown={article.content} />
          </article>
        ) : null}
      </main>
    </div>
  )
}

export default function ArticleViewPage() {
  return (
    <Suspense fallback={<MinLoader />}>
      <ArticleViewContent />
    </Suspense>
  )
}
