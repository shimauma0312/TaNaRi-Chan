"use client"

import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded"
import EditRoundedIcon from "@mui/icons-material/EditRounded"
import {
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Grid,
  List,
  ListItem,
  Stack,
  Typography,
} from "@mui/material"
import { PublicTodo, Todo } from "@/types/todo"
import { formatTodoDate, isTodoDateNear, isTodoDateOverdue } from "@/utils/todoDate"
import { useState } from "react"

interface TodoListProps {
  todos: (Todo | PublicTodo)[]
  onToggleCompletion?: (todoId: number) => Promise<void>
  onEdit?: (todoId: number) => void
  onDelete?: (todoId: number) => Promise<void>
  showStats?: boolean
  allowEdit?: boolean
  showPublicBadge?: boolean
}

const statCards = [
  { key: "total", label: "Total", color: "primary.main" },
  { key: "completed", label: "Completed", color: "success.main" },
  { key: "pending", label: "Pending", color: "warning.main" },
  { key: "overdue", label: "Overdue", color: "error.main" },
  { key: "nearDeadline", label: "Due Soon", color: "secondary.main" },
] as const

/** A shared, accessible Todo list for private and public Todo screens. */
export default function TodoList({
  todos,
  onToggleCompletion,
  onEdit,
  onDelete,
  showStats = true,
  allowEdit = true,
  showPublicBadge = true,
}: TodoListProps) {
  const [deleteTarget, setDeleteTarget] = useState<Todo | PublicTodo | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const stats = {
    total: todos.length,
    completed: todos.filter((todo) => todo.is_completed).length,
    pending: todos.filter((todo) => !todo.is_completed).length,
    overdue: todos.filter((todo) => !todo.is_completed && isTodoDateOverdue(todo.todo_deadline))
      .length,
    nearDeadline: todos.filter(
      (todo) =>
        !todo.is_completed &&
        isTodoDateNear(todo.todo_deadline) &&
        !isTodoDateOverdue(todo.todo_deadline),
    ).length,
  }

  const confirmDelete = async () => {
    if (!deleteTarget || !onDelete) return

    try {
      setIsDeleting(true)
      await onDelete(deleteTarget.todo_id)
      setDeleteTarget(null)
    } catch (error) {
      console.error("Todo deletion failed:", error)
    } finally {
      setIsDeleting(false)
    }
  }

  const toggleCompletion = async (todoId: number) => {
    if (!onToggleCompletion) return
    try {
      await onToggleCompletion(todoId)
    } catch (error) {
      console.error("Todo completion update failed:", error)
    }
  }

  if (todos.length === 0) {
    return (
      <Box sx={{ py: 6, textAlign: "center" }}>
        <Typography variant="h6" color="text.secondary" gutterBottom>
          No Todos available
        </Typography>
        <Typography color="text.secondary">Create a new Todo to get started.</Typography>
      </Box>
    )
  }

  return (
    <Stack spacing={3}>
      {showStats && (
        <Grid container spacing={2} aria-label="Todo statistics">
          {statCards.map((stat) => (
            <Grid key={stat.key} size={{ xs: 6, md: "grow" }}>
              <Card sx={{ height: "100%", borderColor: stat.color }}>
                <CardContent sx={{ "&:last-child": { pb: 2 } }}>
                  <Typography variant="body2" color="text.secondary">
                    {stat.label}
                  </Typography>
                  <Typography
                    variant="h5"
                    component="p"
                    sx={{ color: stat.color, fontWeight: 700 }}
                  >
                    {stats[stat.key]}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <List disablePadding aria-label="Todo list">
        {todos.map((todo) => {
          const overdue = !todo.is_completed && isTodoDateOverdue(todo.todo_deadline)
          const dueSoon = !todo.is_completed && !overdue && isTodoDateNear(todo.todo_deadline)
          const accent = todo.is_completed
            ? "divider"
            : overdue
              ? "error.main"
              : dueSoon
                ? "warning.main"
                : "primary.main"

          return (
            <ListItem key={todo.todo_id} disableGutters sx={{ pb: 2 }}>
              <Card sx={{ width: "100%", borderLeft: 4, borderLeftColor: accent }}>
                <CardContent>
                  <Stack
                    direction={{ xs: "column", sm: "row" }}
                    spacing={2}
                    sx={{ alignItems: { sm: "flex-start" }, justifyContent: "space-between" }}
                  >
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      <Stack direction="row" spacing={1} sx={{ alignItems: "center", mb: 1 }}>
                        {onToggleCompletion && (
                          <Checkbox
                            aria-label={`${todo.title}を${todo.is_completed ? "未完了" : "完了"}にする`}
                            checked={todo.is_completed}
                            onChange={() => void toggleCompletion(todo.todo_id)}
                            color="success"
                            sx={{ p: 0.5 }}
                          />
                        )}
                        <Typography
                          variant="h6"
                          component="h2"
                          sx={{
                            overflowWrap: "anywhere",
                            textDecoration: todo.is_completed ? "line-through" : "none",
                            color: todo.is_completed ? "text.disabled" : "text.primary",
                          }}
                        >
                          {todo.title}
                        </Typography>
                        {showPublicBadge && todo.is_public && (
                          <Chip label="Public" color="info" size="small" variant="outlined" />
                        )}
                      </Stack>

                      <Typography
                        sx={{
                          mb: 1.5,
                          whiteSpace: "pre-wrap",
                          textDecoration: todo.is_completed ? "line-through" : "none",
                          color: todo.is_completed ? "text.disabled" : "text.secondary",
                        }}
                      >
                        {todo.description}
                      </Typography>

                      <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", rowGap: 1 }}>
                        <Chip
                          label={`Due: ${formatTodoDate(todo.todo_deadline)}${overdue ? " · Overdue" : dueSoon ? " · Due soon" : ""}`}
                          color={overdue ? "error" : dueSoon ? "warning" : "default"}
                          size="small"
                          variant="outlined"
                        />
                        <Chip
                          label={todo.is_completed ? "Completed" : "Pending"}
                          color={todo.is_completed ? "success" : "default"}
                          size="small"
                        />
                        {todo.createdAt && (
                          <Chip
                            label={`Created: ${new Date(todo.createdAt).toLocaleDateString("en-US")}`}
                            size="small"
                            variant="outlined"
                          />
                        )}
                        {"user" in todo && (
                          <Chip
                            label={`Author: ${(todo as PublicTodo).user.user_name}`}
                            color="info"
                            size="small"
                            variant="outlined"
                          />
                        )}
                      </Stack>
                    </Box>

                    {allowEdit && (onEdit || onDelete) && (
                      <Stack
                        direction="row"
                        spacing={1}
                        sx={{ alignSelf: { xs: "flex-end", sm: "center" } }}
                      >
                        {onEdit && (
                          <Button
                            size="small"
                            startIcon={<EditRoundedIcon />}
                            onClick={() => onEdit(todo.todo_id)}
                          >
                            Edit
                          </Button>
                        )}
                        {onDelete && (
                          <Button
                            size="small"
                            color="error"
                            startIcon={<DeleteOutlineRoundedIcon />}
                            onClick={() => setDeleteTarget(todo)}
                          >
                            Delete
                          </Button>
                        )}
                      </Stack>
                    )}
                  </Stack>
                </CardContent>
              </Card>
            </ListItem>
          )
        })}
      </List>

      <Dialog
        open={deleteTarget !== null}
        onClose={isDeleting ? undefined : () => setDeleteTarget(null)}
        aria-labelledby="delete-todo-title"
      >
        <DialogTitle id="delete-todo-title">Delete Todo?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {deleteTarget ? `“${deleteTarget.title}” will be permanently deleted.` : ""}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)} disabled={isDeleting}>
            Cancel
          </Button>
          <Button onClick={() => void confirmDelete()} color="error" disabled={isDeleting}>
            {isDeleting ? "Deleting..." : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  )
}
