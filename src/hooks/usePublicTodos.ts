import type { PublicTodo } from "@/types/todo"
import { useCallback, useEffect, useRef, useState } from "react"

export function usePublicTodos() {
  const [todos, setTodos] = useState<PublicTodo[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(false)
  const nextCursorRef = useRef<string | null>(null)
  const requestRef = useRef<AbortController | null>(null)

  const fetchPublicTodos = useCallback(async (append = false) => {
    requestRef.current?.abort()
    const controller = new AbortController()
    requestRef.current = controller

    try {
      setIsLoading(true)
      setError(null)

      const cursor = append ? nextCursorRef.current : null
      const response = await fetch(
        `/api/todoList?limit=20${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ""}`,
        { signal: controller.signal },
      )
      if (!response.ok) {
        throw new Error("公開ToDoリストの取得に失敗しました")
      }

      const data = (await response.json()) as PublicTodo[]
      if (!Array.isArray(data)) {
        throw new Error("公開ToDoリストの応答形式が不正です")
      }
      if (requestRef.current !== controller) {
        return
      }

      setTodos((previous) => (append ? [...previous, ...data] : data))
      const nextCursor = response.headers.get("X-Next-Cursor")
      nextCursorRef.current = nextCursor
      setHasMore(nextCursor !== null)
    } catch (cause) {
      if (cause instanceof DOMException && cause.name === "AbortError") {
        return
      }

      const message = cause instanceof Error ? cause.message : "公開ToDoリストの取得に失敗しました"
      setError(message)
    } finally {
      if (requestRef.current === controller) {
        requestRef.current = null
        setIsLoading(false)
      }
    }
  }, [])

  useEffect(() => () => requestRef.current?.abort(), [])

  const clearError = useCallback(() => setError(null), [])

  return { todos, isLoading, error, fetchPublicTodos, clearError, hasMore }
}
