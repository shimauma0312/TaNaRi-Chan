"use client"

import NextLink from "@/components/NextLink"
import MinLoader from "@/components/MinLoader"
import ShakeImage from "@/components/ShakeImage"
import useAuth from "@/hooks/useAuth"
import { formatTodoDate } from "@/utils/todoDate"
import {
  Alert,
  Box,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  Grid,
  List,
  ListItem,
  Stack,
  Typography,
} from "@mui/material"
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
    <Stack spacing={3}>
      <Box>
        <Typography variant="h4" component="h1" gutterBottom>
          Dashboard
        </Typography>
        <Typography variant="h6">Welcome, {user.user_email}</Typography>
        <Typography color="text.secondary">
          Today&apos;s date: {new Date().toLocaleDateString()}
        </Typography>
      </Box>

      <ShakeImage />
      {error && <Alert severity="error">{error}</Alert>}

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: 4 }}>
          <Card sx={{ height: "100%" }}>
            <CardContent>
              <Typography variant="h6" component="h2" gutterBottom>
                Random timeline articles
              </Typography>
              {!dashboardData?.articles.length ? (
                <Typography color="text.secondary">No articles yet.</Typography>
              ) : (
                <List disablePadding>
                  {dashboardData.articles.map((article) => (
                    <ListItem key={article.post_id} disableGutters>
                      <CardActionArea
                        component={NextLink}
                        href={`/dashboard/articles/view?post_id=${article.post_id}`}
                        sx={{ borderRadius: 1, p: 1.5 }}
                      >
                        <Typography sx={{ fontWeight: 700 }}>{article.title}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {article.content.replace(/[#*`[\]]/g, "").slice(0, 100)}
                          {article.content.length > 100 ? "..." : ""}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          by {article.author.user_name} ·{" "}
                          {new Date(article.createdAt).toLocaleDateString()}
                        </Typography>
                      </CardActionArea>
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, lg: 4 }}>
          <Card sx={{ height: "100%" }}>
            <CardContent>
              <Typography variant="h6" component="h2" gutterBottom>
                Your active todos
              </Typography>
              {!dashboardData?.activeTodos.length ? (
                <Typography color="text.secondary">No active todos.</Typography>
              ) : (
                <List disablePadding>
                  {dashboardData.activeTodos.map((todo) => (
                    <ListItem key={todo.todo_id} divider disableGutters>
                      <Box sx={{ py: 1 }}>
                        <Typography sx={{ fontWeight: 700 }}>{todo.title}</Typography>
                        <Typography variant="body2">{todo.description}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          Due {formatTodoDate(todo.todo_deadline)}
                        </Typography>
                      </Box>
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, lg: 4 }}>
          <Card sx={{ height: "100%" }}>
            <CardContent>
              <Typography variant="h6" component="h2" gutterBottom>
                Public todos
              </Typography>
              {!dashboardData?.publicTodos.length ? (
                <Typography color="text.secondary">No public todos.</Typography>
              ) : (
                <List disablePadding>
                  {dashboardData.publicTodos.map((todo) => (
                    <ListItem key={todo.todo_id} divider disableGutters>
                      <Box sx={{ py: 1, width: "100%" }}>
                        <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                          <Typography sx={{ fontWeight: 700 }}>{todo.title}</Typography>
                          <Chip label={todo.user.user_name} size="small" />
                        </Stack>
                        <Typography variant="body2">{todo.description}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          Due {formatTodoDate(todo.todo_deadline)}
                        </Typography>
                      </Box>
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Stack>
  )
}

export default DashboardPage
