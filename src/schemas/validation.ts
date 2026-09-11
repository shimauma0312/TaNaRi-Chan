import { z } from "zod"
import { loginPasswordSchema, registrationPasswordSchema } from "@/schemas/password"

/**
 * ユーザー登録用のバリデーションスキーマ
 * ユーザー名、メールアドレス、パスワードの検証を行います
 */
export const registerValidation = () => {
  return z.object({
    userName: z
      .string()
      .nonempty("ユーザー名は必須です")
      .trim()
      .max(50, "ユーザー名は50文字以内で入力してください"),
    email: z
      .string()
      .nonempty("メールアドレスは必須です")
      .trim()
      .email("正しいメールアドレスを入力してください。")
      .max(100, "メールアドレスは100文字以内で入力してください。")
      .transform((value) => value.toLowerCase()),
    password: registrationPasswordSchema,
  })
}

/**
 * ログイン用のバリデーションスキーマ
 * メールアドレスとパスワードの検証を行います
 */
export const loginValidation = () => {
  return z.object({
    email: z
      .string()
      .nonempty("メールアドレスは必須です")
      .trim()
      .email("正しいメールアドレスを入力してください。")
      .transform((value) => value.toLowerCase()),
    password: loginPasswordSchema,
  })
}

// 後方互換性のために残しておく
export const validation = registerValidation

// 型定義
export type RegisterSchema = z.infer<ReturnType<typeof registerValidation>>
export type LoginSchema = z.infer<ReturnType<typeof loginValidation>>
