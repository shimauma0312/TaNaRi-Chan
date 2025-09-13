"use client"

import { useLogout } from "@/hooks/useLogout"
import Link from "next/link"

const SideMenu = () => {
  const { handleLogout } = useLogout()

  return (
    <div className="w-1/5 p-4">
      <nav className="space-y-4">
        <div className="space-y-4">
          <Link
            href="/dashboard/todoList"
            className="block text-lg text-indigo-400 hover:text-indigo-300 no-underline"
            style={{ listStyle: 'none', textDecoration: 'none' }}
          >
            My Todo List
          </Link>
          <Link
            href="/dashboard/otherTodos"
            className="block text-lg text-indigo-400 hover:text-indigo-300 no-underline"
            style={{ listStyle: 'none', textDecoration: 'none' }}
          >
            Other&apos;s Todo List
          </Link>
          <Link
            href="/dashboard/articles"
            className="block text-lg text-indigo-400 hover:text-indigo-300 no-underline"
            style={{ listStyle: 'none', textDecoration: 'none' }}
          >
            My Articles
          </Link>
          <Link
            href="/dashboard/myPage"
            className="block text-lg text-indigo-400 hover:text-indigo-300 no-underline"
            style={{ listStyle: 'none', textDecoration: 'none' }}
          >
            My Page
          </Link>
        </div>
        {/* <Link
          href="/dashboard/calendar"
          className="block text-lg text-indigo-400 hover:text-indigo-300"
        >
          Calendar
        </Link> */}
        <button
          className="block w-full bg-red-500 text-lg text-white py-1 px-3 rounded-md shadow-sm hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          onClick={handleLogout}
        >
          Logout
        </button>
      </nav>
    </div>
  )
}

export default SideMenu
