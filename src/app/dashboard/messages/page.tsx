"use client"

import MinLoader from "@/components/MinLoader"
import MessageList from "@/components/messages/MessageList"
import type { MessageWithUsers } from "@/domain/message/Message"
import useAuth from "@/hooks/useAuth"
import { handleClientError } from "@/utils/errorHandler.client"
import AddIcon from "@mui/icons-material/Add"
import Alert from "@mui/material/Alert"
import Badge from "@mui/material/Badge"
import Box from "@mui/material/Box"
import Button from "@mui/material/Button"
import Container from "@mui/material/Container"
import Dialog from "@mui/material/Dialog"
import DialogActions from "@mui/material/DialogActions"
import DialogContent from "@mui/material/DialogContent"
import DialogContentText from "@mui/material/DialogContentText"
import DialogTitle from "@mui/material/DialogTitle"
import Snackbar from "@mui/material/Snackbar"
import Stack from "@mui/material/Stack"
import Tab from "@mui/material/Tab"
import Tabs from "@mui/material/Tabs"
import Typography from "@mui/material/Typography"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useState } from "react"

type MessageTab = "inbox" | "sent"

const tabA11yProps = (tab: MessageTab) => ({
  "aria-controls": `message-${tab}-panel`,
  id: `message-${tab}-tab`,
})

