import { AppError, createApiErrorResponse, ErrorType } from "@/utils/errorHandler"
import { NextRequest, NextResponse } from "next/server"
import * as userService from "@/service/userService"

interface UserRequestBody {
  email: string
  password: string
  userName: string
}

export async function POST(req: NextRequest) {
  try {
    const body: UserRequestBody = await req.json()
    
    // バリデーション
    if (!body.email || !body.password || !body.userName) {
      throw new AppError(
        'Email, password, and username are required',
        ErrorType.VALIDATION,
        400
      );
    }

    // サービス層を使用してユーザーを作成
    await userService.createUser({
      email: body.email,
      password: body.password,
      userName: body.userName
    });

    return NextResponse.json(
      { message: "User registered successfully" },
      { status: 201 },
    )
  } catch (error) {
    const errorResponse = createApiErrorResponse(error, 'Failed to register user');
    return NextResponse.json(errorResponse, { status: errorResponse.statusCode });
  }
}
