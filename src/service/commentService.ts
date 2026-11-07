import { AppError, ErrorType } from "@/utils/errorHandler"
import { PrismaClient } from "@prisma/client"

// Prismaクライアントのシングルトンインスタンス
const prisma = new PrismaClient()

// 作成用のコメントデータの型定義
export interface CreateCommentData {
  post_id: number
  content: string
  author_id: string
}

/**
 * 指定された記事のコメント一覧を取得する
 * @param postId 記事ID
 * @returns コメントのリスト
 */
export async function getComments(postId: number) {
  const post = await prisma.post.findUnique({
    where: {
      post_id: postId,
    },
  })

  if (!post) {
    throw new AppError("Article not found", ErrorType.NOT_FOUND, 404)
  }

  return prisma.postComment.findMany({
    where: {
      post_id: postId,
    },
    orderBy: {
      createdAt: "asc",
    },
    select: {
      comment_id: true,
      content: true,
      createdAt: true,
      author: {
        select: {
          id: true,
          user_name: true,
        },
      },
    },
  })
}

/**
 * コメントを作成する
 * @param data 作成するコメントのデータ
 * @returns 作成されたコメント
 */
export async function createComment(data: CreateCommentData) {
  if (!data.content || !data.content.trim()) {
    throw new AppError("Content is required", ErrorType.VALIDATION, 400)
  }

  const post = await prisma.post.findUnique({
    where: {
      post_id: data.post_id,
    },
  })

  if (!post) {
    throw new AppError("Article not found", ErrorType.NOT_FOUND, 404)
  }

  return prisma.postComment.create({
    data: {
      content: data.content,
      author_id: data.author_id,
      post_id: data.post_id,
    },
    select: {
      comment_id: true,
      content: true,
      createdAt: true,
      author_id: true,
      post_id: true,
      author: {
        select: {
          id: true,
          user_name: true,
        },
      },
    },
  })
}

/**
 * コメントを削除する
 * @param commentId 削除するコメントのID
 * @param requesterId 削除を要求しているユーザーのID
 * @returns 削除されたコメント
 */
export async function deleteComment(commentId: number, requesterId: string) {
  const comment = await prisma.postComment.findUnique({
    where: {
      comment_id: commentId,
    },
  })

  if (!comment) {
    throw new AppError("Comment not found", ErrorType.NOT_FOUND, 404)
  }

  if (comment.author_id !== requesterId) {
    throw new AppError(
      "You do not have permission to delete this comment",
      ErrorType.AUTHORIZATION,
      403,
    )
  }

  return prisma.postComment.delete({
    where: {
      comment_id: commentId,
    },
  })
}
