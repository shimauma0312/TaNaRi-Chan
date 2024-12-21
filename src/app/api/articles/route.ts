import logger from "@/logging/logging"
import { PrismaClient } from "@prisma/client"
import { NextResponse } from "next/server"
const prisma = new PrismaClient()

/*
* 記事一覧を取得する。
*/
export async function GET(req: Request): Promise<NextResponse> {
    try {
        const todos = await getArticles(req)
        return NextResponse.json(todos)
    } catch (error) {
        // 空を返す
        logger.error(error)
        return NextResponse.json([])
    }
}

// 記事POST
export async function POST(req: Request): Promise<NextResponse> {
    try {
        const data = await req.json()
        const newPost = await createArticle(data)
        logger.info(newPost)
        return NextResponse.json(newPost)
    } catch (error) {
        logger.error(error)
        return NextResponse.json({ error: "Failed to create article" }, { status: 500 })
    }
}

/**
 * 記事リストを取得する
 * reqがnullの場合は全ての記事を取得する
 */
async function getArticles(req: Request) {
    const postId = req.headers.get("post_id");
    logger.info(postId);
    if (postId !== null) {
        return await prisma.post.findUnique({
            where: {
                post_id: Number(postId)
            },
            select: {
                post_id: true,
                title: true,
                content: true,
            }
        })
    } else {
        return await prisma.post.findMany({
            select: {
                post_id: true,
                title: true,
                content: true,
                // 他の必要なカラムを追加
            }
        })
    }
}

/**
 * 記事を作成する
 */
async function createArticle(data: any) {
    try {
        return await prisma.post.create({
            data: {
                title: data.title,
                content: data.content,
                author_id: data.author_id,
            },
        })
    } catch (error) {
        logger.error('Error creating article', { error });
        throw error;
    }
}
