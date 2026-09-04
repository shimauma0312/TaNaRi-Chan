"use client"

import type { MessageWithUsers } from "@/domain/message/Message"
import DeleteIcon from "@mui/icons-material/Delete"
import DoneIcon from "@mui/icons-material/Done"
import Box from "@mui/material/Box"
import Button from "@mui/material/Button"
import Card from "@mui/material/Card"
import CardActions from "@mui/material/CardActions"
import CardContent from "@mui/material/CardContent"
import Chip from "@mui/material/Chip"
import ListItem from "@mui/material/ListItem"
import Stack from "@mui/material/Stack"
import Typography from "@mui/material/Typography"

interface MessageItemProps {
  message: MessageWithUsers
  variant: "inbox" | "sent"
  onDelete: (messageId: number) => void
  onRead?: (messageId: number) => void
}

const MessageItem = ({ message, variant, onDelete, onRead }: MessageItemProps) => {
  const isUnread = variant === "inbox" && !message.is_read
  const counterpart = variant === "inbox" ? message.sender : message.receiver
  const counterpartLabel = variant === "inbox" ? "From" : "To"

  return (
    <ListItem disableGutters disablePadding>
      <Card
        sx={{
          borderColor: isUnread ? "primary.main" : "divider",
          bgcolor: isUnread ? "rgba(99, 102, 241, 0.1)" : "background.paper",
          width: "100%",
        }}
      >
        <CardContent>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
            sx={{ justifyContent: "space-between" }}
          >
            <Box sx={{ minWidth: 0 }}>
              <Stack direction="row" spacing={1} sx={{ alignItems: "center", mb: 0.5 }}>
                <Typography component="h2" variant="h6" sx={{ overflowWrap: "anywhere" }}>
                  {message.subject}
                </Typography>
                {isUnread && <Chip color="primary" label="未読" size="small" />}
              </Stack>
              <Typography color="text.secondary" sx={{ mb: 1 }} variant="body2">
                {counterpartLabel}: {counterpart.user_name}
              </Typography>
              <Typography
                color="text.secondary"
                variant="body2"
                sx={{
                  display: "-webkit-box",
                  overflow: "hidden",
                  overflowWrap: "anywhere",
                  WebkitBoxOrient: "vertical",
                  WebkitLineClamp: 2,
                }}
              >
                {message.body}
              </Typography>
              <Typography color="text.disabled" sx={{ mt: 1 }} variant="caption">
                {new Date(message.createdAt).toLocaleString("ja-JP")}
              </Typography>
            </Box>
          </Stack>
        </CardContent>
        <CardActions sx={{ justifyContent: "flex-end", flexWrap: "wrap" }}>
          {isUnread && onRead && (
            <Button
              size="small"
              startIcon={<DoneIcon />}
              onClick={() => onRead(message.message_id)}
            >
              既読にする
            </Button>
          )}
          <Button
            color="error"
            size="small"
            startIcon={<DeleteIcon />}
            onClick={() => onDelete(message.message_id)}
          >
            削除
          </Button>
        </CardActions>
      </Card>
    </ListItem>
  )
}

export default MessageItem
