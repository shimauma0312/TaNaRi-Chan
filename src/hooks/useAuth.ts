import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { auth } from "@/app/firebaseConfig"
import { onAuthStateChanged, User } from "firebase/auth"

const useAuth = () => {
  const [user, setUser] = useState<User | null>(null)
  const router = useRouter()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user)
      } else {
        router.push("login")
      }
    })

    return () => unsubscribe()
  }, [router])

  return user
}

export default useAuth
