import { z } from "zod"

export const validation = () => {
  return z.object({
    userName: z
      .string()
      .nonempty("ユーザー名は必須です")
      .min(5, "ユーザー名は5文字以上で入力してください。")
      .max(10, "ユーザー名は10文字以内で入力してください")
      .regex(/^[ぁ-んァ-ヶ一-龠a-zA-Z0-9]+$/, "記号は使用できません"),
    email: z
      .string()
      .nonempty("メールアドレスは必須です")
      .email("正しいメールアドレスを入力してください。")
      .max(100, "メールアドレスは100文字以内で入力してください。"),
    password: z
      .string()
      .nonempty("パスワードは必須です")
      .min(6, "パスワードは6文字以上で入力してください。")
      .max(30, "パスワードは30文字以内で入力してください。"),
  })
}

export type LoginSchema = z.infer<ReturnType<typeof validation>>
