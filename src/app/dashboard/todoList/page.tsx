"use client"

import { Alert, Box, Button, CircularProgress, Stack, Typography } from "@mui/material"
import TodoList from "@/components/TodoList"
import MinLoader from "@/components/MinLoader"
import useAuth from "@/hooks/useAuth"
import { Todo } from "@/types/todo"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useRef, useState } from "react"

const getTodoList = async (
  id: string,
  cursor: string | undefined,
  signal: AbortSignal,
): Promise<{ todos: Todo[]; nextCursor: string | null }> => {
  const query = new URLSearchParams({ limit: "20" })
  if (cursor) query.set("cursor", cursor)
  const response = await fetch(`/api/todoList/${id}?${query}`, { signal })
  if (!response.ok) throw new Error("Failed to fetch Todo list")
  return {
    todos: (await response.json()) as Todo[],
    nextCursor: response.headers.get("X-Next-Cursor"),
  }
}

const toggleTodoCompletion = async (todoId: number): Promise<Todo> => {
  const response = await fetch(`/api/todoList/toggle/${todoId}`, { method: "PATCH" })
  if (!response.ok) throw new Error("Failed to toggle completion status")
  return response.json()
}

const deleteTodo = async (todoId: number, userId: string): Promise<void> => {
  const response = await fetch(
    `/api/todoList/${userId}?todo_id=${encodeURIComponent(String(todoId))}`,
    { method: "DELETE" },
  )
  if (!response.ok) throw new Error("Failed to delete Todo")
}

export default function ToDoListPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const requestRef = useRef<AbortController | null>(null)
  const [todoList, setTodoList] = useState<Todo[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [nextCursor, setNextCursor] = useState<string | null>(null)

  const fetchTodoList = useCallback(
    async (cursor?: string) => {
      if (!user) return

      requestRef.current?.abort()
      const controller = new AbortController()
      requestRef.current = controller
      try {
        setIsLoading(true)
        setError(null)
        const page = await getTodoList(user.id, cursor, controller.signal)
        if (requestRef.current !== controller) return
        setTodoList((previous) => (cursor ? [...previous, ...page.todos] : page.todos))
        setNextCursor(page.nextCursor)
      } catch (cause) {
        if (controller.signal.aborted) return
        console.error("Todo list request failed:", cause)
        setError(cause instanceof Error ? cause.message : "Failed to fetch Todo list")
      } finally {
        if (requestRef.current === controller) {
          requestRef.current = null
          setIsLoading(false)
        }
      }
    },
    [user],
  )

  useEffect(() => {
    if (user) void fetchTodoList()
    return () => requestRef.current?.abort()
  }, [user, fetchTodoList])

  const handleToggleCompletion = async (todoId: number) => {
    try {
      const updatedTodo = await toggleTodoCompletion(todoId)
      setTodoList((previous) =>
        previous.map((todo) => (todo.todo_id === todoId ? updatedTodo : todo)),
      )
    } catch (cause) {
      console.error("Todo toggle failed:", cause)
      setError(cause instanceof Error ? cause.message : "Failed to update Todo")
      throw cause
    }
  }

  const handleDeleteTodo = async (todoId: number) => {
    if (!user) return
    try {
      await deleteTodo(todoId, user.id)
      setTodoList((previous) => previous.filter((todo) => todo.todo_id !== todoId))
    } catch (cause) {
      console.error("Todo deletion failed:", cause)
      setError(cause instanceof Error ? cause.message : "Failed to delete Todo")
      throw cause
    }
  }

  if (loading || !user) return <MinLoader />

  return (
    <Stack spacing={3}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={2}
        sx={{ alignItems: { sm: "center" }, justifyContent: "space-between" }}
      >
        <Typography variant="h4" component="h1">
          My Todo List
        </Typography>
        <Button
          variant="contained"
          onClick={() => router.push("/dashboard/todoList/register")}
        >
          Add Todo
        </Button>
      </Stack>

      {error && (
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {isLoading && todoList.length === 0 ? (
        <Box role="status" aria-label="Loading Todo list" sx={{ py: 8, textAlign: "center" }}>
          <CircularProgress />
        </Box>
      ) : todoList.length === 0 ? (
        <Box sx={{ py: 8, textAlign: "center" }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No Todos yet
          </Typography>
          <Button
            variant="contained"
            onClick={() => router.push("/dashboard/todoList/register")}
          >
            Create your first Todo
          </Button>
        </Box>
      ) : (
        <>
          <TodoList
            todos={todoList}
            onToggleCompletion={handleToggleCompletion}
            onEdit={(todoId) => router.push(`/dashboard/todoList/edit?id=${todoId}`)}
            onDelete={handleDeleteTodo}
          />
          {nextCursor && (
            <Box sx={{ textAlign: "center" }}>
              <Button
                variant="outlined"
                onClick={() => void fetchTodoList(nextCursor)}
                disabled={isLoading}
              >
                {isLoading ? "Loading..." : "Load more"}
              </Button>
            </Box>
          )}
        </>
      )}
    </Stack>
  )
}
