"use client"

import MarkdownEditor from "@/components/markdown/markdownEditor"
import SideMenu from "@/components/SideMenu"
import useAuth from "@/hooks/useAuth"
import React, { useEffect, useState } from "react"

/**
 * 記事フォームコンポーネントのプロパティ
 * 記事の作成と編集の両方に対応する共通フォーム
 */
interface ArticleFormProps {
  postId?: number               // 投稿ID（undefined: 新規作成, number: 編集）
  initialTitle?: string          // タイトルの初期値（編集時に使用）
  initialContent?: string        // コンテンツの初期値（編集時に使用）
  onSuccess?: () => void        // 成功時のコールバック関数
}

/**
 * 記事作成・編集共通フォームコンポーネント
 * @param postId - 投稿ID（undefined: 新規作成, number: 編集）
 * @param initialTitle - タイトルの初期値
 * @param initialContent - コンテンツの初期値
 * @param onSuccess - フォーム送信成功時のコールバック
 */
const ArticleForm: React.FC<ArticleFormProps> = ({
  postId,
  initialTitle = "",
  initialContent = "",
  onSuccess
}) => {
  // ユーザー認証状態の取得
  const { user, loading } = useAuth()
  
  // postIdの有無でモードを判定（undefined: 新規作成, number: 編集）
  const isEditMode = postId !== undefined
  
  // フォームの状態管理
  const [title, setTitle] = useState(initialTitle)
  const [content, setContent] = useState(initialContent)

  /**
   * 初期データが変更された際にフォームの状態を更新
   * 編集モードで記事データが非同期で取得された場合に対応
   */
  useEffect(() => {
    setTitle(initialTitle)
    setContent(initialContent)
  }, [initialTitle, initialContent])

  // 認証チェック：ローディング中またはユーザーが未認証の場合はローディング表示
  if (loading || !user) {
    return <div>Loading...</div>
  }

  /**
   * フォーム送信処理
   * 作成モードと編集モードで異なるAPIエンドポイントとメソッドを使用
   * @param event - フォーム送信イベント
   */
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    // 編集モード時のバリデーション：投稿IDが必須
    if (isEditMode && !postId) {
      alert("Invalid post ID.")
      return
    }

    // APIリクエスト用のデータ構築
    // 作成時は author_id が必要、編集時は post_id が必要
    const articleData = isEditMode 
      ? {
          post_id: postId,
          title,
          content,
        }
      : {
          title,
          content,
          author_id: user?.id,
        }

    try {
      // APIエンドポイントへのリクエスト送信
      // 作成時はPOST、編集時はPUTメソッドを使用
      const response = await fetch("/api/articles", {
        method: isEditMode ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(articleData),
      })

      if (response.ok) {
        // 作成モード時はフォームをリセット
        if (!isEditMode) {
          setTitle("")
          setContent("")
        }
        
        // 成功時の処理
        if (onSuccess) {
          // カスタムコールバックが指定されている場合は実行
          onSuccess()
        } else {
          // デフォルトでは記事一覧ページにリダイレクト
          window.location.href = "/dashboard/articles"
        }
      } else {
        console.error(response.statusText)
        alert(`Failed to ${isEditMode ? "update" : "create"} article.`)
      }
    } catch (error) {
      // エラーハンドリング
      console.error("Error:", error)
      alert(`An error occurred while ${isEditMode ? "updating" : "creating"} the article.`)
    }
  }

  // UI表示用のテキストをモードに応じて動的に設定
  const formTitle = isEditMode ? "Edit Article" : "Create New Article"
  const buttonText = isEditMode ? "Update Article" : "Create Article"

  return (
    <div className="min-h-screen text-white p-4 flex">
      <SideMenu />
      <div className="w-4/5 p-4">
        <div className="max-w-md mx-auto p-8 rounded-lg shadow-md">
          <h1 className="text-2xl font-bold mb-6">{formTitle}</h1>
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
              <MarkdownEditor initialMarkdown={content} onChange={setContent} />
            </div>
            <button
              type="submit"
              className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {buttonText}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default ArticleForm
