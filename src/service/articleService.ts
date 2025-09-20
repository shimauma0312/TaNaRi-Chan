import { PrismaClient } from "@prisma/client";
import logger from "@/logging/logging";
import { AppError, ErrorType } from "@/utils/errorHandler";

// Prismaクライアントのシングルトンインスタンス
const prisma = new PrismaClient();

// 記事の型定義
export interface Article {
  post_id: number;
  title: string;
  content: string;
  author_id?: string;
  createdAt?: Date;
}

// 作成用の記事データの型定義
export interface CreateArticleData {
  title: string;
  content: string;
  author_id: string;
}

// 更新用の記事データの型定義
export interface UpdateArticleData {
  post_id: number;
  title: string;
  content: string;
}

/**
 * 記事リストを取得する
 * @returns 記事のリスト
 */
export async function getArticles() {
  return prisma.post.findMany({
    select: {
      post_id: true,
      title: true,
      content: true,
      createdAt: true,
    }
  });
}

/**
 * 指定された記事を取得する
 * @param postId 記事ID
 * @returns 記事データまたはnull
 */
export async function getArticle(postId: string | null) {
  logger.info(postId ?? 'null');
  if (postId !== null) {
    // postIdが有効な数値かバリデーション
    const numericPostId = parseInt(postId, 10);
    if (isNaN(numericPostId) || numericPostId <= 0) {
      throw new AppError(
        'Article not found',
        ErrorType.NOT_FOUND,
        404
      );
    }
    
    return prisma.post.findUnique({
      where: {
        post_id: numericPostId
      },
      select: {
        post_id: true,
        title: true,
        content: true,
        createdAt: true,
      }
    });
  }
  return null; // postIdがnullの場合はnullを返す
}

/**
 * 記事を作成する
 * @param data 作成する記事のデータ
 * @returns 作成された記事
 */
export async function createArticle(data: CreateArticleData) {
  return prisma.post.create({
    data: {
      title: data.title,
      content: data.content,
      author_id: data.author_id,
    },
  });
}

/**
 * 記事を更新する
 * @param data 更新する記事のデータ
 * @returns 更新された記事
 */
export async function updateArticle(data: UpdateArticleData) {
  return prisma.post.update({
    where: {
      post_id: data.post_id,
    },
    data: {
      title: data.title,
      content: data.content,
    },
  });
}

/**
 * 記事を削除する
 * @param post_id 削除する記事のID
 * @returns 削除された記事
 */
export async function deleteArticle(post_id: number) {
  return prisma.post.delete({
    where: {
      post_id: post_id,
    },
  });
}