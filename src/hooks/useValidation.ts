import { z } from "zod"

export const useValidation = () => {
  return z.object({
    email: z
      .string()
      .email("正しいメールアドレスを入力してください。")
      .max(100, "メールアドレスは100文字以内で入力してください。"),
    password: z
      .string()
      .min(6, "パスワードは6文字以上で入力してください。")
      .max(50, "パスワードは50文字以内で入力してください。"),
  })
}

export type LoginSchema = z.infer<ReturnType<typeof useValidation>>
