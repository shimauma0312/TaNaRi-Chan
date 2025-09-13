import { handleClientError } from "@/utils/errorHandler"
import { useRouter } from "next/navigation"
import { useState } from "react"

/**
 * ログイン機能カスタムフック
 */
export const useLogin = () => {
  // 状態管理
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  /**
   * メールアドレスとパスワードでログイン処理を実行する
   * 
   * @param email ユーザーのメールアドレス
   * @param password ユーザーのパスワード
   */
  const login = async (email: string, password: string) => {
    setLoading(true)
    setError("")
    
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      if (response.ok) {
        // ダッシュボードへリダイレクト
        router.push('/dashboard')
      } else {
        const errorData = await response.json()
        const errorMessage = errorData.error || "Login failed. Please check your email and password."
        setError(errorMessage)
      }
    } catch (err) {
      const errorMessage = handleClientError(err, "Login failed. Please check your network connection.")
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  // 公開する状態と関数
  return {
    email,
    setEmail,
    password,
    setPassword,
    error,
    loading,
    login,
  }
}
