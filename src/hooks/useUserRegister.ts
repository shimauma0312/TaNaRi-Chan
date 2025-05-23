import { useState } from "react"
import { useRouter } from "next/navigation"

export const useUserRegister = () => {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [userName, setUserName] = useState("")
  const [error, setError] = useState("")
  const router = useRouter()

  const handleSubmit = async ({
    email,
    password,
    userName,
  }: {
    email: string
    password: string
    userName: string
  }) => {
    try {
      const response = await fetch("/api/createUser", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password, userName }),
      })

      if (response.ok) {
        console.log("User registered successfully")
        router.push("login") // 成功後の遷移先
      } else {
        const errorData = await response.json()
        setError(errorData.error || "ユーザー登録中にエラーが発生しました。")
      }
    } catch (error) {
      console.error("Error registering user:", error)
      setError("ユーザー登録中にエラーが発生しました。")
    }
  }

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
