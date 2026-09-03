jest.mock("@/lib/prisma", () => ({
  __esModule: true,
  default: { $transaction: jest.fn() },
}))

import prisma from "@/lib/prisma"
import { consumeRateLimit, getRateLimitClientId } from "@/lib/rateLimit"

const mockDeleteMany = jest.fn()
const mockUpsert = jest.fn()
const mockTransaction = prisma.$transaction as jest.Mock

describe("shared rate limiting", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockDeleteMany.mockResolvedValue({ count: 0 })
    mockTransaction.mockImplementation(async (callback) =>
      callback({ rateLimitBucket: { deleteMany: mockDeleteMany, upsert: mockUpsert } }),
    )
    delete process.env.TRUST_PROXY
  })

  test("allows requests up to the configured limit", async () => {
    mockUpsert.mockResolvedValue({ count: 3 })
    await expect(
      consumeRateLimit({ scope: "login", identifier: "user", limit: 3, windowSeconds: 60 }),
    ).resolves.toEqual(expect.objectContaining({ allowed: true }))
  })

  test("blocks requests over the configured limit", async () => {
    mockUpsert.mockResolvedValue({ count: 4 })
    await expect(
      consumeRateLimit({ scope: "login", identifier: "user", limit: 3, windowSeconds: 60 }),
    ).resolves.toEqual(expect.objectContaining({ allowed: false }))
  })

  test("does not store a raw identifier in the bucket key", async () => {
    mockUpsert.mockResolvedValue({ count: 1 })
    await consumeRateLimit({
      scope: "login",
      identifier: "private@example.com",
      limit: 3,
      windowSeconds: 60,
    })
    const key = mockUpsert.mock.calls[0][0].create.key as string
    expect(key).not.toContain("private@example.com")
  })

  test("trusts forwarded addresses only when explicitly configured", () => {
    const request = new Request("http://app", { headers: { "x-forwarded-for": "203.0.113.10" } })
    expect(getRateLimitClientId(request)).toBe("direct-client")
    process.env.TRUST_PROXY = "true"
    expect(getRateLimitClientId(request)).toBe("203.0.113.10")
  })
})
