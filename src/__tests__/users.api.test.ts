/** @jest-environment node */

jest.mock("@/lib/prisma", () => ({
  __esModule: true,
  default: { user: { findMany: jest.fn() } },
}))
jest.mock("@/lib/auth", () => ({ getUserIdFromRequest: jest.fn() }))

import { GET } from "@/app/api/users/route"
import { getUserIdFromRequest } from "@/lib/auth"
import { NextRequest } from "next/server"

const mockGetUserId = getUserIdFromRequest as jest.MockedFunction<typeof getUserIdFromRequest>
const mockFindMany = jest.requireMock("@/lib/prisma").default.user.findMany as jest.Mock

describe("GET /api/users", () => {
  beforeEach(() => jest.clearAllMocks())

  test("requires authentication", async () => {
    mockGetUserId.mockResolvedValue(null)
    const response = await GET(new NextRequest("http://app/api/users"))
    expect(response.status).toBe(401)
  })

  test("searches recipients by name with a bounded result", async () => {
    mockGetUserId.mockResolvedValue("current-user")
    mockFindMany.mockResolvedValue([{ id: "other", user_name: "Alice" }])

    const response = await GET(new NextRequest("http://app/api/users?q=ali&limit=50"))
    expect(response.status).toBe(200)
    expect(mockFindMany).toHaveBeenCalledWith({
      where: {
        id: { not: "current-user" },
        user_name: { contains: "ali", mode: "insensitive" },
      },
      select: { id: true, user_name: true },
      orderBy: { user_name: "asc" },
      take: 50,
    })
  })
})
