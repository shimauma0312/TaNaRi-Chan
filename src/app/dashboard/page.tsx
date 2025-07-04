"use client"

import MinLoader from "@/components/MinLoader"
import { useAccess } from "@/hooks/useDashboardAccess"
import useAuth from "@/hooks/useAuth"
import Link from "next/link"
import { useRouter } from "next/navigation"

const mockData = {
  timelineArticles: [
    { id: 1, title: "Article 1", content: "Content of Article 1" },
    { id: 2, title: "Article 2", content: "Content of Article 2" },
    { id: 3, title: "Article 3", content: "Content of Article 3" },
    { id: 4, title: "Article 4", content: "Content of Article 4" },
    { id: 5, title: "Article 5", content: "Content of Article 5" },
  ],
  activeTodos: [
    {
      id: 1,
      title: "Todo 1",
      description: "Description of Todo 1",
      deadline: "2023-12-31",
    },
    {
      id: 2,
      title: "Todo 2",
      description: "Description of Todo 2",
      deadline: "2023-12-31",
    },
    {
      id: 3,
      title: "Todo 3",
      description: "Description of Todo 3",
      deadline: "2023-12-31",
    },
  ],
  publicTodos: [
    {
      id: 1,
      title: "Public Todo 1",
      description: "Description of Public Todo 1",
      deadline: "2023-12-31",
    },
    {
      id: 2,
      title: "Public Todo 2",
      description: "Description of Public Todo 2",
      deadline: "2023-12-31",
    },
    {
      id: 3,
      title: "Public Todo 3",
      description: "Description of Public Todo 3",
      deadline: "2023-12-31",
    },
    {
      id: 4,
      title: "Public Todo 4",
      description: "Description of Public Todo 4",
      deadline: "2023-12-31",
    },
    {
      id: 5,
      title: "Public Todo 5",
      description: "Description of Public Todo 5",
      deadline: "2023-12-31",
    },
  ],
}

const DashboardPage = () => {
  const { user, loading } = useAuth()
  const router = useRouter()
  const accessCount = useAccess()

  const handleLogout = async () => {
    try {
      await fetch('/api/logout', { method: 'POST' })
      router.push("/login")
    } catch (error) {
      console.error('Logout error:', error)
      router.push("/login")
    }
  }

  if (loading || !user) {
    return <MinLoader />
  }

  return (
    <div className="min-h-screen text-white p-4 flex">
      <div className="w-1/5 p-4">
        <nav className="space-y-4">
          <Link
            href="/dashboard/todoList"
            className="block text-lg text-indigo-400 hover:text-indigo-300"
          >
            My Todo List
          </Link>
          <Link
            href="/dashboard/otherTodos"
            className="block text-lg text-indigo-400 hover:text-indigo-300"
          >
            Other's Todo List
          </Link>
          <Link
            href="/dashboard/articles"
            className="block text-lg text-indigo-400 hover:text-indigo-300"
          >
            Other's Articles
          </Link>
          <Link
            href="/dashboard/myPage"
            className="block text-lg text-indigo-400 hover:text-indigo-300"
          >
            My Page
          </Link>
          <button
            className="block w-full bg-red-500 text-lg text-white py-1 px-3 rounded-md shadow-sm hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            onClick={handleLogout}
          >
            Logout
          </button>
        </nav>
      </div>
      <div className="w-4/5 p-4">
        <div className="container mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-xl">Welcome, {user.user_email}</p>
            <p className="text-lg">
              Today's Date: {new Date().toLocaleDateString()}
            </p>
            <p className="text-lg">Access Count: {accessCount}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-transparent p-4 rounded-lg shadow-md backdrop-filter backdrop-blur-lg bg-opacity-30 border border-gray-300">
              <h2 className="text-2xl font-bold mb-4">
                Random Timeline Articles
              </h2>
              <ul className="space-y-2">
                {mockData.timelineArticles.map((article) => (
                  <li key={article.id} className="p-2 border rounded-md">
                    <Link href="" className="block hover:underline">
                      <h3 className="font-bold">{article.title}</h3>
                      <p>{article.content}</p>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-transparent p-4 rounded-lg shadow-md backdrop-filter backdrop-blur-lg bg-opacity-30 border border-gray-300">
              <h2 className="text-2xl font-bold mb-4">Your Active Todos</h2>
              <ul className="space-y-2">
                {mockData.activeTodos.map((todo) => (
                  <li key={todo.id} className="p-2 border rounded-md">
                    <Link href="" className="block hover:underline">
                      <h3 className="font-bold">{todo.title}</h3>
                      <p>{todo.description}</p>
                      <p>
                        Deadline: {new Date(todo.deadline).toLocaleDateString()}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-transparent p-4 rounded-lg shadow-md backdrop-filter backdrop-blur-lg bg-opacity-30 border border-gray-300">
              <h2 className="text-2xl font-bold mb-4">Public Todos</h2>
              <ul className="space-y-2">
                {mockData.publicTodos.map((todo) => (
                  <li key={todo.id} className="p-2 border rounded-md">
                    <Link href="" className="block hover:underline">
                      <h3 className="font-bold">{todo.title}</h3>
                      <p>{todo.description}</p>
                      <p>
                        Deadline: {new Date(todo.deadline).toLocaleDateString()}
                      </p>
                    </Link>
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
