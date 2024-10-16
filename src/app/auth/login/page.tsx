// [src/app/auth/login/page.tsx](src/app/auth/login/page.tsx)
"use client"

import React, { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation" // next/routerではなくnext/navigationを使用
import { signInWithEmailAndPassword } from "firebase/auth"
import { auth } from "@/app/firebaseConfig"

const LoginPage = () => {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await signInWithEmailAndPassword(auth, email, password)
      router.push("/dashboard") // ログイン成功後の遷移先
    } catch (error) {
      setError("Failed to log in. Please check your credentials.")
    }
  }

  return (
    <div>
      <h1>Login Page</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="email">Email:</label>
          <input
            type="email"
            id="email"
            name="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="password">Password:</label>
          <input
            type="password"
            id="password"
            name="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        {error && <p>{error}</p>}
        <button type="submit">Login</button>
      </form>
      <p>
        Don't have an account? <Link href="/auth/register">Register here</Link>
      </p>
    </div>
  )
}

export default LoginPage
