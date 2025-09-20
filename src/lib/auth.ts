import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { cookies } from 'next/headers'
import { NextRequest } from 'next/server'

const prisma = new PrismaClient()

export interface AuthUser {
  id: string
  user_name: string
  user_email: string
  icon_number: number
}

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

/**
 * Generate a random user ID
 */
export function generateUserId(): string {
  return 'user_' + Math.random().toString(36).slice(2, 11) + Date.now().toString(36)
}

/**
 * Authenticate user by email and password
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
    })

    if (!user) {
      return null
    }

    const isPasswordValid = await verifyPassword(password, user.password)
    if (!isPasswordValid) {
      return null
    }

    // Return user without password
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _password, ...userWithoutPassword } = user
    return userWithoutPassword
  } catch (error) {
    console.error('Error authenticating user:', error)
    return null
  }
}

/**
 * Set authentication cookie
 */
export function setAuthCookie(userId: string): void {
  const cookieStore = cookies()
  cookieStore.set('auth-user-id', userId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 1 week
    path: '/',
  })
}

/**
 * Clear authentication cookie
 */
export function clearAuthCookie(): void {
  const cookieStore = cookies()
  cookieStore.set('auth-user-id', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  })
}

/**
 * Get current authenticated user from cookie
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const cookieStore = cookies()
    const userId = cookieStore.get('auth-user-id')?.value

    if (!userId) {
      return null
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        user_name: true,
        user_email: true,
        icon_number: true,
      },
    })

    return user
  } catch (error) {
    console.error('Error getting current user:', error)
    return null
  }
}

/**
 * Get user ID from request cookie (for API routes)
 */
export function getUserIdFromRequest(request: NextRequest): string | null {
  const userId = request.cookies.get('auth-user-id')?.value
  return userId || null
}
