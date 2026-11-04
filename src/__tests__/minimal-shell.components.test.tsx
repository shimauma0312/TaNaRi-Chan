/** @jest-environment jsdom */

import { act, render, screen, waitFor, within } from "@testing-library/react"
import DashboardPage from "@/app/dashboard/page"
import Home from "@/app/page"
import DashboardShell from "@/components/DashboardShell"
import SideMenu from "@/components/SideMenu"
import AuthPageShell from "@/components/auth/AuthPageShell"

const mockUsePathname = jest.fn()
const mockUseLogout = jest.fn()
const mockUseAuth = jest.fn()

jest.mock("next/navigation", () => ({
  usePathname: () => mockUsePathname(),
}))

jest.mock("@/hooks/useLogout", () => ({
  useLogout: () => mockUseLogout(),
}))

jest.mock("@/hooks/useAuth", () => ({
  __esModule: true,
  default: () => mockUseAuth(),
}))

jest.mock("@/components/ShakeImage", () => ({
  __esModule: true,
  default: () => <div aria-label="Shake image playground" />,
}))

const dashboardData = {
  articles: [
    {
      post_id: 10,
      title: "Architecture notes",
      content: "A short article",
      createdAt: "2026-09-05T00:00:00.000Z",
      author: { user_name: "alice" },
    },
  ],
  activeTodos: [
    {
      todo_id: 20,
      title: "Review navigation",
      description: "Check the current page state",
      todo_deadline: "2026-09-10",
    },
  ],
  publicTodos: [
    {
      todo_id: 30,
      title: "Shared task",
      description: "Visible to collaborators",
      todo_deadline: "2026-09-12",
      user: { id: "user-2", user_name: "bob" },
    },
  ],
}

describe("minimal application shells", () => {
  beforeEach(() => {
    mockUsePathname.mockReturnValue("/dashboard/messages")
    mockUseLogout.mockReturnValue({
      handleLogout: jest.fn(),
      error: null,
      isLoggingOut: false,
    })
    mockUseAuth.mockReturnValue({
      user: { id: "user-1", user_email: "user@example.com", user_name: "User" },
      loading: false,
    })
  })

  afterEach(() => {
    jest.useRealTimers()
    jest.restoreAllMocks()
  })

  test("the side menu exposes the current destination and emphasizes its label", () => {
    render(<SideMenu />)

    const currentLink = screen.getByRole("link", { name: "Messages" })
    const generatedClass = Array.from(currentLink.classList).find((name) => name.startsWith("css-"))
    const selectedLabelRule = Array.from(document.styleSheets)
      .flatMap((styleSheet) => Array.from(styleSheet.cssRules))
      .find(
        (rule) =>
          generatedClass &&
          rule.cssText.includes(`.${generatedClass}.Mui-selected .MuiListItemText-primary`) &&
          /font-weight:\s*700/.test(rule.cssText),
      )

    expect(currentLink.getAttribute("aria-current")).toBe("page")
    expect(selectedLabelRule).toBeDefined()
    expect(screen.getByRole("link", { name: "Dashboard" }).getAttribute("aria-current")).toBeNull()
  })

  test("the dashboard shell retains its brand route and page landmark", () => {
    render(
      <DashboardShell>
        <h1>Shell content</h1>
      </DashboardShell>,
    )

    expect(screen.getByRole("link", { name: "TaNaRi-Chan" }).getAttribute("href")).toBe(
      "/dashboard",
    )
    expect(
      within(screen.getByRole("main")).getByRole("heading", { name: "Shell content" }),
    ).toBeTruthy()
    expect(
      document
        .querySelector('[aria-controls="dashboard-mobile-navigation"]')
        ?.getAttribute("aria-expanded"),
    ).toBe("false")
  })

  test("the auth shell labels its section and preserves the alternate route", () => {
    const { container } = render(
      <AuthPageShell title="Login" footer={<a href="/register">Register</a>}>
        <form aria-label="Login form" />
      </AuthPageShell>,
    )

    const heading = screen.getByRole("heading", { name: "Login", level: 1 })
    const section = container.querySelector("section")

    expect(section?.getAttribute("aria-labelledby")).toBe(heading.id)
    expect(screen.getByRole("form", { name: "Login form" })).toBeTruthy()
    expect(screen.getByRole("link", { name: "Register" }).getAttribute("href")).toBe("/register")
  })

  test("the landing page keeps its primary login and registration routes", () => {
    jest.useFakeTimers()
    const { container } = render(<Home />)

    act(() => jest.advanceTimersByTime(1_300))

    expect(screen.getByRole("heading", { name: "TaNaRi-Chan", level: 1 })).toBeTruthy()
    expect(screen.getByRole("link", { name: "Log in" }).getAttribute("href")).toBe("/login")
    expect(screen.getByRole("link", { name: "Register" }).getAttribute("href")).toBe("/register")
    expect(container.querySelector(".MuiCard-root")).toBeNull()
  })

  test("the dashboard renders data in plain sections without card or chip components", async () => {
    jest.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => dashboardData,
    } as Response)

    const { container } = render(<DashboardPage />)

    await waitFor(() =>
      expect(screen.getByRole("heading", { name: "Dashboard", level: 1 })).toBeTruthy(),
    )

    expect(screen.getByRole("heading", { name: "Random timeline articles", level: 2 })).toBeTruthy()
    expect(screen.getByRole("heading", { name: "Your active todos", level: 2 })).toBeTruthy()
    expect(screen.getByRole("heading", { name: "Public todos", level: 2 })).toBeTruthy()
    expect(screen.getByRole("link", { name: "Architecture notes" }).getAttribute("href")).toBe(
      "/dashboard/articles/view?post_id=10",
    )
    expect(container.querySelectorAll("section")).toHaveLength(3)
    expect(container.querySelector(".MuiCard-root")).toBeNull()
    expect(container.querySelector(".MuiChip-root")).toBeNull()
  })
})
