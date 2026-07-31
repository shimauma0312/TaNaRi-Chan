/**
 * Comments API Test Suite
 *
 * Features tested:
 * - GET  /api/articles/comments?post_id=X (get comments for an article)
 * - POST /api/articles/comments (create new comment)
 * - DELETE /api/articles/comments/[comment_id] (delete comment)
 * - Error handling for all endpoints
 * - Validation error scenarios
 */

import { NextRequest } from "next/server"
import { ErrorType } from "../utils/errorHandler"

// Mock PrismaClient with proper structure
jest.mock("@prisma/client", () => {
  const mockPrismaPost = {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  }

  const mockPrismaPostComment = {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  }

  return {
    PrismaClient: jest.fn().mockImplementation(() => ({
      post: mockPrismaPost,
      postComment: mockPrismaPostComment,
    })),
    __mockPrismaPost: mockPrismaPost, // Export for accessing in tests
    __mockPrismaPostComment: mockPrismaPostComment, // Export for accessing in tests
  }
})

// Mock logger - need to match the correct import path
jest.mock("@/logging/logging", () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}))

// Mock auth
jest.mock("@/lib/auth", () => ({
  getUserIdFromRequest: jest.fn(),
}))

// Import after mocking
import { getUserIdFromRequest } from "@/lib/auth"
import { PrismaClient } from "@prisma/client"
import { DELETE } from "../app/api/articles/comments/[comment_id]/route"
import { GET, POST } from "../app/api/articles/comments/route"

// Access the mocks
const mockPrismaPost = (require("@prisma/client") as any).__mockPrismaPost
const mockPrismaPostComment = (require("@prisma/client") as any).__mockPrismaPostComment
const mockGetUserIdFromRequest = getUserIdFromRequest as jest.MockedFunction<
  typeof getUserIdFromRequest
>

// Helper function to create a mock Request using built-in Request
function createMockRequest(method: string, url: string, body?: any): Request {
  const headers = new Headers()
  headers.set("content-type", "application/json")

  const request = new Request(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })

  return request as NextRequest
}

