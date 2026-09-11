import { AppError, createApiErrorResponse, ErrorType } from "@/utils/errorHandler"
import { NextRequest, NextResponse } from "next/server"
import * as userService from "@/service/userService"
import { firstValidationMessage, readJsonRequest, registerRequestSchema } from "@/schemas/api"
import { isSameOriginRequest } from "@/lib/auth"
import { consumeRateLimit, getRateLimitClientId } from "@/lib/rateLimit"

interface UserRequestBody {
  email: string
  password: string
  userName: string
}

export async function POST(req: NextRequest) {
  try {
    if (!isSameOriginRequest(req)) {
      return NextResponse.json({ error: "不正な送信元です" }, { status: 403 })
    }

    const json = await readJsonRequest(req)
    if (!json.success) {
      throw new AppError(json.error, ErrorType.VALIDATION, json.status)
    }

    const parsed = registerRequestSchema.safeParse(json.data)
    if (!parsed.success) {
      throw new AppError(firstValidationMessage(parsed.error), ErrorType.VALIDATION, 400)
    }
    const body: UserRequestBody = parsed.data

    const rateLimit = await consumeRateLimit({
      scope: "registration-ip",
      identifier: getRateLimitClientId(req),
      limit: 5,
      windowSeconds: 60 * 60,
    })
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "登録試行回数が上限に達しました。しばらく待ってから再試行してください" },
        { status: 429, headers: { "Retry-After": String(rateLimit.retryAfter) } },
      )
    }

    // サービス層を使用してユーザーを作成
    await userService.createUser({
      email: body.email,
      password: body.password,
      userName: body.userName,
    })

    return NextResponse.json({ message: "User registered successfully" }, { status: 201 })
  } catch (error) {
    const errorResponse = createApiErrorResponse(error, "Failed to register user")
    return NextResponse.json(errorResponse, { status: errorResponse.statusCode })
  }
}
