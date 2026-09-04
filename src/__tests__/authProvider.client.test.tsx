/** @jest-environment jsdom */

import { AuthProvider } from "@/components/auth/AuthProvider"
import useAuth from "@/hooks/useAuth"
import { renderHook } from "@testing-library/react"
import type { ReactNode } from "react"

const user = {
  id: "user-1",
  user_name: "Test User",
  user_email: "test@example.com",
  icon_number: 1,
}

describe("dashboard authentication context", () => {
  test("shares the server-resolved user without a browser API request", () => {
    global.fetch = jest.fn()
    const wrapper = ({ children }: { children: ReactNode }) => (
      <AuthProvider user={user}>{children}</AuthProvider>
    )

    const { result } = renderHook(() => useAuth(), { wrapper })

    expect(result.current).toEqual({ user, loading: false })
    expect(global.fetch).not.toHaveBeenCalled()
  })

  test("fails fast outside the authenticated dashboard boundary", () => {
    expect(() => renderHook(() => useAuth())).toThrow("useAuth must be used within DashboardLayout")
  })
})
