/** @jest-environment jsdom */

import { render, screen } from "@testing-library/react"
import Loader from "@/components/Loader"
import MinLoader from "@/components/MinLoader"
import MarkdownPreview from "@/components/markdown/markdownPreveiw"

jest.mock("react-markdown", () => ({
  __esModule: true,
  default: ({ children }: { children: string }) => <div data-testid="markdown-output">{children}</div>,
}))
jest.mock("remark-breaks", () => ({ __esModule: true, default: jest.fn() }))
jest.mock("remark-gfm", () => ({ __esModule: true, default: jest.fn() }))

describe("shared presentation components", () => {
  test("the full-page loader retains both layout and animation classes", () => {
    const { container } = render(<Loader onTimeout={jest.fn()} timeout={1_000} />)
    const status = screen.getByRole("status", { name: "読み込み中" })

    expect(status.className.split(" ")).toEqual(expect.arrayContaining(["container", "fadeinout"]))
    expect(container.querySelector('[aria-hidden="true"]')).toBeInTheDocument()
  })

  test("the compact loader exposes an accessible status", () => {
    render(<MinLoader />)

    expect(screen.getByRole("status", { name: "読み込み中" })).toBeInTheDocument()
  })

  test("markdown preview uses the shared scoped styles", () => {
    const { container } = render(<MarkdownPreview markdown={"# Heading\n\n- item"} />)

    expect(screen.getByTestId("markdown-output")).toHaveTextContent("# Heading - item")
    expect(container.firstElementChild).toHaveClass("markdownPreview")
  })
})
