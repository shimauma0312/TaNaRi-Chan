"use client"

// componets/MinLoader.tsx
import React from "react"

const MinLoader: React.FC = () => {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-12 h-12 border-2 border-t-2 border-t-transparent border-white rounded-full animate-spin"></div>
    </div>
  )
}

export default MinLoader
