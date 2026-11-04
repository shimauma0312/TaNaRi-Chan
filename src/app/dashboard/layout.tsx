import { AuthProvider } from "@/components/auth/AuthProvider"
import DashboardShell from "@/components/DashboardShell"
import { getCurrentUser } from "@/lib/auth"
import { redirect } from "next/navigation"
import type { ReactNode } from "react"

export const dynamic = "force-dynamic"

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  return (
    <AuthProvider user={user}>
      <DashboardShell>{children}</DashboardShell>
    </AuthProvider>
  )
}
