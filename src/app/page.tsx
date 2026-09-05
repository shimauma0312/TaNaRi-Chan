"use client"

import Loader from "@/components/Loader"
import NextLink from "@/components/NextLink"
import { Box, Button, Link, Paper, Stack, Typography } from "@mui/material"
import { useState } from "react"

export default function Home() {
  const [isLoading, setIsLoading] = useState(true)

  return (
    <Box component="main" sx={{ minHeight: "100dvh" }}>
      {isLoading ? (
        <Loader onTimeout={() => setIsLoading(false)} timeout={1300} />
      ) : (
        <Box
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
            aria-labelledby="home-title"
            variant="outlined"
            sx={{
              maxWidth: 640,
              p: { xs: 3, sm: 5 },
              width: "100%",
            }}
          >
            <Stack spacing={3}>
              <Typography component="h1" id="home-title" variant="h2">
                TaNaRi-Chan
              </Typography>
              <Typography color="text.secondary">
                A simple place for todos, articles, and messages.
              </Typography>
              <Box>
                <Button component={NextLink} href="/login" variant="contained">
                  Log in
                </Button>
              </Box>
              <Typography color="text.secondary" variant="body2">
                Don&apos;t have an account?{" "}
                <Link component={NextLink} href="/register">
                  Register
                </Link>
              </Typography>
            </Stack>
          </Paper>
        </Box>
      )}
    </Box>
  )
}
