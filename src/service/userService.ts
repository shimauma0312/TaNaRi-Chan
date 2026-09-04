import prisma from "@/lib/prisma"
import {
  authenticateUser,
  clearAuthCookie,
  generateUserId,
  getCurrentUser,
  getUserIdFromRequest,
  hashPassword,
  setAuthCookie,
  verifyPassword,
} from "@/lib/auth"
import { AppError, ErrorType } from "@/utils/errorHandler"

export type { AuthUser } from "@/lib/auth"
export {
  authenticateUser,
  clearAuthCookie,
  getCurrentUser,
  getUserIdFromRequest,
  hashPassword,
  setAuthCookie,
  verifyPassword,
}

export interface CreateUserData {
  email: string
  password: string
  userName: string
}

export async function findUserByEmail(email: string) {
  return prisma.user.findUnique({ where: { user_email: email } })
}

export async function findUserById(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      user_name: true,
      user_email: true,
      icon_number: true,
    },
  })
}

export async function createUser(userData: CreateUserData) {
  try {
    if (await findUserByEmail(userData.email)) {
      throw new AppError("Email address is already registered", ErrorType.VALIDATION, 409)
    }

    return await prisma.user.create({
      data: {
        id: generateUserId(),
        user_name: userData.userName,
        user_email: userData.email,
        password: await hashPassword(userData.password),
        icon_number: 1,
      },
    })
  } catch (error) {
    if (error instanceof AppError) {
      throw error
    }
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    ) {
      throw new AppError("Email address is already registered", ErrorType.VALIDATION, 409)
    }
    console.error("Error creating user:", error)
    throw new AppError("Failed to create user", ErrorType.DATABASE_ERROR, 500)
  }
}
