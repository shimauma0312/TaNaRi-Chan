"use client"

import MinLoader from "@/components/MinLoader"
import NextLink from "@/components/NextLink"
import ShakeImage from "@/components/ShakeImage"
import useAuth from "@/hooks/useAuth"
import { formatTodoDate } from "@/utils/todoDate"
import { Alert, Box, Divider, Link, List, ListItem, Paper, Stack, Typography } from "@mui/material"
import { useEffect, useState } from "react"

type DashboardArticle = {
  post_id: number
  title: string
  content: string
  createdAt: string
  author: { user_name: string }
}

type DashboardTodo = {
  todo_id: number
  title: string
  description: string
  todo_deadline: string
}

type DashboardPublicTodo = DashboardTodo & {
  user: { id: string; user_name: string }
}

type DashboardData = {
  articles: DashboardArticle[]
  activeTodos: DashboardTodo[]
  publicTodos: DashboardPublicTodo[]
}

const DashboardPage = () => {
  const { user, loading } = useAuth()
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [dataLoading, setDataLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return

    const controller = new AbortController()
    const fetchDashboard = async () => {
      try {
        const response = await fetch("/api/dashboard", { signal: controller.signal })
        const data = await response.json().catch(() => null)
        if (!response.ok) throw new Error(data?.error || "Failed to load the dashboard")
        setDashboardData(data)
      } catch (fetchError) {
        if (controller.signal.aborted) return
        console.error("Failed to fetch dashboard data:", fetchError)
        setError(fetchError instanceof Error ? fetchError.message : "Failed to load the dashboard")
      } finally {
        if (!controller.signal.aborted) setDataLoading(false)
      }
    }

    fetchDashboard()
    return () => controller.abort()
  }, [user])

  if (loading || !user || dataLoading) return <MinLoader />

  return (
    <Stack spacing={4}>
      <Box>
        <Typography variant="h4" component="h1">
          Dashboard
        </Typography>
        <Typography sx={{ mt: 1 }}>Welcome, {user.user_email}</Typography>
        <Typography color="text.secondary" variant="body2">
          Today&apos;s date: {new Date().toLocaleDateString()}
        </Typography>
      </Box>

      <Divider />
      {error && <Alert severity="error">{error}</Alert>}

      <Box
        sx={{
          display: "grid",
          gap: 2,
          gridTemplateColumns: { xs: "1fr", lg: "repeat(3, minmax(0, 1fr))" },
        }}
      >
        <Paper component="section" variant="outlined" sx={{ p: 2 }}>
          <Typography variant="h6" component="h2">
            Random timeline articles
          </Typography>
          {!dashboardData?.articles.length ? (
            <Typography color="text.secondary" sx={{ mt: 2 }}>
              No articles yet.
            </Typography>
          ) : (
            <List disablePadding sx={{ mt: 1 }}>
              {dashboardData.articles.map((article) => (
                <ListItem key={article.post_id} divider disableGutters>
                  <Box sx={{ py: 1, width: "100%" }}>
                    <Link
                      component={NextLink}
                      href={`/dashboard/articles/view?post_id=${article.post_id}`}
                    >
                      {article.title}
                    </Link>
                    <Typography variant="body2" color="text.secondary">
                      {article.content.replace(/[#*`[\]]/g, "").slice(0, 100)}
                      {article.content.length > 100 ? "..." : ""}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      by {article.author.user_name},{" "}
                      {new Date(article.createdAt).toLocaleDateString()}
                    </Typography>
                  </Box>
                </ListItem>
              ))}
            </List>
          )}
        </Paper>

        <Paper component="section" variant="outlined" sx={{ p: 2 }}>
          <Typography variant="h6" component="h2">
            Your active todos
          </Typography>
          {!dashboardData?.activeTodos.length ? (
            <Typography color="text.secondary" sx={{ mt: 2 }}>
              No active todos.
            </Typography>
          ) : (
            <List disablePadding sx={{ mt: 1 }}>
              {dashboardData.activeTodos.map((todo) => (
                <ListItem key={todo.todo_id} divider disableGutters>
                  <Box sx={{ py: 1 }}>
                    <Typography>{todo.title}</Typography>
                    <Typography variant="body2">{todo.description}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Due {formatTodoDate(todo.todo_deadline)}
                    </Typography>
                  </Box>
                </ListItem>
              ))}
            </List>
          )}
        </Paper>

        <Paper component="section" variant="outlined" sx={{ p: 2 }}>
          <Typography variant="h6" component="h2">
            Public todos
          </Typography>
          {!dashboardData?.publicTodos.length ? (
            <Typography color="text.secondary" sx={{ mt: 2 }}>
              No public todos.
            </Typography>
          ) : (
            <List disablePadding sx={{ mt: 1 }}>
              {dashboardData.publicTodos.map((todo) => (
                <ListItem key={todo.todo_id} divider disableGutters>
                  <Box sx={{ py: 1, width: "100%" }}>
                    <Typography>{todo.title}</Typography>
                    <Typography variant="body2">{todo.description}</Typography>
                    <Typography variant="caption" color="text.secondary" component="p">
                      by {todo.user.user_name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Due {formatTodoDate(todo.todo_deadline)}
                    </Typography>
                  </Box>
                </ListItem>
              ))}
            </List>
          )}
        </Paper>
      </Box>

      <ShakeImage />
    </Stack>
  )
}

export default DashboardPage
