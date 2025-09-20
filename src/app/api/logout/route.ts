import { NextRequest, NextResponse } from 'next/server'
import * as userService from '@/service/userService'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

export async function POST(_req: NextRequest) {
  try {
    // Clear authentication cookie
    userService.clearAuthCookie()

    return NextResponse.json(
      { message: 'ログアウトしました' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { error: 'ログアウト処理中にエラーが発生しました' },
      { status: 500 }
    )
  }
}
