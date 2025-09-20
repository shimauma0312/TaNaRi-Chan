import logger from "@/logging/logging";
import { AppError, createApiErrorResponse, ErrorType } from "@/utils/errorHandler";
import { NextResponse } from "next/server";
import * as articleService from "@/service/articleService";

/*
* 記事一覧を取得する。
*/
export async function GET(req: Request): Promise<NextResponse> {
    try {
        const url = new URL(req.url);
        const postId = url.searchParams.get('post_id');
        if (!postId) {
            const articles = await articleService.getArticles();
            return NextResponse.json(articles);
        } else {
            const article = await articleService.getArticle(postId);
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

        const errorResponse = createApiErrorResponse(
            error as AppError,
            'Failed to fetch articles'
        );
        return NextResponse.json(errorResponse, { status: errorResponse.statusCode });
    }
}

// 記事POST
export async function POST(req: Request): Promise<NextResponse> {
    try {
        const data = await req.json();

        if (!data.title || !data.content || !data.author_id || 
            !data.title.trim() || !data.content.trim() || !data.author_id.trim()) {
            throw new AppError(
                'Title, content, and author ID are required',
                ErrorType.VALIDATION,
                400
            );
        }

        const newPost = await articleService.createArticle(data);
        logger.info('Article created successfully', { postId: newPost.post_id });
        return NextResponse.json(newPost, { status: 201 });
    } catch (error) {
        if (error instanceof AppError) {
            const errorResponse = createApiErrorResponse(error, 'Failed to create article');
            return NextResponse.json(errorResponse, { status: errorResponse.statusCode });
        }

        const errorResponse = createApiErrorResponse(
            error as AppError,
            'Failed to create article'
        );
        return NextResponse.json(errorResponse, { status: errorResponse.statusCode });
    }
}

// 記事PUT
export async function PUT(req: Request): Promise<NextResponse> {
    try {
        const data = await req.json();

        if (!data.post_id || !data.title || !data.content ||
            !data.title.trim() || !data.content.trim()) {
            throw new AppError(
                'Post ID, title, and content are required',
                ErrorType.VALIDATION,
                400
            );
        }

        const updatedPost = await articleService.updateArticle(data);
        logger.info('Article updated successfully', { postId: updatedPost.post_id });
        return NextResponse.json(updatedPost);
    } catch (error) {
        if (error instanceof AppError) {
            const errorResponse = createApiErrorResponse(error, 'Failed to update article');
            return NextResponse.json(errorResponse, { status: errorResponse.statusCode });
        }

        const errorResponse = createApiErrorResponse(
            error as AppError,
            'Failed to update article'
        );
        return NextResponse.json(errorResponse, { status: errorResponse.statusCode });
    }
}

// 記事DELETE
export async function DELETE(req: Request): Promise<NextResponse> {
    try {
        const data = await req.json();

        if (!data.post_id) {
            throw new AppError(
                'Post ID is required',
                ErrorType.VALIDATION,
                400
            );
        }

        const deletedPost = await articleService.deleteArticle(data.post_id);
        logger.info('Article deleted successfully', { postId: data.post_id });
        return NextResponse.json(deletedPost);
    } catch (error) {
        if (error instanceof AppError) {
            const errorResponse = createApiErrorResponse(error, 'Failed to delete article');
            return NextResponse.json(errorResponse, { status: errorResponse.statusCode });
        }

        const errorResponse = createApiErrorResponse(
            error as AppError,
            'Failed to delete article'
        );
        return NextResponse.json(errorResponse, { status: errorResponse.statusCode });
    }
}
