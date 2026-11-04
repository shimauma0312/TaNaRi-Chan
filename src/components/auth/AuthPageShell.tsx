import type { ReactNode } from "react"
import { Box, Stack, Typography } from "@mui/material"

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
      <Box
        component="section"
        aria-labelledby={titleId}
        sx={{
          maxWidth: 448,
          width: "100%",
        }}
      >
        <Stack spacing={3}>
          <Typography component="h1" id={titleId} variant="h4">
            {title}
          </Typography>
          {children}
          <Typography color="text.secondary" variant="body2">
            {footer}
          </Typography>
        </Stack>
      </Box>
    </Box>
  )
}
