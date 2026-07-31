/**
 * メッセージ作成フォームコンポーネント
 *
 * 新規メッセージの件名・本文・受信者を入力し、送信する。
 */

"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { handleClientError } from "@/utils/errorHandler.client"

/**
 * MessageFormコンポーネントのProps
 *
 * @property users - 送信先として選択可能なユーザーの配列
 */
interface User {
  id: string
  user_name: string
}

interface MessageFormProps {
  users: User[]
}

/**
 * メッセージ作成フォームコンポーネント
 *
 * @param props - コンポーネントのProps
 * @returns メッセージ作成フォームのJSX要素
 */
const MessageForm = ({ users }: MessageFormProps) => {
  const [subject, setSubject] = useState("")
  const [body, setBody] = useState("")
  const [receiverId, setReceiverId] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const router = useRouter()

  /**
   * フォーム送信ハンドラー
   *
   * @param e - フォームイベント
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    try {
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, body, receiver_id: receiverId }),
      })

      if (response.ok) {
        router.push("/dashboard/messages")
      } else {
        const data = await response.json()
        setError(data.error || "メッセージの送信に失敗しました")
      }
    } catch (err) {
      setError(handleClientError(err, "メッセージの送信に失敗しました"))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-500 bg-opacity-20 border border-red-500 rounded-md text-red-300">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">
          送信先
        </label>
        <select
          value={receiverId}
          onChange={(e) => setReceiverId(e.target.value)}
          required
          className="w-full px-3 py-2 bg-transparent border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="" className="bg-gray-800">
            送信先を選択してください
          </option>
          {users.map((user) => (
            <option key={user.id} value={user.id} className="bg-gray-800">
              {user.user_name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">
          件名
        </label>
        <input
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          required
          maxLength={200}
          placeholder="件名を入力してください"
          className="w-full px-3 py-2 bg-transparent border border-gray-600 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">
          本文
        </label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          required
          maxLength={10000}
          rows={8}
          placeholder="本文を入力してください"
          className="w-full px-3 py-2 bg-transparent border border-gray-600 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y"
        />
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="px-6 py-2 bg-indigo-500 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? "送信中..." : "送信"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/dashboard/messages")}
          className="px-6 py-2 bg-gray-600 text-white font-semibold rounded-lg shadow-md hover:bg-gray-700"
        >
          キャンセル
        </button>
      </div>
    </form>
  )
}

export default MessageForm
