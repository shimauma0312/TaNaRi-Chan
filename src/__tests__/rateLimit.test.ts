jest.mock("@/lib/prisma", () => ({
  __esModule: true,
  default: { rateLimitBucket: { upsert: jest.fn() } },
}))

import prisma from "@/lib/prisma"
import { consumeRateLimit, getRateLimitClientId } from "@/lib/rateLimit"

const mockUpsert = prisma.rateLimitBucket.upsert as jest.Mock

describe("shared rate limiting", () => {
  beforeEach(() => {
    jest.clearAllMocks()
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

  test("does not perform retention cleanup on the request path", async () => {
    mockUpsert.mockResolvedValue({ count: 1 })

    await consumeRateLimit({ scope: "login", identifier: "user", limit: 3, windowSeconds: 60 })

    expect(prisma).not.toHaveProperty("rateLimitBucket.deleteMany")
  })

  test("trusts forwarded addresses only when explicitly configured", () => {
    const request = new Request("http://app", { headers: { "x-forwarded-for": "203.0.113.10" } })
    expect(getRateLimitClientId(request)).toBe("direct-client")
    process.env.TRUST_PROXY = "true"
    expect(getRateLimitClientId(request)).toBe("203.0.113.10")
  })
})
