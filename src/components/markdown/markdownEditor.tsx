
// Markdownエディタ用のCSSをインポート
import "easymde/dist/easymde.min.css"
import "github-markdown-css/github-markdown.css" 

import React, { useState } from "react"

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
   * - ローカルstateを更新し、親コンポーネントにも変更を通知
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
    <div className="p-4">
      {/* タブ切り替えボタン（Edit/Preview） */}
      <div className="flex mb-4">
        {/* 編集タブボタン */}
        <button
          type="button"
          onClick={() => setActiveTab(1)}
          className={`px-4 py-2 mr-2 ${activeTab === 1 ? "bg-blue-500 text-white" : "bg-gray-200"}`}
        >
          Edit
        </button>
        {/* プレビュタブボタン */}
        <button
          type="button"
          onClick={() => setActiveTab(0)}
          className={`px-4 py-2 ${activeTab === 0 ? "bg-blue-500 text-white" : "bg-gray-200"}`}
        >
          Preview
        </button>
      </div>

      {/* 編集 or プレビュー */}
      {activeTab === 1 ? (
        // --- 編集タブ ---
        // TODO: 将来的にreact-simplemde-editor等のリッチエディタに置き換え
        <textarea
          value={markdown}
          onChange={handleChange}
          className="w-full h-96 p-2 border bg-slate-800 rounded-md markdown-input"
          placeholder="Type here..."
        />
      ) : (
          // --- プレビュタブ ---
        <div className="markdown-body">
            {/*
            ReactMarkdown:
            - remarkGfm: GFM拡張（テーブル・チェックボックス等）を有効化
            - breaks: 改行を<br>に変換
            - children: 現在のmarkdownテキスト
          */}
          <ReactMarkdown remarkPlugins={[remarkGfm, breaks]}>
            {markdown}
          </ReactMarkdown>
        </div>
      )}
    </div>
  )
}

export default MarkdownEditor
