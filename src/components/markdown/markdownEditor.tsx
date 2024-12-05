import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

import React, { useState } from "react"

/**
 * MarkdownEditorコンポーネント
 *
 * @param {string} [initialMarkdown=""] - 初期表示するMarkdownテキスト。省略可能で、デフォルト値は空の文字列。
 */
const MarkdownEditor: React.FC<{ initialMarkdown?: string }> = ({
  initialMarkdown = "",
}) => {
  const [markdown, setMarkdown] = useState<string>(initialMarkdown)
  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit")

  return (
    <div className="p-4">
      <div className="flex mb-4">
        <button
          onClick={() => setActiveTab("edit")}
          className={`px-4 py-2 mr-2 ${activeTab === "edit" ? "bg-blue-500 text-white" : "bg-gray-200"}`}
        >
          Edit
        </button>
        <button
          onClick={() => setActiveTab("preview")}
          className={`px-4 py-2 ${activeTab === "preview" ? "bg-blue-500 text-white" : "bg-gray-200"}`}
        >
          Preview
        </button>
      </div>
    {activeTab === "edit" ? (
      <textarea
        value={markdown}
        onChange={(e) => setMarkdown(e.target.value)}
        className="w-full h-96 p-2 border bg-slate-800 rounded-md markdown-input"
      />
    ) : (
        <div className="w-full h-64 p-2 border rounded-md markdown-preview">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
        </div>
      )}
    </div>
  )
}

export default MarkdownEditor
