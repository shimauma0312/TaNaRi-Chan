/**
 * Comment Service Functions Test Suite
 * Testing individual functions from commentService.ts
 */

import { AppError, ErrorType } from "../utils/errorHandler"

// Mock Prisma Client
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

// Mock logger
jest.mock("@/logging/logging", () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}))

// Import after mocking
import { createComment, deleteComment, getComments } from "../service/commentService"

// Access the mocks
const mockPrismaPost = (require("@prisma/client") as any).__mockPrismaPost
const mockPrismaPostComment = (require("@prisma/client") as any).__mockPrismaPostComment

describe("Comment Service Functions", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe("getComments function", () => {
    test("should fetch comments for a post successfully", async () => {
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

      const result = await getComments(1)

      expect(result).toEqual(mockComments)
      expect(mockPrismaPost.findUnique).toHaveBeenCalledWith({
        where: { post_id: 1 },
      })
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

    test("should throw 404 AppError when the post does not exist", async () => {
      mockPrismaPost.findUnique.mockResolvedValue(null)

      await expect(getComments(999)).rejects.toThrow(AppError)

      try {
        await getComments(999)
        fail("Expected error to be thrown")
      } catch (error) {
        const appError = error as AppError
        expect(appError.message).toBe("Article not found")
        expect(appError.type).toBe(ErrorType.NOT_FOUND)
        expect(appError.statusCode).toBe(404)
      }

      expect(mockPrismaPostComment.findMany).not.toHaveBeenCalled()
    })
  })

  describe("createComment function", () => {
    test("should create a new comment successfully", async () => {
      const mockPost = { post_id: 1, title: "Article", content: "Content" }
      const newCommentData = {
        post_id: 1,
        content: "New comment",
        author_id: "user1",
      }
      const createdComment = {
        comment_id: 1,
        content: "New comment",
        createdAt: new Date("2024-01-01"),
        author_id: "user1",
        post_id: 1,
        author: { id: "user1", user_name: "Alice" },
      }

      mockPrismaPost.findUnique.mockResolvedValue(mockPost)
      mockPrismaPostComment.create.mockResolvedValue(createdComment)

      const result = await createComment(newCommentData)

      expect(result).toEqual(createdComment)
      expect(mockPrismaPost.findUnique).toHaveBeenCalledWith({
        where: { post_id: 1 },
      })
      expect(mockPrismaPostComment.create).toHaveBeenCalledWith({
        data: {
          content: "New comment",
          author_id: "user1",
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

    test("should throw 400 validation error when content is empty", async () => {
      const newCommentData = {
        post_id: 1,
        content: "   ",
        author_id: "user1",
      }

      await expect(createComment(newCommentData)).rejects.toThrow(AppError)

      try {
        await createComment(newCommentData)
        fail("Expected error to be thrown")
      } catch (error) {
        const appError = error as AppError
        expect(appError.message).toBe("Content is required")
        expect(appError.type).toBe(ErrorType.VALIDATION)
        expect(appError.statusCode).toBe(400)
      }

      expect(mockPrismaPost.findUnique).not.toHaveBeenCalled()
      expect(mockPrismaPostComment.create).not.toHaveBeenCalled()
    })

    test("should throw 404 AppError when the referenced post does not exist", async () => {
      const newCommentData = {
        post_id: 999,
        content: "New comment",
        author_id: "user1",
      }

      mockPrismaPost.findUnique.mockResolvedValue(null)

      await expect(createComment(newCommentData)).rejects.toThrow(AppError)

      try {
        await createComment(newCommentData)
        fail("Expected error to be thrown")
      } catch (error) {
        const appError = error as AppError
        expect(appError.message).toBe("Article not found")
        expect(appError.type).toBe(ErrorType.NOT_FOUND)
        expect(appError.statusCode).toBe(404)
      }

      expect(mockPrismaPostComment.create).not.toHaveBeenCalled()
    })
  })

  describe("deleteComment function", () => {
    test("should delete a comment successfully when requester is the author", async () => {
      const existingComment = {
        comment_id: 1,
        content: "A comment",
        createdAt: new Date("2024-01-01"),
        author_id: "user1",
        post_id: 1,
      }

      mockPrismaPostComment.findUnique.mockResolvedValue(existingComment)
      mockPrismaPostComment.delete.mockResolvedValue(existingComment)

      const result = await deleteComment(1, "user1")

      expect(result).toEqual(existingComment)
      expect(mockPrismaPostComment.findUnique).toHaveBeenCalledWith({
        where: { comment_id: 1 },
      })
      expect(mockPrismaPostComment.delete).toHaveBeenCalledWith({
        where: { comment_id: 1 },
      })
    })

    test("should throw 404 AppError when the comment does not exist", async () => {
      mockPrismaPostComment.findUnique.mockResolvedValue(null)

      await expect(deleteComment(999, "user1")).rejects.toThrow(AppError)

      try {
        await deleteComment(999, "user1")
        fail("Expected error to be thrown")
      } catch (error) {
        const appError = error as AppError
        expect(appError.message).toBe("Comment not found")
        expect(appError.type).toBe(ErrorType.NOT_FOUND)
        expect(appError.statusCode).toBe(404)
      }

      expect(mockPrismaPostComment.delete).not.toHaveBeenCalled()
    })

    test("should throw 403 AppError when requester is not the author", async () => {
      const existingComment = {
        comment_id: 1,
        content: "A comment",
        createdAt: new Date("2024-01-01"),
        author_id: "user1",
        post_id: 1,
      }

      mockPrismaPostComment.findUnique.mockResolvedValue(existingComment)

      await expect(deleteComment(1, "user2")).rejects.toThrow(AppError)

      try {
        await deleteComment(1, "user2")
        fail("Expected error to be thrown")
      } catch (error) {
        const appError = error as AppError
        expect(appError.message).toBe("You do not have permission to delete this comment")
        expect(appError.type).toBe(ErrorType.AUTHORIZATION)
        expect(appError.statusCode).toBe(403)
      }

      expect(mockPrismaPostComment.delete).not.toHaveBeenCalled()
    })
  })
})
