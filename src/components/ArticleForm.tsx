"use client"

import MarkdownEditor from "@/components/markdown/markdownEditor"
import useAuth from "@/hooks/useAuth"
import { AppError, ErrorType, handleClientError } from "@/utils/errorHandler.client"
import React, { useEffect, useState } from "react"

/**
 * 記事フォームコンポーネントのプロパティ
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
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")

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
    setError("")
    setIsSubmitting(true)

    try {
      // 編集モード時のバリデーション：投稿IDが必須
      if (isEditMode && !postId) {
        throw new AppError(
          "Invalid post ID",
          ErrorType.VALIDATION,
          400
        );
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
        const errorData = await response.json()
        const errorMessage = errorData.error || `Failed to ${isEditMode ? "update" : "create"} article`
        setError(errorMessage)
      }
    } catch (error) {
      // エラーハンドリング
      const errorMessage = handleClientError(error, `An error occurred while ${isEditMode ? "updating" : "creating"} the article`)
      setError(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  // UI表示用のテキストをモードに応じて動的に設定
  const formTitle = isEditMode ? "Edit Article" : "Create New Article"
  const buttonText = isEditMode ? "Update Article" : "Create Article"

  return (
      <div className="w-full p-8">
        <div className="max-w-8xl p-8 rounded-lg bg-slate-800 border border-slate-600">
          <h1 className="text-2xl font-bold mb-6 text-white">{formTitle}</h1>
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label
                htmlFor="title"
                className="block text-white font-medium mb-2"
              >
                Title:
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="bg-slate-700 border border-slate-600 w-full px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-slate-400"
                placeholder="記事のタイトルを入力してください"
              />
            </div>
            <div className="mb-4">
              <label
                htmlFor="content"
                className="block text-white font-medium mb-2"
              >
                Content:
              </label>
              <MarkdownEditor initialMarkdown={content} onChange={setContent} />
            </div>
            
            {/* エラーメッセージ表示 */}
            {error && (
              <div className="mb-4 p-3 bg-red-600 text-white rounded-lg">
                {error}
              </div>
            )}
            
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-3 rounded-lg focus:outline-none focus:ring-2 font-medium ${
                isSubmitting 
                  ? "bg-gray-600 cursor-not-allowed" 
                  : "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500"
              } text-white`}
            >
              {isSubmitting ? "Processing..." : buttonText}
            </button>
          </form>
        </div>
      </div>
  )
}

export default ArticleForm
