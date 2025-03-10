import { NextRequest, NextResponse } from "next/server"
import { insertTodo } from "@/service/todoService"
import { getAuth } from "firebase-admin/auth"

export async function POST(
  req: NextRequest,
  { params }: { params: { user_id: string } },
) {
  try {
    const { user_id } = params
    const { todoData } = await req.json()

    if (!user_id || !todoData) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 })
    }

    // Firebase 認証チェック
    const authToken = req.headers.get("authorization")?.split("Bearer ")[1]
    if (!authToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decodedToken = await getAuth().verifyIdToken(authToken)
    if (decodedToken.uid !== user_id) {
      return NextResponse.json({ error: "Invalid user" }, { status: 403 })
    }

    // ToDo登録処理
    const newTodo = await insertTodo(user_id, {
      title: todoData.title,
      description: todoData.description,
      deadline: new Date(todoData.deadline),
      is_public: todoData.is_public,
    })

    return NextResponse.json(
      { message: "ToDo created", todo: newTodo },
      { status: 201 },
    )
  } catch (error) {
    console.error("ToDo登録エラー:", error)
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    )
  }
}
