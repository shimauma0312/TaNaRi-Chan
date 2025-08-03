
import "easymde/dist/easymde.min.css"
import "github-markdown-css/github-markdown.css"

import React, { useState } from "react"

import styles from "@/styles/markdown.module.css"
import ReactMarkdown from "react-markdown"
import breaks from "remark-breaks"
import remarkGfm from "remark-gfm"

/**
 * MarkdownEditorコンポーネント
 *
 * - Markdownの編集とプレビューをタブで切り替え
 * - 親コンポーネントから初期値とonChangeハンドラを受け取る
 *
 * Props:
 *   - initialMarkdown: 初期表示するMarkdownテキスト（省略可、デフォルト空文字）
 *   - onChange: Markdownテキストが変更されたときに呼ばれるコールバック
 */
const MarkdownEditor: React.FC<{
  initialMarkdown?: string
  onChange: (value: string) => void
}> = ({ initialMarkdown = "", onChange }) => {
  // markdown: 現在編集中のMarkdownテキスト
  const [markdown, setMarkdown] = useState(initialMarkdown)

  React.useEffect(() => {
    setMarkdown(initialMarkdown)
  }, [initialMarkdown])

  /**
   * テキストエリアの内容が変更されたときのハンドラ
   * - ローカルstateを更新し、親コンポーネントにも通知する
   * @param event テキストエリアのonChangeイベント
   */
  const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMarkdown(event.target.value)
    onChange(event.target.value)
  }

  // activeTab: 1=編集タブ, 0=プレビュタブ。デフォルトは編集タブ。
  const [activeTab, setActiveTab] = useState<1 | 0>(1)

  // --- UIレンダリング ---
  return (
    <div className="w-full">
      {/* タブ切り替えボタン（Edit/Preview） */}
      <div className="flex mb-4 bg-slate-800 rounded-t border border-slate-600">
        {/* 編集タブボタン */}
        <button
          type="button"
          onClick={() => setActiveTab(1)}
          className={`flex-1 px-4 py-2 font-medium ${
            activeTab === 1 
              ? "bg-blue-600 text-white" 
              : "text-slate-300 bg-slate-700"
          }`}
        >
          Edit
        </button>
        {/* プレビュタブボタン */}
        <button
          type="button"
          onClick={() => setActiveTab(0)}
          className={`flex-1 px-4 py-2 font-medium ${
            activeTab === 0 
              ? "bg-blue-600 text-white" 
              : "text-slate-300 bg-slate-700"
          }`}
        >
          Preview
        </button>
      </div>

      {/* 編集 or プレビュー */}
      <div className="border border-slate-600 rounded-b bg-slate-800">
        {activeTab === 1 ? (
          // --- 編集タブ ---
          <textarea
            value={markdown}
            onChange={handleChange}
            className="w-full h-96 p-4 bg-transparent text-white placeholder-slate-400 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
            placeholder="マークダウンで記事を書いてください..."
          />
        ) : (
          // --- プレビュタブ ---
          <div className={`p-4 text-white min-h-96 ${styles.markdownPreview}`}>
            {/*
              ReactMarkdown:
              - remarkGfm: GFM拡張（テーブル・チェックボックス等）を有効化
              - breaks: 改行を<br>に変換
              - children: 現在のmarkdownテキスト
            */}
            {markdown.trim() ? (
              <ReactMarkdown 
                remarkPlugins={[remarkGfm, breaks]}
              >
                {markdown}
              </ReactMarkdown>
            ) : (
              <div className="text-slate-400 italic text-center py-20">
                Editタブでマークダウンを入力してください
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default MarkdownEditor
