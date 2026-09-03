/** @jest-environment node */

jest.mock("@/lib/dbLogger", () => ({ writeLogToDB: jest.fn() }))
jest.mock("@/lib/auth", () => ({
  getUserIdFromRequest: jest.fn(),
  isSameOriginRequest: jest.fn(),
}))

import { POST } from "@/app/api/logs/route"
import { LogLevel, LogSource } from "@prisma/client"
import { NextRequest } from "next/server"

const mockWriteLogToDB = jest.requireMock("@/lib/dbLogger").writeLogToDB as jest.Mock
const mockAuth = jest.requireMock("@/lib/auth") as {
  getUserIdFromRequest: jest.Mock
  isSameOriginRequest: jest.Mock
}
const mockGetUserIdFromRequest = mockAuth.getUserIdFromRequest
const mockIsSameOriginRequest = mockAuth.isSameOriginRequest

function request(body: unknown, headers: Record<string, string> = {}): NextRequest {
  return new NextRequest("http://localhost:3000/api/logs", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json", ...headers },
  })
}

function streamedRequest(chunks: string[]): NextRequest {
  const encoder = new TextEncoder()
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      for (const chunk of chunks) {
        controller.enqueue(encoder.encode(chunk))
      }
      controller.close()
    },
  })

  const options = {
    method: "POST",
    body,
    headers: { "content-type": "application/json" },
    duplex: "half" as const,
  }

  return new NextRequest("http://localhost:3000/api/logs", options)
}

describe("POST /api/logs", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockIsSameOriginRequest.mockReturnValue(true)
    mockGetUserIdFromRequest.mockResolvedValue("session-user")
    mockWriteLogToDB.mockResolvedValue(undefined)
  })

  test("uses session identity and ignores a client-supplied userId", async () => {
    const response = await POST(
      request({ level: LogLevel.INFO, message: "hello", userId: "victim-user" }),
    )

    expect(response.status).toBe(201)
    expect(mockWriteLogToDB).toHaveBeenCalledWith(
      expect.objectContaining({
        level: LogLevel.INFO,
        message: "hello",
        source: LogSource.CLIENT,
        userId: "session-user",
      }),
    )
  })

  test("rejects anonymous log writes", async () => {
    mockGetUserIdFromRequest.mockResolvedValue(null)

    const response = await POST(
      request({ level: LogLevel.WARN, message: "anonymous", userId: "victim-user" }),
    )

    expect(response.status).toBe(401)
    expect(mockWriteLogToDB).not.toHaveBeenCalled()
  })

  test("rejects oversized messages", async () => {
    const response = await POST(request({ level: LogLevel.ERROR, message: "x".repeat(2_001) }))

    expect(response.status).toBe(400)
    expect(mockWriteLogToDB).not.toHaveBeenCalled()
  })

  test("rejects oversized contexts", async () => {
    const response = await POST(
      request({ level: LogLevel.DEBUG, message: "debug", context: { value: "x".repeat(9_000) } }),
    )

    expect(response.status).toBe(413)
    expect(mockWriteLogToDB).not.toHaveBeenCalled()
  })

  test("stops an oversized chunked body without a content-length header", async () => {
    const response = await POST(
      streamedRequest([
        '{"level":"ERROR","message":"',
        "x".repeat(16 * 1024),
        '"}',
      ]),
    )

    expect(response.status).toBe(413)
    expect(mockWriteLogToDB).not.toHaveBeenCalled()
  })

  test("rejects explicitly cross-site requests", async () => {
    mockIsSameOriginRequest.mockReturnValue(false)

    const response = await POST(request({ level: LogLevel.INFO, message: "hello" }))

    expect(response.status).toBe(403)
    expect(mockWriteLogToDB).not.toHaveBeenCalled()
  })

  test("stores only the referer pathname", async () => {
    const response = await POST(
      request(
        { level: LogLevel.INFO, message: "hello" },
        { referer: "https://tanari.example/dashboard?token=secret#private" },
      ),
    )

    expect(response.status).toBe(201)
    expect(mockWriteLogToDB).toHaveBeenCalledWith(expect.objectContaining({ path: "/dashboard" }))
  })

  test("reports persistence failures instead of claiming success", async () => {
    mockWriteLogToDB.mockRejectedValue(new Error("database unavailable"))
    const response = await POST(request({ level: LogLevel.ERROR, message: "failed" }))
    expect(response.status).toBe(500)
  })
})
