"use client"

import AddRoundedIcon from "@mui/icons-material/AddRounded"
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
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
    { label: "Total Public Todos", value: filteredTodos.length, color: "primary.main" },
    {
      label: "Completed",
      value: filteredTodos.filter((todo) => todo.is_completed).length,
      color: "success.main",
    },
    {
      label: "In Progress",
      value: filteredTodos.filter((todo) => !todo.is_completed).length,
      color: "warning.main",
    },
    { label: "Users", value: selectedUser ? 1 : uniqueUsers.length, color: "secondary.main" },
  ]

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h4" component="h1" gutterBottom>
          Public Todos
        </Typography>
        <Typography color="text.secondary">
          Browse goals and activities shared by other users.
        </Typography>
      </Box>

      <Alert severity="info">
        Public Todos are visible to everyone. Choose Private when creating personal tasks.
      </Alert>

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
        <Grid container spacing={2} aria-label="Public Todo statistics">
          {stats.map((stat) => (
            <Grid key={stat.label} size={{ xs: 12, sm: 6, lg: 3 }}>
              <Card sx={{ height: "100%", borderColor: stat.color }}>
                <CardContent>
                  <Typography variant="body2" color="text.secondary">
                    {stat.label}
                  </Typography>
                  <Typography
                    variant="h5"
                    component="p"
                    sx={{ color: stat.color, fontWeight: 700 }}
                  >
                    {stat.value}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
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
        <Paper sx={{ p: 5, textAlign: "center" }}>
          <Typography variant="h6" gutterBottom>
            {selectedUser ? "No public Todos found for this user" : "No public Todos available yet"}
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>
            {selectedUser
              ? "Choose a different user or clear the filter."
              : "Create a public Todo to share a goal with everyone."}
          </Typography>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
            sx={{ justifyContent: "center" }}
          >
            {selectedUser && (
              <Button variant="outlined" onClick={() => setSelectedUser("")}>
                Show all users
              </Button>
            )}
            <Button
              variant="contained"
              color="success"
              startIcon={<AddRoundedIcon />}
              onClick={() => router.push("/dashboard/todoList/register")}
            >
              Create New Todo
            </Button>
          </Stack>
        </Paper>
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
