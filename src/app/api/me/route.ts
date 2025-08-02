import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json(
        { error: 'ユーザーが認証されていません' },
        { status: 401 }
      )
    }

    return NextResponse.json(user, { status: 200 })
  } catch (error: any) {
    console.error('Get current user error:', error)
    return NextResponse.json(
      { error: 'ユーザー情報の取得中にエラーが発生しました' },
      { status: 500 }
    )
  }
}