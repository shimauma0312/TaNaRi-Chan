"use client"

import {
  Alert,
  Box,
  Button,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Typography,
} from "@mui/material"
import MinLoader from "@/components/MinLoader"
import TodoList from "@/components/TodoList"
import useAuth from "@/hooks/useAuth"
import { usePublicTodos } from "@/hooks/usePublicTodos"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"

interface PublicUser {
  id: string
  user_name: string
}

export default function OtherTodosPage() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const { todos, isLoading, error, fetchPublicTodos, clearError, hasMore } = usePublicTodos()
  const [selectedUser, setSelectedUser] = useState("")

  useEffect(() => {
    if (user) void fetchPublicTodos()
  }, [user, fetchPublicTodos])

  const uniqueUsers = useMemo(() => {
    const userMap = new Map<string, PublicUser>()
    todos.forEach((todo) => {
      if (todo.user.id !== user?.id && !userMap.has(todo.user.id)) {
        userMap.set(todo.user.id, { id: todo.user.id, user_name: todo.user.user_name })
      }
    })
    return Array.from(userMap.values())
  }, [todos, user?.id])

  const filteredTodos = useMemo(
    () =>
      todos.filter(
        (todo) => todo.user.id !== user?.id && (!selectedUser || todo.user.id === selectedUser),
      ),
    [todos, selectedUser, user?.id],
  )

  if (loading || !user) return <MinLoader />

  const stats = [
    { label: "Total", value: filteredTodos.length },
    {
      label: "Completed",
      value: filteredTodos.filter((todo) => todo.is_completed).length,
    },
    {
      label: "In Progress",
      value: filteredTodos.filter((todo) => !todo.is_completed).length,
    },
    { label: "Users", value: selectedUser ? 1 : uniqueUsers.length },
  ]

  return (
    <Stack spacing={3}>
      <Typography variant="h4" component="h1">
        Public Todos
      </Typography>

      <FormControl sx={{ width: { xs: "100%", sm: 320 } }}>
        <InputLabel id="public-todo-user-label">Filter by user</InputLabel>
        <Select
          labelId="public-todo-user-label"
          label="Filter by user"
          value={selectedUser}
          onChange={(event) => setSelectedUser(event.target.value)}
        >
          <MenuItem value="">All users</MenuItem>
          {uniqueUsers.map((publicUser) => (
            <MenuItem key={publicUser.id} value={publicUser.id}>
              {publicUser.user_name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {filteredTodos.length > 0 && (
        <Box
          component="dl"
          aria-label="Public Todo statistics"
          sx={{
            m: 0,
            py: 1.5,
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(112px, 1fr))",
            gap: 2,
            borderTop: 1,
            borderBottom: 1,
            borderColor: "divider",
          }}
        >
          {stats.map((stat) => (
            <Box key={stat.label}>
              <Typography component="dt" variant="caption" color="text.secondary">
                {stat.label}
              </Typography>
              <Typography component="dd" sx={{ m: 0, fontWeight: 600 }}>
                {stat.value}
              </Typography>
            </Box>
          ))}
        </Box>
      )}

      {error && (
        <Alert severity="error" onClose={clearError}>
          {error}
        </Alert>
      )}

      {isLoading && filteredTodos.length === 0 ? (
        <Box role="status" aria-label="Loading public Todos" sx={{ py: 8, textAlign: "center" }}>
          <CircularProgress />
        </Box>
      ) : filteredTodos.length > 0 ? (
        <TodoList
          todos={filteredTodos}
          showStats={false}
          allowEdit={false}
          showPublicBadge={false}
        />
      ) : !error ? (
        <Box sx={{ py: 6, textAlign: "center" }}>
          <Typography variant="h6" gutterBottom>
            {selectedUser ? "No public Todos found for this user" : "No public Todos available yet"}
          </Typography>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
            sx={{ justifyContent: "center", mt: 3 }}
          >
            {selectedUser && (
              <Button variant="outlined" onClick={() => setSelectedUser("")}>
                Show all users
              </Button>
            )}
            <Button variant="contained" onClick={() => router.push("/dashboard/todoList/register")}>
              Create New Todo
            </Button>
          </Stack>
        </Box>
      ) : null}

      {hasMore && (
        <Box sx={{ textAlign: "center" }}>
          <Button
            variant="outlined"
            onClick={() => void fetchPublicTodos(true)}
            disabled={isLoading}
          >
            {isLoading ? "Loading..." : "Load more"}
          </Button>
        </Box>
      )}
    </Stack>
  )
}
