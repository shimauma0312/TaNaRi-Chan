"use client"

import MinLoader from "@/components/MinLoader"
import SideMenu from "@/components/SideMenu"
import TetrisGame from "@/components/tetris/TetrisGame"
import useAuth from "@/hooks/useAuth"

const TetrisPage = () => {
  const { user, loading } = useAuth()

  if (loading || !user) {
    return <MinLoader />
  }

  return (
    <div className="min-h-screen text-white p-4 flex">
      <SideMenu />
      <div className="w-4/5 p-4">
        <div className="container mx-auto">
          <h1 className="text-2xl font-bold mb-2">Tetris</h1>
          <p className="text-gray-400 mb-4 text-sm">
            Controls: ← → move, ↓ soft-drop, ↑ rotate, Space hard-drop, Enter to restart after Game
            Over.
          </p>
          <TetrisGame />
        </div>
      </div>
    </div>
  )
}

export default TetrisPage
