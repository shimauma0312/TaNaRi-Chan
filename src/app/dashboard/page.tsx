// [src/app/dashboard/page.tsx](src/app/dashboard/page.tsx)
"use client"

import React, { useEffect, useState } from "react"
import { useRouter } from "next/navigation" // next/routerではなくnext/navigationを使用
import { onAuthStateChanged, signOut, User } from "firebase/auth"
import { auth } from "@/app/firebaseConfig"
import { useDashboardAccess } from "@/hooks/useDashboardAccess"

const DashboardPage = () => {
  const [user, setUser] = useState<User | null>(null)
  const router = useRouter()
  const accessCount = useDashboardAccess()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user)
      } else {
        router.push("login")
      }
    })

    return () => unsubscribe()
  }, [router])

  const handleLogout = async () => {
    await signOut(auth)
    router.push("login")
  }

  if (!user) {
    return <div>Loading...</div>
  }

  return (
    <div>
      <h1>Dashboard (acscnt: {accessCount})</h1>
      <p>Welcome, {user.email}</p>
      <button onClick={handleLogout}>Logout</button>
    </div>
  )
}

export default DashboardPage
