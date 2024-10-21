"use client"

import Link from "next/link"
import { useUserRegister } from "@/hooks/useUserRegister"

const RegisterPage = () => {
  const {
    email,
    setEmail,
    password,
    setPassword,
    userName,
    setUserName,
    error,
    handleSubmit,
  } = useUserRegister()

  return (
    <div>
      <h1>Register Page</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="username">Username:</label>
          <input
            type="text"
            id="username"
            name="username"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            required
          />
        </div>
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
        <button type="submit">Register</button>
      </form>
      <p>
        Already have an account? <Link href="login">Login here</Link>
      </p>
    </div>
  )
}

export default RegisterPage
