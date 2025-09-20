import { NextRequest, NextResponse } from 'next/server'
import * as userService from '@/service/userService'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest) {
  try {
    const user = await userService.getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { error: 'ユーザーが認証されていません' },
        { status: 401 }
      )
    }

    return NextResponse.json(user, { status: 200 })
  } catch (error) {
    console.error('Get current user error:', error)
    return NextResponse.json(
      { error: 'ユーザー情報の取得中にエラーが発生しました' },
      { status: 500 }
    )
  }
}
