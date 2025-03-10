import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

/**
 * ユーザーのToDoリストを取得する
 * @param userId : number
 */
export async function getTodo(userId: string) {
  const todos = await prisma.todo.findMany({
    where: {
      user_id: userId,
    },
  })
  return todos
}

/**
 * ユーザーのToDoを作成する
 * */
export async function insertTodo(
  userId: string,
  todoData: {
    title: string
    description: string
    deadline: Date
    is_public: boolean
  },
) {
  const todo = await prisma.todo.create({
    data: {
      title: todoData.title,
      description: todoData.description,
      todo_deadline: todoData.deadline,
      is_public: todoData.is_public,
      user_id: userId,
    },
  })
}
