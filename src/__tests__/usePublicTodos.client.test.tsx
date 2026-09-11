/** @jest-environment jsdom */

import { usePublicTodos } from "@/hooks/usePublicTodos"
import type { PublicTodo } from "@/types/todo"
import { act, renderHook } from "@testing-library/react"

function deferredResponse() {
  let resolve!: (response: Response) => void
  const promise = new Promise<Response>((done) => {
    resolve = done
  })
  return { promise, resolve }
}

function responseFor(todos: PublicTodo[], cursor: string | null = null) {
  const headers = new Headers()
  if (cursor) headers.set("X-Next-Cursor", cursor)
  return new Response(JSON.stringify(todos), { status: 200, headers })
}

const todo = (todoId: number): PublicTodo => ({
  todo_id: todoId,
  id: `user-${todoId}`,
  title: `Todo ${todoId}`,
  description: "Description",
  todo_deadline: "2026-09-05",
  is_completed: false,
  is_public: true,
  user: { id: `user-${todoId}`, user_name: `User ${todoId}` },
})

describe("usePublicTodos", () => {
  test("keeps the latest response when requests overlap", async () => {
    const first = deferredResponse()
    const second = deferredResponse()
    global.fetch = jest.fn().mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise)
    const { result } = renderHook(() => usePublicTodos())

    let firstRequest!: Promise<void>
    let secondRequest!: Promise<void>
    act(() => {
      firstRequest = result.current.fetchPublicTodos()
      secondRequest = result.current.fetchPublicTodos()
    })

    await act(async () => {
      second.resolve(responseFor([todo(2)], "next"))
      await secondRequest
    })
    await act(async () => {
      first.resolve(responseFor([todo(1)]))
      await firstRequest
    })

    expect(result.current.todos.map(({ todo_id }) => todo_id)).toEqual([2])
    expect(result.current.hasMore).toBe(true)
    expect(result.current.isLoading).toBe(false)
  })
})
