"use client"

import { Box, CircularProgress } from "@mui/material"

export default function MinLoader() {
  return (
    <Box
      role="status"
      aria-label="読み込み中"
      sx={{
        alignItems: "center",
        display: "flex",
        justifyContent: "center",
        minHeight: { xs: "calc(100dvh - 56px)", sm: "calc(100dvh - 64px)" },
        width: "100%",
      }}
    >
      <CircularProgress
        aria-hidden="true"
        size={32}
        sx={{ "@media (prefers-reduced-motion: reduce)": { animation: "none" } }}
      />
    </Box>
  )
}
