import { RegisterSchema } from "@/schemas/validation"
import { useRouter } from "next/navigation"
import { useState } from "react"

/**
 * ユーザー登録機能カスタムフック
 */
export const useUserRegister = () => {
  // 状態管理
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [userName, setUserName] = useState("")
  const [error, setError] = useState("")
  const router = useRouter()

  /**
   * ユーザー登録を実行する関数
   * 
   * @param data 登録データ（メール、パスワード、ユーザー名）
   */
  const handleSubmit = async (data: RegisterSchema) => {
    const { email, password, userName } = data
    
    try {
      // APIリクエスト
      const response = await fetch("/api/createUser", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password, userName }),
      })

      // レスポンス処理
      if (response.ok) {
        console.log("ユーザー登録が完了しました")
        router.push("/login") // ログインページへリダイレクト
      } else {
        const errorData = await response.json()
        setError(errorData.error || "ユーザー登録中にエラーが発生しました。")
      }
    } catch (error) {
      console.error("ユーザー登録エラー:", error)
      setError("ユーザー登録中にエラーが発生しました。サーバーに接続できません。")
    }
  }

  // 公開する状態と関数
  return {
    email,
    setEmail,
    password,
    setPassword,
    userName,
    setUserName,
    error,
    handleSubmit,
  }
}
