import { z } from "zod"

export const validation = () => {
  return z.object({
    userName: z
      .string()
      .min(6, "パスワードは6文字以上で入力してください。")
      .max(50, "ユーザー名は50文字以内で入力してください")
      .regex(/^[ぁ-んァ-ヶ一-龠a-zA-Z0-9]+$/, "記号は使用できません"),
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

export type LoginSchema = z.infer<ReturnType<typeof validation>>
