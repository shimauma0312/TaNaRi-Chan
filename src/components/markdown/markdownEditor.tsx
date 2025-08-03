
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
      <div className="flex mb-4 bg-slate-800/50 rounded-t-lg p-1 border border-slate-600">
        {/* 編集タブボタン */}
        <button
          type="button"
          onClick={() => setActiveTab(1)}
          className={`flex-1 px-6 py-3 rounded-md font-medium transition-all duration-200 ${
            activeTab === 1 
              ? "bg-blue-600 text-white shadow-lg transform scale-105" 
              : "text-slate-300 hover:text-white hover:bg-slate-700/50"
          }`}
        >
          Edit
        </button>
        {/* プレビュタブボタン */}
        <button
          type="button"
          onClick={() => setActiveTab(0)}
          className={`flex-1 px-6 py-3 rounded-md font-medium transition-all duration-200 ${
            activeTab === 0 
              ? "bg-purple-600 text-white shadow-lg transform scale-105" 
              : "text-slate-300 hover:text-white hover:bg-slate-700/50"
          }`}
        >
          Preview
        </button>
      </div>

      {/* 編集 or プレビュー */}
      <div className="border border-slate-600 rounded-b-lg bg-slate-800/30 backdrop-blur-sm overflow-hidden">
        {activeTab === 1 ? (
          // --- 編集タブ ---
          <div className="relative">
            <textarea
              value={markdown}
              onChange={handleChange}
              className="w-full h-96 p-6 bg-transparent text-white placeholder-slate-400 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-inset font-mono text-sm leading-relaxed"
              placeholder={`✨ Write your article in Markdown...

          # Heading 1
          ## Heading 2

          **Bold** *Italic* \`Code\`

          - List item 1
          - List item 2

          \`\`\`code
          Code block
          \`\`\`

          [Link](https://example.com)`}
            />
            <div className="absolute bottom-4 right-4 text-slate-500 text-xs">
              Markdown supported
            </div>
          </div>
        ) : (
          // --- プレビュタブ ---
          <div className={`p-6 bg-white/5 text-white min-h-96 max-w-none ${styles.markdownPreview}`}>
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
                Please enter Markdown in the Edit tab to see the preview.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default MarkdownEditor