// Helper function to create a mock NextRequest (with cookie support)
function createMockNextRequest(method: string, url: string, body?: any): NextRequest {
  return new NextRequest(url, {
    method,
    headers: { "content-type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  })
}

// Helper function to convert Date objects to ISO strings for JSON comparison
function convertDatesForJson(obj: any): any {
  if (obj && typeof obj === "object") {
    if (obj instanceof Date) {
      return obj.toISOString()
    }
    if (Array.isArray(obj)) {
      return obj.map(convertDatesForJson)
    }
    const converted: any = {}
    for (const key in obj) {
      converted[key] = convertDatesForJson(obj[key])
    }
    return converted
  }
  return obj
}

describe("Comments API - GET Endpoint", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test("should return comments for a post successfully", async () => {
    const mockPost = { post_id: 1, title: "Article", content: "Content" }
    const mockComments = [
      {
        comment_id: 1,
        content: "First comment",
        createdAt: new Date("2024-01-01"),
        author: { id: "user1", user_name: "Alice" },
      },
      {
        comment_id: 2,
        content: "Second comment",
        createdAt: new Date("2024-01-02"),
        author: { id: "user2", user_name: "Bob" },
      },
    ]

    mockPrismaPost.findUnique.mockResolvedValue(mockPost)
    mockPrismaPostComment.findMany.mockResolvedValue(mockComments)

    const request = createMockRequest(
      "GET",
      "http://localhost:3000/api/articles/comments?post_id=1",
    )
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toEqual(convertDatesForJson(mockComments))
    expect(mockPrismaPostComment.findMany).toHaveBeenCalledWith({
      where: { post_id: 1 },
      orderBy: { createdAt: "asc" },
      select: {
        comment_id: true,
        content: true,
        createdAt: true,
        author: {
          select: {
            id: true,
            user_name: true,
          },
        },
      },
    })
  })

  test("should return 400 when post_id is missing", async () => {
    const request = createMockRequest("GET", "http://localhost:3000/api/articles/comments")
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe("post_id is required")
    expect(data.type).toBe(ErrorType.VALIDATION)
    expect(mockPrismaPostComment.findMany).not.toHaveBeenCalled()
  })

  test("should return 400 when post_id is invalid (NaN)", async () => {
    const request = createMockRequest(
      "GET",
      "http://localhost:3000/api/articles/comments?post_id=invalid",
    )
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe("post_id is required")
    expect(data.type).toBe(ErrorType.VALIDATION)
  })

  test("should return 400 when post_id is non-positive", async () => {
    const request = createMockRequest(
      "GET",
      "http://localhost:3000/api/articles/comments?post_id=0",
    )
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe("post_id is required")
    expect(data.type).toBe(ErrorType.VALIDATION)
  })

  test("should return 404 when the referenced article does not exist", async () => {
    mockPrismaPost.findUnique.mockResolvedValue(null)

    const request = createMockRequest(
      "GET",
      "http://localhost:3000/api/articles/comments?post_id=999",
    )
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error).toBe("Article not found")
    expect(data.type).toBe(ErrorType.NOT_FOUND)
  })
})

describe("Comments API - POST Endpoint", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test("should create new comment successfully", async () => {
    const userId = "user1"
    const mockPost = { post_id: 1, title: "Article", content: "Content" }
    const newCommentData = { post_id: 1, content: "New comment" }
    const createdComment = {
      comment_id: 1,
      content: "New comment",
      createdAt: new Date("2024-01-01"),
      author_id: userId,
      post_id: 1,
      author: { id: userId, user_name: "Alice" },
    }

    mockGetUserIdFromRequest.mockReturnValue(userId)
    mockPrismaPost.findUnique.mockResolvedValue(mockPost)
    mockPrismaPostComment.create.mockResolvedValue(createdComment)

    const request = createMockNextRequest(
      "POST",
      "http://localhost:3000/api/articles/comments",
      newCommentData,
    )
    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data).toEqual(convertDatesForJson(createdComment))
    expect(mockPrismaPostComment.create).toHaveBeenCalledWith({
      data: {
        content: "New comment",
        author_id: userId,
        post_id: 1,
      },
      select: {
        comment_id: true,
        content: true,
        createdAt: true,
        author_id: true,
        post_id: true,
        author: {
          select: {
            id: true,
            user_name: true,
          },
        },
      },
    })
  })

  test("should return 401 when not authenticated", async () => {
    mockGetUserIdFromRequest.mockReturnValue(null)

    const request = createMockNextRequest("POST", "http://localhost:3000/api/articles/comments", {
      post_id: 1,
      content: "New comment",
    })
    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data).toEqual({ error: "認証が必要です" })
    expect(mockPrismaPostComment.create).not.toHaveBeenCalled()
  })

  test("should return 400 when post_id is missing", async () => {
    mockGetUserIdFromRequest.mockReturnValue("user1")

    const request = createMockNextRequest("POST", "http://localhost:3000/api/articles/comments", {
      content: "New comment",
    })
    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe("Valid post_id is required")
    expect(data.type).toBe(ErrorType.VALIDATION)
    expect(mockPrismaPostComment.create).not.toHaveBeenCalled()
  })

  test("should return 400 when post_id is invalid", async () => {
    mockGetUserIdFromRequest.mockReturnValue("user1")

    const request = createMockNextRequest("POST", "http://localhost:3000/api/articles/comments", {
      post_id: "invalid",
      content: "New comment",
    })
    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe("Valid post_id is required")
    expect(data.type).toBe(ErrorType.VALIDATION)
  })

  test("should return 400 when content is empty", async () => {
    mockGetUserIdFromRequest.mockReturnValue("user1")
    mockPrismaPost.findUnique.mockResolvedValue({ post_id: 1 })

    const request = createMockNextRequest("POST", "http://localhost:3000/api/articles/comments", {
      post_id: 1,
      content: "   ",
    })
    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe("Content is required")
    expect(data.type).toBe(ErrorType.VALIDATION)
    expect(mockPrismaPostComment.create).not.toHaveBeenCalled()
  })

  test("should return 404 when the referenced article does not exist", async () => {
    mockGetUserIdFromRequest.mockReturnValue("user1")
    mockPrismaPost.findUnique.mockResolvedValue(null)

    const request = createMockNextRequest("POST", "http://localhost:3000/api/articles/comments", {
      post_id: 999,
      content: "New comment",
    })
    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error).toBe("Article not found")
    expect(data.type).toBe(ErrorType.NOT_FOUND)
    expect(mockPrismaPostComment.create).not.toHaveBeenCalled()
  })
})

