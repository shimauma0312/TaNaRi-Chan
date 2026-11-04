jest.mock("@/lib/rateLimit", () => ({ consumeRateLimit: jest.fn() }))

import { consumeRateLimit } from "@/lib/rateLimit"
import { enforceWriteRateLimit } from "@/lib/writeRateLimit"

const mockConsume = consumeRateLimit as jest.MockedFunction<typeof consumeRateLimit>

describe("enforceWriteRateLimit", () => {
  test("allows a write below the account quota", async () => {
    mockConsume.mockResolvedValue({ allowed: true, retryAfter: 1 })

    await expect(
      enforceWriteRateLimit("user-1", { scope: "logs", limit: 10, windowSeconds: 60 }),
    ).resolves.toBeNull()
    expect(mockConsume).toHaveBeenCalledWith({
      scope: "logs",
      identifier: "user-1",
      limit: 10,
      windowSeconds: 60,
    })
  })

  test("returns a consistent 429 response above the account quota", async () => {
    mockConsume.mockResolvedValue({ allowed: false, retryAfter: 17 })

    const response = await enforceWriteRateLimit("user-1", {
      scope: "logs",
      limit: 10,
      windowSeconds: 60,
    })

    expect(response?.status).toBe(429)
    expect(response?.headers.get("Retry-After")).toBe("17")
  })
})
