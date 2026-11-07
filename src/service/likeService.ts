import prisma from "@/lib/prisma"
import { AppError, ErrorType } from "@/utils/errorHandler"

/** 記事のいいね状態 */
export interface LikeStatus {
  post_id: number
  count: number
  liked: boolean
}

async function ensurePostExists(postId: number): Promise<void> {
  const post = await prisma.post.findUnique({
    where: { post_id: postId },
    select: { post_id: true },
  })
  if (!post) {
    throw new AppError("Article not found", ErrorType.NOT_FOUND, 404)
  }
}

/**
 * 記事のいいね数と、指定ユーザーがいいね済みかを取得する
 * @param postId 記事ID
 * @param userId 閲覧ユーザーID（未ログインなら null）
 */
export async function getLikeStatus(postId: number, userId: string | null): Promise<LikeStatus> {
  await ensurePostExists(postId)

  const [count, own] = await Promise.all([
    prisma.postLike.count({ where: { post_id: postId } }),
    userId
      ? prisma.postLike.findUnique({
          where: { user_id_post_id: { user_id: userId, post_id: postId } },
          select: { post_id: true },
        })
      : Promise.resolve(null),
  ])

  return { post_id: postId, count, liked: own !== null }
}

/**
 * 記事にいいねする（すでにいいね済みなら何もしない）
 * @param postId 記事ID
 * @param userId いいねするユーザーID
 */
export async function likeArticle(postId: number, userId: string): Promise<LikeStatus> {
  await ensurePostExists(postId)

  await prisma.postLike.upsert({
    where: { user_id_post_id: { user_id: userId, post_id: postId } },
    create: { user_id: userId, post_id: postId },
    update: {},
  })

  return getLikeStatus(postId, userId)
}

/**
 * 記事のいいねを取り消す（いいねしていなければ何もしない）
 * @param postId 記事ID
 * @param userId 取り消すユーザーID
 */
export async function unlikeArticle(postId: number, userId: string): Promise<LikeStatus> {
  await ensurePostExists(postId)

  await prisma.postLike.deleteMany({
    where: { user_id: userId, post_id: postId },
  })

  return getLikeStatus(postId, userId)
}