describe("Comments API - DELETE Endpoint", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test("should delete comment successfully", async () => {
    const userId = "user1"
    const existingComment = {
      comment_id: 1,
      content: "A comment",
      createdAt: new Date("2024-01-01"),
      author_id: userId,
      post_id: 1,
    }

    mockGetUserIdFromRequest.mockReturnValue(userId)
    mockPrismaPostComment.findUnique.mockResolvedValue(existingComment)
    mockPrismaPostComment.delete.mockResolvedValue(existingComment)

    const request = createMockNextRequest(
      "DELETE",
      "http://localhost:3000/api/articles/comments/1",
    )
    const response = await DELETE(request, { params: Promise.resolve({ comment_id: "1" }) })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toEqual({ message: "コメントを削除しました" })
    expect(mockPrismaPostComment.delete).toHaveBeenCalledWith({
      where: { comment_id: 1 },
    })
  })

  test("should return 401 when not authenticated", async () => {
    mockGetUserIdFromRequest.mockReturnValue(null)

    const request = createMockNextRequest(
      "DELETE",
      "http://localhost:3000/api/articles/comments/1",
    )
    const response = await DELETE(request, { params: Promise.resolve({ comment_id: "1" }) })
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data).toEqual({ error: "認証が必要です" })
    expect(mockPrismaPostComment.delete).not.toHaveBeenCalled()
  })

  test("should return 400 when comment_id is invalid", async () => {
    mockGetUserIdFromRequest.mockReturnValue("user1")

    const request = createMockNextRequest(
      "DELETE",
      "http://localhost:3000/api/articles/comments/invalid",
    )
    const response = await DELETE(request, {
      params: Promise.resolve({ comment_id: "invalid" }),
    })
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe("Invalid comment ID")
    expect(data.type).toBe(ErrorType.VALIDATION)
    expect(mockPrismaPostComment.delete).not.toHaveBeenCalled()
  })

  test("should return 404 when comment does not exist", async () => {
    mockGetUserIdFromRequest.mockReturnValue("user1")
    mockPrismaPostComment.findUnique.mockResolvedValue(null)

    const request = createMockNextRequest(
      "DELETE",
      "http://localhost:3000/api/articles/comments/999",
    )
    const response = await DELETE(request, {
      params: Promise.resolve({ comment_id: "999" }),
    })
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error).toBe("Comment not found")
    expect(data.type).toBe(ErrorType.NOT_FOUND)
    expect(mockPrismaPostComment.delete).not.toHaveBeenCalled()
  })

  test("should return 403 when requester is not the comment author", async () => {
    const existingComment = {
      comment_id: 1,
      content: "A comment",
      createdAt: new Date("2024-01-01"),
      author_id: "user1",
      post_id: 1,
    }

    mockGetUserIdFromRequest.mockReturnValue("user2")
    mockPrismaPostComment.findUnique.mockResolvedValue(existingComment)

    const request = createMockNextRequest(
      "DELETE",
      "http://localhost:3000/api/articles/comments/1",
    )
    const response = await DELETE(request, { params: Promise.resolve({ comment_id: "1" }) })
    const data = await response.json()

    expect(response.status).toBe(403)
    expect(data.error).toBe("You do not have permission to delete this comment")
    expect(data.type).toBe(ErrorType.AUTHORIZATION)
    expect(mockPrismaPostComment.delete).not.toHaveBeenCalled()
  })
})
