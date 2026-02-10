/**
 * ログインAPIテスト
 * 
 * /api/login エンドポイントのテストケース：
 * - 正常なログイン
 * - バリデーションエラー
 * - 認証失敗
 * - システムエラー時のログ出力確認
 */

import { NextRequest } from 'next/server';
import { POST } from '@/app/api/login/route';
import * as userService from '@/service/userService';
import logger from '@/utils/logger';

// userServiceをモック
jest.mock('@/service/userService');
jest.mock('@/utils/logger');

const mockUserService = userService as jest.Mocked<typeof userService>;
const mockLogger = logger as jest.Mocked<typeof logger>;

// テスト用のNextRequestを作成するヘルパー関数
function createMockRequest(body: any): NextRequest {
  return {
    json: jest.fn().mockResolvedValue(body),
  } as unknown as NextRequest;
}

describe('/api/login', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('正常系', () => {
    it('有効な認証情報でログインに成功する', async () => {
      // Arrange
      const requestBody = {
        email: 'test@example.com',
        password: 'password123'
      };
      
      const mockUser = {
        id: 'user123',
        user_name: 'テストユーザー',
        user_email: 'test@example.com',
        icon_number: 1,
      };

      mockUserService.authenticateUser.mockResolvedValue(mockUser);
      mockUserService.setAuthCookie.mockResolvedValue(undefined);

      const request = createMockRequest(requestBody);

      // Act
      const response = await POST(request);
      const responseData = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(responseData).toEqual({
        message: 'ログインに成功しました',
        user: mockUser
      });
      expect(mockUserService.authenticateUser).toHaveBeenCalledWith('test@example.com', 'password123');
      expect(mockUserService.setAuthCookie).toHaveBeenCalledWith('user123');
    });
  });

  describe('バリデーションエラー', () => {
    it('メールアドレスが空の場合は400エラーを返す', async () => {
      // Arrange
      const requestBody = {
        email: '',
        password: 'password123'
      };
      const request = createMockRequest(requestBody);

      // Act
      const response = await POST(request);
      const responseData = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(responseData).toEqual({
        error: 'メールアドレスとパスワードは必須です'
      });
      expect(mockUserService.authenticateUser).not.toHaveBeenCalled();
    });

    it('パスワードが空の場合は400エラーを返す', async () => {
      // Arrange
      const requestBody = {
        email: 'test@example.com',
        password: ''
      };
      const request = createMockRequest(requestBody);

      // Act
      const response = await POST(request);
      const responseData = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(responseData).toEqual({
        error: 'メールアドレスとパスワードは必須です'
      });
      expect(mockUserService.authenticateUser).not.toHaveBeenCalled();
    });
  });

  describe('認証失敗', () => {
    it('無効な認証情報の場合は401エラーを返す', async () => {
      // Arrange
      const requestBody = {
        email: 'test@example.com',
        password: 'wrongpassword'
      };

      mockUserService.authenticateUser.mockResolvedValue(null);
      const request = createMockRequest(requestBody);

      // Act
      const response = await POST(request);
      const responseData = await response.json();

      // Assert
      expect(response.status).toBe(401);
      expect(responseData).toEqual({
        error: 'メールアドレスまたはパスワードが正しくありません'
      });
      expect(mockUserService.authenticateUser).toHaveBeenCalledWith('test@example.com', 'wrongpassword');
      expect(mockUserService.setAuthCookie).not.toHaveBeenCalled();
    });
  });

  describe('システムエラー', () => {
    it('authenticateUserでエラーが発生した場合は500エラーを返し、ログに記録する', async () => {
      // Arrange
      const requestBody = {
        email: 'test@example.com',
        password: 'password123'
      };

      const dbError = new Error('Database connection failed');
      mockUserService.authenticateUser.mockRejectedValue(dbError);
      const request = createMockRequest(requestBody);

      // Act
      const response = await POST(request);
      const responseData = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(responseData).toEqual({
        error: 'ログイン処理中にエラーが発生しました'
      });
      
      // ログ出力の確認
      expect(mockLogger.error).toHaveBeenCalledWith('Login error occurred', {
        email: 'test@example.com',
        error: 'Database connection failed',
        stack: dbError.stack
      });
      
      expect(mockUserService.setAuthCookie).not.toHaveBeenCalled();
    });

    it('JSON解析エラーが発生した場合は500エラーを返し、ログに記録する', async () => {
      // Arrange
      const jsonError = new Error('Invalid JSON');
      const request = {
        json: jest.fn().mockRejectedValue(jsonError),
      } as unknown as NextRequest;

      // Act
      const response = await POST(request);
      const responseData = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(responseData).toEqual({
        error: 'ログイン処理中にエラーが発生しました'
      });
      
      // ログ出力の確認（メールアドレスが取得できない場合）
      expect(mockLogger.error).toHaveBeenCalledWith('Login error occurred', {
        email: 'unknown',
        error: 'Invalid JSON',
        stack: jsonError.stack
      });
    });
  });

  describe('ログ出力テスト', () => {
    it('エラー発生時に適切なコンテキスト情報がログに記録される', async () => {
      // Arrange
      const requestBody = {
        email: 'user@example.com',
        password: 'testpass'
      };

      const customError = new Error('Custom database error');
      customError.stack = 'Error: Custom database error\n    at someFunction...';
      
      mockUserService.authenticateUser.mockRejectedValue(customError);
      const request = createMockRequest(requestBody);

      // Act
      await POST(request);

      // Assert
      expect(mockLogger.error).toHaveBeenCalledTimes(1);
      expect(mockLogger.error).toHaveBeenCalledWith('Login error occurred', {
        email: 'user@example.com',
        error: 'Custom database error',
        stack: 'Error: Custom database error\n    at someFunction...'
      });
    });
  });
});