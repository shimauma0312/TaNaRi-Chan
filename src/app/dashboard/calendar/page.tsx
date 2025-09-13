"use client"

import MinLoader from "@/components/MinLoader"
import SideMenu from "@/components/SideMenu"
import Calendar, { TodoItem } from "@/components/calendar/Calendar"
import useAuth from "@/hooks/useAuth"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

const getTodoList = async (id: string) => {
  const response = await fetch(`/api/todoList/${id}`)
  if (!response.ok) {
    throw new Error(`Failed to fetch todos: ${response.status}`)
  }
  const data = (await response.json()) as TodoItem[]
  return data
}

const CalendarPage = () => {
  const user = useAuth()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [todos, setTodos] = useState<TodoItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!user.user) {
          throw new Error("User is not authenticated")
        }
        const data = await getTodoList(user.user.id)
        setTodos(data)
      } catch (err) {
        console.error("Error fetching user todos:", err)
        setError("Failed to load todos. Please try again later.")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [user.user?.id, user.user])

  if (!user || loading) {
    return <MinLoader />
  }

  return (
    <div className="min-h-screen text-white p-4 flex">
      <SideMenu />
      <div className="w-4/5 p-4">
        <div className="container mx-auto">
          <div className="flex justify-between items-center mb-4">
            <button
              className="px-3 py-1 bg-blue-500 text-white rounded-md"
              onClick={() =>
                setCurrentDate(
                  (prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1),
                )
              }
            >
              Prev
            </button>
            <h1 className="text-2xl font-bold">
              {currentDate.getFullYear()} / {currentDate.getMonth() + 1}
            </h1>
            <button
              className="px-3 py-1 bg-blue-500 text-white rounded-md"
              onClick={() =>
                setCurrentDate(
                  (prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1),
                )
              }
            >
              Next
            </button>
          </div>

          {error && (
            <p className="text-red-500 mb-2" role="alert">
              {error}
            </p>
          )}

          <Calendar currentDate={currentDate} todos={todos} />

          <div className="mt-4">
            {/* ダッシュボードへ戻るボタン */}
            <button
              onClick={() => router.push("/dashboard")}
              className="px-4 py-2 bg-red-500 text-white rounded-md"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CalendarPage
