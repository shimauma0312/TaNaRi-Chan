import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

import React, { useState } from "react"

const MarkdownEditor: React.FC = () => {
    const [markdown, setMarkdown] = useState<string>("")
    const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit")

    return (
        <div>
            <div className="tabs">
                <button onClick={() => setActiveTab("edit")}>Edit</button>
                <button onClick={() => setActiveTab("preview")}>Preview</button>
            </div>
            {activeTab === "edit" ? (
                <textarea
                    value={markdown}
                    onChange={(e) => setMarkdown(e.target.value)}
                    className="markdown-input"
                />
            ) : (
                <div className="markdown-preview">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
                </div>
            )}
        </div>
    )
}

export default MarkdownEditor
