"use client"

import Calendar from "@/components/calendar/Calendar"
import MinLoader from "@/components/MinLoader"
import useAuth from "@/hooks/useAuth"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

interface Todo {
  todo_id: number
  title: string
  todo_deadline: string
}

const getTodoList = async (id: string) => {
  const res = await fetch(`/api/todoList/${id}`)
  const data = await res.json()
  return data
}

const CalendarPage = () => {
  const user = useAuth()
  const router = useRouter()
  const [todos, setTodos] = useState<Todo[]>([])

  useEffect(() => {
    if (user) {
      const fetchData = async () => {
        const data = await getTodoList(user.uid)
        setTodos(data)
      }
      fetchData()
    }
  }, [user])

  if (!user) {
    return <MinLoader />
  }

  return (
    <div className="p-4">
      <button
        onClick={() => router.push("/dashboard")}
        className="mb-4 px-4 py-2 bg-red-500 text-white rounded-md"
      >
        戻る
      </button>
      <h1 className="text-2xl font-bold mb-4">Calendar</h1>
      <Calendar todos={todos} />
    </div>
  )
}

export default CalendarPage
