import "easymde/dist/easymde.min.css"
import "github-markdown-css/github-markdown.css"
import React, { useState } from "react"
import ReactMarkdown from "react-markdown"
import breaks from "remark-breaks"
import remarkGfm from "remark-gfm"

/**
 * MarkdownEditorコンポーネント
 *
 * @param {string} [initialMarkdown=""] - 初期表示するMarkdownテキスト。省略可能で、デフォルト値は空の文字列。
 */
const MarkdownEditor: React.FC<{
  initialMarkdown?: string
  onChange: (value: string) => void
}> = ({ initialMarkdown = "", onChange }) => {
  const [markdown, setMarkdown] = useState(initialMarkdown)
  const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMarkdown(event.target.value)
    onChange(event.target.value)
  }
  const [activeTab, setActiveTab] = useState<1 | 0>(1)

  return (
    <div className="p-4">
      <div className="flex mb-4">
        <button
          type="button"
          onClick={() => setActiveTab(1)}
          className={`px-4 py-2 mr-2 ${activeTab === 1 ? "bg-blue-500 text-white" : "bg-gray-200"}`}
        >
          Edit
        </button>
        <button
          type="button"
          onClick={() => setActiveTab(0)}
          className={`px-4 py-2 ${activeTab === 0 ? "bg-blue-500 text-white" : "bg-gray-200"}`}
        >
          Preview
        </button>
      </div>
      {activeTab === 1 ? (
        // TODO: Replace this textarea with react-simplemde-editor in the future
        <textarea
          value={markdown}
          onChange={handleChange}
          className="w-full h-96 p-2 border bg-slate-800 rounded-md markdown-input"
          placeholder="Type here..."
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
