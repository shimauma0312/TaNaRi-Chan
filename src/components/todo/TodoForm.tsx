"use client"

import SaveRoundedIcon from "@mui/icons-material/SaveRounded"
import {
  Alert,
  Button,
  Checkbox,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material"
import type { FormEvent } from "react"

export type TodoFormValues = {
  title: string
  description: string
  dueDate: string
  visibility: "private" | "public"
  isCompleted?: boolean
}

interface TodoFormProps {
  heading: string
  submitLabel: string
  values: TodoFormValues
  error: string | null
  submitting: boolean
  minimumDueDate?: string
  showCompleted?: boolean
  onChange: (values: TodoFormValues) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onCancel: () => void
}

export default function TodoForm({
  heading,
  submitLabel,
  values,
  error,
  submitting,
  minimumDueDate,
  showCompleted = false,
  onChange,
  onSubmit,
  onCancel,
}: TodoFormProps) {
  const update = <Key extends keyof TodoFormValues>(key: Key, value: TodoFormValues[Key]) => {
    onChange({ ...values, [key]: value })
  }

  return (
    <Paper sx={{ width: "100%", maxWidth: 640, p: { xs: 2, sm: 4 } }}>
      <Typography variant="h4" component="h1" gutterBottom>
        {heading}
      </Typography>
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Stack component="form" spacing={3} onSubmit={onSubmit} noValidate>
        <TextField
          label="Todo title"
          value={values.title}
          onChange={(event) => update("title", event.target.value)}
          required
          disabled={submitting}
          placeholder="e.g. Create project documentation"
          slotProps={{ htmlInput: { maxLength: 100 } }}
        />
        <TextField
          label="Description"
          value={values.description}
          onChange={(event) => update("description", event.target.value)}
          required
          disabled={submitting}
          placeholder="Enter detailed description"
          multiline
          minRows={4}
          slotProps={{ htmlInput: { maxLength: 1000 } }}
        />
        <TextField
          label="Due date"
          type="date"
          value={values.dueDate}
          onChange={(event) => update("dueDate", event.target.value)}
          required
          disabled={submitting}
          slotProps={{ inputLabel: { shrink: true }, htmlInput: { min: minimumDueDate } }}
        />
        <FormControl fullWidth disabled={submitting}>
          <InputLabel id="todo-visibility-label">Visibility</InputLabel>
          <Select
            labelId="todo-visibility-label"
            label="Visibility"
            value={values.visibility}
            onChange={(event) =>
              update("visibility", event.target.value as TodoFormValues["visibility"])
            }
          >
            <MenuItem value="private">Private</MenuItem>
            <MenuItem value="public">Public</MenuItem>
          </Select>
        </FormControl>
        {showCompleted && (
          <FormControlLabel
            control={
              <Checkbox
                checked={Boolean(values.isCompleted)}
                onChange={(event) => update("isCompleted", event.target.checked)}
                disabled={submitting}
                color="success"
              />
            }
            label="Completed"
          />
        )}
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
          <Button
            type="submit"
            variant="contained"
            startIcon={<SaveRoundedIcon />}
            disabled={submitting}
            sx={{ flex: 1 }}
          >
            {submitting ? `${submitLabel}...` : submitLabel}
          </Button>
          <Button
            type="button"
            variant="outlined"
            onClick={onCancel}
            disabled={submitting}
            sx={{ flex: 1 }}
          >
            Cancel
          </Button>
        </Stack>
      </Stack>
    </Paper>
  )
}
