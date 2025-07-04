import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

export interface AuthUser {
  user_id: string
  user_name: string
  user_email: string
  icon_number: number
}

const useAuth = () => {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/me')
        if (response.ok) {
          const userData = await response.json()
          setUser(userData)
        } else {
          setUser(null)
          router.push("/login")
        }
      } catch (error) {
        console.error('Auth check failed:', error)
        setUser(null)
        router.push("/login")
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [router])

  return { user, loading }
}

export default useAuth

export default useAuth
