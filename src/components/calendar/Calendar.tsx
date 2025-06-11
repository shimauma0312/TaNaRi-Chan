"use client"

import React, { useState } from "react"

interface Todo {
  todo_id: number
  title: string
  todo_deadline: string
}

const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

const Calendar: React.FC<{ todos?: Todo[] }> = ({ todos = [] }) => {
  const [currentDate, setCurrentDate] = useState(new Date())

  const startOfMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    1,
  )
  const endOfMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth() + 1,
    0,
  )

  const days: (Date | null)[] = []
  for (let i = 0; i < startOfMonth.getDay(); i++) {
    days.push(null)
  }
  for (let i = 1; i <= endOfMonth.getDate(); i++) {
    days.push(new Date(currentDate.getFullYear(), currentDate.getMonth(), i))
  }

  const handlePrev = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1),
    )
  }
  const handleNext = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1),
    )
  }

  const isToday = (date: Date) => {
    const today = new Date()
    return (
      date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth() &&
      date.getDate() === today.getDate()
    )
  }

  const todosByDate = (date: Date) => {
    return todos.filter((todo) => {
      const d = new Date(todo.todo_deadline)
      return (
        d.getFullYear() === date.getFullYear() &&
        d.getMonth() === date.getMonth() &&
        d.getDate() === date.getDate()
      )
    })
  }

  return (
    <div className="w-full max-w-xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <button
          onClick={handlePrev}
          className="px-2 py-1 bg-gray-700 text-white rounded"
        >
          Prev
        </button>
        <h2 className="text-xl font-bold">
          {currentDate.toLocaleString("default", { month: "long", year: "numeric" })}
        </h2>
        <button
          onClick={handleNext}
          className="px-2 py-1 bg-gray-700 text-white rounded"
        >
          Next
        </button>
      </div>
      <div className="grid grid-cols-7 gap-px bg-gray-700 text-center text-sm">
        {dayNames.map((day) => (
          <div key={day} className="bg-gray-700 py-1 font-semibold">
            {day}
          </div>
        ))}
        {days.map((date, idx) => (
          <div
            key={idx}
            className="bg-gray-800 h-20 border border-gray-700 flex flex-col items-start p-1 text-sm"
          >
            {date && (
              <div
                className={`text-right w-full ${
                  isToday(date) ? "bg-indigo-500 text-white rounded" : ""
                }`}
              >
                {date.getDate()}
              </div>
            )}
            {date &&
              todosByDate(date)
                .slice(0, 2)
                .map((todo) => (
                  <div key={todo.todo_id} className="text-xs truncate">
                    • {todo.title}
                  </div>
                ))}
            {date && todosByDate(date).length > 2 && (
              <div className="text-xs">...</div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default Calendar
