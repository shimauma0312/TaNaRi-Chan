import logger from "@/logging/logging";
import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";
const prisma = new PrismaClient()

/*
* 記事一覧を取得する。
*/
export async function GET(req: Request): Promise<NextResponse> {
    try {
        const url = new URL(req.url);
        const postId = url.searchParams.get('post_id');
        if (!postId) {
            const todos = await getArticles();
            return NextResponse.json(todos);
        } else {
            const article = await getArticle(postId);
            if (article) {
                return NextResponse.json(article);
            } else {
                return NextResponse.json({ error: "Article not found" }, { status: 404 });
            }
        }
    } catch (error) {
        logger.error(error);
        return NextResponse.json(
            { error: "Failed to fetch articles", detail: (error instanceof Error ? error.message : String(error)) },
            { status: 500 }
        );
    }
}

// 記事POST
export async function POST(req: Request): Promise<NextResponse> {
    try {
        const data = await req.json()

        if (!data.title || !data.content || !data.author_id) {
            return NextResponse.json(
                { error: "Missing required fields: title, content, and author_id are required" },
                { status: 400 }
            )
        }

        const newPost = await createArticle(data)
        logger.info(newPost)
        return NextResponse.json(newPost)
    } catch (error) {
        logger.error(error)
        return NextResponse.json({ error: "Failed to create article" }, { status: 500 })
    }
}

// 記事PUT
export async function PUT(req: Request): Promise<NextResponse> {
    try {
        const data = await req.json()

        if (!data.post_id || !data.title || !data.content) {
            return NextResponse.json(
                { error: "Missing required fields: post_id, title, and content are required" },
                { status: 400 }
            )
        }

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

        if (!data.post_id) {
            return NextResponse.json(
                { error: "Missing required field: post_id is required" },
                { status: 400 }
            )
        }

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
 */
async function getArticles() {
    return await prisma.post.findMany({
        select: {
            post_id: true,
            title: true,
            content: true,
            createdAt: true,
        }
    })
}

/**
 * 指定された記事を取得する
 */
async function getArticle(postId: string | null) {
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
    }
    return null; // postIdがnullの場合はnullを返す
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
