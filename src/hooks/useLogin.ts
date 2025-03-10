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

  // アクセス数をカウントアップする関数
  const incrementAccessCount = () => {
    const accessCountRef = ref(db, "dashboard/accessCount")
    update(accessCountRef, { count: increment(1) })
  }

  const login = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password)
      await incrementAccessCount() // ログイン成功時にアクセスカウントを増やす
    } catch (err) {
      setError("Login failed. Please check your credentials.")
    }
  }

  return {
    email,
    setEmail,
    password,
    setPassword,
    error,
    login,
  }
}
