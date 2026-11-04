import { z } from "zod"

export const BCRYPT_MAX_PASSWORD_BYTES = 72

export function passwordByteLength(value: string): number {
  return new TextEncoder().encode(value).length
}

const withinBcryptLimit = (value: string) => passwordByteLength(value) <= BCRYPT_MAX_PASSWORD_BYTES

export const registrationPasswordSchema = z
  .string({ required_error: "パスワードは必須です" })
  .min(8, "パスワードは8文字以上必要です")
  .refine(withinBcryptLimit, "パスワードはUTF-8で72バイト以内にしてください")

export const loginPasswordSchema = z
  .string({ required_error: "メールアドレスとパスワードは必須です" })
  .min(1, "メールアドレスとパスワードは必須です")
  .refine(withinBcryptLimit, "パスワードはUTF-8で72バイト以内にしてください")
