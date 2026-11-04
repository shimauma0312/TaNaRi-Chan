jest.mock("@/lib/prisma", () => ({
  __esModule: true,
  default: {
    user: { findFirst: jest.fn() },
    rateLimitBucket: { findFirst: jest.fn() },
  },
}))

import { GET } from "@/app/api/health/ready/route"
import prisma from "@/lib/prisma"

const mockUserFindFirst = prisma.user.findFirst as jest.Mock
const mockRateLimitFindFirst = prisma.rateLimitBucket.findFirst as jest.Mock

describe("GET /api/health/ready", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUserFindFirst.mockResolvedValue(null)
    mockRateLimitFindFirst.mockResolvedValue(null)
  })

  test("reports ready only after old and new Prisma models are queryable", async () => {
    const response = await GET()

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ status: "ready" })
    expect(mockUserFindFirst).toHaveBeenCalledWith({ select: { id: true } })
    expect(mockRateLimitFindFirst).toHaveBeenCalledWith({ select: { key: true } })
  })

  test("reports unavailable when the generated client cannot query a new model", async () => {
    mockRateLimitFindFirst.mockRejectedValue(new TypeError("stale Prisma Client"))

    const response = await GET()

    expect(response.status).toBe(503)
    expect(await response.json()).toEqual({ status: "unavailable" })
  })
})
