"use client"

// components/MinLoader.tsx
import React from "react"

const MinLoader: React.FC = () => {
  return (
    <div
      className="flex items-center justify-center min-h-screen"
      role="status"
      aria-label="読み込み中"
    >
      <div
        className="w-12 h-12 border-2 border-t-2 border-t-transparent border-white rounded-full animate-spin motion-reduce:animate-none"
        aria-hidden="true"
      />
    </div>
  )
}

export default MinLoader
