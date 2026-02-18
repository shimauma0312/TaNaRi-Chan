/**
 * メッセージ作成ページ
 *
 * 新規メッセージを作成・送信する。
 */

"use client"

import { useEffect, useState } from "react"
import MinLoader from "@/components/MinLoader"
import SideMenu from "@/components/SideMenu"
import MessageForm from "@/components/messages/MessageForm"
import useAuth from "@/hooks/useAuth"
import { handleClientError } from "@/utils/errorHandler.client"

/**
 * ユーザー情報の型
 *
 * @property id        - ユーザーID
 * @property user_name - ユーザー名
 */
interface User {
  id: string
  user_name: string
}

/**
 * メッセージ作成ページコンポーネント
 *
 * @returns メッセージ作成ページのJSX要素
 */
const ComposeMessagePage = () => {
  const { user, loading } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [usersLoading, setUsersLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      const fetchUsers = async () => {
        try {
          const response = await fetch("/api/users")
          if (response.ok) {
            const data = await response.json()
            setUsers(data)
          } else {
            setError("ユーザー一覧の取得に失敗しました")
          }
        } catch (err) {
          setError(handleClientError(err, "ユーザー一覧の取得に失敗しました"))
        } finally {
          setUsersLoading(false)
        }
      }

      fetchUsers()
    }
  }, [user])

  if (loading || !user) {
    return <MinLoader />
  }

  return (
    <div className="min-h-screen text-white p-4 flex">
      <SideMenu />
      <div className="w-4/5 p-4">
        <div className="container mx-auto max-w-2xl">
          <h1 className="text-2xl font-bold mb-6">新規メッセージ</h1>

          {error && (
            <div className="p-3 mb-4 bg-red-500 bg-opacity-20 border border-red-500 rounded-md text-red-300">
              {error}
            </div>
          )}

          {usersLoading ? (
            <MinLoader />
          ) : (
            <MessageForm users={users} />
          )}
        </div>
      </div>
    </div>
  )
}

export default ComposeMessagePage
