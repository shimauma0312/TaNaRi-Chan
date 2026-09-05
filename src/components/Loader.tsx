"use client"

import { Box, CircularProgress, Stack, Typography } from "@mui/material"
import { useEffect } from "react"

interface LoaderProps {
  onTimeout: () => void
  timeout: number
}

export default function Loader({ onTimeout, timeout }: LoaderProps) {
  useEffect(() => {
    const timer = window.setTimeout(onTimeout, timeout)
    return () => window.clearTimeout(timer)
  }, [onTimeout, timeout])

  return (
    <Box
      component="section"
      role="status"
      aria-label="読み込み中"
      sx={{
        alignItems: "center",
        display: "flex",
        justifyContent: "center",
        minHeight: "100dvh",
        width: "100%",
      }}
    >
      <Stack spacing={2} sx={{ alignItems: "center" }}>
        <CircularProgress
          aria-hidden="true"
          size={40}
          sx={{ "@media (prefers-reduced-motion: reduce)": { animation: "none" } }}
        />
        <Typography color="text.secondary" variant="body2">
          Loading...
        </Typography>
      </Stack>
    </Box>
  )
}
