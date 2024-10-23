"use client"

import React, { useEffect, useState } from "react"
import { useRouter } from "next/navigation" // next/routerではなくnext/navigationを使用
import useAuth from "@/hooks/useAuth"

const getTodoList = async (id: string) => {
  const response = await fetch("/api/todoList/" + id)
  const data = await response.json()
  return data
}

const ToDoListPage = () => {
  const user = useAuth()
  const [todoList, setTodoList] = useState<any[]>([]) // ToDoリストデータの状態を追加

  useEffect(() => {
    if (user) {
      const fetchData = async () => {
        const todos = await getTodoList(user.uid) // ToDoリストデータを取得
        setTodoList(todos) // ToDoリストデータを状態に設定
      }

      fetchData()
    }
  }, [user])

  if (!user) {
    return <div>Loading...</div>
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">To Do List</h1>
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
  )
}

export default ToDoListPage
