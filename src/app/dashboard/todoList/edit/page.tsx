"use client"

import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded"
import { Alert, Button, Stack } from "@mui/material"
import MinLoader from "@/components/MinLoader"
import TodoForm, { TodoFormValues } from "@/components/todo/TodoForm"
import useAuth from "@/hooks/useAuth"
import { Todo } from "@/types/todo"
import { formatTodoDate } from "@/utils/todoDate"
import { useRouter, useSearchParams } from "next/navigation"
import { Suspense, useEffect, useState } from "react"

const emptyValues: TodoFormValues = {
  title: "",
  description: "",
  dueDate: "",
  visibility: "private",
  isCompleted: false,
}

function EditTodoPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const todoId = searchParams.get("id")
  const { user, loading } = useAuth()
  const [values, setValues] = useState(emptyValues)
  const [initialDueDate, setInitialDueDate] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user?.id || !todoId) {
      setIsLoading(false)
      return
    }

    const controller = new AbortController()
    const initializeTodo = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const response = await fetch(
          `/api/todoList/${user.id}?todo_id=${encodeURIComponent(todoId)}`,
          { signal: controller.signal },
        )
        if (!response.ok) throw new Error("Failed to fetch Todo")
        const todo = (await response.json()) as Todo
        const dueDate = formatTodoDate(todo.todo_deadline)
        setValues({
          title: todo.title,
          description: todo.description || "",
          dueDate,
          visibility: todo.is_public ? "public" : "private",
          isCompleted: todo.is_completed,
        })
        setInitialDueDate(dueDate)
      } catch (cause) {
        if (controller.signal.aborted) return
        console.error("Todo request failed:", cause)
        setError(cause instanceof Error ? cause.message : "Failed to fetch Todo")
      } finally {
        if (!controller.signal.aborted) setIsLoading(false)
      }
    }

    void initializeTodo()
    return () => controller.abort()
  }, [user?.id, todoId])

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!todoId || !user) return

    setIsSubmitting(true)
    setError(null)
    try {
      const numericTodoId = Number(todoId)
      if (!Number.isInteger(numericTodoId) || numericTodoId <= 0) {
        throw new Error("Invalid Todo ID")
      }
      if (!values.title.trim()) throw new Error("Title is required")
      if (!values.description.trim()) throw new Error("Description is required")
      if (!values.dueDate) throw new Error("Due date is required")

      const response = await fetch(`/api/todoList/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          todo_id: numericTodoId,
          title: values.title.trim(),
          description: values.description.trim(),
          ...(values.dueDate !== initialDueDate && { todo_deadline: values.dueDate }),
          is_completed: Boolean(values.isCompleted),
          is_public: values.visibility === "public",
        }),
      })
      const responseBody = await response.json().catch(() => null)
      if (!response.ok) throw new Error(responseBody?.error || "Failed to update Todo")
      router.push("/dashboard/todoList")
    } catch (cause) {
      console.error("Todo update failed:", cause)
      setError(cause instanceof Error ? cause.message : "Failed to update Todo")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading || !user || isLoading) return <MinLoader />

  if (!todoId) {
    return (
      <Stack spacing={2} sx={{ alignItems: "flex-start" }}>
        <Alert severity="error">Todo ID is not specified.</Alert>
        <Button
          startIcon={<ArrowBackRoundedIcon />}
          onClick={() => router.push("/dashboard/todoList")}
        >
          Back to Todo List
        </Button>
      </Stack>
    )
  }

  return (
    <Stack spacing={3} sx={{ alignItems: "center" }}>
      <Button
        startIcon={<ArrowBackRoundedIcon />}
        onClick={() => router.push("/dashboard/todoList")}
        disabled={isSubmitting}
        sx={{ alignSelf: "flex-start" }}
      >
        Back to My Todo List
      </Button>
      <TodoForm
        heading="Edit Todo"
        submitLabel="Update"
        values={values}
        error={error}
        submitting={isSubmitting}
        showCompleted
        onChange={setValues}
        onSubmit={handleSubmit}
        onCancel={() => router.push("/dashboard/todoList")}
      />
    </Stack>
  )
}

export default function EditTodoPage() {
  return (
    <Suspense fallback={<MinLoader />}>
      <EditTodoPageContent />
    </Suspense>
  )
}
