import { NextApiRequest, NextApiResponse } from "next"
import { NextRequest, NextResponse } from "next/server"

import { PrismaClient } from "@prisma/client"
import { createUserWithEmailAndPassword } from "firebase/auth"
import { auth } from "@/app/firebaseConfig"

const prisma = new PrismaClient()

interface UserRequestBody {
  email: string
  password: string
  userName: string
}

export async function POST(req: NextRequest) {
  const body: UserRequestBody = await req.json()
  try {
    // firebaseに認証ユーザーを作成
    const uid = await firebaseCreateUser(body)

    // データベースにユーザー情報を保存
    saveUserToDatabase(body, uid)

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

/**
 * firebaseにユーザーを作成し、作成されたuidを返す
 * @param body : UserRequestBody
 * @returns User
 */
async function firebaseCreateUser(body: UserRequestBody) {
  const userCredential = await createUserWithEmailAndPassword(
    auth,
    body.email,
    body.password,
  )
  return userCredential.user.uid
}

/**
 * prismaにユーザー情報を保存する
 * @param body : UserRequestBody
 * @param userId : string
 */
async function saveUserToDatabase(body: UserRequestBody, userId: string) {
  await prisma.user.create({
    data: {
      user_id: userId,
      user_name: body.userName,
      user_email: body.email,
      icon_number: 1, // デフォルトのアイコン番号
    },
  })
}
