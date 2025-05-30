import { auth, database } from "@/app/firebaseConfig"
import { signInWithEmailAndPassword } from "firebase/auth"
import {
  increment,
  ref,
  update
} from "firebase/database"
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
  const router = useRouter()

  /**
   * ダッシュボードのアクセスカウンターを増加させる
   */
  const incrementAccessCount = () => {
    const accessCountRef = ref(database, "dashboard/accessCount")
    update(accessCountRef, { count: increment(1) })
  }

  /**
   * メールアドレスとパスワードでログイン処理を実行する
   * 
   * @param email ユーザーのメールアドレス
   * @param password ユーザーのパスワード
   */
  const login = async (email: string, password: string) => {
    try {
      // Firebase認証
      await signInWithEmailAndPassword(auth, email, password)
      
      // アクセスカウントを増やす
      await incrementAccessCount()
      
      // ダッシュボードへリダイレクト
      router.push('/dashboard')
    } catch (err) {
      setError("ログインに失敗しました。メールアドレスとパスワードを確認してください。")
      console.error("ログインエラー:", err)
    }
  }

  // 公開する状態と関数
  return {
    email,
    setEmail,
    password,
    setPassword,
    error,
    login,
  }
}
