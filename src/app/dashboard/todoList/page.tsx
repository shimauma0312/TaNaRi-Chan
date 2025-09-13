"use client"

import SideMenu from "@/components/SideMenu";
import useAuth from "@/hooks/useAuth";
import { useRouter } from "next/navigation"; // next/routerではなくnext/navigationを使用
import { useEffect, useState } from "react";

const getTodoList = async (id: string) => {
  const response = await fetch("/api/todoList/" + id)
  const data = await response.json()
  return data
}

interface Todo {
  todo_id: string
  title: string
  description?: string
  todo_deadline: string
  is_completed: boolean
  createdAt?: string
}

const ToDoListPage = () => {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [todoList, setTodoList] = useState<Todo[]>([]) // ToDoリストデータの状態を追加

  useEffect(() => {
    if (user) {
      const fetchData = async () => {
        const todos = await getTodoList(user.id) // ToDoリストデータを取得
        setTodoList(todos) // ToDoリストデータを状態に設定
      }

      fetchData()
    }
  }, [user])

  if (loading || !user) {
    return <div>Loading...</div>
  }

  return (
    <div className="min-h-screen text-white p-4 flex">
      <SideMenu />
      <div className="w-4/5 p-4 relative">
        <div className="container mx-auto">
          {/* ヘッダー */}
          <div className="absolute top-4 right-4 flex space-x-2">
            <button
              onClick={() => router.push("/dashboard/todoList/register")}
              className="px-4 py-2 bg-red-500 text-lg text-white rounded-md shadow-sm hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Todoを登録
            </button>
            <button
              onClick={() => router.push("/dashboard")}
              className="px-4 py-2 bg-red-500 text-lg text-white rounded-md shadow-sm hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              戻る
            </button>
          </div>

          {/* タイトル */}
          <h1 className="text-2xl font-bold mb-4">To Do List</h1>

          {/* TODOリスト */}
          <ul className="space-y-4">
            {todoList.map((todo) => (
              <li key={todo.todo_id} className="p-4 border rounded-lg shadow-md">
                <h2 className="text-xl font-semibold">{todo.title}</h2>
                <p className="text-gray-700">{todo.description}</p>
                <p className="text-gray-500">
                  Deadline: {new Date(todo.todo_deadline).toLocaleDateString()}
                </p>
                <p className="text-gray-500">
                  Completed: {todo.is_completed ? "Yes" : "No"}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

export default ToDoListPage
