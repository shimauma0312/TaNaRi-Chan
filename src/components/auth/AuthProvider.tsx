"use client"

import type { AuthUser } from "@/lib/auth"
import { createContext, type ReactNode, useContext } from "react"

interface AuthContextValue {
  user: AuthUser
  loading: false
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children, user }: { children: ReactNode; user: AuthUser }) {
  return <AuthContext.Provider value={{ user, loading: false }}>{children}</AuthContext.Provider>
}

export function useDashboardAuth(): AuthContextValue {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error("useAuth must be used within DashboardLayout")
  }

  return context
}
