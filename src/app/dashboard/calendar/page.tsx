"use client"

import { Alert, Box, Button, LinearProgress, Stack, Typography } from "@mui/material"
import MinLoader from "@/components/MinLoader"
import Calendar, { TodoItem } from "@/components/calendar/Calendar"
import useAuth from "@/hooks/useAuth"
import { useEffect, useState } from "react"

const getTodoList = async (id: string, currentDate: Date, signal: AbortSignal) => {
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const from = `${year}-${String(month + 1).padStart(2, "0")}-01`
  const nextMonth = new Date(year, month + 1, 1)
  const to = `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, "0")}-01`
  const todos: TodoItem[] = []
  let cursor: string | null = null

  do {
    const query = new URLSearchParams({ from, to, limit: "100" })
    if (cursor) query.set("cursor", cursor)
    const response = await fetch(`/api/todoList/${id}?${query}`, { signal })
    if (!response.ok) throw new Error(`Failed to fetch Todos: ${response.status}`)
    todos.push(...((await response.json()) as TodoItem[]))
    const nextCursor = response.headers.get("X-Next-Cursor")
    if (nextCursor === cursor) throw new Error("Todo pagination did not advance")
    cursor = nextCursor
  } while (cursor)

  return todos
}

export default function CalendarPage() {
  const { user, loading: authLoading } = useAuth()
  const [currentDate, setCurrentDate] = useState(() => new Date())
  const [todos, setTodos] = useState<TodoItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (authLoading || !user?.id) return
    const controller = new AbortController()

    const fetchData = async () => {
      try {
        setLoading(true)
        const data = await getTodoList(user.id, currentDate, controller.signal)
        if (controller.signal.aborted) return
        setTodos(data)
        setError(null)
      } catch (cause) {
        if (controller.signal.aborted) return
        console.error("Calendar Todo request failed:", cause)
        setError("Failed to load Todos. Please try again later.")
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }

    void fetchData()
    return () => controller.abort()
  }, [user?.id, authLoading, currentDate])

  if (authLoading || !user) return <MinLoader />

  const monthLabel = currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h4" component="h1" gutterBottom>
          Todo Calendar
        </Typography>
        <Typography color="text.secondary">Review deadlines across the month.</Typography>
      </Box>

      <Stack direction="row" spacing={2} sx={{ alignItems: "center", justifyContent: "center" }}>
        <Button
          onClick={() =>
            setCurrentDate(
              (previous) => new Date(previous.getFullYear(), previous.getMonth() - 1, 1),
            )
          }
        >
          Previous
        </Button>
        <Typography variant="h5" component="h2" sx={{ minWidth: { sm: 220 }, textAlign: "center" }}>
          {monthLabel}
        </Typography>
        <Button
          onClick={() =>
            setCurrentDate(
              (previous) => new Date(previous.getFullYear(), previous.getMonth() + 1, 1),
            )
          }
        >
          Next
        </Button>
      </Stack>

      {error && <Alert severity="error">{error}</Alert>}
      {loading && <LinearProgress aria-label="Loading calendar Todos" />}
      <Box sx={{ overflowX: "auto", pb: 1 }}>
        <Calendar currentDate={currentDate} todos={todos} />
      </Box>
    </Stack>
  )
}
