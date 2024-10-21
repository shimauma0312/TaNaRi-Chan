// [src/app/auth/login/page.tsx](src/app/auth/login/page.tsx)
"use client"

import Link from "next/link"
import { useLogin } from "@/hooks/useLogin"

const LoginPage = () => {
  const { email, setEmail, password, setPassword, error, handleSubmit } =
    useLogin()

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
        Don't have an account? <Link href="register">Register here</Link>
      </p>
    </div>
  )
}

export default LoginPage
