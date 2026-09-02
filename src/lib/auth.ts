import { createHash, randomBytes, randomUUID } from "node:crypto"
import bcrypt from "bcryptjs"
import { cookies } from "next/headers"
import { NextRequest } from "next/server"
import prisma from "@/lib/prisma"

export const AUTH_COOKIE_NAME = "auth-session"
const LEGACY_AUTH_COOKIE_NAME = "auth-user-id"
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7

export interface AuthUser {
  id: string
  user_name: string
  user_email: string
  icon_number: number
}

const authUserSelect = {
  id: true,
  user_name: true,
  user_email: true,
  icon_number: true,
} as const

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

export function generateUserId(): string {
  return `user_${randomUUID()}`
}

function hashSessionToken(token: string): string {
  return createHash("sha256").update(token).digest("hex")
}

function newSessionToken(): string {
  return randomBytes(32).toString("base64url")
}

async function findUserBySessionToken(token: string | undefined): Promise<AuthUser | null> {
  if (!token) {
    return null
  }

  const session = await prisma.session.findUnique({
    where: { tokenHash: hashSessionToken(token) },
    select: {
      expiresAt: true,
      revokedAt: true,
      user: { select: authUserSelect },
    },
  })

  if (!session || session.revokedAt !== null || session.expiresAt <= new Date()) {
    return null
  }

  return session.user
}

export async function authenticateUser(email: string, password: string): Promise<AuthUser | null> {
  const user = await prisma.user.findUnique({
    where: { user_email: email },
    select: {
      ...authUserSelect,
      password: true,
    },
  })

  if (!user || !(await verifyPassword(password, user.password))) {
    return null
  }

  return {
    id: user.id,
    user_name: user.user_name,
    user_email: user.user_email,
    icon_number: user.icon_number,
  }
}

/** Create a server-side session and store only its opaque token in the browser. */
export async function setAuthCookie(userId: string): Promise<void> {
  const token = newSessionToken()
  const expiresAt = new Date(Date.now() + SESSION_TTL_SECONDS * 1000)

  await prisma.session.create({
    data: {
      tokenHash: hashSessionToken(token),
      userId,
      expiresAt,
    },
  })

  const cookieStore = await cookies()
  cookieStore.set(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_TTL_SECONDS,
    expires: expiresAt,
    path: "/",
  })
  // Remove cookies issued by versions that stored a raw user ID.
  cookieStore.set(LEGACY_AUTH_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  })
}

/** Revoke the current server-side session before removing its browser cookie. */
export async function clearAuthCookie(): Promise<void> {
  const cookieStore = await cookies()
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value

  if (token) {
    await prisma.session.updateMany({
      where: {
        tokenHash: hashSessionToken(token),
        revokedAt: null,
      },
      data: { revokedAt: new Date() },
    })
  }

  for (const name of [AUTH_COOKIE_NAME, LEGACY_AUTH_COOKIE_NAME]) {
    cookieStore.set(name, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 0,
      path: "/",
    })
  }
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const cookieStore = await cookies()
  return findUserBySessionToken(cookieStore.get(AUTH_COOKIE_NAME)?.value)
}

/** Resolve an authenticated user ID from an opaque, non-reversible session cookie. */
export async function getUserIdFromRequest(request: NextRequest): Promise<string | null> {
  const user = await findUserBySessionToken(request.cookies.get(AUTH_COOKIE_NAME)?.value)
  return user?.id ?? null
}

export async function getUserFromRequest(request: NextRequest): Promise<AuthUser | null> {
  return findUserBySessionToken(request.cookies.get(AUTH_COOKIE_NAME)?.value)
}

/** Reject browser requests whose origin is explicitly cross-site. */
export function isSameOriginRequest(request: Request): boolean {
  if (request.headers.get("sec-fetch-site") === "cross-site") {
    return false
  }

  const origin = request.headers.get("origin")
  return origin === null || origin === new URL(request.url).origin
}
