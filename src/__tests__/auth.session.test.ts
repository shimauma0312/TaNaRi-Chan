/** @jest-environment node */

jest.mock("@/lib/prisma", () => ({
  __esModule: true,
  default: {
    session: {
      create: jest.fn(),
      findUnique: jest.fn(),
      updateMany: jest.fn(),
    },
    user: { findUnique: jest.fn() },
  },
}))

jest.mock("next/headers", () => ({
  cookies: jest.fn(async () => ({
    get: jest.fn(),
    set: jest.fn(),
  })),
}))

import { createHash } from "node:crypto"
import {
  AUTH_COOKIE_NAME,
  clearAuthCookie,
  getCurrentUser,
  getUserIdFromRequest,
  setAuthCookie,
} from "@/lib/auth"
import { NextRequest } from "next/server"
import { cookies } from "next/headers"

const mockPrisma = jest.requireMock("@/lib/prisma").default
const mockCookies = cookies as jest.MockedFunction<typeof cookies>
const mockCookieStore = {
  get: jest.fn(),
  set: jest.fn(),
}

const user = {
  id: "user-1",
  user_name: "alice",
  user_email: "alice@example.com",
  icon_number: 1,
}

describe("server-side sessions", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockCookies.mockResolvedValue(mockCookieStore as never)
    mockPrisma.session.create.mockResolvedValue({})
    mockPrisma.session.updateMany.mockResolvedValue({ count: 1 })
  })

  test("stores only a token hash in the database and an opaque token in the cookie", async () => {
    await setAuthCookie(user.id)

    const cookieCall = mockCookieStore.set.mock.calls.find(([name]) => name === AUTH_COOKIE_NAME)
    expect(cookieCall).toBeDefined()
    const token = cookieCall![1] as string
    expect(token).not.toContain(user.id)
    expect(token).toHaveLength(43)

    const data = mockPrisma.session.create.mock.calls[0][0].data
    expect(data.userId).toBe(user.id)
    expect(data.tokenHash).toBe(createHash("sha256").update(token).digest("hex"))
    expect(data.tokenHash).not.toBe(token)
    expect(cookieCall![2]).toEqual(
      expect.objectContaining({ httpOnly: true, sameSite: "lax", path: "/" }),
    )
  })

  test("accepts an active, unexpired session", async () => {
    mockCookieStore.get.mockReturnValue({ value: "opaque-token" })
    mockPrisma.session.findUnique.mockResolvedValue({
      expiresAt: new Date(Date.now() + 60_000),
      revokedAt: null,
      user,
    })

    await expect(getCurrentUser()).resolves.toEqual(user)
  })

  test.each([
    ["expired", new Date(Date.now() - 1), null],
    ["revoked", new Date(Date.now() + 60_000), new Date()],
  ])("rejects an %s session", async (_label, expiresAt, revokedAt) => {
    mockCookieStore.get.mockReturnValue({ value: "opaque-token" })
    mockPrisma.session.findUnique.mockResolvedValue({ expiresAt, revokedAt, user })

    await expect(getCurrentUser()).resolves.toBeNull()
  })

  test("does not interpret the legacy raw-user-ID cookie as authentication", async () => {
    const request = new NextRequest("http://localhost/api/me", {
      headers: { cookie: "auth-user-id=user-1" },
    })

    await expect(getUserIdFromRequest(request)).resolves.toBeNull()
    expect(mockPrisma.session.findUnique).not.toHaveBeenCalled()
  })

  test("revokes the server-side session on logout", async () => {
    mockCookieStore.get.mockImplementation((name: string) =>
      name === AUTH_COOKIE_NAME ? { value: "opaque-token" } : undefined,
    )

    await clearAuthCookie()

    expect(mockPrisma.session.updateMany).toHaveBeenCalledWith({
      where: {
        tokenHash: createHash("sha256").update("opaque-token").digest("hex"),
        revokedAt: null,
      },
      data: { revokedAt: expect.any(Date) },
    })
    expect(mockCookieStore.set).toHaveBeenCalledWith(
      AUTH_COOKIE_NAME,
      "",
      expect.objectContaining({ maxAge: 0 }),
    )
  })
})
