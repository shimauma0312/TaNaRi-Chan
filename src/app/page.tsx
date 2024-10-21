"use client"
// pages/index.tsx
import React, { useState } from "react"
import Link from "next/link"
import Loader from "../components/Loader"
import fede from "../styles/fede.module.css"

export default function Home() {
  const [isLoading, setIsLoading] = useState<boolean>(true)

  // ロード画面が表示される時間（ミリ秒）
  const handleTimeout = () => {
    setIsLoading(false)
  }

  return (
    <main>
      <div className="h-screen w-screen flex justify-center items-center">
        {isLoading ? (
          <Loader onTimeout={handleTimeout} timeout={1300} />
        ) : (
          <Link className={fede.fadein} href="login">
            Go to Login
          </Link>
        )}
      </div>
    </main>
  )
}
