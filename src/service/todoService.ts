import { PrismaClient, Todo } from "@prisma/client"

/**
 * ToDoサービスクラス
 * ToDoに関するビジネスロジックとデータアクセスを統合
 */
export class TodoService {
  //prismaを依存性注入方式に変更
  private prisma: PrismaClient
  constructor(prismaClient?: PrismaClient) {
    this.prisma = prismaClient || new PrismaClient()
  }

  /**
   * ユーザーのToDoリストを取得する
   * @param userId ユーザーID
   * @returns ToDoリストの配列
   */
  async getUserTodos(userId: string): Promise<Todo[]> {
    return await this.prisma.todo.findMany({
      where: {
        id: userId,
      },
      orderBy: {
        createdAt: "desc",
      },
    })
  }

  /**
   * 公開されているToDoリストを取得する（ユーザー情報付き）
   * @returns 公開ToDoリストの配列（ユーザー情報含む）
   */
  async getPublicTodos(): Promise<
    (Todo & { user: { id: string; user_name: string } })[]
  > {
    return await this.prisma.todo.findMany({
      where: {
        is_public: true,
      },
      include: {
        user: {
          select: {
            id: true,
            user_name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })
  }

  /**
   * ToDoIDに基づいてToDoを取得する（公開チェック付き）
   * @param todoId ToDoID
   * @param requestUserId リクエストユーザーID（権限チェック用）
   * @returns ToDo オブジェクトまたはnull
   */
  async getTodoById(
    todoId: number,
    requestUserId?: string,
  ): Promise<Todo | null> {
    const todo = await this.prisma.todo.findUnique({
      where: {
        todo_id: todoId,
      },
    })

    if (!todo) {
      return null
    }

    // 公開設定または所有者の場合のみ返す
    if (todo.is_public || todo.id === requestUserId) {
      return todo
    }

    return null
  }

  /**
   * 新しいToDoを作成する
   * @param userId ユーザーID
   * @param todoData ToDoデータ
   * @returns 作成されたToDoオブジェクト
   */
  async createTodo(
    userId: string,
    todoData: {
      title: string
      description: string
      todo_deadline: Date
      is_public?: boolean
    },
  ): Promise<Todo> {
    // バリデーション
    if (!todoData.title.trim()) {
      throw new Error("タイトルは必須です")
    }

    if (todoData.todo_deadline < new Date()) {
      throw new Error("期限は現在時刻より後に設定してください")
    }

    return await this.prisma.todo.create({
      data: {
        title: todoData.title.trim(),
        description: todoData.description.trim(),
        todo_deadline: todoData.todo_deadline,
        is_public: todoData.is_public || false,
        id: userId,
      },
    })
  }

  /**
   * ToDoを更新する（権限チェック付き）
   * @param todoId ToDoID
   * @param userId ユーザーID（権限チェック用）
   * @param updateData 更新データ
   * @returns 更新されたToDoオブジェクトまたはnull
   */
  async updateTodo(
    todoId: number,
    userId: string,
    updateData: {
      title?: string
      description?: string
      todo_deadline?: Date
      is_completed?: boolean
      is_public?: boolean
    },
  ): Promise<Todo | null> {
    // 権限チェック：所有者のみ更新可能
    const existingTodo = await this.prisma.todo.findFirst({
      where: {
        todo_id: todoId,
        id: userId,
      },
    })

    if (!existingTodo) {
      return null
    }

    // バリデーション
    if (updateData.title !== undefined && !updateData.title.trim()) {
      throw new Error("タイトルは必須です")
    }

    if (updateData.todo_deadline && updateData.todo_deadline < new Date()) {
      throw new Error("期限は現在時刻より後に設定してください")
    }

    // データの整形
    const sanitizedData: any = {}
    if (updateData.title !== undefined) {
      sanitizedData.title = updateData.title.trim()
    }
    if (updateData.description !== undefined) {
      sanitizedData.description = updateData.description.trim()
    }
    if (updateData.todo_deadline !== undefined) {
      sanitizedData.todo_deadline = updateData.todo_deadline
    }
    if (updateData.is_completed !== undefined) {
      sanitizedData.is_completed = updateData.is_completed
    }
    if (updateData.is_public !== undefined) {
      sanitizedData.is_public = updateData.is_public
    }

    try {
      return await this.prisma.todo.update({
        where: {
          todo_id: todoId,
        },
        data: sanitizedData,
      })
    } catch (error) {
      return null
    }
  }

  /**
   * ToDoを削除する（権限チェック付き）
   * @param todoId ToDoID
   * @param userId ユーザーID（権限チェック用）
   * @returns 削除の成功可否
   */
  async deleteTodo(todoId: number, userId: string): Promise<boolean> {
    // 権限チェック：所有者のみ削除可能
    const existingTodo = await this.prisma.todo.findFirst({
      where: {
        todo_id: todoId,
        id: userId,
      },
    })

    if (!existingTodo) {
      return false
    }

    try {
      await this.prisma.todo.delete({
        where: {
          todo_id: todoId,
        },
      })
      return true
    } catch (error) {
      return false
    }
  }

  /**
   * ToDoの完了状態を切り替える
   * @param todoId ToDoID
   * @param userId ユーザーID（権限チェック用）
   * @returns 更新されたToDoオブジェクトまたはnull
   */
  async toggleTodoCompletion(
    todoId: number,
    userId: string,
  ): Promise<Todo | null> {
    const existingTodo = await this.prisma.todo.findFirst({
      where: {
        todo_id: todoId,
        id: userId,
      },
    })

    if (!existingTodo) {
      return null
    }

    try {
      return await this.prisma.todo.update({
        where: {
          todo_id: todoId,
        },
        data: {
          is_completed: !existingTodo.is_completed,
        },
      })
    } catch (error) {
      return null
    }
  }
}

// シングルトンインスタンスをエクスポート
export const todoService = new TodoService()

// 既存のinterface互換性のために関数もエクスポート
export async function getTodo(userId: string): Promise<Todo[]> {
  return todoService.getUserTodos(userId)
}
