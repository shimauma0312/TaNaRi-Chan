/**
 * ユーザー認証サービステスト
 * 
 * authenticateUser関数のテストケース：
 * - 正常なログイン
 * - 無効なメール・パスワード
 * - データベースエラー時の例外伝播
 */

import { PrismaClient } from '@prisma/client';

// Prismaクライアントを完全にモック
jest.mock('@prisma/client', () => {
  const mockPrisma = {
    user: {
      findUnique: jest.fn(),
    },
  };
  return {
    PrismaClient: jest.fn().mockImplementation(() => mockPrisma),
  };
});

// bcryptjsをモック
jest.mock('bcryptjs', () => ({
  compare: jest.fn(),
}));

// userServiceをモック後にインポート
import { authenticateUser } from '@/service/userService';
import bcrypt from 'bcryptjs';

const mockBcryptCompare = bcrypt.compare as jest.MockedFunction<typeof bcrypt.compare>;

// Prismaクライアントのインスタンスを取得
const mockPrismaInstance = new PrismaClient();
const mockPrisma = mockPrismaInstance as jest.Mocked<PrismaClient>;

describe('authenticateUser', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('正常系', () => {
    it('有効なメールアドレスとパスワードでユーザーを認証できる', async () => {
      // Arrange
      const email = 'test@example.com';
      const password = 'password123';
      const hashedPassword = 'hashed_password';
      
      const mockUser = {
        id: 'user123',
        user_name: 'テストユーザー',
        user_email: email,
        icon_number: 1,
        password: hashedPassword,
      };

      mockPrisma.user.findUnique = jest.fn().mockResolvedValue(mockUser);
      (mockBcryptCompare as jest.Mock).mockResolvedValue(true);

      // Act
      const result = await authenticateUser(email, password);

      // Assert
      expect(result).toEqual({
        id: 'user123',
        user_name: 'テストユーザー',
        user_email: email,
        icon_number: 1,
      });
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { user_email: email },
        select: {
          id: true,
          user_name: true,
          user_email: true,
          icon_number: true,
          password: true,
        },
      });
      expect(mockBcryptCompare).toHaveBeenCalledWith(password, hashedPassword);
    });
  });

  describe('異常系 - 認証失敗', () => {
    it('存在しないメールアドレスの場合はnullを返す', async () => {
      // Arrange
      const email = 'nonexistent@example.com';
      const password = 'password123';

      mockPrisma.user.findUnique = jest.fn().mockResolvedValue(null);

      // Act
      const result = await authenticateUser(email, password);

      // Assert
      expect(result).toBeNull();
      expect(mockBcryptCompare).not.toHaveBeenCalled();
    });

    it('パスワードが間違っている場合はnullを返す', async () => {
      // Arrange
      const email = 'test@example.com';
      const password = 'wrongpassword';
      const hashedPassword = 'hashed_password';
      
      const mockUser = {
        id: 'user123',
        user_name: 'テストユーザー',
        user_email: email,
        icon_number: 1,
        password: hashedPassword,
      };

      mockPrisma.user.findUnique = jest.fn().mockResolvedValue(mockUser);
      (mockBcryptCompare as jest.Mock).mockResolvedValue(false);

      // Act
      const result = await authenticateUser(email, password);

      // Assert
      expect(result).toBeNull();
      expect(mockBcryptCompare).toHaveBeenCalledWith(password, hashedPassword);
    });
  });

  describe('異常系 - システムエラー', () => {
    it('データベースエラーが発生した場合は例外を上位に伝播する', async () => {
      // Arrange
      const email = 'test@example.com';
      const password = 'password123';
      const dbError = new Error('Database connection failed');

      mockPrisma.user.findUnique = jest.fn().mockRejectedValue(dbError);

      // Act & Assert
      await expect(authenticateUser(email, password)).rejects.toThrow('Database connection failed');
      expect(mockBcryptCompare).not.toHaveBeenCalled();
    });

    it('bcryptエラーが発生した場合は例外を上位に伝播する', async () => {
      // Arrange
      const email = 'test@example.com';
      const password = 'password123';
      const hashedPassword = 'hashed_password';
      
      const mockUser = {
        id: 'user123',
        user_name: 'テストユーザー',
        user_email: email,
        icon_number: 1,
        password: hashedPassword,
      };

      const bcryptError = new Error('bcrypt comparison failed');
      mockPrisma.user.findUnique = jest.fn().mockResolvedValue(mockUser);
      (mockBcryptCompare as jest.Mock).mockRejectedValue(bcryptError);

      // Act & Assert
      await expect(authenticateUser(email, password)).rejects.toThrow('bcrypt comparison failed');
    });
  });

  describe('セキュリティテスト', () => {
    it('返却されるユーザー情報にパスワードが含まれない', async () => {
      // Arrange
      const email = 'test@example.com';
      const password = 'password123';
      const hashedPassword = 'hashed_password';
      
      const mockUser = {
        id: 'user123',
        user_name: 'テストユーザー',
        user_email: email,
        icon_number: 1,
        password: hashedPassword,
      };

      mockPrisma.user.findUnique = jest.fn().mockResolvedValue(mockUser);
      (mockBcryptCompare as jest.Mock).mockResolvedValue(true);

      // Act
      const result = await authenticateUser(email, password);

      // Assert
      expect(result).toBeDefined();
      expect(result).not.toHaveProperty('password');
      expect(Object.keys(result!)).toEqual(['id', 'user_name', 'user_email', 'icon_number']);
    });
  });
});