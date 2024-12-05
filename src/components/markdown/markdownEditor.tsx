import "easymde/dist/easymde.min.css"
import "github-markdown-css/github-markdown.css"
import React, { useState } from "react"
import ReactMarkdown from "react-markdown"
import SimpleMDE from "react-simplemde-editor"
import breaks from "remark-breaks"
import remarkGfm from "remark-gfm"

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
    <div className="p-4 overflow-auto">
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
        <SimpleMDE
          value={markdown}
          onChange={setMarkdown}
          options={{
            spellChecker: false,
            placeholder: "Type here...",
          }}
        />
      ) : (
        <div className="markdown-body">
          <ReactMarkdown remarkPlugins={[remarkGfm, breaks]}>
            {markdown}
          </ReactMarkdown>
        </div>
      )}
    </div>
  )
}

export default MarkdownEditor
