"use client"

// MarkdownEditorコンポーネントをインポート
import MarkdownEditor from "@/components/markdown/markdownEditor"
// 認証フックをインポート
import useAuth from "@/hooks/useAuth"
import React, { useState } from "react"

// RegisterArticlePageコンポーネントの定義
const RegisterArticlePage: React.FC = () => {
  // ユーザー情報を取得
  const user = useAuth()
  // タイトルとコンテンツの状態を管理
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")

  // フォーム送信時の処理
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    // 新しい記事のデータを作成
    const newPost = {
      title,
      content,
      author_id: user?.uid,
    }

    try {
      // APIに記事をPOSTリクエストで送信
      const response = await fetch("/api/articles", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newPost),
      })

      // レスポンスの確認
      if (response.ok) {
        // フォームをリセット
        setTitle("")
        setContent("")
        // 一覧ページに遷移
        window.location.href = "/dashboard/articles"
      } else {
        alert("Failed to create article.")
      }
    } catch (error) {
      console.error("Error:", error)
      alert("An error occurred while creating the article.")
    }
  }

  return (
    <div className="max-w-md mx-auto p-8 rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6">Create New Article</h1>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label
            htmlFor="title"
            className="block text-gray-700 font-semibold mb-2"
          >
            Title:
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="bg-slate-800 w-full px-3 py-2 border rounded-lg focus:outline-none"
          />
        </div>
        <div className="mb-4">
          <label
            htmlFor="content"
            className="block text-gray-700 font-semibold mb-2"
          >
            Content:
          </label>
          {/* MarkdownEditorコンポーネントを使用 */}
          <MarkdownEditor initialMarkdown={content} onChange={setContent} />
        </div>
        <button
          type="submit"
          className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Create Article
        </button>
      </form>
    </div>
  )
}

export default RegisterArticlePage
