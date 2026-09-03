/** @jest-environment node */

jest.mock("@/lib/prisma", () => ({
  __esModule: true,
  default: {},
}))

jest.mock("next/headers", () => ({
  cookies: jest.fn(),
}))

import { isSameOriginRequest } from "@/lib/auth"

describe("browser request origin validation", () => {
  const originalTrustedOrigins = process.env.TRUSTED_ORIGINS

  afterEach(() => {
    if (originalTrustedOrigins === undefined) {
      delete process.env.TRUSTED_ORIGINS
    } else {
      process.env.TRUSTED_ORIGINS = originalTrustedOrigins
    }
  })

  test("accepts the request URL origin and non-browser requests without Origin", () => {
    expect(
      isSameOriginRequest(
        new Request("http://app:3000/api/login", { headers: { origin: "http://app:3000" } }),
      ),
    ).toBe(true)
    expect(isSameOriginRequest(new Request("http://app:3000/api/login"))).toBe(true)
  })

  test.each(["http://localhost:33100", "http://127.0.0.1:33100", "https://tanari.example.com"])(
    "accepts configured public origin %s behind a proxy",
    (origin) => {
      process.env.TRUSTED_ORIGINS =
        "http://localhost:33100,http://127.0.0.1:33100,https://tanari.example.com"

      expect(
        isSameOriginRequest(
          new Request("http://app:3000/api/login", {
            headers: { origin, "sec-fetch-site": "same-origin" },
          }),
        ),
      ).toBe(true)
    },
  )

  test("rejects an unconfigured origin", () => {
    process.env.TRUSTED_ORIGINS = "https://tanari.example.com"

    expect(
      isSameOriginRequest(
        new Request("http://app:3000/api/login", {
          headers: { origin: "https://attacker.example" },
        }),
      ),
    ).toBe(false)
  })

  test("rejects an explicitly cross-site request even if its origin is configured", () => {
    process.env.TRUSTED_ORIGINS = "https://tanari.example.com"

    expect(
      isSameOriginRequest(
        new Request("http://app:3000/api/login", {
          headers: {
            origin: "https://tanari.example.com",
            "sec-fetch-site": "cross-site",
          },
        }),
      ),
    ).toBe(false)
  })

  test("does not trust spoofed forwarded headers", () => {
    delete process.env.TRUSTED_ORIGINS

    expect(
      isSameOriginRequest(
        new Request("http://app:3000/api/login", {
          headers: {
            origin: "https://attacker.example",
            "x-forwarded-host": "attacker.example",
            "x-forwarded-proto": "https",
          },
        }),
      ),
    ).toBe(false)
  })

  test.each([
    "not-a-url",
    "ftp://tanari.example.com",
    "https://tanari.example.com/path",
    "https://user@tanari.example.com",
  ])("ignores invalid configured origin %s", (configuredOrigin) => {
    process.env.TRUSTED_ORIGINS = configuredOrigin

    expect(
      isSameOriginRequest(
        new Request("http://app:3000/api/login", {
          headers: { origin: "https://tanari.example.com" },
        }),
      ),
    ).toBe(false)
  })
})
