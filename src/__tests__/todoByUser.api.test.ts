/** @jest-environment node */

jest.mock("@/service/todoService", () => ({
  todoService: {
    getUserTodos: jest.fn(),
    getPublicTodos: jest.fn(),
    getTodoById: jest.fn(),
  },
}))
jest.mock("@/lib/auth", () => ({
  getUserIdFromRequest: jest.fn(),
  isSameOriginRequest: jest.fn(),
}))
jest.mock("@/utils/errorHandler", () => ({
  createApiErrorResponse: jest.fn(() => ({ error: "failed", statusCode: 500 })),
}))

import { GET } from "@/app/api/todoList/[user_id]/route"
import { getUserIdFromRequest } from "@/lib/auth"
import { todoService } from "@/service/todoService"
import { NextRequest } from "next/server"

const mockAuth = getUserIdFromRequest as jest.MockedFunction<typeof getUserIdFromRequest>
const mockService = todoService as jest.Mocked<typeof todoService>

const todo = {
  todo_id: 101,
  title: "Older todo",
  description: "Still editable",
  todo_deadline: new Date("2026-09-30T00:00:00.000Z"),
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: new Date("2026-01-01T00:00:00.000Z"),
  id: "owner",
  is_completed: false,
  is_public: false,
}

function callGet(query: string, targetUserId = "owner") {
  return GET(new NextRequest(`http://localhost/api/todoList/${targetUserId}${query}`), {
    params: Promise.resolve({ user_id: targetUserId }),
  })
}

describe("GET /api/todoList/[user_id]", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockAuth.mockResolvedValue("owner")
  })

  test("fetches one owned todo directly instead of scanning a bounded list", async () => {
    mockService.getTodoById.mockResolvedValue(todo)

    const response = await callGet("?todo_id=101")

    expect(response.status).toBe(200)
    expect(mockService.getTodoById).toHaveBeenCalledWith(101, "owner")
    expect(mockService.getUserTodos).not.toHaveBeenCalled()
    expect((await response.json()).todo_id).toBe(101)
  })

  test("does not return a todo through a mismatched user path", async () => {
    mockService.getTodoById.mockResolvedValue(todo)

    const response = await callGet("?todo_id=101", "different-user")

    expect(response.status).toBe(404)
  })

  test("passes a validated calendar range into the bounded query", async () => {
    mockService.getUserTodos.mockResolvedValue([todo])

    const response = await callGet("?from=2026-09-01&to=2026-10-01&limit=100&cursor=200")

    expect(response.status).toBe(200)
    expect(mockService.getUserTodos).toHaveBeenCalledWith("owner", {
      cursor: 200,
      limit: 100,
      from: new Date("2026-09-01T00:00:00.000Z"),
      to: new Date("2026-10-01T00:00:00.000Z"),
    })
  })

  test("applies the validated calendar range and pagination to public todos", async () => {
    mockAuth.mockResolvedValue("viewer")
    mockService.getPublicTodos.mockResolvedValue([
      { ...todo, is_public: true, user: { id: "owner", user_name: "Owner" } },
    ])

    const response = await callGet(
      "?from=2026-09-01&to=2026-10-01&limit=1&cursor=200",
      "owner",
    )

    expect(response.status).toBe(200)
    expect(mockService.getPublicTodos).toHaveBeenCalledWith({
      userId: "owner",
      cursor: 200,
      limit: 1,
      from: new Date("2026-09-01T00:00:00.000Z"),
      to: new Date("2026-10-01T00:00:00.000Z"),
    })
    expect(response.headers.get("X-Next-Cursor")).toBe("101")
  })

  test("rejects incomplete or reversed date ranges", async () => {
    expect((await callGet("?from=2026-09-01")).status).toBe(400)
    expect((await callGet("?from=2026-10-01&to=2026-09-01")).status).toBe(400)
    expect(mockService.getUserTodos).not.toHaveBeenCalled()
  })
})