const MessagesPage = () => {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<MessageTab>("inbox")
  const [inboxMessages, setInboxMessages] = useState<MessageWithUsers[]>([])
  const [sentMessages, setSentMessages] = useState<MessageWithUsers[]>([])
  const [dataLoading, setDataLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [inboxCursor, setInboxCursor] = useState<string | null>(null)
  const [sentCursor, setSentCursor] = useState<string | null>(null)
  const [messageToDelete, setMessageToDelete] = useState<number | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [notice, setNotice] = useState<{ message: string; severity: "error" | "success" } | null>(
    null,
  )

  const fetchMessages = useCallback(async () => {
    setDataLoading(true)
    setError(null)
    try {
      const [inboxRes, sentRes] = await Promise.all([
        fetch("/api/messages?limit=20"),
        fetch("/api/messages/sent?limit=20"),
      ])
      if (!inboxRes.ok || !sentRes.ok) throw new Error("メッセージの取得に失敗しました")

      const [inboxData, sentData] = await Promise.all([inboxRes.json(), sentRes.json()])
      if (!Array.isArray(inboxData) || !Array.isArray(sentData)) {
        throw new Error("メッセージ一覧の応答形式が不正です")
      }

      setInboxMessages(inboxData)
      setSentMessages(sentData)
      setInboxCursor(inboxRes.headers.get("X-Next-Cursor"))
      setSentCursor(sentRes.headers.get("X-Next-Cursor"))
    } catch (error) {
      setError(handleClientError(error, "メッセージの取得に失敗しました"))
    } finally {
      setDataLoading(false)
    }
  }, [])

  useEffect(() => {
    if (user) void fetchMessages()
  }, [user, fetchMessages])

  const loadMore = async (tab: MessageTab) => {
    const cursor = tab === "inbox" ? inboxCursor : sentCursor
    if (!cursor || dataLoading) return

    setDataLoading(true)
    setError(null)
    try {
      const path = tab === "inbox" ? "/api/messages" : "/api/messages/sent"
      const response = await fetch(`${path}?limit=20&cursor=${cursor}`)
      const data = await response.json().catch(() => null)
      if (!response.ok || !Array.isArray(data)) {
        throw new Error(data?.error || "メッセージの取得に失敗しました")
      }
      if (tab === "inbox") {
        setInboxMessages((previous) => [...previous, ...data])
        setInboxCursor(response.headers.get("X-Next-Cursor"))
      } else {
        setSentMessages((previous) => [...previous, ...data])
        setSentCursor(response.headers.get("X-Next-Cursor"))
      }
    } catch (error) {
      setError(handleClientError(error, "メッセージの取得に失敗しました"))
    } finally {
      setDataLoading(false)
    }
  }

  const handleDelete = async () => {
    if (messageToDelete === null || deleting) return

    setDeleting(true)
    try {
      const response = await fetch(`/api/messages/${messageToDelete}`, { method: "DELETE" })
      if (!response.ok) {
        const data = await response.json().catch(() => null)
        throw new Error(data?.error || "削除に失敗しました")
      }

      setInboxMessages((previous) =>
        previous.filter((message) => message.message_id !== messageToDelete),
      )
      setSentMessages((previous) =>
        previous.filter((message) => message.message_id !== messageToDelete),
      )
      setMessageToDelete(null)
      setNotice({ message: "メッセージを削除しました", severity: "success" })
    } catch (error) {
      setNotice({ message: handleClientError(error, "削除に失敗しました"), severity: "error" })
    } finally {
      setDeleting(false)
    }
  }

  const handleRead = async (messageId: number) => {
    try {
      const response = await fetch(`/api/messages/${messageId}/read`, { method: "PATCH" })
      if (!response.ok) {
        const data = await response.json().catch(() => null)
        throw new Error(data?.error || "既読化に失敗しました")
      }
      setInboxMessages((previous) =>
        previous.map((message) =>
          message.message_id === messageId ? { ...message, is_read: true } : message,
        ),
      )
    } catch (error) {
      setNotice({ message: handleClientError(error, "既読化に失敗しました"), severity: "error" })
    }
  }

  if (loading || !user) return <MinLoader />

  const unreadCount = inboxMessages.filter((message) => !message.is_read).length
  const cursor = activeTab === "inbox" ? inboxCursor : sentCursor

  return (
    <Container maxWidth="lg">
      <Stack spacing={3}>
        <Box
          sx={{
            alignItems: { sm: "center" },
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            gap: 2,
            justifyContent: "space-between",
          }}
        >
          <Typography component="h1" variant="h4">
            メッセージ
          </Typography>
          <Button
            startIcon={<AddIcon />}
            variant="contained"
            onClick={() => router.push("/dashboard/messages/compose")}
          >
            新規メッセージ
          </Button>
        </Box>

        {error && <Alert severity="error">{error}</Alert>}

        <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
          <Tabs
            aria-label="メッセージボックス"
            value={activeTab}
            onChange={(_event, value: MessageTab) => setActiveTab(value)}
          >
            <Tab
              {...tabA11yProps("inbox")}
              value="inbox"
              label={
                <Badge badgeContent={unreadCount} color="primary" max={99}>
                  受信トレイ
                </Badge>
              }
            />
            <Tab {...tabA11yProps("sent")} value="sent" label="送信トレイ" />
          </Tabs>
        </Box>

        {dataLoading && inboxMessages.length === 0 && sentMessages.length === 0 ? (
          <MinLoader />
        ) : (
          <>
            <Box
              aria-labelledby="message-inbox-tab"
              hidden={activeTab !== "inbox"}
              id="message-inbox-panel"
              role="tabpanel"
            >
              {activeTab === "inbox" && (
                <MessageList
                  messages={inboxMessages}
                  variant="inbox"
                  onDelete={setMessageToDelete}
                  onRead={handleRead}
                />
              )}
            </Box>
            <Box
              aria-labelledby="message-sent-tab"
              hidden={activeTab !== "sent"}
              id="message-sent-panel"
              role="tabpanel"
            >
              {activeTab === "sent" && (
                <MessageList messages={sentMessages} variant="sent" onDelete={setMessageToDelete} />
              )}
            </Box>
            {cursor && (
              <Box sx={{ textAlign: "center" }}>
                <Button
                  disabled={dataLoading}
                  variant="outlined"
                  onClick={() => void loadMore(activeTab)}
                >
                  {dataLoading ? "読み込み中..." : "さらに読み込む"}
                </Button>
              </Box>
            )}
          </>
        )}
      </Stack>

      <Dialog open={messageToDelete !== null} onClose={() => !deleting && setMessageToDelete(null)}>
        <DialogTitle>メッセージを削除しますか？</DialogTitle>
        <DialogContent>
          <DialogContentText>この操作は取り消せません。</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button disabled={deleting} onClick={() => setMessageToDelete(null)}>
            キャンセル
          </Button>
          <Button
            color="error"
            disabled={deleting}
            variant="contained"
            onClick={() => void handleDelete()}
          >
            {deleting ? "削除中..." : "削除"}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={notice !== null} autoHideDuration={5000} onClose={() => setNotice(null)}>
        <Alert severity={notice?.severity ?? "error"} onClose={() => setNotice(null)}>
          {notice?.message}
        </Alert>
      </Snackbar>
    </Container>
  )
}

export default MessagesPage
