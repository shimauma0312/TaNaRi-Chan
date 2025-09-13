"use client"

import ArticleForm from "@/components/ArticleForm"
import SideMenu from "@/components/SideMenu"
import React from "react"

const RegisterArticlePage: React.FC = () => {
  return (    
  <div className="min-h-screen text-white p-4 flex">
      <SideMenu />
      <ArticleForm />
    </div>
  )
}

export default RegisterArticlePage
