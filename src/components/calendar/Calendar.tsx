"use client"

import { Box, Typography } from "@mui/material"
import { formatTodoDate, getLocalToday } from "@/utils/todoDate"
import { useMemo } from "react"

export interface TodoItem {
  todo_id: number
  title: string
  todo_deadline: string
}

interface CalendarProps {
  currentDate: Date
  todos: TodoItem[]
}

const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

type CalendarCell = { date: Date | null; todos: TodoItem[] }

export default function Calendar({ currentDate, todos }: CalendarProps) {
  const weeks = useMemo(() => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const firstDay = new Date(year, month, 1)
    const totalDays = new Date(year, month + 1, 0).getDate()
    const items: CalendarCell[] = Array.from({ length: firstDay.getDay() }, () => ({
      date: null,
      todos: [],
    }))

    for (let day = 1; day <= totalDays; day += 1) {
      const date = new Date(year, month, day)
      const dateKey = getLocalToday(date)
      items.push({
        date,
        todos: todos.filter((todo) => formatTodoDate(todo.todo_deadline) === dateKey),
      })
    }

    while (items.length % 7 !== 0) items.push({ date: null, todos: [] })
    const rows: CalendarCell[][] = []
    for (let index = 0; index < items.length; index += 7) rows.push(items.slice(index, index + 7))
    return rows
  }, [currentDate, todos])

  return (
    <Box
      role="grid"
      aria-label={`${currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })} Todo calendar`}
      sx={{ minWidth: 700, border: 1, borderColor: "divider" }}
    >
      <Box role="row" sx={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))" }}>
        {dayNames.map((day, dayIndex) => (
          <Box
            key={day}
            role="columnheader"
            aria-label={day}
            sx={{
              p: 1.5,
              textAlign: "center",
              borderRight: dayIndex < 6 ? 1 : 0,
              borderBottom: 1,
              borderColor: "divider",
            }}
          >
            <Typography variant="subtitle2">{day.slice(0, 3)}</Typography>
          </Box>
        ))}
      </Box>

      {weeks.map((week, weekIndex) => (
        <Box
          role="row"
          key={`week-${weekIndex}`}
          sx={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))" }}
        >
          {week.map((cell, dayIndex) => {
            const fullDate = cell.date?.toLocaleDateString("en-US", { dateStyle: "full" })
            const todoSummary = cell.todos.map((todo) => todo.title).join(", ")
            return (
              <Box
                role="gridcell"
                key={cell.date ? getLocalToday(cell.date) : `blank-${weekIndex}-${dayIndex}`}
                aria-label={
                  fullDate
                    ? `${fullDate}. ${cell.todos.length} Todo${cell.todos.length === 1 ? "" : "s"}${todoSummary ? `: ${todoSummary}` : ""}`
                    : "Outside the current month"
                }
                sx={{
                  aspectRatio: "1 / 1",
                  p: 1,
                  minWidth: 0,
                  overflow: "hidden",
                  borderRight: dayIndex < 6 ? 1 : 0,
                  borderBottom: weekIndex < weeks.length - 1 ? 1 : 0,
                  borderColor: "divider",
                }}
              >
                {cell.date && (
                  <Box>
                    <Typography variant="body2" sx={{ mb: 0.75, textAlign: "right" }}>
                      {cell.date.getDate()}
                    </Typography>
                    {cell.todos.map((todo) => (
                      <Typography
                        key={todo.todo_id}
                        variant="caption"
                        component="p"
                        title={todo.title}
                        sx={{
                          m: 0,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {todo.title}
                      </Typography>
                    ))}
                  </Box>
                )}
              </Box>
            )
          })}
        </Box>
      ))}
    </Box>
  )
}
