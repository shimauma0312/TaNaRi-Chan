import { z } from "zod"

const trimmedString = (field: string, max: number) =>
  z
    .string({ required_error: `${field}は必須です` })
    .trim()
    .min(1, `${field}は必須です`)
    .max(max, `${field}が長すぎます`)

export const registerRequestSchema = z
  .object({
    email: z
      .string({ required_error: "メールアドレスは必須です" })
      .trim()
      .email("メールアドレスの形式が不正です")
      .max(100),
    password: z.string().min(8, "パスワードは8文字以上必要です").max(72),
    userName: trimmedString("ユーザー名", 50),
  })
  .strict()

export const loginRequestSchema = z
  .object({
    email: z
      .string({ required_error: "メールアドレスとパスワードは必須です" })
      .trim()
      .min(1, "メールアドレスとパスワードは必須です")
      .email("メールアドレスの形式が不正です")
      .max(100),
    password: z
      .string({ required_error: "メールアドレスとパスワードは必須です" })
      .min(1, "メールアドレスとパスワードは必須です")
      .max(72),
  })
  .strict()

export const createTodoRequestSchema = z
  .object({
    title: trimmedString("タイトル", 200),
    description: trimmedString("詳細", 5_000),
    todo_deadline: z.coerce.date({ required_error: "期限は必須です" }),
    is_public: z.boolean().optional().default(false),
  })
  .strict()

export const updateTodoRequestSchema = z
  .object({
    todo_id: z.coerce.number().int().positive(),
    title: trimmedString("タイトル", 200).optional(),
    description: z.string().trim().max(5_000, "詳細が長すぎます").optional(),
    todo_deadline: z.coerce.date().optional(),
    is_completed: z.boolean().optional(),
    is_public: z.boolean().optional(),
  })
  .strict()

export const todoIdSchema = z.coerce.number().int().positive()

export const createMessageRequestSchema = z
  .object({
    subject: trimmedString("件名", 200),
    body: trimmedString("本文", 10_000),
    receiver_id: trimmedString("受信者", 128),
  })
  .strict()

export function firstValidationMessage(error: z.ZodError): string {
  return error.issues[0]?.message ?? "入力内容が不正です"
}

export async function readJsonRequest(
  request: Request,
): Promise<{ success: true; data: unknown } | { success: false }> {
  try {
    return { success: true, data: await request.json() }
  } catch {
    return { success: false }
  }
}
