"use client"

import MinLoader from "@/components/MinLoader"
import ShakeImage from "@/components/ShakeImage"
import SideMenu from "@/components/SideMenu"
import useAuth from "@/hooks/useAuth"
import { formatTodoDate } from "@/utils/todoDate"
import { useEffect, useState } from "react"
import Link from "next/link"

type DashboardArticle = {
  post_id: number
  title: string
  content: string
  createdAt: string
  author: { user_name: string }
}

type DashboardTodo = {
  todo_id: number
  title: string
  description: string
  todo_deadline: string
}

type DashboardPublicTodo = DashboardTodo & {
  user: {
    id: string
    user_name: string
  }
}

type DashboardData = {
  articles: DashboardArticle[]
  activeTodos: DashboardTodo[]
  publicTodos: DashboardPublicTodo[]
}

const DashboardPage = () => {
  const { user, loading } = useAuth()
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [dataLoading, setDataLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return

    const fetchDashboard = async () => {
      try {
        const res = await fetch("/api/dashboard")
        const data = await res.json().catch(() => null)
        if (!res.ok) {
          throw new Error(data?.error || "ダッシュボードの取得に失敗しました")
        }
        setDashboardData(data)
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error)
        setError(error instanceof Error ? error.message : "ダッシュボードの取得に失敗しました")
      } finally {
        setDataLoading(false)
      }
    }

    fetchDashboard()
  }, [user])

  if (loading || !user) {
    return <MinLoader />
  }

  if (dataLoading) {
    return <MinLoader />
  }

  return (
    <div className="min-h-screen text-white p-4 flex flex-col md:flex-row">
      <SideMenu />
      <div className="w-full md:w-4/5 p-4 relative">
        <div className="container mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-xl">Welcome, {user.user_email}</p>
            <p className="text-lg">Today&apos;s Date: {new Date().toLocaleDateString()}</p>
          </div>

          <ShakeImage />

          {error && (
            <p role="alert" className="mb-6 text-red-300">
              {error}
            </p>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-transparent p-4 rounded-lg shadow-md backdrop-filter backdrop-blur-lg bg-opacity-30 border border-gray-300">
              <h2 className="text-2xl font-bold mb-4">Random Timeline Articles</h2>
              <ul className="space-y-2">
                {dashboardData?.articles.length === 0 && (
                  <p className="text-gray-400">記事がありません</p>
                )}
                {dashboardData?.articles.map((article) => (
                  <li key={article.post_id} className="p-2 border rounded-md">
                    <Link
                      className="block hover:underline"
                      href={`/dashboard/articles/view?post_id=${article.post_id}`}
                    >
                      <h3 className="font-bold">{article.title}</h3>
                      <p className="text-sm text-gray-300">
                        {article.content.replace(/[#*`[\]]/g, "").slice(0, 100)}
                        {article.content.length > 100 ? "..." : ""}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        by {article.author.user_name} &middot;{" "}
                        {new Date(article.createdAt).toLocaleDateString()}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-transparent p-4 rounded-lg shadow-md backdrop-filter backdrop-blur-lg bg-opacity-30 border border-gray-300">
              <h2 className="text-2xl font-bold mb-4">Your Active Todos</h2>
              <ul className="space-y-2">
                {dashboardData?.activeTodos.length === 0 && (
                  <p className="text-gray-400">アクティブなTodoはありません</p>
                )}
                {dashboardData?.activeTodos.map((todo) => (
                  <li key={todo.todo_id} className="p-2 border rounded-md">
                    <div className="block">
                      <h3 className="font-bold">{todo.title}</h3>
                      <p className="text-sm">{todo.description}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        Deadline: {formatTodoDate(todo.todo_deadline)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-transparent p-4 rounded-lg shadow-md backdrop-filter backdrop-blur-lg bg-opacity-30 border border-gray-300">
              <h2 className="text-2xl font-bold mb-4">Public Todos</h2>
              <ul className="space-y-2">
                {dashboardData?.publicTodos.length === 0 && (
                  <p className="text-gray-400">公開Todoはありません</p>
                )}
                {dashboardData?.publicTodos.map((todo) => (
                  <li key={todo.todo_id} className="p-2 border rounded-md">
                    <div className="block">
                      <h3 className="font-bold">{todo.title}</h3>
                      <p className="text-sm">{todo.description}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        by {todo.user.user_name} &middot; Deadline:{" "}
                        {formatTodoDate(todo.todo_deadline)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DashboardPage
