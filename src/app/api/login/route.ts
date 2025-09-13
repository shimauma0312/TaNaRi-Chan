import { authenticateUser, setAuthCookie } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'

interface LoginRequestBody {
  email: string
  password: string
}

export async function POST(req: NextRequest) {
  try {
    const body: LoginRequestBody = await req.json()

    if (!body.email || !body.password) {
      return NextResponse.json(
        { error: 'メールアドレスとパスワードは必須です' },
        { status: 400 }
      )
    }

    const user = await authenticateUser(body.email, body.password)

    if (!user) {
      return NextResponse.json(
        { error: 'メールアドレスまたはパスワードが正しくありません' },
        { status: 401 }
      )
    }

    // Set authentication cookie
    await setAuthCookie(user.id)

    return NextResponse.json(
      {
        message: 'ログインに成功しました',
        user: {
          id: user.id,
          user_name: user.user_name,
          user_email: user.user_email,
          icon_number: user.icon_number,
        }
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'ログイン処理中にエラーが発生しました' },
      { status: 500 }
    )
  }
}
