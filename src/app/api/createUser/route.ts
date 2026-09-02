import { AppError, createApiErrorResponse, ErrorType } from "@/utils/errorHandler"
import { NextRequest, NextResponse } from "next/server"
import * as userService from "@/service/userService"
import { firstValidationMessage, readJsonRequest, registerRequestSchema } from "@/schemas/api"
import { isSameOriginRequest } from "@/lib/auth"

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
      throw new AppError("Request body must be valid JSON", ErrorType.VALIDATION, 400)
    }

    const parsed = registerRequestSchema.safeParse(json.data)
    if (!parsed.success) {
      throw new AppError(firstValidationMessage(parsed.error), ErrorType.VALIDATION, 400)
    }
    const body: UserRequestBody = parsed.data

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
