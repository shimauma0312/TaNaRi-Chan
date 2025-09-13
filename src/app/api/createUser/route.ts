import { generateUserId, hashPassword } from "@/lib/auth"
import { AppError, createApiErrorResponse, ErrorType } from "@/utils/errorHandler"
import { PrismaClient } from "@prisma/client"
import { NextRequest, NextResponse } from "next/server"

const prisma = new PrismaClient()

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

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { user_email: body.email },
    })

    if (existingUser) {
      throw new AppError(
        'Email address is already registered',
        ErrorType.VALIDATION,
        400
      );
    }

    // Generate user ID and hash password
    const userId = generateUserId()
    const hashedPassword = await hashPassword(body.password)

    // Save user to database
    await prisma.user.create({
      data: {
        id: userId,
        user_name: body.userName,
        user_email: body.email,
        password: hashedPassword,
        icon_number: 1, // デフォルトのアイコン番号
      },
    })

    return NextResponse.json(
      { message: "User registered successfully" },
      { status: 201 },
    )
  } catch (error) {
    const errorResponse = createApiErrorResponse(error, 'Failed to register user');
    return NextResponse.json(errorResponse, { status: errorResponse.statusCode });
  }
}
