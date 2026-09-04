"use client"

import MinLoader from "@/components/MinLoader"
import MessageForm from "@/components/messages/MessageForm"
import useAuth from "@/hooks/useAuth"
import { handleClientError } from "@/utils/errorHandler.client"
import SearchIcon from "@mui/icons-material/Search"
import Alert from "@mui/material/Alert"
import Container from "@mui/material/Container"
import InputAdornment from "@mui/material/InputAdornment"
import Paper from "@mui/material/Paper"
import Stack from "@mui/material/Stack"
import TextField from "@mui/material/TextField"
import Typography from "@mui/material/Typography"
import { useEffect, useState } from "react"

interface User {
  id: string
  user_name: string
}

const ComposeMessagePage = () => {
  const { user, loading } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [usersLoading, setUsersLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState("")

  useEffect(() => {
    if (!user) return

    const controller = new AbortController()
    setUsersLoading(true)
    setError(null)
    const fetchUsers = async () => {
      try {
        const response = await fetch(`/api/users?limit=50&q=${encodeURIComponent(query)}`, {
          signal: controller.signal,
        })
        const data = await response.json().catch(() => null)
        if (!response.ok || !Array.isArray(data)) {
          throw new Error(data?.error || "ユーザー一覧の取得に失敗しました")
        }
        if (!controller.signal.aborted) setUsers(data)
      } catch (error) {
        if (!controller.signal.aborted) {
          setError(handleClientError(error, "ユーザー一覧の取得に失敗しました"))
        }
      } finally {
        if (!controller.signal.aborted) setUsersLoading(false)
      }
    }

    const timer = setTimeout(fetchUsers, 250)
    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [query, user])

  if (loading || !user) return <MinLoader />

  return (
    <Container maxWidth="md">
      <Paper sx={{ p: { xs: 2, sm: 4 } }}>
        <Stack spacing={3}>
          <Typography component="h1" variant="h4">
            新規メッセージ
          </Typography>
          {error && <Alert severity="error">{error}</Alert>}
          <TextField
            id="recipient-search"
            type="search"
            label="送信先を検索"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="ユーザー名"
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              },
            }}
          />
          {usersLoading ? <MinLoader /> : <MessageForm users={users} />}
        </Stack>
      </Paper>
    </Container>
  )
}

export default ComposeMessagePage
