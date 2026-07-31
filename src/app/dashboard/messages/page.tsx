/**
 * メッセージ一覧ダッシュボードページ
 *
 * 受信トレイと送信トレイをタブで切り替えて表示する。
 */

"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import MinLoader from "@/components/MinLoader"
import SideMenu from "@/components/SideMenu"
import MessageList from "@/components/messages/MessageList"
import useAuth from "@/hooks/useAuth"
import { MessageWithUsers } from "@/domain/message/Message"
import { handleClientError } from "@/utils/errorHandler.client"

/** タブの種別 */
type Tab = "inbox" | "sent"

/**
 * メッセージ一覧ページコンポーネント
 *
 * @returns メッセージ一覧ページのJSX要素
 */
const MessagesPage = () => {
  const { user, loading } = useAuth()
  const [activeTab, setActiveTab] = useState<Tab>("inbox")
  const [inboxMessages, setInboxMessages] = useState<MessageWithUsers[]>([])
  const [sentMessages, setSentMessages] = useState<MessageWithUsers[]>([])
  const [dataLoading, setDataLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  /**
   * メッセージデータを取得する
   */
  const fetchMessages = useCallback(async () => {
    setDataLoading(true)
    setError(null)
    try {
      const [inboxRes, sentRes] = await Promise.all([
        fetch("/api/messages"),
        fetch("/api/messages/sent"),
      ])

      if (!inboxRes.ok || !sentRes.ok) {
        throw new Error("メッセージの取得に失敗しました")
      }

      const [inboxData, sentData] = await Promise.all([
        inboxRes.json(),
        sentRes.json(),
      ])

      setInboxMessages(inboxData)
      setSentMessages(sentData)
    } catch (err) {
      setError(handleClientError(err, "メッセージの取得に失敗しました"))
    } finally {
      setDataLoading(false)
    }
  }, [])

  useEffect(() => {
    if (user) {
      fetchMessages()
    }
  }, [user, fetchMessages])

  /**
   * メッセージを削除する
   *
   * @param messageId - 削除するメッセージID
   */
  const handleDelete = async (messageId: number) => {
    if (!confirm("このメッセージを削除しますか？")) return

    try {
      const response = await fetch(`/api/messages/${messageId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setInboxMessages((prev) =>
          prev.filter((m) => m.message_id !== messageId)
        )
        setSentMessages((prev) =>
          prev.filter((m) => m.message_id !== messageId)
        )
      } else {
        const data = await response.json()
        alert(data.error || "削除に失敗しました")
      }
    } catch (err) {
      alert(handleClientError(err, "削除に失敗しました"))
    }
  }

  /**
   * メッセージを既読にする
   *
   * @param messageId - 既読にするメッセージID
   */
  const handleRead = async (messageId: number) => {
    try {
      const response = await fetch(`/api/messages/${messageId}/read`, {
        method: "PATCH",
      })

      if (response.ok) {
        setInboxMessages((prev) =>
          prev.map((m) =>
            m.message_id === messageId ? { ...m, is_read: true } : m
          )
        )
      } else {
        const data = await response.json()
        alert(data.error || "既読化に失敗しました")
      }
    } catch (err) {
      alert(handleClientError(err, "既読化に失敗しました"))
    }
  }

  if (loading || !user) {
    return <MinLoader />
  }

  return (
    <div className="min-h-screen text-white p-4 flex">
      <SideMenu />
      <div className="w-4/5 p-4">
        <div className="container mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">メッセージ</h1>
            <button
              onClick={() => router.push("/dashboard/messages/compose")}
              className="px-4 py-2 bg-indigo-500 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-600"
            >
              新規メッセージ
            </button>
          </div>

          {error && (
            <div className="p-3 mb-4 bg-red-500 bg-opacity-20 border border-red-500 rounded-md text-red-300">
              {error}
            </div>
          )}

          {/* タブ切り替え */}
          <div className="flex border-b border-gray-600 mb-4">
            <button
              onClick={() => setActiveTab("inbox")}
              className={`px-6 py-2 text-sm font-medium transition-colors ${
                activeTab === "inbox"
                  ? "border-b-2 border-indigo-400 text-indigo-400"
                  : "text-gray-400 hover:text-gray-200"
              }`}
            >
              受信トレイ
              {inboxMessages.filter((m) => !m.is_read).length > 0 && (
                <span className="ml-2 px-2 py-0.5 text-xs bg-indigo-500 text-white rounded-full">
                  {inboxMessages.filter((m) => !m.is_read).length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("sent")}
              className={`px-6 py-2 text-sm font-medium transition-colors ${
                activeTab === "sent"
                  ? "border-b-2 border-indigo-400 text-indigo-400"
                  : "text-gray-400 hover:text-gray-200"
              }`}
            >
              送信トレイ
            </button>
          </div>

          {dataLoading ? (
            <MinLoader />
          ) : (
            <>
              {activeTab === "inbox" && (
                <MessageList
                  messages={inboxMessages}
                  variant="inbox"
                  onDelete={handleDelete}
                  onRead={handleRead}
                />
              )}
              {activeTab === "sent" && (
                <MessageList
                  messages={sentMessages}
                  variant="sent"
                  onDelete={handleDelete}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default MessagesPage
