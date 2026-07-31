import { getUserIdFromRequest } from "@/lib/auth"
import logger from "@/logging/logging"
import * as commentService from "@/service/commentService"
import { AppError, createApiErrorResponse, ErrorType } from "@/utils/errorHandler"
import { NextRequest, NextResponse } from "next/server"

interface RouteParams {
  params: Promise<{
    comment_id: string
  }>
}

// コメントDELETE
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams,
): Promise<NextResponse> {
  try {
    const userId = getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 })
    }

    const { comment_id } = await params
    const commentId = parseInt(comment_id, 10)
    if (isNaN(commentId) || commentId <= 0) {
      throw new AppError("Invalid comment ID", ErrorType.VALIDATION, 400)
    }

    await commentService.deleteComment(commentId, userId)
    logger.info("Comment deleted successfully", { commentId })
    return NextResponse.json({ message: "コメントを削除しました" })
  } catch (error) {
    if (error instanceof AppError) {
      const errorResponse = createApiErrorResponse(error, "Failed to delete comment")
      return NextResponse.json(errorResponse, { status: errorResponse.statusCode })
    }

    const errorResponse = createApiErrorResponse(error as AppError, "Failed to delete comment")
    return NextResponse.json(errorResponse, { status: errorResponse.statusCode })
  }
}
