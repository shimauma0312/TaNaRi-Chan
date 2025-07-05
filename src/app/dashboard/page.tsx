"use client"

import { auth } from "@/app/firebaseConfig"
import MinLoader from "@/components/MinLoader"
import { useAccess } from "@/hooks/useDashboardAccess"
import { onAuthStateChanged, signOut, User } from "firebase/auth"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

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
  const [user, setUser] = useState<User | null>(null)
  const router = useRouter()
  const accessCount = useAccess()
  const [activeSection, setActiveSection] = useState<string>("todo") // 新たに追加：アクティブなセクションを管理

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user)
      } else {
        router.push("login")
      }
    })

    return () => unsubscribe()
  }, [router])

  const handleLogout = async () => {
    await signOut(auth)
    router.push("login")
  }

  if (!user) {
    return <MinLoader />
  }

  return (
    <div className="min-h-screen bg-black text-white flex">
      <div className="w-1/6 border-r border-gray-800 p-6 flex flex-col">
        <div className="mb-12">
          <h2 className="text-3xl font-bold mb-8">article</h2>
          <nav className="space-y-5">
            <Link
              href="/dashboard/articles"
              className="block text-lg hover:text-gray-400"
            >
              Others&apos; Articles
            </Link>
            <Link
              href="/dashboard/myArticles"
              className="block text-lg hover:text-gray-400"
            >
              My Articles
            </Link>
          </nav>
        </div>

        <div className="mb-12">
          <h2 className="text-3xl font-bold mb-8">task</h2>
          <nav className="space-y-5">
            <Link
              href="/dashboard/todoList"
              className="block text-lg hover:text-gray-400"
            >
              Others&apos; Tasks
            </Link>
            <Link
              href="/dashboard/todoList"
              className="block text-lg hover:text-gray-400"
            >
              My Tasks
            </Link>
          </nav>
        </div>

        <div className="mt-auto">
          <button
            className="block w-full text-lg text-left hover:text-gray-400"
            onClick={handleLogout}
          >
            log out
          </button>
        </div>
      </div>

      <div className="flex-1 p-8">
        <h2 className="text-3xl font-bold mb-6">active tasks</h2>
        
        <div className="space-y-8">
          {mockData.activeTodos.map((todo) => (
            <div key={todo.id} className="block">
              <h3 className="text-2xl font-bold">title {todo.id}</h3>
              <p className="text-gray-400">deadline: {new Date(todo.deadline).toLocaleDateString('ja-JP', { 
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
              }).replace(/\//g, '-')}</p>
            </div>
          ))}
          
          <div className="block">
            <h3 className="text-2xl font-bold">title 3title 3title 3</h3>
            <h3 className="text-2xl font-bold">title 3</h3>
            <p className="text-gray-400">deadline: 2020-20-20</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DashboardPage
