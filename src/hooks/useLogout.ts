import { useRouter } from "next/navigation"
import { useState } from "react"

export const useLogout = () => {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleLogout = async () => {
    setError(null)
    setIsLoggingOut(true)
    try {
      const response = await fetch("/api/logout", { method: "POST" })
      if (!response.ok) {
        const data = await response.json().catch(() => null)
        throw new Error(data?.error || "ログアウトに失敗しました")
      }
      router.push("/login")
      router.refresh()
    } catch (error) {
      console.error("Logout error:", error)
      setError(error instanceof Error ? error.message : "ログアウトに失敗しました")
    } finally {
      setIsLoggingOut(false)
    }
  }

  return { handleLogout, error, isLoggingOut }
}
