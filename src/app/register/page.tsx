"use client"

import AuthPageShell from "@/components/auth/AuthPageShell"
import NextLink from "@/components/NextLink"
import { useUserRegister } from "@/hooks/useUserRegister"
import { RegisterSchema, registerValidation } from "@/schemas/validation"
import { zodResolver } from "@hookform/resolvers/zod"
import { Alert, Box, Button, CircularProgress, Link, Stack, TextField } from "@mui/material"
import { useForm } from "react-hook-form"

const RegisterPage = () => {
  const {
    email,
    setEmail,
    password,
    setPassword,
    userName,
    setUserName,
    error,
    isSubmitting,
    handleSubmit: registerUser,
  } = useUserRegister()
  const {
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<RegisterSchema>({
    resolver: zodResolver(registerValidation()),
  })

  const handleInputChange = (field: "userName" | "email" | "password", value: string) => {
    setValue(field, value, { shouldValidate: true })
    if (field === "userName") setUserName(value)
    if (field === "email") setEmail(value)
    if (field === "password") setPassword(value)
  }

  const onSubmit = (data: RegisterSchema) => {
    void registerUser(data)
  }

  return (
    <AuthPageShell
      title="Register"
      footer={
        <>
          Already have an account?{" "}
          <Link component={NextLink} href="/login">
            Login here
          </Link>
        </>
      }
    >
      <Box component="form" onSubmit={handleSubmit(onSubmit)} aria-busy={isSubmitting}>
        <Stack spacing={2.5}>
          <TextField
            autoComplete="username"
            disabled={isSubmitting}
            error={Boolean(errors.userName)}
            helperText={errors.userName?.message}
            id="username"
            label="Username"
            name="userName"
            onChange={(event) => handleInputChange("userName", event.target.value)}
            value={userName}
          />
          <TextField
            autoComplete="email"
            disabled={isSubmitting}
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
            autoComplete="new-password"
            disabled={isSubmitting}
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
          <Button disabled={isSubmitting} fullWidth size="large" type="submit" variant="contained">
            {isSubmitting && (
              <CircularProgress aria-hidden="true" color="inherit" size={18} sx={{ mr: 1 }} />
            )}
            {isSubmitting ? "Registering..." : "Register"}
          </Button>
        </Stack>
      </Box>
    </AuthPageShell>
  )
}

export default RegisterPage
