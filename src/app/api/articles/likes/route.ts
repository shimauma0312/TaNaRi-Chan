import { getUserIdFromRequest, isSameOriginRequest } from "@/lib/auth"
import { enforceWriteRateLimit } from "@/lib/writeRateLimit"
import { readJsonRequest } from "@/schemas/api"
import * as likeService from "@/service/likeService"
import logger from "@/utils/logger"
import { AppError, createApiErrorResponse, ErrorType } from "@/utils/errorHandler"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

const postIdSchema = z.coerce.number().int().positive()
const likeInput = z.object({ post_id: postIdSchema })

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

async function readPostId(req: NextRequest): Promise<number> {
  const result = await readJsonRequest(req)
  if (!result.success) {
    throw new AppError(
      result.status === 400 ? "Request body must be valid JSON" : result.error,
      ErrorType.VALIDATION,
      result.status,
    )
  }
  const parsed = likeInput.safeParse(result.data)
  if (!parsed.success) {
    throw new AppError("Valid post_id is required", ErrorType.VALIDATION, 400)
  }
  return parsed.data.post_id
}

/*
 * 記事のいいね数と、ログインユーザーがいいね済みかを取得する。
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const parsed = postIdSchema.safeParse(new URL(req.url).searchParams.get("post_id") ?? undefined)
    if (!parsed.success) {
      throw new AppError("Valid post_id is required", ErrorType.VALIDATION, 400)
    }

    const userId = await getUserIdFromRequest(req)
    const status = await likeService.getLikeStatus(parsed.data, userId)
    return NextResponse.json(status)
  } catch (error) {
    return errorResponse(error, "Failed to fetch likes")
  }
}

/*
 * 記事にいいねする。何度送っても1件として扱う。
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const userId = await requireUserId(req)
    const limited = await enforceWriteRateLimit(userId, {
      scope: "article-like",
      limit: 60,
      windowSeconds: 60,
    })
    if (limited) return limited

    const postId = await readPostId(req)
    const status = await likeService.likeArticle(postId, userId)
    logger.info("Article liked", { postId, userId })
    return NextResponse.json(status)
  } catch (error) {
    return errorResponse(error, "Failed to like article")
  }
}

/*
 * 記事のいいねを取り消す。
 */
export async function DELETE(req: NextRequest): Promise<NextResponse> {
  try {
    const userId = await requireUserId(req)
    const limited = await enforceWriteRateLimit(userId, {
      scope: "article-like",
      limit: 60,
      windowSeconds: 60,
    })
    if (limited) return limited

    const postId = await readPostId(req)
    const status = await likeService.unlikeArticle(postId, userId)
    logger.info("Article unliked", { postId, userId })
    return NextResponse.json(status)
  } catch (error) {
    return errorResponse(error, "Failed to unlike article")
  }
}
