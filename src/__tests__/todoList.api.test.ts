import { NextRequest } from 'next/server';
import { GET, POST } from '../app/api/todoList/route';
import { getUserIdFromRequest } from '../lib/auth';
import { todoService } from '../service/todoService';

// モック設定
jest.mock('../service/todoService');
jest.mock('../lib/auth');
jest.mock('../utils/errorHandler', () => ({
  createApiErrorResponse: jest.fn((error, message) => ({
    error: message,
    statusCode: 500,
  })),
}));

const mockTodoService = todoService as jest.Mocked<typeof todoService>;
const mockGetUserIdFromRequest = getUserIdFromRequest as jest.MockedFunction<typeof getUserIdFromRequest>;

describe('/api/todoList', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET', () => {
    it('公開ToDoリストを取得できること', async () => {
      // Arrange
      const testDate = new Date('2025-01-01T00:00:00.000Z');
      const mockTodos = [
        {
          todo_id: 1,
          title: 'Public Todo',
          description: 'Public Description',
          todo_deadline: testDate,
          createdAt: testDate,
          updatedAt: testDate,
          id: 'user1',
          is_completed: false,
          is_public: true,
          user: { id: 'user1', user_name: 'テストユーザー' },
        },
      ];
      mockTodoService.getPublicTodos.mockResolvedValue(mockTodos);

      // Act
      const response = await GET();
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      // JSONのレスポンスでは日付は文字列になるため、比較用にデータを調整
      const expectedData = mockTodos.map(todo => ({
        ...todo,
        todo_deadline: todo.todo_deadline.toISOString(),
        createdAt: todo.createdAt.toISOString(),
        updatedAt: todo.updatedAt.toISOString(),
      }));
      expect(data).toEqual(expectedData);
      expect(mockTodoService.getPublicTodos).toHaveBeenCalledTimes(1);
    });

    it('エラー時に適切なエラーレスポンスを返すこと', async () => {
      // Arrange
      mockTodoService.getPublicTodos.mockRejectedValue(new Error('Database error'));

      // Act
      const response = await GET();
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data).toHaveProperty('error');
    });
  });

  describe('POST', () => {
    it('認証されたユーザーがToDoを作成できること', async () => {
      // Arrange
      const userId = 'test-user-id';
      const testDate = new Date('2025-01-01T00:00:00.000Z');
      const todoData = {
        title: 'New Todo',
        description: 'New Description',
        todo_deadline: '2025-01-01T00:00:00.000Z',
        is_public: false,
      };
      const createdTodo = {
        todo_id: 1,
        title: todoData.title,
        description: todoData.description,
        todo_deadline: testDate,
        createdAt: testDate,
        updatedAt: testDate,
        id: userId,
        is_completed: false,
        is_public: todoData.is_public,
      };

      mockGetUserIdFromRequest.mockReturnValue(userId);
      mockTodoService.createTodo.mockResolvedValue(createdTodo);

      const request = {
        json: jest.fn().mockResolvedValue(todoData),
        cookies: { get: jest.fn() },
      } as unknown as NextRequest;

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(201);
      // JSONのレスポンスでは日付は文字列になるため、比較用にデータを調整
      const expectedData = {
        ...createdTodo,
        todo_deadline: createdTodo.todo_deadline.toISOString(),
        createdAt: createdTodo.createdAt.toISOString(),
        updatedAt: createdTodo.updatedAt.toISOString(),
      };
      expect(data).toEqual(expectedData);
      expect(mockTodoService.createTodo).toHaveBeenCalledWith(userId, {
        title: todoData.title,
        description: todoData.description,
        todo_deadline: new Date(todoData.todo_deadline),
        is_public: todoData.is_public,
      });
    });

    it('認証されていないユーザーの場合401を返すこと', async () => {
      // Arrange
      mockGetUserIdFromRequest.mockReturnValue(null);

      const request = {
        json: jest.fn(),
        cookies: { get: jest.fn() },
      } as unknown as NextRequest;

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(401);
      expect(data).toEqual({ error: '認証が必要です' });
    });

    it('必須フィールドが不足している場合400を返すこと', async () => {
      // Arrange
      const userId = 'test-user-id';
      const incompleteTodoData = {
        title: 'New Todo',
        // description と todo_deadline が不足
      };

      mockGetUserIdFromRequest.mockReturnValue(userId);

      const request = {
        json: jest.fn().mockResolvedValue(incompleteTodoData),
        cookies: { get: jest.fn() },
      } as unknown as NextRequest;

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data).toEqual({ error: 'タイトル、詳細、期限は必須です' });
    });

    it('サービス層でエラーが発生した場合適切にハンドリングすること', async () => {
      // Arrange
      const userId = 'test-user-id';
      const todoData = {
        title: 'New Todo',
        description: 'New Description',
        todo_deadline: '2025-01-01T00:00:00.000Z',
        is_public: false,
      };

      mockGetUserIdFromRequest.mockReturnValue(userId);
      mockTodoService.createTodo.mockRejectedValue(new Error('Service error'));

      const request = {
        json: jest.fn().mockResolvedValue(todoData),
        cookies: { get: jest.fn() },
      } as unknown as NextRequest;

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data).toHaveProperty('error');
    });
  });
});