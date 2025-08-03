import { useRouter } from "next/navigation"
export const useLogout = () => {
  const router = useRouter()

  const handleLogout = async () => {
    try {
      await fetch('/api/logout', { method: 'POST' })
      router.push("/login")
    } catch (error) {
      console.error('Logout error:', error)
      router.push("/login")
    }
  }

  return { handleLogout }
}
