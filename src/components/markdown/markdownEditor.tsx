"use client"

import MarkdownPreview from "@/components/markdown/markdownPreveiw"
import Box from "@mui/material/Box"
import Paper from "@mui/material/Paper"
import Tab from "@mui/material/Tab"
import Tabs from "@mui/material/Tabs"
import TextField from "@mui/material/TextField"
import Typography from "@mui/material/Typography"
import { useEffect, useState } from "react"

interface MarkdownEditorProps {
  disabled?: boolean
  id?: string
  initialMarkdown?: string
  labelledBy?: string
  onChange: (value: string) => void
  required?: boolean
}

type EditorTab = "edit" | "preview"

const MarkdownEditor = ({
  disabled = false,
  id = "article-content",
  initialMarkdown = "",
  labelledBy,
  onChange,
  required = false,
}: MarkdownEditorProps) => {
  const [markdown, setMarkdown] = useState(initialMarkdown)
  const [activeTab, setActiveTab] = useState<EditorTab>("edit")

  useEffect(() => {
    setMarkdown(initialMarkdown)
  }, [initialMarkdown])

  const editTabId = `${id}-edit-tab`
  const previewTabId = `${id}-preview-tab`
  const editPanelId = `${id}-edit-panel`
  const previewPanelId = `${id}-preview-panel`

  return (
    <Paper variant="outlined" sx={{ overflow: "hidden", width: "100%" }}>
      <Tabs
        aria-label="記事本文の編集モード"
        onChange={(_event, value: EditorTab) => setActiveTab(value)}
        value={activeTab}
        variant="fullWidth"
      >
        <Tab
          aria-controls={editPanelId}
          disabled={disabled}
          id={editTabId}
          label="Edit"
          value="edit"
        />
        <Tab
          aria-controls={previewPanelId}
          disabled={disabled}
          id={previewTabId}
          label="Preview"
          value="preview"
        />
      </Tabs>

      <Box
        aria-labelledby={editTabId}
        hidden={activeTab !== "edit"}
        id={editPanelId}
        role="tabpanel"
        sx={{ p: 2 }}
      >
        {activeTab === "edit" && (
          <TextField
            id={id}
            disabled={disabled}
            multiline
            minRows={16}
            required={required}
            value={markdown}
            onChange={(event) => {
              setMarkdown(event.target.value)
              onChange(event.target.value)
            }}
            placeholder="マークダウンで記事を書いてください..."
            slotProps={{
              htmlInput: {
                "aria-labelledby": labelledBy,
                "aria-required": required,
              },
            }}
            sx={{
              "& textarea": {
                fontFamily: "var(--font-geist-mono), monospace",
                fontSize: "0.875rem",
              },
            }}
          />
        )}
      </Box>

      <Box
        aria-labelledby={previewTabId}
        hidden={activeTab !== "preview"}
        id={previewPanelId}
        role="tabpanel"
        sx={{ minHeight: 420, p: 3 }}
      >
        {activeTab === "preview" &&
          (markdown.trim() ? (
            <MarkdownPreview markdown={markdown} />
          ) : (
            <Typography align="center" color="text.secondary" sx={{ fontStyle: "italic", py: 10 }}>
              Editタブでマークダウンを入力してください
            </Typography>
          ))}
      </Box>
    </Paper>
  )
}

export default MarkdownEditor
