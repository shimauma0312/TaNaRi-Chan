import { getUserIdFromRequest, isSameOriginRequest } from "@/lib/auth"
import logger from "@/logging/logging"
import * as articleService from "@/service/articleService"
import { AppError, createApiErrorResponse, ErrorType } from "@/utils/errorHandler"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { readJsonRequest } from "@/schemas/api"

const articleFields = z.object({
  title: z.string().trim().min(1).max(200),
  content: z.string().trim().min(1).max(100_000),
})

const updateArticleInput = articleFields.extend({
  post_id: z.coerce.number().int().positive(),
})

const deleteArticleInput = z.object({
  post_id: z.coerce.number().int().positive(),
})

const articleListQuery = z.object({
  cursor: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  mine: z.enum(["true"]).optional(),
})

function errorResponse(error: unknown, fallback: string): NextResponse {
  const response = createApiErrorResponse(error, fallback)
  return NextResponse.json(response, { status: response.statusCode })
}

async function requireUserId(req: NextRequest): Promise<string> {
  if (!isSameOriginRequest(req)) {
    throw new AppError("Cross-origin request is not allowed", ErrorType.AUTHORIZATION, 403)
  }

  const userId = await getUserIdFromRequest(req)
  if (!userId) {
    throw new AppError("Authentication required", ErrorType.AUTHENTICATION, 401)
  }
  return userId
}

async function readJson(req: NextRequest): Promise<unknown> {
  const result = await readJsonRequest(req)
  if (!result.success) {
    throw new AppError(
      result.status === 400 ? "Request body must be valid JSON" : result.error,
      ErrorType.VALIDATION,
      result.status,
    )
  }
  return result.data
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const url = new URL(req.url)
    const postId = url.searchParams.get("post_id")
    if (!postId) {
      const query = articleListQuery.safeParse({
        cursor: url.searchParams.get("cursor") ?? undefined,
        limit: url.searchParams.get("limit") ?? undefined,
        mine: url.searchParams.get("mine") ?? undefined,
      })
      if (!query.success) {
        throw new AppError("Invalid pagination parameters", ErrorType.VALIDATION, 400)
      }
      let authorId: string | undefined
      if (query.data.mine) {
        const currentUserId = await getUserIdFromRequest(req)
        if (!currentUserId) {
          throw new AppError("Authentication required", ErrorType.AUTHENTICATION, 401)
        }
        authorId = currentUserId
      }
      return NextResponse.json(
        await articleService.getArticles({
          cursor: query.data.cursor,
          limit: query.data.limit,
          authorId,
        }),
      )
    }

    const article = await articleService.getArticle(postId)
    if (!article) {
      throw new AppError("Article not found", ErrorType.NOT_FOUND, 404)
    }
    return NextResponse.json(article)
  } catch (error) {
    return errorResponse(error, "Failed to fetch articles")
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const userId = await requireUserId(req)
    const parsed = articleFields.safeParse(await readJson(req))
    if (!parsed.success) {
      throw new AppError("Title and content are required", ErrorType.VALIDATION, 400)
    }

    const newPost = await articleService.createArticle({
      ...parsed.data,
      // Never accept author identity from the request body.
      author_id: userId,
    })
    logger.info("Article created successfully", { postId: newPost.post_id, userId })
    return NextResponse.json(newPost, { status: 201 })
  } catch (error) {
    return errorResponse(error, "Failed to create article")
  }
}

export async function PUT(req: NextRequest): Promise<NextResponse> {
  try {
    const userId = await requireUserId(req)
    const parsed = updateArticleInput.safeParse(await readJson(req))
    if (!parsed.success) {
      throw new AppError("Post ID, title, and content are required", ErrorType.VALIDATION, 400)
    }

    const updatedPost = await articleService.updateArticle({
      ...parsed.data,
      author_id: userId,
    })
    logger.info("Article updated successfully", { postId: updatedPost.post_id, userId })
    return NextResponse.json(updatedPost)
  } catch (error) {
    return errorResponse(error, "Failed to update article")
  }
}

export async function DELETE(req: NextRequest): Promise<NextResponse> {
  try {
    const userId = await requireUserId(req)
    const parsed = deleteArticleInput.safeParse(await readJson(req))
    if (!parsed.success) {
      throw new AppError("Post ID is required", ErrorType.VALIDATION, 400)
    }

    const deletedPost = await articleService.deleteArticle(parsed.data.post_id, userId)
    logger.info("Article deleted successfully", { postId: parsed.data.post_id, userId })
    return NextResponse.json(deletedPost)
  } catch (error) {
    return errorResponse(error, "Failed to delete article")
  }
}
