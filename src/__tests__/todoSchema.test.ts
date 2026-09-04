import { updateTodoRequestSchema } from "@/schemas/api"

describe("updateTodoRequestSchema", () => {
  test("rejects a no-op update", () => {
    expect(updateTodoRequestSchema.safeParse({ todo_id: 1 }).success).toBe(false)
  })

  test("rejects an empty required description", () => {
    expect(updateTodoRequestSchema.safeParse({ todo_id: 1, description: "   " }).success).toBe(
      false,
    )
  })

  test("accepts false as an explicit update", () => {
    expect(updateTodoRequestSchema.safeParse({ todo_id: 1, is_public: false }).success).toBe(true)
  })
})
