/**
 * Article Likes API Test Suite
 *
 * Features tested:
 * - GET    /api/articles/likes?post_id=X (count and own like state)
 * - POST   /api/articles/likes (like, idempotent)
 * - DELETE /api/articles/likes (unlike)
 * - Authentication, same-origin, validation and not-found handling
 */

import { NextRequest } from "next/server"

jest.mock("@prisma/client", () => {
  const mockPrismaPost = {
    findUnique: jest.fn(),
  }
  const mockPrismaPostLike = {
    count: jest.fn(),
    findUnique: jest.fn(),
    upsert: jest.fn(),
    deleteMany: jest.fn(),
  }

  return {
    PrismaClient: jest.fn().mockImplementation(() => ({
      post: mockPrismaPost,
      postLike: mockPrismaPostLike,
    })),
    __mockPrismaPost: mockPrismaPost,
    __mockPrismaPostLike: mockPrismaPostLike,
  }
})

jest.mock("@/lib/auth", () => ({
  getUserIdFromRequest: jest.fn(),
  isSameOriginRequest: jest.fn(),
}))
jest.mock("@/lib/writeRateLimit", () => ({
  enforceWriteRateLimit: jest.fn(),
}))
jest.mock("@/utils/logger", () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}))

import { DELETE, GET, POST } from "../app/api/articles/likes/route"

const mockPrismaPost = (require("@prisma/client") as any).__mockPrismaPost
const mockPrismaPostLike = (require("@prisma/client") as any).__mockPrismaPostLike
const mockAuth = jest.requireMock("@/lib/auth") as {
  getUserIdFromRequest: jest.Mock
  isSameOriginRequest: jest.Mock
}
const mockRateLimit = jest.requireMock("@/lib/writeRateLimit") as {
  enforceWriteRateLimit: jest.Mock
}

const BASE = "http://localhost:3000/api/articles/likes"

function createRequest(method: string, url: string, body?: unknown): NextRequest {
  return new Request(url, {
    method,
    headers: { "content-type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  }) as NextRequest
}

describe("Article Likes API", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockAuth.getUserIdFromRequest.mockResolvedValue("user123")
    mockAuth.isSameOriginRequest.mockReturnValue(true)
    mockRateLimit.enforceWriteRateLimit.mockResolvedValue(null)
    mockPrismaPost.findUnique.mockResolvedValue({ post_id: 1 })
    mockPrismaPostLike.count.mockResolvedValue(3)
    mockPrismaPostLike.findUnique.mockResolvedValue(null)
  })

  describe("GET", () => {
    test("returns count and liked state for the current user", async () => {
      mockPrismaPostLike.findUnique.mockResolvedValue({ post_id: 1 })

      const response = await GET(createRequest("GET", `${BASE}?post_id=1`))

      expect(response.status).toBe(200)
      expect(await response.json()).toEqual({ post_id: 1, count: 3, liked: true })
      expect(mockPrismaPostLike.findUnique).toHaveBeenCalledWith({
        where: { user_id_post_id: { user_id: "user123", post_id: 1 } },
        select: { post_id: true },
      })
    })

    test("returns liked=false without looking up a like when not logged in", async () => {
      mockAuth.getUserIdFromRequest.mockResolvedValue(null)

      const response = await GET(createRequest("GET", `${BASE}?post_id=1`))

      expect(response.status).toBe(200)
      expect(await response.json()).toEqual({ post_id: 1, count: 3, liked: false })
      expect(mockPrismaPostLike.findUnique).not.toHaveBeenCalled()
    })

    test.each(["", "?post_id=abc", "?post_id=0", "?post_id=-1"])(
      "rejects invalid post_id (%s)",
      async (query) => {
        const response = await GET(createRequest("GET", `${BASE}${query}`))
        expect(response.status).toBe(400)
      },
    )

    test("returns 404 when the article does not exist", async () => {
      mockPrismaPost.findUnique.mockResolvedValue(null)

      const response = await GET(createRequest("GET", `${BASE}?post_id=999`))

      expect(response.status).toBe(404)
    })
  })

  describe("POST", () => {
    test("likes an article idempotently with upsert", async () => {
      mockPrismaPostLike.findUnique.mockResolvedValue({ post_id: 1 })
      mockPrismaPostLike.count.mockResolvedValue(4)

      const response = await POST(createRequest("POST", BASE, { post_id: 1 }))

      expect(response.status).toBe(200)
      expect(await response.json()).toEqual({ post_id: 1, count: 4, liked: true })
      expect(mockPrismaPostLike.upsert).toHaveBeenCalledWith({
        where: { user_id_post_id: { user_id: "user123", post_id: 1 } },
        create: { user_id: "user123", post_id: 1 },
        update: {},
      })
    })

    test("requires authentication", async () => {
      mockAuth.getUserIdFromRequest.mockResolvedValue(null)

      const response = await POST(createRequest("POST", BASE, { post_id: 1 }))

      expect(response.status).toBe(401)
      expect(mockPrismaPostLike.upsert).not.toHaveBeenCalled()
    })

    test("rejects cross-origin requests", async () => {
      mockAuth.isSameOriginRequest.mockReturnValue(false)

      const response = await POST(createRequest("POST", BASE, { post_id: 1 }))

      expect(response.status).toBe(403)
      expect(mockPrismaPostLike.upsert).not.toHaveBeenCalled()
    })

    test("returns the rate limit response when limited", async () => {
      const { NextResponse } = jest.requireActual("next/server")
      mockRateLimit.enforceWriteRateLimit.mockResolvedValue(
        NextResponse.json({ error: "limited" }, { status: 429 }),
      )

      const response = await POST(createRequest("POST", BASE, { post_id: 1 }))

      expect(response.status).toBe(429)
      expect(mockPrismaPostLike.upsert).not.toHaveBeenCalled()
    })

    test("rejects an invalid post_id", async () => {
      const response = await POST(createRequest("POST", BASE, { post_id: "x" }))

      expect(response.status).toBe(400)
      expect(mockPrismaPostLike.upsert).not.toHaveBeenCalled()
    })

    test("returns 404 when the article does not exist", async () => {
      mockPrismaPost.findUnique.mockResolvedValue(null)

      const response = await POST(createRequest("POST", BASE, { post_id: 999 }))

      expect(response.status).toBe(404)
      expect(mockPrismaPostLike.upsert).not.toHaveBeenCalled()
    })
  })

  describe("DELETE", () => {
    test("removes only the current user's like", async () => {
      mockPrismaPostLike.count.mockResolvedValue(2)

      const response = await DELETE(createRequest("DELETE", BASE, { post_id: 1 }))

      expect(response.status).toBe(200)
      expect(await response.json()).toEqual({ post_id: 1, count: 2, liked: false })
      expect(mockPrismaPostLike.deleteMany).toHaveBeenCalledWith({
        where: { user_id: "user123", post_id: 1 },
      })
    })

    test("requires authentication", async () => {
      mockAuth.getUserIdFromRequest.mockResolvedValue(null)

      const response = await DELETE(createRequest("DELETE", BASE, { post_id: 1 }))

      expect(response.status).toBe(401)
      expect(mockPrismaPostLike.deleteMany).not.toHaveBeenCalled()
    })
  })
})
