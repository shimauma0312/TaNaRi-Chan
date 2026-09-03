import { loginRequestSchema, registerRequestSchema } from "@/schemas/api"
import { loginValidation, registerValidation } from "@/schemas/validation"

describe("shared password constraints", () => {
  const registration = {
    email: "user@example.com",
    userName: "Example User",
  }

  test.each([registerRequestSchema, registerValidation()])(
    "requires at least eight characters for registration",
    (schema) => {
      expect(schema.safeParse({ ...registration, password: "1234567" }).success).toBe(false)
      expect(schema.safeParse({ ...registration, password: "12345678" }).success).toBe(true)
    },
  )

  test.each([registerRequestSchema, registerValidation()])(
    "rejects passwords exceeding bcrypt's 72-byte limit",
    (schema) => {
      expect(schema.safeParse({ ...registration, password: `${"😀".repeat(18)}A` }).success).toBe(
        false,
      )
      expect(schema.safeParse({ ...registration, password: "😀".repeat(18) }).success).toBe(true)
    },
  )

  test("keeps client and API username rules aligned", () => {
    const input = { ...registration, userName: "A name with spaces", password: "password123" }
    expect(registerRequestSchema.safeParse(input).success).toBe(true)
    expect(registerValidation().safeParse(input).success).toBe(true)
  })

  test("applies the byte limit to login without blocking legacy short passwords", () => {
    expect(loginRequestSchema.safeParse({ email: registration.email, password: "x" }).success).toBe(
      true,
    )
    expect(loginValidation().safeParse({ email: registration.email, password: "x" }).success).toBe(
      true,
    )
    expect(
      loginRequestSchema.safeParse({ email: registration.email, password: "😀".repeat(19) })
        .success,
    ).toBe(false)
  })
})
