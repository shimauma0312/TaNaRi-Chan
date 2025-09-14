import logger from "@/logging/logging";
import { AppError, createApiErrorResponse, ErrorType, handleDatabaseError } from "@/utils/errorHandler";
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
                throw new AppError(
                    'Article not found',
                    ErrorType.NOT_FOUND,
                    404
                );
            }
        }
    } catch (error) {
        if (error instanceof AppError) {
            const errorResponse = createApiErrorResponse(error, 'Failed to fetch articles');
            return NextResponse.json(errorResponse, { status: errorResponse.statusCode });
        }


        const dbError = handleDatabaseError(error as any);
        const errorResponse = {
            error: 'Failed to fetch articles',
            type: dbError.type,
            statusCode: dbError.statusCode,
            timestamp: new Date().toISOString(),
        };
        return NextResponse.json(errorResponse, { status: errorResponse.statusCode });
    }
}

// 記事POST
export async function POST(req: Request): Promise<NextResponse> {
    try {
        const data = await req.json()

        if (!data.title || !data.content || !data.author_id) {
            throw new AppError(
                'Title, content, and author ID are required',
                ErrorType.VALIDATION,
                400
            );
        }

        const newPost = await createArticle(data)
        logger.info('Article created successfully', { postId: newPost.post_id });
        return NextResponse.json(newPost, { status: 201 })
    } catch (error) {
        if (error instanceof AppError) {
            const errorResponse = createApiErrorResponse(error, 'Failed to create article');
            return NextResponse.json(errorResponse, { status: errorResponse.statusCode });
        }


        const dbError = handleDatabaseError(error as any);
        const errorResponse = {
            error: 'Failed to create article',
            type: dbError.type,
            statusCode: dbError.statusCode,
            timestamp: new Date().toISOString(),
        };
        return NextResponse.json(errorResponse, { status: errorResponse.statusCode });
    }
}

// 記事PUT
export async function PUT(req: Request): Promise<NextResponse> {
    try {
        const data = await req.json()

        if (!data.post_id || !data.title || !data.content) {
            throw new AppError(
                'Post ID, title, and content are required',
                ErrorType.VALIDATION,
                400
            );
        }

        const updatedPost = await updateArticle(data)
        logger.info('Article updated successfully', { postId: updatedPost.post_id });
        return NextResponse.json(updatedPost)
    } catch (error) {
        if (error instanceof AppError) {
            const errorResponse = createApiErrorResponse(error, 'Failed to update article');
            return NextResponse.json(errorResponse, { status: errorResponse.statusCode });
        }


        const dbError = handleDatabaseError(error as any);
        const errorResponse = {
            error: 'Failed to update article',
            type: dbError.type,
            statusCode: dbError.statusCode,
            timestamp: new Date().toISOString(),
        };
        return NextResponse.json(errorResponse, { status: errorResponse.statusCode });
    }
}

// 記事DELETE
export async function DELETE(req: Request): Promise<NextResponse> {
    try {
        const data = await req.json()

        if (!data.post_id) {
            throw new AppError(
                'Post ID is required',
                ErrorType.VALIDATION,
                400
            );
        }

        const deletedPost = await deleteArticle(data.post_id)
        logger.info('Article deleted successfully', { postId: data.post_id });
        return NextResponse.json(deletedPost)
    } catch (error) {
        if (error instanceof AppError) {
            const errorResponse = createApiErrorResponse(error, 'Failed to delete article');
            return NextResponse.json(errorResponse, { status: errorResponse.statusCode });
        }


        const dbError = handleDatabaseError(error as any);
        const errorResponse = {
            error: 'Failed to delete article',
            type: dbError.type,
            statusCode: dbError.statusCode,
            timestamp: new Date().toISOString(),
        };
        return NextResponse.json(errorResponse, { status: errorResponse.statusCode });
    }
}

/**
 * 記事リストを取得する
 */
async function getArticles() {
    try {
        return await prisma.post.findMany({
            select: {
                post_id: true,
                title: true,
                content: true,
                createdAt: true,
            }
        })
    } catch (error) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        throw handleDatabaseError(error as any);
    }
}

/**
 * 指定された記事を取得する
 */
async function getArticle(postId: string | null) {
    logger.info(postId ?? 'null');
    if (postId !== null) {
        try {
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
        } catch (error) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            throw handleDatabaseError(error as any);
        }
    }
    return null; // postIdがnullの場合はnullを返す
}

/**
 * 記事を作成する
 */
async function createArticle(data: { title: string; content: string; author_id: string }) {
    try {
        return await prisma.post.create({
            data: {
                title: data.title,
                content: data.content,
                author_id: data.author_id,
            },
        })
    } catch (error) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        throw handleDatabaseError(error as any);
    }
}

/**
 * 記事を更新する
 */
async function updateArticle(data: { post_id: number; title: string; content: string }) {
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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        throw handleDatabaseError(error as any);
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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        throw handleDatabaseError(error as any);
    }
}
