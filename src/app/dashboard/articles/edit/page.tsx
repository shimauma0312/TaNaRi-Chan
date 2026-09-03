"use client"

import ArticleForm from "@/components/ArticleForm"
import MinLoader from "@/components/MinLoader"
import SideMenu from "@/components/SideMenu"
import useAuth from "@/hooks/useAuth"
import { useRouter, useSearchParams } from "next/navigation"
import { Suspense, useEffect, useState } from "react"

async function fetchArticleData(postId: number) {
  const response = await fetch(`/api/articles?post_id=${postId}`)
  const data = await response.json().catch(() => null)
  if (!response.ok) {
    throw new Error(data?.error || "記事の取得に失敗しました")
  }
  return { title: data.title, content: data.content }
}

function EditArticleContent({ postId }: { postId: number | null }) {
  const router = useRouter()
  const [articleData, setArticleData] = useState({ title: "", content: "" })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (postId === null) {
      setLoading(false)
      return
    }

    const loadArticleData = async () => {
      setLoading(true)
      try {
        const data = await fetchArticleData(postId)
        setArticleData(data)
      } catch (error) {
        console.error("Failed to load article:", error)
        setError(error instanceof Error ? error.message : "記事の取得に失敗しました")
      } finally {
        setLoading(false)
      }
    }

    loadArticleData()
  }, [postId])

  const handleSuccess = () => {
    router.push("/dashboard/articles")
  }

  if (postId === null) {
    return <div className="text-center p-8">Invalid article ID.</div>
  }

  if (loading) {
    return <MinLoader />
  }

  if (error) {
    return (
      <div className="min-h-screen text-white p-4 flex flex-col md:flex-row">
        <SideMenu />
        <div className="w-full md:w-4/5 p-8">
          <p role="alert" className="text-red-300">
            {error}
          </p>
          <button
            className="mt-4 text-indigo-300 underline"
            onClick={() => router.push("/dashboard/articles")}
          >
            記事一覧へ戻る
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen text-white p-4 flex flex-col md:flex-row">
      <SideMenu />
      <ArticleForm
        postId={postId}
        initialTitle={articleData.title}
        initialContent={articleData.content}
        onSuccess={handleSuccess}
      />
    </div>
  )
}

const EditArticlePageInner = () => {
  const { user, loading } = useAuth()
  const searchParams = useSearchParams()
  const postIdParam = searchParams.get("post_id")
  const postId = postIdParam ? Number(postIdParam) : null

  if (loading || !user) {
    return <MinLoader />
  }

  return <EditArticleContent postId={postId} />
}

const EditArticlePage = () => {
  return (
    <Suspense fallback={<MinLoader />}>
      <EditArticlePageInner />
    </Suspense>
  )
}

export default EditArticlePage
