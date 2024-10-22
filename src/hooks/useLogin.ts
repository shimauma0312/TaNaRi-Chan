import { useState } from "react"
import { useRouter } from "next/navigation"
import { signInWithEmailAndPassword } from "firebase/auth"
import { auth, app } from "@/app/firebaseConfig"
import {
  getDatabase,
  ref,
  onValue,
  set,
  push,
  increment,
  update,
  off,
} from "firebase/database"

// Realtime Database を取得
const db = getDatabase(app)

export const useLogin = () => {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    // アクセス数をカウントアップする関数
    const incrementAccessCount = () => {
      const accessCountRef = ref(db, "dashboard/accessCount")
      update(accessCountRef, { count: increment(1) })
    }

    e.preventDefault()
    try {
      await signInWithEmailAndPassword(auth, email, password)
      // メソッドが起動するたびにアクセス数をカウントアップ
      incrementAccessCount()
      router.push("/dashboard")
    } catch (error) {
      setError("Failed to log in. Please check your credentials.")
    }
  }

  return {
    email,
    setEmail,
    password,
    setPassword,
    error,
    handleSubmit,
  }
}
