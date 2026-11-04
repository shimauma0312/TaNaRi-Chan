/** @jest-environment jsdom */

import { act, render, screen } from "@testing-library/react"
import Loader from "@/components/Loader"
import MinLoader from "@/components/MinLoader"
import MarkdownPreview from "@/components/markdown/markdownPreveiw"

jest.mock("react-markdown", () => ({
  __esModule: true,
  default: ({ children }: { children: string }) => (
    <div data-testid="markdown-output">{children}</div>
  ),
}))
jest.mock("remark-breaks", () => ({ __esModule: true, default: jest.fn() }))
jest.mock("remark-gfm", () => ({ __esModule: true, default: jest.fn() }))

describe("shared presentation components", () => {
  afterEach(() => jest.useRealTimers())

  test("the full-page loader announces progress and completes after its timeout", () => {
    jest.useFakeTimers()
    const onTimeout = jest.fn()
    render(<Loader onTimeout={onTimeout} timeout={1_000} />)
    const status = screen.getByRole("status", { name: "読み込み中" })

    expect(status).toBeTruthy()
    expect(screen.getByText("Loading...")).toBeTruthy()

    act(() => jest.advanceTimersByTime(1_000))
    expect(onTimeout).toHaveBeenCalledTimes(1)
  })

  test("the compact loader exposes an accessible status", () => {
    render(<MinLoader />)

    expect(screen.getByRole("status", { name: "読み込み中" })).toBeTruthy()
  })

  test("markdown preview passes content to the renderer", () => {
    render(<MarkdownPreview markdown={"# Heading\n\n- item"} />)

    expect(screen.getByTestId("markdown-output").textContent).toContain("# Heading")
  })
})
