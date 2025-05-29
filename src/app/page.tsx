"use client"
// pages/index.tsx
import Link from "next/link"
import { useState } from "react"
import Loader from "../components/Loader"
import fede from "../styles/fede.module.css"
import noise from "../styles/noise.module.css"

export default function Home() {
  const [isLoading, setIsLoading] = useState<boolean>(true)

  // ロード画面が表示される時間（ミリ秒）
  const handleTimeout = () => {
    setIsLoading(false)
  }

  return (
    <main className="min-h-screen">
      {isLoading ? (
        <div className="h-screen w-screen flex justify-center items-center">
          <Loader onTimeout={handleTimeout} timeout={1300} />
        </div>
      ) : (
        <div className={`${fede.fadein} min-h-screen flex flex-col items-center justify-center p-4`}>
          <div className="relative w-full max-w-4xl mx-auto text-center">
            {/* ノイズエフェクト背景 */}
            <div className="absolute inset-0 opacity-10 pointer-events-none">
              <div className={noise.glitch} data-text=""></div>
            </div>

            {/* メインコンテンツ */}
            <div className="backdrop-blur-sm bg-black/40 p-8 rounded-2xl shadow-2xl border border-white/20">
              <h1 className="text-5xl font-bold mb-2 text-white">
                TaNaRi-Chan
              </h1>
              <Link
                href="/login"
                className="inline-block px-8 py-4 text-lg font-medium text-white bg-black/60 border border-white/30 rounded-lg shadow-lg hover:bg-black/80 transform hover:scale-105 transition-all duration-300"
              >
                Log in to start
              </Link>
              <p className="mt-6 text-white/70">
                Don't have an account? You can <Link href="/register" className="text-white hover:text-white/90 underline">sign up here</Link> to get started.

              </p>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
