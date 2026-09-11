"use client"

import { Button, Stack } from "@mui/material"
import MinLoader from "@/components/MinLoader"
import TodoForm, { TodoFormValues } from "@/components/todo/TodoForm"
import useAuth from "@/hooks/useAuth"
import { getTodoBusinessToday } from "@/utils/todoDate"
import { useRouter } from "next/navigation"
import { useState } from "react"

const initialValues: TodoFormValues = {
  title: "",
  description: "",
  dueDate: "",
  visibility: "private",
}

export default function RegisterTodoPage() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [values, setValues] = useState(initialValues)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      if (!values.title.trim()) throw new Error("Title is required")
      if (!values.description.trim()) throw new Error("Description is required")
      if (!values.dueDate) throw new Error("Due date is required")
      if (values.dueDate < getTodoBusinessToday()) {
        throw new Error("Due date must be today or later")
      }

      const response = await fetch("/api/todoList", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: values.title.trim(),
          description: values.description.trim(),
          todo_deadline: values.dueDate,
          is_public: values.visibility === "public",
        }),
      })
      const responseBody = await response.json().catch(() => null)
      if (!response.ok) throw new Error(responseBody?.error || "Failed to create Todo")
      router.push("/dashboard/todoList")
    } catch (cause) {
      console.error("Todo creation failed:", cause)
      setError(cause instanceof Error ? cause.message : "Failed to create Todo")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading || !user) return <MinLoader />

  return (
    <Stack spacing={3} sx={{ alignItems: "center" }}>
      <Button
        onClick={() => router.push("/dashboard/todoList")}
        disabled={isSubmitting}
        sx={{ alignSelf: "flex-start" }}
      >
        Back to My Todo List
      </Button>
      <TodoForm
        heading="Register New Todo"
        submitLabel="Register"
        values={values}
        error={error}
        submitting={isSubmitting}
        minimumDueDate={getTodoBusinessToday()}
        onChange={setValues}
        onSubmit={handleSubmit}
        onCancel={() => router.push("/dashboard/todoList")}
      />
    </Stack>
  )
}
