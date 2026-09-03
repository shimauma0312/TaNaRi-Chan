import { readJsonRequest } from "@/schemas/api"

describe("bounded JSON request reader", () => {
  test("parses valid JSON", async () => {
    await expect(
      readJsonRequest(new Request("http://app.test", { method: "POST", body: '{"ok":true}' })),
    ).resolves.toEqual({ success: true, data: { ok: true } })
  })

  test("rejects malformed JSON", async () => {
    await expect(
      readJsonRequest(new Request("http://app.test", { method: "POST", body: "{" })),
    ).resolves.toEqual(expect.objectContaining({ success: false, status: 400 }))
  })

  test("rejects declared oversized bodies before reading", async () => {
    const request = new Request("http://app.test", {
      method: "POST",
      headers: { "content-length": "100" },
      body: "{}",
    })
    await expect(readJsonRequest(request, 10)).resolves.toEqual(
      expect.objectContaining({ success: false, status: 413 }),
    )
  })

  test("stops chunked bodies at the byte limit", async () => {
    const request = new Request("http://app.test", {
      method: "POST",
      body: JSON.stringify({ value: "😀" }),
    })
    await expect(readJsonRequest(request, 8)).resolves.toEqual(
      expect.objectContaining({ success: false, status: 413 }),
    )
  })
})
