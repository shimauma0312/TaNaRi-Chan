"use client"

import { handleClientError } from "@/utils/errorHandler.client"
import SendIcon from "@mui/icons-material/Send"
import Alert from "@mui/material/Alert"
import Button from "@mui/material/Button"
import CircularProgress from "@mui/material/CircularProgress"
import FormControl from "@mui/material/FormControl"
import InputLabel from "@mui/material/InputLabel"
import MenuItem from "@mui/material/MenuItem"
import Select from "@mui/material/Select"
import Stack from "@mui/material/Stack"
import TextField from "@mui/material/TextField"
import { useRouter } from "next/navigation"
import { useEffect, useState, type FormEvent } from "react"

interface User {
  id: string
  user_name: string
}

interface MessageFormProps {
  users: User[]
}

const MessageForm = ({ users }: MessageFormProps) => {
  const [subject, setSubject] = useState("")
  const [body, setBody] = useState("")
  const [receiverId, setReceiverId] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const router = useRouter()

  useEffect(() => {
    if (receiverId && !users.some((user) => user.id === receiverId)) {
      setReceiverId("")
    }
  }, [receiverId, users])

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (submitting) return

    setError(null)
    setSubmitting(true)

    try {
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, body, receiver_id: receiverId }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => null)
        throw new Error(data?.error || "メッセージの送信に失敗しました")
      }

      router.push("/dashboard/messages")
    } catch (error) {
      setError(handleClientError(error, "メッセージの送信に失敗しました"))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Stack component="form" spacing={3} onSubmit={handleSubmit} noValidate>
      {error && <Alert severity="error">{error}</Alert>}

      <FormControl required disabled={submitting}>
        <InputLabel id="message-receiver-label">送信先</InputLabel>
        <Select
          id="message-receiver"
          label="送信先"
          labelId="message-receiver-label"
          value={receiverId}
          onChange={(event) => setReceiverId(event.target.value)}
        >
          <MenuItem value="">
            <em>送信先を選択してください</em>
          </MenuItem>
          {users.map((user) => (
            <MenuItem key={user.id} value={user.id}>
              {user.user_name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <TextField
        id="message-subject"
        label="件名"
        value={subject}
        onChange={(event) => setSubject(event.target.value)}
        required
        disabled={submitting}
        placeholder="件名を入力してください"
        slotProps={{ htmlInput: { maxLength: 200 } }}
      />

      <TextField
        id="message-body"
        label="本文"
        value={body}
        onChange={(event) => setBody(event.target.value)}
        required
        disabled={submitting}
        multiline
        minRows={8}
        placeholder="本文を入力してください"
        slotProps={{ htmlInput: { maxLength: 10000 } }}
      />

      <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
        <Button
          type="submit"
          variant="contained"
          disabled={submitting || !receiverId || !subject.trim() || !body.trim()}
          startIcon={submitting ? <CircularProgress color="inherit" size={18} /> : <SendIcon />}
        >
          {submitting ? "送信中..." : "送信"}
        </Button>
        <Button
          type="button"
          variant="outlined"
          disabled={submitting}
          onClick={() => router.push("/dashboard/messages")}
        >
          キャンセル
        </Button>
      </Stack>
    </Stack>
  )
}

export default MessageForm
