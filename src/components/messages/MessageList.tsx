"use client"

import type { MessageWithUsers } from "@/domain/message/Message"
import List from "@mui/material/List"
import Typography from "@mui/material/Typography"
import MessageItem from "./MessageItem"

interface MessageListProps {
  messages: MessageWithUsers[]
  variant: "inbox" | "sent"
  onDelete: (messageId: number) => void
  onRead?: (messageId: number) => void
}

const MessageList = ({ messages, variant, onDelete, onRead }: MessageListProps) => {
  if (messages.length === 0) {
    return (
      <Typography color="text.secondary">
        {variant === "inbox" ? "受信メッセージはありません" : "送信メッセージはありません"}
      </Typography>
    )
  }

  return (
    <List disablePadding sx={{ display: "grid", gap: 2 }}>
      {messages.map((message) => (
        <MessageItem
          key={message.message_id}
          message={message}
          variant={variant}
          onDelete={onDelete}
          onRead={onRead}
        />
      ))}
    </List>
  )
}

export default MessageList
