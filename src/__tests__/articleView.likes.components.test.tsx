/** @jest-environment jsdom */

import { render, screen, waitFor } from "@testing-library/react"
import ArticleViewPage from "@/app/dashboard/articles/view/page"

jest.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams("post_id=1"),
}))

jest.mock("@/hooks/useAuth", () => ({
  __esModule: true,
  default: () => ({ user: { id: "user-1", user_name: "alice" }, loading: false }),
}))

jest.mock("@/components/markdown/markdownPreveiw", () => ({
  __esModule: true,
  default: ({ markdown }: { markdown: string }) => <div>{markdown}</div>,
}))

const article = {
  title: "Like test article",
  content: "Body text",
  createdAt: "2026-11-07T00:00:00.000Z",
}

function jsonResponse(ok: boolean, body: unknown): Response {
  return { ok, json: async () => body } as Response
}

function mockFetch(likes: () => Promise<Response>) {
  jest.spyOn(global, "fetch").mockImplementation((input) => {
    const url = String(input)
    if (url.startsWith("/api/articles/likes")) return likes()
    if (url.startsWith("/api/articles/comments")) return Promise.resolve(jsonResponse(true, []))
    return Promise.resolve(jsonResponse(true, article))
  })
}

describe("Article view likes", () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

  test("shows the like button with its count", async () => {
    mockFetch(() => Promise.resolve(jsonResponse(true, { post_id: 1, count: 2, liked: true })))

    render(<ArticleViewPage />)

    const button = await screen.findByRole("button", { name: /いいね！ 2/ })
    expect(button.getAttribute("aria-pressed")).toBe("true")
  })

  test("still shows the article when fetching likes fails", async () => {
    mockFetch(() => Promise.reject(new Error("network down")))

    render(<ArticleViewPage />)

    expect(await screen.findByRole("heading", { name: "Like test article", level: 1 })).toBeTruthy()
    await waitFor(() => expect(screen.getByText("network down")).toBeTruthy())
    expect(screen.queryByRole("button", { name: /いいね！/ })).toBeNull()
  })
})
