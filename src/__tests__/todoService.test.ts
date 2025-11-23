import { PrismaClient, Todo } from '@prisma/client';
import { TodoService } from '../service/todoService';

// Prismaクライアントのモック
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(),
}));

const mockPrismaClient = {
  todo: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
};

(PrismaClient as jest.Mock).mockImplementation(() => mockPrismaClient);

describe('TodoService', () => {
  let service: TodoService;

  beforeEach(() => {
    service = new TodoService(mockPrismaClient as any)
    jest.clearAllMocks();
  });

  describe('getUserTodos', () => {
    it('指定されたユーザーIDのToDoリストを取得できること', async () => {
      // Arrange
      const userId = 'test-user-id';
      const testDate = new Date('2025-01-01T00:00:00.000Z');
      const mockTodos: Todo[] = [
        {
          todo_id: 1,
          title: 'Test Todo 1',
          description: 'Test Description 1',
          todo_deadline: testDate,
          createdAt: testDate,
          updatedAt: testDate,
          id: userId,
          is_completed: false,
          is_public: false,
        },
        {
          todo_id: 2,
          title: 'Test Todo 2',
          description: 'Test Description 2',
          todo_deadline: testDate,
          createdAt: testDate,
          updatedAt: testDate,
          id: userId,
          is_completed: true,
          is_public: false,
        },
      ];
      mockPrismaClient.todo.findMany.mockResolvedValue(mockTodos);

      // Act
      const result = await service.getUserTodos(userId);

      // Assert
      expect(mockPrismaClient.todo.findMany).toHaveBeenCalledWith({
        where: { id: userId },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual(mockTodos);
    });
  });

  describe('getPublicTodos', () => {
    it('公開されているToDoリストを取得できること', async () => {
      // Arrange
      const mockPublicTodos: Todo[] = [
        {
          todo_id: 1,
          title: 'Public Todo 1',
          description: 'Public Description 1',
          todo_deadline: new Date('2025-01-01'),
          createdAt: new Date(),
          updatedAt: new Date(),
          id: 'user1',
          is_completed: false,
          is_public: true,
        },
      ];
      mockPrismaClient.todo.findMany.mockResolvedValue(mockPublicTodos);

      // Act
      const result = await service.getPublicTodos();

      // Assert
      expect(mockPrismaClient.todo.findMany).toHaveBeenCalledWith({
        where: { is_public: true },
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              user_name: true,
            },
          },
        },
      });

      expect(result).toEqual(mockPublicTodos);
    })
  })

  describe('getTodoById', () => {
    it('公開ToDoを取得できること', async () => {
      // Arrange
      const todoId = 1;
      const mockTodo: Todo = {
        todo_id: todoId,
        title: 'Public Todo',
        description: 'Public Description',
        todo_deadline: new Date('2025-01-01'),
        createdAt: new Date(),
        updatedAt: new Date(),
        id: 'owner-id',
        is_completed: false,
        is_public: true,
      };
      mockPrismaClient.todo.findUnique.mockResolvedValue(mockTodo);

      // Act
      const result = await service.getTodoById(todoId, 'other-user-id');

      // Assert
      expect(result).toEqual(mockTodo);
    });

    it('所有者のプライベートToDoを取得できること', async () => {
      // Arrange
      const todoId = 1
      const userId = 'owner-id';
      const mockTodo: Todo = {
        todo_id: todoId,
        title: 'Private Todo',
        description: 'Private Description',
        todo_deadline: new Date('2025-01-01'),
        createdAt: new Date(),
        updatedAt: new Date(),
        id: userId,
        is_completed: false,
        is_public: false,
      };
      mockPrismaClient.todo.findUnique.mockResolvedValue(mockTodo);

      // Act
      const result = await service.getTodoById(todoId, userId);

      // Assert
      expect(result).toEqual(mockTodo);
    });

    it('他人のプライベートToDoは取得できないこと', async () => {
      // Arrange
      const todoId = 1;
      const mockTodo: Todo = {
        todo_id: todoId,
        title: 'Private Todo',
        description: 'Private Description',
        todo_deadline: new Date('2025-01-01'),
        createdAt: new Date(),
        updatedAt: new Date(),
        id: 'owner-id',
        is_completed: false,
        is_public: false,
      };
      mockPrismaClient.todo.findUnique.mockResolvedValue(mockTodo);

      // Act
      const result = await service.getTodoById(todoId, 'other-user-id');

      // Assert
      expect(result).toBeNull();
    })

    it('存在しないToDoの場合nullを返すこと', async () => {
      // Arrange
      const todoId = 999
      mockPrismaClient.todo.findUnique.mockResolvedValue(null);

      // Act
      const result = await service.getTodoById(todoId, 'user-id');

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('createTodo', () => {
    it('新しいToDoを作成できること', async () => {
      // Arrange
      const userId = 'test-user-id'
      const todoData = {
        title: 'New Todo',
        description: 'New Description',
        todo_deadline: new Date('2026-01-01'),
        is_public: true,
      };
      const mockCreatedTodo: Todo = {
        todo_id: 1,
        title: todoData.title,
        description: todoData.description,
        todo_deadline: todoData.todo_deadline,
        is_public: todoData.is_public,
        id: userId,
        is_completed: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockPrismaClient.todo.create.mockResolvedValue(mockCreatedTodo);

      // Act
      const result = await service.createTodo(userId, todoData);

      // Assert
      expect(mockPrismaClient.todo.create).toHaveBeenCalledWith({
        data: {
          title: todoData.title,
          description: todoData.description,
          todo_deadline: todoData.todo_deadline,
          is_public: todoData.is_public,
          id: userId,
        },
      });
      expect(result).toEqual(mockCreatedTodo);
    });

    it('タイトルが空の場合エラーを投げること', async () => {
      // Arrange
      const userId = 'test-user-id'
      const todoData = {
        title: '   ',
        description: 'Description',
        todo_deadline: new Date('2025-01-01'),
      };

      // Act & Assert
      await expect(service.createTodo(userId, todoData)).rejects.toThrow('タイトルは必須です');
    });

    it('過去の期限の場合エラーを投げること', async () => {
      // Arrange
      const userId = 'test-user-id';
      const pastDate = new Date('2024-12-31'); // 固定の過去日付を使用
      const todoData = {
        title: 'Test Todo',
        description: 'Description',
        todo_deadline: pastDate,
      };

      // Act & Assert
      await expect(service.createTodo(userId, todoData)).rejects.toThrow('期限は現在時刻より後に設定してください');
    });
  });

  describe('updateTodo', () => {
    it('ToDoを更新できること', async () => {
      // Arrange
      const todoId = 1;
      const userId = 'test-user-id';
      const updateData = {
        title: 'Updated Todo',
        is_completed: true,
      };
      const mockExistingTodo: Todo = {
        todo_id: todoId,
        title: 'Original Todo',
        description: 'Original Description',
        todo_deadline: new Date('2025-01-01'),
        createdAt: new Date(),
        updatedAt: new Date(),
        id: userId,
        is_completed: false,
        is_public: false,
      };
      const mockUpdatedTodo: Todo = {
        ...mockExistingTodo,
        title: 'Updated Todo',
        is_completed: true,
      };
      mockPrismaClient.todo.findFirst.mockResolvedValue(mockExistingTodo);
      mockPrismaClient.todo.update.mockResolvedValue(mockUpdatedTodo);

      // Act
      const result = await service.updateTodo(todoId, userId, updateData);

      // Assert
      expect(mockPrismaClient.todo.findFirst).toHaveBeenCalledWith({
        where: { todo_id: todoId, id: userId },
      });
      expect(mockPrismaClient.todo.update).toHaveBeenCalledWith({
        where: { todo_id: todoId },
        data: {
          title: 'Updated Todo',
          is_completed: true,
        },
      });
      expect(result).toEqual(mockUpdatedTodo);
    });

    it('権限がない場合nullを返すこと', async () => {
      // Arrange
      const todoId = 1
      const userId = 'test-user-id'
      const updateData = { title: 'Updated Todo' };
      mockPrismaClient.todo.findFirst.mockResolvedValue(null);

      // Act
      const result = await service.updateTodo(todoId, userId, updateData);

      // Assert
      expect(result).toBeNull();
    })

    it('空のタイトルの場合エラーを投げること', async () => {
      // Arrange
      const todoId = 1;
      const userId = 'test-user-id';
      const updateData = { title: '   ' };
      const mockExistingTodo: Todo = {
        todo_id: todoId,
        title: 'Original Todo',
        description: 'Original Description',
        todo_deadline: new Date('2025-01-01'),
        createdAt: new Date(),
        updatedAt: new Date(),
        id: userId,
        is_completed: false,
        is_public: false,
      };
      mockPrismaClient.todo.findFirst.mockResolvedValue(mockExistingTodo);

      // Act & Assert
      await expect(
        service.updateTodo(todoId, userId, updateData)).rejects.toThrow('タイトルは必須です');
    });
  });

  describe('deleteTodo', () => {
    it('ToDoを削除できること', async () => {
      // Arrange
      const todoId = 1;
      const userId = 'test-user-id';
      const mockExistingTodo: Todo = {
        todo_id: todoId,
        title: 'Test Todo',
        description: 'Test Description',
        todo_deadline: new Date('2025-01-01'),
        createdAt: new Date(),
        updatedAt: new Date(),
        id: userId,
        is_completed: false,
        is_public: false,
      };
      mockPrismaClient.todo.findFirst.mockResolvedValue(mockExistingTodo);
      mockPrismaClient.todo.delete.mockResolvedValue({});

      // Act
      const result = await service.deleteTodo(todoId, userId)

      // Assert
      expect(mockPrismaClient.todo.findFirst).toHaveBeenCalledWith({
        where: { todo_id: todoId, id: userId },
      });
      expect(mockPrismaClient.todo.delete).toHaveBeenCalledWith({
        where: { todo_id: todoId },
      });
      expect(result).toBe(true);
    });

    it('権限がない場合falseを返すこと', async () => {
      // Arrange
      const todoId = 1;
      const userId = 'test-user-id';
      mockPrismaClient.todo.findFirst.mockResolvedValue(null);

      // Act
      const result = await service.deleteTodo(todoId, userId);

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('toggleTodoCompletion', () => {
    it('ToDoの完了状態を切り替えできること', async () => {
      // Arrange
      const todoId = 1;
      const userId = 'test-user-id';
      const mockExistingTodo: Todo = {
        todo_id: todoId,
        title: 'Test Todo',
        description: 'Test Description',
        todo_deadline: new Date('2025-01-01'),
        createdAt: new Date(),
        updatedAt: new Date(),
        id: userId,
        is_completed: false,
        is_public: false,
      };
      const mockUpdatedTodo: Todo = {
        ...mockExistingTodo,
        is_completed: true,
      }
      mockPrismaClient.todo.findFirst.mockResolvedValue(mockExistingTodo);
      mockPrismaClient.todo.update.mockResolvedValue(mockUpdatedTodo);

      // Act
      const result = await service.toggleTodoCompletion(todoId, userId);

      // Assert
      expect(mockPrismaClient.todo.update).toHaveBeenCalledWith({
        where: { todo_id: todoId },
        data: { is_completed: true },
      });
      expect(result).toEqual(mockUpdatedTodo)
    });

    it('権限がない場合nullを返すこと', async () => {
      // Arrange
      const todoId = 1;
      const userId = 'test-user-id';
      mockPrismaClient.todo.findFirst.mockResolvedValue(null);

      // Act
      const result = await service.toggleTodoCompletion(todoId, userId);

      // Assert
      expect(result).toBeNull();
    });
  });
});
