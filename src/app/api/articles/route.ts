import { PrismaClient } from "@prisma/client"
import { NextResponse } from "next/server"

const prisma = new PrismaClient()
export async function GET(): Promise<NextResponse> {
    try {
        const todos = await getArticles()
        return NextResponse.json(todos)
    } catch (error) {
        // 空を返す
        console.error(error)
        return NextResponse.json([])
    }
}

/**
 * 記事リストを取得する
 */
async function getArticles() {
    return await prisma.post.findMany()
}
