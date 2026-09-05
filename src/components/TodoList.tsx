"use client"

import {
  Alert,
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  List,
  ListItem,
  Stack,
  Typography,
} from "@mui/material"
import { PublicTodo, Todo } from "@/types/todo"
import { formatTodoDate, isTodoDateNear, isTodoDateOverdue } from "@/utils/todoDate"
import { Fragment, useState } from "react"

interface TodoListProps {
  todos: (Todo | PublicTodo)[]
  onToggleCompletion?: (todoId: number) => Promise<void>
  onEdit?: (todoId: number) => void
  onDelete?: (todoId: number) => Promise<void>
  showStats?: boolean
  allowEdit?: boolean
  showPublicBadge?: boolean
}

const statItems = [
  { key: "total", label: "Total" },
  { key: "completed", label: "Completed" },
  { key: "pending", label: "Pending" },
  { key: "overdue", label: "Overdue" },
  { key: "nearDeadline", label: "Due soon" },
] as const

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
  const [deleteError, setDeleteError] = useState<string | null>(null)

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
      setDeleteError(null)
      await onDelete(deleteTarget.todo_id)
      setDeleteTarget(null)
      setDeleteError(null)
    } catch (error) {
      console.error("Todo deletion failed:", error)
      setDeleteError(error instanceof Error ? error.message : "Failed to delete Todo")
    } finally {
      setIsDeleting(false)
    }
  }

  const closeDeleteDialog = () => {
    if (isDeleting) return
    setDeleteTarget(null)
    setDeleteError(null)
  }

  const openDeleteDialog = (todo: Todo | PublicTodo) => {
    setDeleteError(null)
    setDeleteTarget(todo)
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
        <Typography variant="h6" gutterBottom>
          No Todos available
        </Typography>
      </Box>
    )
  }

  return (
    <Stack spacing={2}>
      {showStats && (
        <Box
          component="dl"
          aria-label="Todo statistics"
          sx={{
            m: 0,
            py: 1.5,
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(96px, 1fr))",
            gap: 2,
            borderTop: 1,
            borderBottom: 1,
            borderColor: "divider",
          }}
        >
          {statItems.map((stat) => (
            <Box key={stat.key}>
              <Typography component="dt" variant="caption" color="text.secondary">
                {stat.label}
              </Typography>
              <Typography component="dd" sx={{ m: 0, fontWeight: 600 }}>
                {stats[stat.key]}
              </Typography>
            </Box>
          ))}
        </Box>
      )}

      <List disablePadding aria-label="Todo list">
        {todos.map((todo, index) => {
          const overdue = !todo.is_completed && isTodoDateOverdue(todo.todo_deadline)
          const dueSoon = !todo.is_completed && !overdue && isTodoDateNear(todo.todo_deadline)
          const deadlineState = overdue ? "Overdue" : dueSoon ? "Due soon" : null

          return (
            <Fragment key={todo.todo_id}>
              <ListItem disableGutters sx={{ py: 2.5, alignItems: "flex-start" }}>
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  spacing={2}
                  sx={{ width: "100%", justifyContent: "space-between" }}
                >
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Stack direction="row" spacing={1} sx={{ alignItems: "center", mb: 1 }}>
                      {onToggleCompletion && (
                        <Checkbox
                          aria-label={`${todo.title}を${todo.is_completed ? "未完了" : "完了"}にする`}
                          checked={todo.is_completed}
                          onChange={() => void toggleCompletion(todo.todo_id)}
                          sx={{ p: 0.5 }}
                        />
                      )}
                      <Typography
                        variant="h6"
                        component="h2"
                        sx={{
                          overflowWrap: "anywhere",
                          textDecoration: todo.is_completed ? "line-through" : "none",
                        }}
                      >
                        {todo.title}
                      </Typography>
                    </Stack>

                    <Typography sx={{ mb: 1, whiteSpace: "pre-wrap" }}>
                      {todo.description}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Due: {formatTodoDate(todo.todo_deadline)}
                      {deadlineState ? ` (${deadlineState})` : ""} · Status:{" "}
                      {todo.is_completed ? "Completed" : "Pending"}
                      {showPublicBadge && todo.is_public ? " · Visibility: Public" : ""}
                      {todo.createdAt
                        ? ` · Created: ${new Date(todo.createdAt).toLocaleDateString("en-US")}`
                        : ""}
                      {"user" in todo ? ` · Author: ${(todo as PublicTodo).user.user_name}` : ""}
                    </Typography>
                  </Box>

                  {allowEdit && (onEdit || onDelete) && (
                    <Stack
                      direction="row"
                      spacing={1}
                      sx={{ alignSelf: { xs: "flex-end", sm: "center" } }}
                    >
                      {onEdit && (
                        <Button size="small" onClick={() => onEdit(todo.todo_id)}>
                          Edit
                        </Button>
                      )}
                      {onDelete && (
                        <Button size="small" onClick={() => openDeleteDialog(todo)}>
                          Delete
                        </Button>
                      )}
                    </Stack>
                  )}
                </Stack>
              </ListItem>
              {index < todos.length - 1 && <Divider component="li" />}
            </Fragment>
          )
        })}
      </List>

      <Dialog
        open={deleteTarget !== null}
        onClose={isDeleting ? undefined : closeDeleteDialog}
        aria-labelledby="delete-todo-title"
      >
        <DialogTitle id="delete-todo-title">Delete Todo?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {deleteTarget ? `“${deleteTarget.title}” will be permanently deleted.` : ""}
          </DialogContentText>
          {deleteError && (
            <Alert role="alert" severity="error" sx={{ mt: 2 }}>
              {deleteError}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDeleteDialog} disabled={isDeleting}>
            Cancel
          </Button>
          <Button onClick={() => void confirmDelete()} disabled={isDeleting}>
            {isDeleting ? "Deleting..." : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  )
}
