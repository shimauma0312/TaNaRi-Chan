import type { ReactNode } from "react"
import { Box, Paper, Stack, Typography } from "@mui/material"

interface AuthPageShellProps {
  title: string
  children: ReactNode
  footer: ReactNode
}

export default function AuthPageShell({ title, children, footer }: AuthPageShellProps) {
  const titleId = `auth-${title.toLowerCase().replaceAll(" ", "-")}-title`

  return (
    <Box
      component="main"
      sx={{
        alignItems: "center",
        display: "flex",
        justifyContent: "center",
        minHeight: "100dvh",
        px: 2,
        py: 4,
      }}
    >
      <Paper
        component="section"
        aria-labelledby={titleId}
        elevation={12}
        sx={{
          backdropFilter: "blur(12px)",
          backgroundColor: "rgba(15, 18, 12, 0.78)",
          border: 1,
          borderColor: "divider",
          maxWidth: 448,
          p: { xs: 3, sm: 4 },
          width: "100%",
        }}
      >
        <Stack spacing={3}>
          <Typography component="h1" id={titleId} sx={{ textAlign: "center" }} variant="h4">
            {title}
          </Typography>
          {children}
          <Typography color="text.secondary" sx={{ textAlign: "center" }} variant="body2">
            {footer}
          </Typography>
        </Stack>
      </Paper>
    </Box>
  )
}
