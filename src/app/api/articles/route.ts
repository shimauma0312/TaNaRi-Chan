import logger from "@/logging/logging";
import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";
const prisma = new PrismaClient()

/*
* 記事を取得する。
*/
export async function GET(req: Request): Promise<NextResponse> {
    try {
        const url = new URL(req.url);
        const postId = url.searchParams.get('post_id');
        const todos = await getArticles(postId);
        return NextResponse.json(todos);
    } catch (error) {
        // 空を返す
        logger.error(error);
        return NextResponse.json([]);
    }
}

// 記事POST
export async function POST(req: Request): Promise<NextResponse> {
    try {
        const data = await req.json()

        // バリデーション：必須フィールドのチェック
        if (!data.title || !data.content || !data.author_id) {
            return NextResponse.json(
                { error: "Missing required fields: title, content, and author_id are required" },
                { status: 400 }
            )
        }

        const newPost = await createArticle(data)
        logger.info(newPost)
        return NextResponse.json(newPost)
    } catch (error: any) {
        logger.error("Error creating article", { error })

        // エラーコードに基づいた適切なレスポンスを返す
        if (error.code === 'P2003') {
            return NextResponse.json(
                { error: "Referenced author does not exist" },
                { status: 400 }
            )
        } else if (error.code === 'P2021') {
            return NextResponse.json(
                { error: "Database table does not exist" },
                { status: 500 }
            )
        } else if (error.name === 'PrismaClientValidationError') {
            return NextResponse.json(
                { error: "Invalid data format" },
                { status: 400 }
            )
        }

        return NextResponse.json(
            { error: "Failed to create article" },
            { status: 500 }
        )
    }
}

// 記事PUT
export async function PUT(req: Request): Promise<NextResponse> {
    try {
        const data = await req.json()
        const updatedPost = await updateArticle(data)
        logger.info(updatedPost)
        return NextResponse.json(updatedPost)
    } catch (error) {
        logger.error(error)
        return NextResponse.json({ error: "Failed to update article" }, { status: 500 })
    }
}

// 記事DELETE
export async function DELETE(req: Request): Promise<NextResponse> {
    try {
        const data = await req.json()
        const deletedPost = await deleteArticle(data.post_id)
        logger.info(deletedPost)
        return NextResponse.json(deletedPost)
    } catch (error) {
        logger.error(error)
        return NextResponse.json({ error: "Failed to delete article" }, { status: 500 })
    }
}

/**
 * 記事リストを取得する
 * reqがnullの場合は全ての記事を取得する
 */
async function getArticles(postId: string | null) {
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
                createdAt: true,
            }
        })
    } else {
        return await prisma.post.findMany({
            select: {
                post_id: true,
                title: true,
                createdAt: true,
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
    } catch (error: any) {
        // author_idが存在しない場合のエラー
        if (error.code === 'P2003' && error.meta?.field_name?.includes('author_id')) {
            logger.error('Error creating article: Author ID does not exist', { error })
        } else {
            logger.error('Error creating article', { error })
        }
        throw error
    }
}

/**
 * 記事を更新する
 */
async function updateArticle(data: any) {
    try {
        return await prisma.post.update({
            where: {
                post_id: data.post_id,
            },
            data: {
                title: data.title,
                content: data.content,
            },
        })
    } catch (error) {
        logger.error('Error updating article', { error });
        throw error;
    }
}

/**
 * 記事を削除する
 */
async function deleteArticle(post_id: number) {
    try {
        return await prisma.post.delete({
            where: {
                post_id: post_id,
            },
        })
    } catch (error) {
        logger.error('Error deleting article', { error });
        throw error;
    }
}
