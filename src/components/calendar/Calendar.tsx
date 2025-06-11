"use client"

// Todoの締切を表示するための再利用可能な月間カレンダーコンポーネントです。
// Todoが存在する日はハイライト表示されます。

import { useMemo } from "react"

// カレンダーで使用するTodoの型定義。
// `todo_deadline` は ISO 形式の日付文字列である必要があります。

export interface TodoItem {
  todo_id: number
  title: string
  todo_deadline: string
}

// Calendarコンポーネントが受け取るプロパティ
interface CalendarProps {
  currentDate: Date
  todos: TodoItem[]
}

const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

const Calendar = ({ currentDate, todos }: CalendarProps) => {
  // 現在の月を計算し、入力が変わったときだけ再計算する
  const days = useMemo(() => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const totalDays = lastDay.getDate()
    const offset = firstDay.getDay()
    const items: { date: Date | null; todos: TodoItem[] }[] = []

    // 月初より前の空白セルを追加
    for (let i = 0; i < offset; i++) {
      items.push({ date: null, todos: [] })
    }
    // 各日に該当するTodoを追加
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

  // 曜日ヘッダーとTodoタイトルを表示するカレンダーを描画
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

// 他のページから利用できるようエクスポート
export default Calendar
