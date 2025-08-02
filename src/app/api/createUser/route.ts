import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import { hashPassword, generateUserId } from "@/lib/auth"

const prisma = new PrismaClient()

interface UserRequestBody {
  email: string
  password: string
  userName: string
}

export async function POST(req: NextRequest) {
  const body: UserRequestBody = await req.json()
  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { user_email: body.email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "このメールアドレスは既に登録されています" },
        { status: 400 },
      )
    }

    // Generate user ID and hash password
    const userId = generateUserId()
    const hashedPassword = await hashPassword(body.password)

    // Save user to database
    await prisma.user.create({
      data: {
        user_id: userId,
        user_name: body.userName,
        user_email: body.email,
        password: hashedPassword,
        icon_number: 1, // デフォルトのアイコン番号
      },
    })

    return NextResponse.json(
      { message: "User registered successfully" },
      { status: 200 },
    )
  } catch (error: any) {
    console.error("Error registering user:", error)
    return NextResponse.json(
      { error: error.message || "Error registering user" },
      { status: 500 },
    )
  }
}
