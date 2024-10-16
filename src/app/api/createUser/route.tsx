import { NextApiRequest, NextApiResponse } from "next"
import { NextRequest } from "next/server"

import { PrismaClient } from "@prisma/client"
import { createUserWithEmailAndPassword } from "firebase/auth"
import { auth } from "@/app/firebaseConfig"

const prisma = new PrismaClient()

export default async function POST(req: NextRequest, res: NextApiResponse) {
  const body = await req.json()

  try {
    const userCredential = await createUserWithEmailAndPassword(
      body.auth,
      body.email,
      body.password,
    )
    const firebaseUser = userCredential.user

    // データベースにユーザー情報を保存
    await prisma.user.create({
      data: {
        firebase_uid: firebaseUser.uid,
        user_name: body.userName,
        user_email: body.email,
        icon_number: 1, // デフォルトのアイコン番号
      },
    })

    res.status(200).json({ message: "User registered successfully" })
  } catch (error: any) {
    console.error("Error registering user:", error)
    res.status(500).json({ error: error.message || "Error registering user" })
  }
}
