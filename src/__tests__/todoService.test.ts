import { PrismaClient, Todo } from "@prisma/client"
import { TodoService } from "../service/todoService"

// Prismaクライアントのモック
jest.mock("@prisma/client", () => ({
  PrismaClient: jest.fn(),
}))

const mockPrismaClient = {
  todo: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
}

;(PrismaClient as jest.Mock).mockImplementation(() => mockPrismaClient)

describe("TodoService", () => {
  let service: TodoService

  beforeEach(() => {
    service = new TodoService(mockPrismaClient as any)
    jest.clearAllMocks()
  })

  describe("getUserTodos", () => {
    it("指定されたユーザーIDのToDoリストを取得できること", async () => {
      // Arrange
      const userId = "test-user-id"
      const testDate = new Date("2025-01-01T00:00:00.000Z")
      const mockTodos: Todo[] = [
        {
          todo_id: 1,
          title: "Test Todo 1",
          description: "Test Description 1",
          todo_deadline: testDate,
          createdAt: testDate,
          updatedAt: testDate,
          id: userId,
          is_completed: false,
          is_public: false,
        },
        {
          todo_id: 2,
          title: "Test Todo 2",
          description: "Test Description 2",
          todo_deadline: testDate,
          createdAt: testDate,
          updatedAt: testDate,
          id: userId,
          is_completed: true,
          is_public: false,
        },
      ]
      mockPrismaClient.todo.findMany.mockResolvedValue(mockTodos)

      // Act
      const result = await service.getUserTodos(userId)

      // Assert
      expect(mockPrismaClient.todo.findMany).toHaveBeenCalledWith({
        where: { id: userId },
        orderBy: { todo_id: "desc" },
        take: 100,
      })
      expect(result).toEqual(mockTodos)
    })

    it("filters a calendar range while retaining cursor pagination", async () => {
      mockPrismaClient.todo.findMany.mockResolvedValue([])
      const from = new Date("2026-09-01T00:00:00.000Z")
      const to = new Date("2026-10-01T00:00:00.000Z")

      await service.getUserTodos("test-user-id", { from, to, cursor: 200, limit: 50 })

      expect(mockPrismaClient.todo.findMany).toHaveBeenCalledWith({
        where: { id: "test-user-id", todo_deadline: { gte: from, lt: to } },
        orderBy: { todo_id: "desc" },
        take: 50,
        cursor: { todo_id: 200 },
        skip: 1,
      })
    })
  })

  describe("getPublicTodos", () => {
    it("公開されているToDoリストを取得できること", async () => {
      // Arrange

      //翌日以降の日付を動的に取得
      const currentDate = new Date()
      const tomorrow = new Date(currentDate)
      tomorrow.setDate(tomorrow.getDate() + 1)

      const mockPublicTodos: Todo[] = [
        {
          todo_id: 1,
          title: "Public Todo 1",
          description: "Public Description 1",
          todo_deadline: tomorrow,
          createdAt: currentDate,
          updatedAt: currentDate,
          id: "user1",
          is_completed: false,
          is_public: true,
        },
      ]
      mockPrismaClient.todo.findMany.mockResolvedValue(mockPublicTodos)

      // Act
      const result = await service.getPublicTodos()

      // Assert
      expect(mockPrismaClient.todo.findMany).toHaveBeenCalledWith({
        where: { is_public: true },
        orderBy: { todo_id: "desc" },
        take: 100,
        include: {
          user: {
            select: {
              id: true,
              user_name: true,
            },
          },
        },
      })

      expect(result).toEqual(mockPublicTodos)
    })

    test("applies a half-open deadline range", async () => {
      mockPrismaClient.todo.findMany.mockResolvedValue([])
      const from = new Date("2026-09-01T00:00:00.000Z")
      const to = new Date("2026-10-01T00:00:00.000Z")

      await service.getPublicTodos({ userId: "owner", from, to, limit: 20 })

      expect(mockPrismaClient.todo.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            is_public: true,
            id: "owner",
            todo_deadline: { gte: from, lt: to },
          },
          take: 20,
        }),
      )
    })
  })

  describe("getTodoById", () => {
    it("公開ToDoを取得できること", async () => {
      // Arrange
      const todoId = 1
      const currentDate = new Date()
      const tomorrow = new Date(currentDate)
      tomorrow.setDate(tomorrow.getDate() + 1) //過去の日付を避けるため
      const mockTodo: Todo = {
        todo_id: todoId,
        title: "Public Todo",
        description: "Public Description",
        todo_deadline: tomorrow,
        createdAt: currentDate,
        updatedAt: currentDate,
        id: "owner-id",
        is_completed: false,
        is_public: true,
      }
      mockPrismaClient.todo.findUnique.mockResolvedValue(mockTodo)

      // Act
      const result = await service.getTodoById(todoId, "other-user-id")

      // Assert
      expect(result).toEqual(mockTodo)
    })

    it("所有者のプライベートToDoを取得できること", async () => {
      // Arrange
      const todoId = 1
      const userId = "owner-id"
      const currentDate = new Date()
      const tomorrow = new Date(currentDate)
      tomorrow.setDate(tomorrow.getDate() + 1)
      const mockTodo: Todo = {
        todo_id: todoId,
        title: "Private Todo",
        description: "Private Description",
        todo_deadline: tomorrow,
        createdAt: currentDate,
        updatedAt: currentDate,
        id: userId,
        is_completed: false,
        is_public: false,
      }
      mockPrismaClient.todo.findUnique.mockResolvedValue(mockTodo)

      // Act
      const result = await service.getTodoById(todoId, userId)

      // Assert
      expect(result).toEqual(mockTodo)
    })

    it("他人のプライベートToDoは取得できないこと", async () => {
      // Arrange
      const todoId = 1
      const currentDate = new Date()
      const tomorrow = new Date(currentDate)
      tomorrow.setDate(tomorrow.getDate() + 1)
      const mockTodo: Todo = {
        todo_id: todoId,
        title: "Private Todo",
        description: "Private Description",
        todo_deadline: tomorrow,
        createdAt: currentDate,
        updatedAt: currentDate,
        id: "owner-id",
        is_completed: false,
        is_public: false,
      }
      mockPrismaClient.todo.findUnique.mockResolvedValue(mockTodo)

      // Act
      const result = await service.getTodoById(todoId, "other-user-id")

      // Assert
      expect(result).toBeNull()
    })

    it("存在しないToDoの場合nullを返すこと", async () => {
      // Arrange
      const todoId = 999
      mockPrismaClient.todo.findUnique.mockResolvedValue(null)

      // Act
      const result = await service.getTodoById(todoId, "user-id")

      // Assert
      expect(result).toBeNull()
    })
  })

  describe("createTodo", () => {
    it("新しいToDoを作成できること", async () => {
      // Arrange
      const userId = "test-user-id"
      const currentDate = new Date()
      const tomorrow = new Date(currentDate)
      tomorrow.setDate(tomorrow.getDate() + 1)
      const todoData = {
        title: "New Todo",
        description: "New Description",
        todo_deadline: tomorrow,
        is_public: true,
      }
      const mockCreatedTodo: Todo = {
        todo_id: 1,
        title: todoData.title,
        description: todoData.description,
        todo_deadline: todoData.todo_deadline,
        is_public: todoData.is_public,
        id: userId,
        is_completed: false,
        createdAt: currentDate,
        updatedAt: currentDate,
      }
      mockPrismaClient.todo.create.mockResolvedValue(mockCreatedTodo)

      // Act
      const result = await service.createTodo(userId, todoData)

      // Assert
      expect(mockPrismaClient.todo.create).toHaveBeenCalledWith({
        data: {
          title: todoData.title,
          description: todoData.description,
          todo_deadline: new Date(
            Date.UTC(
              todoData.todo_deadline.getUTCFullYear(),
              todoData.todo_deadline.getUTCMonth(),
              todoData.todo_deadline.getUTCDate(),
            ),
          ),
          is_public: todoData.is_public,
          id: userId,
        },
      })
      expect(result).toEqual(mockCreatedTodo)
    })

    it("タイトルが空の場合エラーを投げること", async () => {
      // Arrange
      const userId = "test-user-id"
      const currentDate = new Date()
      const tomorrow = new Date(currentDate)
      tomorrow.setDate(tomorrow.getDate() + 1)
      const todoData = {
        title: "   ",
        description: "Description",
        todo_deadline: tomorrow,
      }

      // Act & Assert
      await expect(service.createTodo(userId, todoData)).rejects.toThrow("タイトルは必須です")
    })

    it("過去の期限の場合エラーを投げること", async () => {
      // Arrange
      const userId = "test-user-id"
      const pastDate = new Date("2024-12-31") // 固定の過去日付を使用
      const todoData = {
        title: "Test Todo",
        description: "Description",
        todo_deadline: pastDate,
      }

      // Act & Assert
      await expect(service.createTodo(userId, todoData)).rejects.toThrow(
        "期限は今日以降に設定してください",
      )
    })

    it("当日の期限を時刻に関係なく受け付けること", async () => {
      jest.useFakeTimers().setSystemTime(new Date("2026-09-03T12:00:00.000Z"))
      const today = new Date("2026-09-03T00:00:00.000Z")
      mockPrismaClient.todo.create.mockResolvedValue({ todo_id: 1 } as Todo)

      await service.createTodo("test-user-id", {
        title: "Today",
        description: "Due today",
        todo_deadline: today,
      })

      expect(mockPrismaClient.todo.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ todo_deadline: today }),
      })
      jest.useRealTimers()
    })
  })

  describe("updateTodo", () => {
    it("期限を変更しない期限切れToDoの編集を許可すること", async () => {
      const expiredTodo = {
        todo_id: 1,
        title: "Expired",
        todo_deadline: new Date("2020-01-01T00:00:00.000Z"),
      } as Todo
      mockPrismaClient.todo.update.mockResolvedValue({ ...expiredTodo, title: "Updated" })

      await expect(service.updateTodo(1, "test-user-id", { title: "Updated" })).resolves.toEqual(
        expect.objectContaining({ title: "Updated" }),
      )
      expect(mockPrismaClient.todo.update).toHaveBeenCalledWith({
        where: { todo_id: 1, id: "test-user-id" },
        data: { title: "Updated" },
      })
    })

    it("ToDoを更新できること", async () => {
      // Arrange
      const todoId = 1
      const userId = "test-user-id"
      const currentDate = new Date()
      const tomorrow = new Date(currentDate)
      tomorrow.setDate(tomorrow.getDate() + 1)
      const updateData = {
        title: "Updated Todo",
        is_completed: true,
      }
      const mockExistingTodo: Todo = {
        todo_id: todoId,
        title: "Original Todo",
        description: "Original Description",
        todo_deadline: tomorrow,
        createdAt: currentDate,
        updatedAt: currentDate,
        id: userId,
        is_completed: false,
        is_public: false,
      }
      const mockUpdatedTodo: Todo = {
        ...mockExistingTodo,
        title: "Updated Todo",
        is_completed: true,
      }
      mockPrismaClient.todo.update.mockResolvedValue(mockUpdatedTodo)

      // Act
      const result = await service.updateTodo(todoId, userId, updateData)

      // Assert
      expect(mockPrismaClient.todo.update).toHaveBeenCalledWith({
        where: { todo_id: todoId, id: userId },
        data: {
          title: "Updated Todo",
          is_completed: true,
        },
      })
      expect(result).toEqual(mockUpdatedTodo)
    })

    it("権限がない場合nullを返すこと", async () => {
      // Arrange
      const todoId = 1
      const userId = "test-user-id"
      const updateData = { title: "Updated Todo" }
      mockPrismaClient.todo.update.mockRejectedValue(
        Object.assign(new Error("Record not found"), { code: "P2025" }),
      )

      // Act
      const result = await service.updateTodo(todoId, userId, updateData)

      // Assert
      expect(result).toBeNull()
    })

    it("空のタイトルの場合エラーを投げること", async () => {
      // Arrange
      const todoId = 1
      const userId = "test-user-id"
      const updateData = { title: "   " }
      const currentDate = new Date()
      const tomorrow = new Date(currentDate)
      tomorrow.setDate(tomorrow.getDate() + 1)
      const mockExistingTodo: Todo = {
        todo_id: todoId,
        title: "Original Todo",
        description: "Original Description",
        todo_deadline: tomorrow,
        createdAt: currentDate,
        updatedAt: currentDate,
        id: userId,
        is_completed: false,
        is_public: false,
      }
      mockPrismaClient.todo.findFirst.mockResolvedValue(mockExistingTodo)

      // Act & Assert
      await expect(service.updateTodo(todoId, userId, updateData)).rejects.toThrow(
        "タイトルは必須です",
      )
    })
  })

  describe("deleteTodo", () => {
    it("ToDoを削除できること", async () => {
      // Arrange
      const todoId = 1
      const userId = "test-user-id"
      mockPrismaClient.todo.delete.mockResolvedValue({})

      // Act
      const result = await service.deleteTodo(todoId, userId)

      // Assert
      expect(mockPrismaClient.todo.delete).toHaveBeenCalledWith({
        where: { todo_id: todoId, id: userId },
      })
      expect(result).toBe(true)
    })

    it("権限がない場合falseを返すこと", async () => {
      // Arrange
      const todoId = 1
      const userId = "test-user-id"
      mockPrismaClient.todo.delete.mockRejectedValue(
        Object.assign(new Error("Record not found"), { code: "P2025" }),
      )

      // Act
      const result = await service.deleteTodo(todoId, userId)

      // Assert
      expect(result).toBe(false)
    })
  })

  describe("toggleTodoCompletion", () => {
    it("ToDoの完了状態を切り替えできること", async () => {
      // Arrange
      const todoId = 1
      const userId = "test-user-id"
      const currentDate = new Date()
      const tomorrow = new Date(currentDate)
      tomorrow.setDate(tomorrow.getDate() + 1)
      const mockExistingTodo: Todo = {
        todo_id: todoId,
        title: "Test Todo",
        description: "Test Description",
        todo_deadline: tomorrow,
        createdAt: currentDate,
        updatedAt: currentDate,
        id: userId,
        is_completed: false,
        is_public: false,
      }
      const mockUpdatedTodo: Todo = {
        ...mockExistingTodo,
        is_completed: true,
      }
      mockPrismaClient.todo.findFirst.mockResolvedValue(mockExistingTodo)
      mockPrismaClient.todo.update.mockResolvedValue(mockUpdatedTodo)

      // Act
      const result = await service.toggleTodoCompletion(todoId, userId)

      // Assert
      expect(mockPrismaClient.todo.update).toHaveBeenCalledWith({
        where: { todo_id: todoId, id: userId, is_completed: false },
        data: { is_completed: true },
      })
      expect(result).toEqual(mockUpdatedTodo)
    })

    it("権限がない場合nullを返すこと", async () => {
      // Arrange
      const todoId = 1
      const userId = "test-user-id"
      mockPrismaClient.todo.findFirst.mockResolvedValue(null)

      // Act
      const result = await service.toggleTodoCompletion(todoId, userId)

      // Assert
      expect(result).toBeNull()
    })
  })
})
