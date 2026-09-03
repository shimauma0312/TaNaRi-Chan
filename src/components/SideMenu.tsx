"use client"

import { useLogout } from "@/hooks/useLogout"
import Link from "next/link"

const SideMenu = () => {
  const { handleLogout, error, isLoggingOut } = useLogout()

  return (
    <aside className="w-full md:w-1/5 p-4" aria-label="ダッシュボードメニュー">
      <nav className="flex flex-wrap gap-4 md:block md:space-y-4">
        <Link href="/dashboard" className="block text-lg text-indigo-400 hover:text-indigo-300">
          Dashboard
        </Link>
        <Link
          href="/dashboard/todoList"
          className="block text-lg text-indigo-400 hover:text-indigo-300"
        >
          My Todo List
        </Link>
        <Link
          href="/dashboard/otherTodos"
          className="block text-lg text-indigo-400 hover:text-indigo-300"
        >
          Other&apos;s Todo List
        </Link>
        <Link
          href="/dashboard/articles"
          className="block text-lg text-indigo-400 hover:text-indigo-300"
        >
          My Articles
        </Link>
        <Link
          href="/dashboard/messages"
          className="block text-lg text-indigo-400 hover:text-indigo-300"
        >
          Messages
        </Link>
        <Link
          href="/dashboard/calendar"
          className="block text-lg text-indigo-400 hover:text-indigo-300"
        >
          Calendar
        </Link>
        <button
          className="block w-full bg-red-500 text-lg text-white py-1 px-3 rounded-md shadow-sm hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          onClick={handleLogout}
          disabled={isLoggingOut}
        >
          {isLoggingOut ? "Logging out..." : "Logout"}
        </button>
      </nav>
      {error && (
        <p role="alert" className="mt-3 text-sm text-red-300">
          {error}
        </p>
      )}
    </aside>
  )
}

export default SideMenu
