"use client"

import AuthPageShell from "@/components/auth/AuthPageShell"
import NextLink from "@/components/NextLink"
import { useLogin } from "@/hooks/useLogin"
import { LoginSchema, loginValidation } from "@/schemas/validation"
import { zodResolver } from "@hookform/resolvers/zod"
import { Alert, Box, Button, CircularProgress, Link, Stack, TextField } from "@mui/material"
import { useForm } from "react-hook-form"

const LoginPage = () => {
  const { email, setEmail, password, setPassword, error, loading, login } = useLogin()
  const {
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<LoginSchema>({
    resolver: zodResolver(loginValidation()),
  })

  const handleInputChange = (field: "email" | "password", value: string) => {
    setValue(field, value, { shouldValidate: true })
    if (field === "email") setEmail(value)
    if (field === "password") setPassword(value)
  }

  const onSubmit = (data: LoginSchema) => {
    void login(data.email, data.password)
  }

  return (
    <AuthPageShell
      title="Login"
      footer={
        <>
          Don&apos;t have an account?{" "}
          <Link component={NextLink} href="/register">
            Register here
          </Link>
        </>
      }
    >
      <Box component="form" onSubmit={handleSubmit(onSubmit)} aria-busy={loading}>
        <Stack spacing={2.5}>
          <TextField
            autoComplete="email"
            disabled={loading}
            error={Boolean(errors.email)}
            helperText={errors.email?.message}
            id="email"
            label="Email"
            name="email"
            onChange={(event) => handleInputChange("email", event.target.value)}
            type="email"
            value={email}
          />
          <TextField
            autoComplete="current-password"
            disabled={loading}
            error={Boolean(errors.password)}
            helperText={errors.password?.message}
            id="password"
            label="Password"
            name="password"
            onChange={(event) => handleInputChange("password", event.target.value)}
            type="password"
            value={password}
          />
          {error && (
            <Alert severity="error" role="alert">
              {error}
            </Alert>
          )}
          <Button disabled={loading} fullWidth size="large" type="submit" variant="contained">
            {loading && (
              <CircularProgress aria-hidden="true" color="inherit" size={18} sx={{ mr: 1 }} />
            )}
            {loading ? "Logging in..." : "Login"}
          </Button>
        </Stack>
      </Box>
    </AuthPageShell>
  )
}

export default LoginPage
