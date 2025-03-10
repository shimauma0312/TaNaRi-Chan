"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export default function RegisterForm() {
  const router = useRouter()

  // フォームの状態管理
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [deadline, setDeadline] = useState<Date | null>(null)
  const [is_public, setIsPublic] = useState<boolean>(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const newTodo = { title, description, deadline, is_public }
    console.log("New Todo:", newTodo)

    try {
      const response = await fetch(`/api/todoList/${userId}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTodo),
      })

      if (!response.ok) {
        throw new Error("Failed to register todo")
      }

      router.push("/dashboard/todoList")
    } catch (error) {
      console.error("Error registering todo:", error)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4">
      {/* My Todo Listへ戻るボタン */}
      <button
        onClick={() => router.push("/dashboard/todoList")}
        className="self-start mb-4 px-4 py-2 bg-red-500 text-lg text-white py-1 px-3 rounded-md shadow-sm hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
      >
        My Todo Listへ戻る
      </button>

      {/* フォーム */}
      <div className="w-full max-w-lg p-6 rounded-lg shadow-lg border border-gray-300 dark:border-gray-700 bg-[var(--background)] text-[var(--foreground)]">
        <h2 className="text-2xl font-bold mb-4">新しいToDoを登録</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block font-medium">ToDoタイトル</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-2 border rounded-lg bg-transparent border-gray-400 focus:ring-2 focus:ring-blue-400"
              required
            />
          </div>

          <div>
            <label className="block font-medium">説明文</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-2 border rounded-lg bg-transparent border-gray-400 focus:ring-2 focus:ring-blue-400"
              rows={3}
              required
            />
          </div>

          <div>
            <label className="block font-medium">期限</label>
            <input
              type="date"
              value={deadline ? deadline.toISOString().split("T")[0] : ""}
              onChange={(e) =>
                setDeadline(e.target.value ? new Date(e.target.value) : null)
              }
              className="w-full p-2 border rounded-lg bg-transparent border-gray-400 focus:ring-2 focus:ring-blue-400"
              required
            />
          </div>

          <div>
            <label className="block font-medium">公開範囲</label>
            <select
              value={is_public ? "public" : "private"}
              onChange={(e) => setIsPublic(e.target.value === "public")}
              className="w-full p-2 border rounded-lg bg-black text-white border-gray-400 focus:ring-2 focus:ring-blue-400"
            >
              <option value="private">自分のみ</option>
              <option value="public">全体公開</option>
            </select>
          </div>

          <button
            type="submit"
            className="w-full bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 transition"
          >
            登録
          </button>
        </form>
      </div>
    </div>
  )
}
