import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';
import { AppError, ErrorType } from '@/utils/errorHandler';

// Prismaクライアントのシングルトンインスタンス
const prisma = new PrismaClient();

// ユーザー情報の型定義
export interface AuthUser {
  id: string;
  user_name: string;
  user_email: string;
  icon_number: number;
}

// ユーザー作成用データの型定義
export interface CreateUserData {
  email: string;
  password: string;
  userName: string;
}

/**
 * パスワードをハッシュ化する
 * @param password ハッシュ化するパスワード
 * @returns ハッシュ化されたパスワード
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

/**
 * パスワードがハッシュと一致するか検証する
 * @param password 検証するパスワード
 * @param hashedPassword ハッシュ化されたパスワード
 * @returns 一致すればtrue、そうでなければfalse
 */
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

/**
 * ランダムなユーザーIDを生成する
 * @returns 生成されたユーザーID
 */
export function generateUserId(): string {
  return 'user_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
}

/**
 * メールアドレスでユーザーを検索する
 * @param email 検索するメールアドレス
 * @returns ユーザーオブジェクトまたはnull
 */
export async function findUserByEmail(email: string) {
  try {
    return await prisma.user.findUnique({
      where: { user_email: email },
    });
  } catch (error) {
    console.error('Error finding user by email:', error);
    throw new AppError(
      'Failed to find user',
      ErrorType.DATABASE_ERROR,
      500
    );
  }
}

/**
 * IDでユーザーを検索する
 * @param userId 検索するユーザーID
 * @returns ユーザーオブジェクトまたはnull
 */
export async function findUserById(userId: string) {
  try {
    return await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        user_name: true,
        user_email: true,
        icon_number: true,
      },
    });
  } catch (error) {
    console.error('Error finding user by ID:', error);
    throw new AppError(
      'Failed to find user',
      ErrorType.DATABASE_ERROR,
      500
    );
  }
}

/**
 * 新規ユーザーを作成する
 * @param userData ユーザー作成データ
 * @returns 作成されたユーザー
 */
export async function createUser(userData: CreateUserData) {
  try {
    // Check if user already exists
    const existingUser = await findUserByEmail(userData.email);

    if (existingUser) {
      throw new AppError(
        'Email address is already registered',
        ErrorType.VALIDATION,
        400
      );
    }

    // Generate user ID and hash password
    const userId = generateUserId();
    const hashedPassword = await hashPassword(userData.password);

    // Save user to database
    return await prisma.user.create({
      data: {
        id: userId,
        user_name: userData.userName,
        user_email: userData.email,
        password: hashedPassword,
        icon_number: 1, // デフォルトのアイコン番号
      },
    });
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    console.error('Error creating user:', error);
    throw new AppError(
      'Failed to create user',
      ErrorType.DATABASE_ERROR,
      500
    );
  }
}

/**
 * メールアドレスとパスワードでユーザーを認証する
 * @param email メールアドレス
 * @param password パスワード
 * @returns 認証されたユーザー情報またはnull
 */
export async function authenticateUser(email: string, password: string): Promise<AuthUser | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { user_email: email },
      select: {
        id: true,
        user_name: true,
        user_email: true,
        icon_number: true,
        password: true,
      },
    });

    if (!user) {
      return null;
    }

    const isPasswordValid = await verifyPassword(password, user.password);
    if (!isPasswordValid) {
      return null;
    }

    // Return user without password
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  } catch (error) {
    console.error('Error authenticating user:', error);
    return null;
  }
}

/**
 * 認証用Cookieを設定する
 * @param userId ユーザーID
 */
export function setAuthCookie(userId: string): void {
  const cookieStore = cookies();
  cookieStore.set('auth-user-id', userId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 1 week
    path: '/',
  });
}

/**
 * 認証用Cookieをクリアする
 */
export function clearAuthCookie(): void {
  const cookieStore = cookies();
  cookieStore.set('auth-user-id', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  });
}

/**
 * 現在の認証済みユーザーを取得する
 * @returns 認証済みユーザーまたはnull
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const cookieStore = cookies();
    const userId = cookieStore.get('auth-user-id')?.value;

    if (!userId) {
      return null;
    }

    return await findUserById(userId);
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

/**
 * リクエストからユーザーIDを取得する（API用）
 * @param request NextRequest
 * @returns ユーザーIDまたはnull
 */
export function getUserIdFromRequest(request: NextRequest): string | null {
  const userId = request.cookies.get('auth-user-id')?.value;
  return userId || null;
}