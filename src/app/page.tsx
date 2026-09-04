"use client"

import Loader from "@/components/Loader"
import NextLink from "@/components/NextLink"
import { Box, Button, Fade, Link, Paper, Stack, Typography, useMediaQuery } from "@mui/material"
import { useState } from "react"

export default function Home() {
  const [isLoading, setIsLoading] = useState(true)
  const reduceMotion = useMediaQuery("(prefers-reduced-motion: reduce)")

  return (
    <Box component="main" sx={{ minHeight: "100dvh" }}>
      {isLoading ? (
        <Loader onTimeout={() => setIsLoading(false)} timeout={1300} />
      ) : (
        <Fade appear in timeout={reduceMotion ? 0 : 500}>
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
              elevation={16}
              sx={{
                backdropFilter: "blur(12px)",
                backgroundColor: "rgba(0, 0, 0, 0.54)",
                border: 1,
                borderColor: "rgba(255, 255, 255, 0.2)",
                maxWidth: 896,
                p: { xs: 4, sm: 6 },
                textAlign: "center",
                width: "100%",
              }}
            >
              <Stack spacing={3} sx={{ alignItems: "center" }}>
                <Typography component="h1" id="home-title" variant="h2">
                  TaNaRi-Chan
                </Typography>
                <Button
                  component={NextLink}
                  href="/login"
                  size="large"
                  sx={{ px: 4, py: 1.5 }}
                  variant="contained"
                >
                  Log in to start
                </Button>
                <Typography color="text.secondary">
                  Don&apos;t have an account? You can{" "}
                  <Link component={NextLink} href="/register">
                    sign up here
                  </Link>{" "}
                  to get started.
                </Typography>
              </Stack>
            </Paper>
          </Box>
        </Fade>
      )}
    </Box>
  )
}
