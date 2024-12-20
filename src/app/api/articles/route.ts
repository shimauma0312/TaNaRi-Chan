import { PrismaClient } from "@prisma/client"
import { NextResponse } from "next/server"

const prisma = new PrismaClient()

// 全ての記事を取得
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

// 記事POST
export async function POST(req: Request): Promise<NextResponse> {
    try {
        const data = await req.json()
        const newPost = await createArticle(data)
        return NextResponse.json(newPost)
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: "Failed to create article" }, { status: 500 })
    }
}


/**
 * 記事リストを取得する
 */
async function getArticles() {
    return await prisma.post.findMany()
}

/**
 * 記事を作成する
 */
async function createArticle(data: any) {
    return await prisma.post.create({
        data: {
            title: data.title,
            content: data.content,
            author_id: data.author_id,
        },
    })
}
