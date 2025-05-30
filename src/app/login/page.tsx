"use client"

import { useLogin } from "@/hooks/useLogin"
import { LoginSchema, loginValidation } from "@/schemas/validation"
import { zodResolver } from "@hookform/resolvers/zod"
import Link from "next/link"
import { useForm } from "react-hook-form"

const LoginPage = () => {
  // バリデーションスキーマを取得
  const schema = loginValidation()

  // カスタムフックから状態と関数を取得
  const { email, setEmail, password, setPassword, error, login } = useLogin()

  // react-hook-form の設定
  const {
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<LoginSchema>({
    resolver: zodResolver(schema),
  })

  // フォーム入力の変更ハンドラー
  const handleInputChange = (field: "email" | "password", value: string) => {
    // フォームの値を更新し、バリデーションを実行
    setValue(field, value, { shouldValidate: true })
    
    // 対応する状態を更新
    if (field === "email") setEmail(value)
    if (field === "password") setPassword(value)
  }

  // フォーム送信ハンドラー
  const onSubmit = (data: LoginSchema) => {
    const { email, password } = data
    login(email, password)
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <div className="bg-transparent p-8 rounded-lg shadow-md w-full max-w-md backdrop-filter backdrop-blur-lg bg-opacity-30 border border-gray-300">
        <h1 className="text-2xl font-bold mb-6 text-center text-white">
          Login Page
        </h1>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="mb-4">
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-300"
            >
              Email:
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              className="mt-1 block w-full px-3 py-2 bg-transparent border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-white"
            />
            {errors.email && (
              <p className="text-red-500 text-sm mt-1">
                {errors.email.message}
              </p>
            )}
          </div>
          <div className="mb-4">
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-300"
            >
              Password:
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={password}
              onChange={(e) => handleInputChange("password", e.target.value)}
              className="mt-1 block w-full px-3 py-2 bg-transparent border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-white"
            />
            {errors.password && (
              <p className="text-red-500 text-sm mt-1">
                {errors.password.message}
              </p>
            )}
          </div>
          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
          <button
            className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            type="submit"
          >
            Login
          </button>
        </form>
        <p className="mt-4 text-center text-gray-300">
          Don't have an account?{" "}
          <Link
            className="font-bold text-indigo-600 hover:text-indigo-500"
            href="register"
          >
            Register here
          </Link>
        </p>
      </div>
    </div>
  )
}

export default LoginPage
