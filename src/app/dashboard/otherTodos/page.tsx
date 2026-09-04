"use client"

import SideMenu from "@/components/SideMenu"
import TodoList from "@/components/TodoList"
import useAuth from "@/hooks/useAuth"
import { usePublicTodos } from "@/hooks/usePublicTodos"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"

interface PublicUser {
  id: string
  user_name: string
}

export default function OtherTodosPage() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const { todos, isLoading, error, fetchPublicTodos, clearError, hasMore } = usePublicTodos()

  const [selectedUser, setSelectedUser] = useState<string>("")

  // 公開ToDoを取得
  useEffect(() => {
    if (user) {
      fetchPublicTodos()
    }
  }, [user, fetchPublicTodos])

  // 公開ToDoから表示用のユーザーリストを導出
  const uniqueUsers = useMemo(() => {
    const userMap = new Map<string, PublicUser>()
    todos.forEach((todo) => {
      // PublicTodoかどうかをチェック
      if (todo.user.id !== user?.id && !userMap.has(todo.user.id)) {
        userMap.set(todo.user.id, {
          id: todo.user.id,
          user_name: todo.user.user_name,
        })
      }
    })
    return Array.from(userMap.values())
  }, [todos, user?.id])

  // 選択中のユーザーに応じた一覧を導出
  const filteredTodos = useMemo(() => {
    return todos.filter((todo) => {
      if (todo.user.id === user?.id) return false
      return !selectedUser || todo.user.id === selectedUser
    })
  }, [todos, selectedUser, user?.id])

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-lg">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen text-white p-4 flex flex-col md:flex-row">
      <SideMenu />
      <div className="w-full md:w-4/5 p-4">
        <div className="container mx-auto">
          {/* ヘッダー */}
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h1 className="text-3xl font-bold">Public Todos</h1>
            <button
              onClick={() => router.push("/dashboard")}
              className="px-4 py-2 bg-red-500 text-white rounded-md shadow-sm hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Back to Dashboard
            </button>
          </div>

          {/* 説明文 */}
          <div className="mb-6 p-4 bg-blue-900/30 border border-blue-500 rounded-lg">
            <p className="text-blue-300">
              📋 View public todos shared by other users. Get inspired by everyone&apos;s goals and
              activities!
            </p>
          </div>

          {/* フィルター */}
          <div className="mb-6">
            <label htmlFor="public-todo-user" className="block text-lg font-medium mb-2">
              Filter by User:
            </label>
            <select
              id="public-todo-user"
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="px-4 py-2 bg-gray-800 border border-gray-600 rounded-md text-white focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
            >
              <option value="">All Users</option>
              {uniqueUsers.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.user_name}
                </option>
              ))}
            </select>
          </div>

          {/* 統計情報 */}
          {filteredTodos.length > 0 && (
            <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-blue-500/20 border border-blue-500 rounded-lg p-4">
                <div className="text-sm text-blue-300">Total Public Todos</div>
                <div className="text-2xl font-bold">{filteredTodos.length}</div>
              </div>
              <div className="bg-green-500/20 border border-green-500 rounded-lg p-4">
                <div className="text-sm text-green-300">Completed</div>
                <div className="text-2xl font-bold">
                  {filteredTodos.filter((todo) => todo.is_completed).length}
                </div>
              </div>
              <div className="bg-yellow-500/20 border border-yellow-500 rounded-lg p-4">
                <div className="text-sm text-yellow-300">In Progress</div>
                <div className="text-2xl font-bold">
                  {filteredTodos.filter((todo) => !todo.is_completed).length}
                </div>
              </div>
              <div className="bg-purple-500/20 border border-purple-500 rounded-lg p-4">
                <div className="text-sm text-purple-300">Users</div>
                <div className="text-2xl font-bold">{selectedUser ? 1 : uniqueUsers.length}</div>
              </div>
            </div>
          )}

          {/* エラーメッセージ */}
          {error && (
            <div role="alert" className="mb-6 p-4 bg-red-500/20 border border-red-500 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-red-300">{error}</span>
                <button onClick={clearError} className="text-red-300 hover:text-white">
                  ✕
                </button>
              </div>
            </div>
          )}

          {/* ローディング */}
          {isLoading && (
            <div className="text-center py-8">
              <div className="text-lg text-gray-400">Loading...</div>
            </div>
          )}

          {/* ToDoリスト */}
          {!isLoading && filteredTodos.length > 0 && (
            <TodoList
              todos={filteredTodos}
              showStats={false} // 統計は上で表示するため無効化
              allowEdit={false} // 他人のToDoは編集不可
              showPublicBadge={false} // すべて公開ToDoなので不要
            />
          )}

          {!isLoading && hasMore && (
            <div className="mt-6 text-center">
              <button
                onClick={() => fetchPublicTodos(true)}
                className="px-5 py-2 bg-indigo-500 rounded-md hover:bg-indigo-600"
              >
                さらに読み込む
              </button>
            </div>
          )}

          {/* 空の状態 */}
          {!isLoading && filteredTodos.length === 0 && !error && (
            <div className="text-center py-12">
              <div className="text-lg text-gray-400 mb-4">
                {selectedUser
                  ? "No public todos found for this user"
                  : "No public todos available yet"}
              </div>
              <p className="text-gray-500 mb-6">
                {selectedUser
                  ? "Try selecting a different user or clear the filter."
                  : "Why not create the first public todo?"}
              </p>
              <div className="space-x-4">
                {selectedUser && (
                  <button
                    onClick={() => setSelectedUser("")}
                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                  >
                    Show All Users
                  </button>
                )}
                <button
                  onClick={() => router.push("/dashboard/todoList/register")}
                  className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
                >
                  Create New Todo
                </button>
              </div>
            </div>
          )}

          {/* フッター情報 */}
          <div className="mt-8 p-4 bg-gray-800/50 rounded-lg border border-gray-600">
            <div className="text-sm text-gray-400">
              💡 <strong>Tip:</strong>
              Public todos can be viewed by other users. If you want to keep them private, create
              todos with &quot;Private&quot; setting.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
