"use client"

import type { MessageWithUsers } from "@/domain/message/Message"
import Box from "@mui/material/Box"
import Button from "@mui/material/Button"
import ListItem from "@mui/material/ListItem"
import Stack from "@mui/material/Stack"
import Typography from "@mui/material/Typography"

interface MessageItemProps {
  message: MessageWithUsers
  variant: "inbox" | "sent"
  divider?: boolean
  onDelete: (messageId: number) => void
  onRead?: (messageId: number) => void
}

const MessageItem = ({ message, variant, divider = false, onDelete, onRead }: MessageItemProps) => {
  const isUnread = variant === "inbox" && !message.is_read
  const counterpart = variant === "inbox" ? message.sender : message.receiver
  const counterpartLabel = variant === "inbox" ? "From" : "To"

  return (
    <ListItem
      disableGutters
      divider={divider}
      sx={{ alignItems: { xs: "flex-start", sm: "center" }, flexDirection: { xs: "column", sm: "row" }, gap: 2, py: 2 }}
    >
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Stack direction="row" spacing={1} sx={{ alignItems: "baseline", mb: 0.5 }}>
          <Typography
            component="h2"
            variant="h6"
            sx={{ fontWeight: isUnread ? 700 : 400, overflowWrap: "anywhere" }}
          >
            {message.subject}
          </Typography>
          {isUnread && <Typography variant="caption">未読</Typography>}
        </Stack>
        <Typography color="text.secondary" sx={{ mb: 1 }} variant="body2">
          {counterpartLabel}: {counterpart.user_name}
        </Typography>
        <Typography
          color="text.secondary"
          variant="body2"
          sx={{ display: "-webkit-box", overflow: "hidden", overflowWrap: "anywhere", WebkitBoxOrient: "vertical", WebkitLineClamp: 2 }}
        >
          {message.body}
        </Typography>
        <Typography color="text.disabled" sx={{ mt: 1 }} variant="caption">
          {new Date(message.createdAt).toLocaleString("ja-JP")}
        </Typography>
      </Box>
      <Stack direction="row" spacing={1}>
        {isUnread && onRead && (
          <Button size="small" onClick={() => onRead(message.message_id)}>既読にする</Button>
        )}
        <Button color="error" size="small" onClick={() => onDelete(message.message_id)}>削除</Button>
      </Stack>
    </ListItem>
  )
}

export default MessageItem
