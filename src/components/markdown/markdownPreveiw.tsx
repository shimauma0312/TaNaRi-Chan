"use client"

import React from "react"
import ReactMarkdown from "react-markdown"
import breaks from "remark-breaks"
import remarkGfm from "remark-gfm"
import styles from "@/styles/markdown.module.css"

interface MarkdownPreviewProps {
  markdown: string
}

const MarkdownPreview: React.FC<MarkdownPreviewProps> = ({ markdown }) => {
  return (
    <div className={styles.markdownPreview}>
      <ReactMarkdown remarkPlugins={[remarkGfm, breaks]}>{markdown}</ReactMarkdown>
    </div>
  )
}

export default MarkdownPreview
