import { NextRequest, NextResponse } from 'next/server'
import { clearAuthCookie } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    // Clear authentication cookie
    clearAuthCookie()

    return NextResponse.json(
      { message: 'ログアウトしました' },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { error: 'ログアウト処理中にエラーが発生しました' },
      { status: 500 }
    )
  }
}