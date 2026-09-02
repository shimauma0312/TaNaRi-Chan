import { NextRequest, NextResponse } from "next/server"
import * as userService from "@/service/userService"
import logger from "@/utils/logger"
import { firstValidationMessage, loginRequestSchema, readJsonRequest } from "@/schemas/api"
import { isSameOriginRequest } from "@/lib/auth"

interface LoginRequestBody {
  email: string
  password: string
}

export async function POST(req: NextRequest) {
  let requestBody: LoginRequestBody | null = null

  try {
    if (!isSameOriginRequest(req)) {
      return NextResponse.json({ error: "不正な送信元です" }, { status: 403 })
    }

    const json = await readJsonRequest(req)
    if (!json.success) {
      return NextResponse.json({ error: "リクエスト本文が不正です" }, { status: 400 })
    }

    const parsed = loginRequestSchema.safeParse(json.data)
    if (!parsed.success) {
      return NextResponse.json({ error: firstValidationMessage(parsed.error) }, { status: 400 })
    }

    const body: LoginRequestBody = parsed.data
    requestBody = body

    const user = await userService.authenticateUser(body.email, body.password)

    if (!user) {
      return NextResponse.json(
        { error: "メールアドレスまたはパスワードが正しくありません" },
        { status: 401 },
      )
    }

    // Set authentication cookie
    await userService.setAuthCookie(user.id)

    return NextResponse.json(
      {
        message: "ログインに成功しました",
        user: {
          id: user.id,
          user_name: user.user_name,
          user_email: user.user_email,
          icon_number: user.icon_number,
        },
      },
      { status: 200 },
    )
  } catch (error) {
    logger.error("Login error occurred", {
      email: requestBody?.email || "unknown",
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    })
    return NextResponse.json({ error: "ログイン処理中にエラーが発生しました" }, { status: 500 })
  }
}
