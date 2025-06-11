"use client"

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

const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

const Calendar = ({ currentDate, todos }: CalendarProps) => {
  const days = useMemo(() => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const totalDays = lastDay.getDate()
    const offset = firstDay.getDay()
    const items: { date: Date | null; todos: TodoItem[] }[] = []

    for (let i = 0; i < offset; i++) {
      items.push({ date: null, todos: [] })
    }
    for (let i = 1; i <= totalDays; i++) {
      const date = new Date(year, month, i)
      const iso = date.toISOString().split("T")[0]
      const dayTodos = todos.filter((t) =>
        t.todo_deadline.startsWith(iso),
      )
      items.push({ date, todos: dayTodos })
    }

    return items
  }, [currentDate, todos])

  return (
    <div className="grid grid-cols-7 gap-2 text-center">
      {dayNames.map((day) => (
        <div key={day} className="font-semibold">
          {day}
        </div>
      ))}
      {days.map((d, idx) => (
        <div
          key={idx}
          className="border border-gray-400 rounded-md h-24 p-1 text-xs flex flex-col"
        >
          {d.date && (
            <>
              <span className="self-end text-sm font-medium">
                {d.date.getDate()}
              </span>
              <ul className="list-disc ml-2 overflow-hidden">
                {d.todos.map((todo) => (
                  <li key={todo.todo_id} className="truncate text-left">
                    {todo.title}
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      ))}
    </div>
  )
}

export default Calendar
