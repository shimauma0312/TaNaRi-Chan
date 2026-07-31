import { getUserIdFromRequest } from "@/lib/auth"
import logger from "@/logging/logging"
import * as commentService from "@/service/commentService"
import { AppError, createApiErrorResponse, ErrorType } from "@/utils/errorHandler"
import { NextRequest, NextResponse } from "next/server"

/*
 * 記事のコメント一覧を取得する。
 */
export async function GET(req: Request): Promise<NextResponse> {
  try {
    const url = new URL(req.url)
    const postIdParam = url.searchParams.get("post_id")

    if (!postIdParam) {
      throw new AppError("post_id is required", ErrorType.VALIDATION, 400)
    }

    const postId = parseInt(postIdParam, 10)
    if (isNaN(postId) || postId <= 0) {
      throw new AppError("post_id is required", ErrorType.VALIDATION, 400)
    }

    const comments = await commentService.getComments(postId)
    return NextResponse.json(comments)
  } catch (error) {
    if (error instanceof AppError) {
      const errorResponse = createApiErrorResponse(error, "Failed to fetch comments")
      return NextResponse.json(errorResponse, { status: errorResponse.statusCode })
    }

    const errorResponse = createApiErrorResponse(error, "Failed to fetch comments")
    return NextResponse.json(errorResponse, { status: errorResponse.statusCode })
  }
}

// コメントPOST
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const userId = getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 })
    }

    const data = await request.json()

    const postId = parseInt(data.post_id, 10)
    if (!data.post_id || isNaN(postId) || postId <= 0) {
      throw new AppError("Valid post_id is required", ErrorType.VALIDATION, 400)
    }

    const newComment = await commentService.createComment({
      post_id: postId,
      content: data.content,
      author_id: userId,
    })
    logger.info("Comment created successfully", { commentId: newComment.comment_id })
    return NextResponse.json(newComment, { status: 201 })
  } catch (error) {
    if (error instanceof AppError) {
      const errorResponse = createApiErrorResponse(error, "Failed to create comment")
      return NextResponse.json(errorResponse, { status: errorResponse.statusCode })
    }

    const errorResponse = createApiErrorResponse(error as AppError, "Failed to create comment")
    return NextResponse.json(errorResponse, { status: errorResponse.statusCode })
  }
}
