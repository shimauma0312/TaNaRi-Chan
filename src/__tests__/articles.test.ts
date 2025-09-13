/**
 * Articles API Test Suite
 * 
 * Features tested:
 * - GET requests (all articles and specific article by ID)
 * - POST requests (create new article)
 * - PUT requests (update existing article)  
 * - DELETE requests (remove article)
 * - Error handling scenarios
 * - Input validation tests
 * - Database interaction mocks
 */

import { NextRequest, NextResponse } from 'next/server';
import { GET, POST, PUT, DELETE } from '../app/api/articles/route';
import { PrismaClient } from '@prisma/client';

// Mock Prisma Client
jest.mock('@prisma/client', () => {
  const mockPrismaClient = {
    post: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };
  
  return {
    PrismaClient: jest.fn(() => mockPrismaClient),
  };
});

// Mock logger to avoid file operations during tests
jest.mock('../logging/logging', () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

// Mock error handler
jest.mock('../utils/errorHandler', () => ({
  AppError: jest.fn().mockImplementation((message, type, statusCode) => {
    const error = new Error(message);
    (error as any).type = type;
    (error as any).statusCode = statusCode;
    return error;
  }),
  createApiErrorResponse: jest.fn((error, fallback) => ({
    error: error?.message || fallback || 'Internal server error occurred',
    type: error?.type || 'SERVER_ERROR',
    statusCode: error?.statusCode || 500,
    timestamp: new Date().toISOString(),
  })),
  ErrorType: {
    VALIDATION: 'VALIDATION',
    NOT_FOUND: 'NOT_FOUND',
    SERVER_ERROR: 'SERVER_ERROR',
    DATABASE_ERROR: 'DATABASE_ERROR',
  },
  handleDatabaseError: jest.fn((error) => {
    const appError = new Error(`Database error: ${error.message}`);
    (appError as any).type = 'DATABASE_ERROR';
    (appError as any).statusCode = 500;
    return appError;
  }),
}));

describe('Articles API', () => {
  let mockPrismaClient: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockPrismaClient = new PrismaClient();
  });

  describe('GET /api/articles', () => {
    describe('Get All Articles', () => {
      it('should return all articles when no post_id is provided', async () => {
        const mockArticles = [
          {
            post_id: 1,
            title: 'First Article',
            content: 'This is the first article content',
            createdAt: new Date('2024-01-01'),
          },
          {
            post_id: 2,
            title: 'Second Article',
            content: 'This is the second article content',
            createdAt: new Date('2024-01-02'),
          },
        ];

        const expectedResponse = [
          {
            post_id: 1,
            title: 'First Article',
            content: 'This is the first article content',
            createdAt: '2024-01-01T00:00:00.000Z',
          },
          {
            post_id: 2,
            title: 'Second Article',
            content: 'This is the second article content',
            createdAt: '2024-01-02T00:00:00.000Z',
          },
        ];

        mockPrismaClient.post.findMany.mockResolvedValue(mockArticles);

        const request = new NextRequest('http://localhost:3000/api/articles');
        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data).toEqual(expectedResponse);
        expect(mockPrismaClient.post.findMany).toHaveBeenCalledWith({
          select: {
            post_id: true,
            title: true,
            content: true,
            createdAt: true,
          },
        });
      });

      it('should handle database errors when fetching all articles', async () => {
        const dbError = new Error('Database connection failed');
        mockPrismaClient.post.findMany.mockRejectedValue(dbError);

        const request = new NextRequest('http://localhost:3000/api/articles');
        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.error).toBeDefined();
        expect(data.type).toBe('SERVER_ERROR');
      });
    });

    describe('Get Specific Article', () => {
      it('should return specific article when valid post_id is provided', async () => {
        const mockArticle = {
          post_id: 1,
          title: 'Specific Article',
          content: 'This is a specific article content',
          createdAt: new Date('2024-01-01'),
        };

        const expectedResponse = {
          post_id: 1,
          title: 'Specific Article',
          content: 'This is a specific article content',
          createdAt: '2024-01-01T00:00:00.000Z',
        };

        mockPrismaClient.post.findUnique.mockResolvedValue(mockArticle);

        const request = new NextRequest('http://localhost:3000/api/articles?post_id=1');
        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data).toEqual(expectedResponse);
        expect(mockPrismaClient.post.findUnique).toHaveBeenCalledWith({
          where: { post_id: 1 },
          select: {
            post_id: true,
            title: true,
            content: true,
            createdAt: true,
          },
        });
      });

      it('should return 404 when article is not found', async () => {
        mockPrismaClient.post.findUnique.mockResolvedValue(null);

        const request = new NextRequest('http://localhost:3000/api/articles?post_id=999');
        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(404);
        expect(data.error).toBe('Article not found');
        expect(data.type).toBe('NOT_FOUND');
      });

      it('should handle invalid post_id formats', async () => {
        mockPrismaClient.post.findUnique.mockResolvedValue(null);

        const request = new NextRequest('http://localhost:3000/api/articles?post_id=invalid');
        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(404);
        expect(data.error).toBe('Article not found');
      });

      it('should handle database errors when fetching specific article', async () => {
        const dbError = new Error('Database query failed');
        mockPrismaClient.post.findUnique.mockRejectedValue(dbError);

        const request = new NextRequest('http://localhost:3000/api/articles?post_id=1');
        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.error).toBeDefined();
      });
    });
  });

  describe('POST /api/articles', () => {
    it('should create a new article with valid data', async () => {
      const mockNewArticle = {
        post_id: 1,
        title: 'New Article',
        content: 'This is new article content',
        author_id: 'user123',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      };

      const requestData = {
        title: 'New Article',
        content: 'This is new article content',
        author_id: 'user123',
      };

      mockPrismaClient.post.create.mockResolvedValue(mockNewArticle);

      const request = new NextRequest('http://localhost:3000/api/articles', {
        method: 'POST',
        body: JSON.stringify(requestData),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.post_id).toBe(mockNewArticle.post_id);
      expect(data.title).toBe(mockNewArticle.title);
      expect(data.content).toBe(mockNewArticle.content);
      expect(data.author_id).toBe(mockNewArticle.author_id);
      expect(data.createdAt).toBe('2024-01-01T00:00:00.000Z');
      expect(data.updatedAt).toBe('2024-01-01T00:00:00.000Z');
      expect(mockPrismaClient.post.create).toHaveBeenCalledWith({
        data: {
          title: 'New Article',
          content: 'This is new article content',
          author_id: 'user123',
        },
      });
    });

    it('should return 400 when title is missing', async () => {
      const requestData = {
        content: 'This is new article content',
        author_id: 'user123',
      };

      const request = new NextRequest('http://localhost:3000/api/articles', {
        method: 'POST',
        body: JSON.stringify(requestData),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Title, content, and author ID are required');
      expect(data.type).toBe('VALIDATION');
    });

    it('should return 400 when content is missing', async () => {
      const requestData = {
        title: 'New Article',
        author_id: 'user123',
      };

      const request = new NextRequest('http://localhost:3000/api/articles', {
        method: 'POST',
        body: JSON.stringify(requestData),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Title, content, and author ID are required');
      expect(data.type).toBe('VALIDATION');
    });

    it('should return 400 when author_id is missing', async () => {
      const requestData = {
        title: 'New Article',
        content: 'This is new article content',
      };

      const request = new NextRequest('http://localhost:3000/api/articles', {
        method: 'POST',
        body: JSON.stringify(requestData),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Title, content, and author ID are required');
      expect(data.type).toBe('VALIDATION');
    });

    it('should handle empty strings as missing fields', async () => {
      const requestData = {
        title: '',
        content: 'This is new article content',
        author_id: 'user123',
      };

      const request = new NextRequest('http://localhost:3000/api/articles', {
        method: 'POST',
        body: JSON.stringify(requestData),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Title, content, and author ID are required');
    });

    it('should handle database errors during creation', async () => {
      const dbError = new Error('Database insert failed');
      mockPrismaClient.post.create.mockRejectedValue(dbError);

      const requestData = {
        title: 'New Article',
        content: 'This is new article content',
        author_id: 'user123',
      };

      const request = new NextRequest('http://localhost:3000/api/articles', {
        method: 'POST',
        body: JSON.stringify(requestData),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBeDefined();
    });

    it('should handle malformed JSON in request body', async () => {
      const request = new NextRequest('http://localhost:3000/api/articles', {
        method: 'POST',
        body: 'invalid json',
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBeDefined();
    });
  });

  describe('PUT /api/articles', () => {
    it('should update an existing article with valid data', async () => {
      const mockUpdatedArticle = {
        post_id: 1,
        title: 'Updated Article',
        content: 'This is updated article content',
        author_id: 'user123',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02'),
      };

      const requestData = {
        post_id: 1,
        title: 'Updated Article',
        content: 'This is updated article content',
      };

      mockPrismaClient.post.update.mockResolvedValue(mockUpdatedArticle);

      const request = new NextRequest('http://localhost:3000/api/articles', {
        method: 'PUT',
        body: JSON.stringify(requestData),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.post_id).toBe(mockUpdatedArticle.post_id);
      expect(data.title).toBe(mockUpdatedArticle.title);
      expect(data.content).toBe(mockUpdatedArticle.content);
      expect(data.author_id).toBe(mockUpdatedArticle.author_id);
      expect(data.createdAt).toBe('2024-01-01T00:00:00.000Z');
      expect(data.updatedAt).toBe('2024-01-02T00:00:00.000Z');
      expect(mockPrismaClient.post.update).toHaveBeenCalledWith({
        where: { post_id: 1 },
        data: {
          title: 'Updated Article',
          content: 'This is updated article content',
        },
      });
    });

    it('should return 400 when post_id is missing', async () => {
      const requestData = {
        title: 'Updated Article',
        content: 'This is updated article content',
      };

      const request = new NextRequest('http://localhost:3000/api/articles', {
        method: 'PUT',
        body: JSON.stringify(requestData),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Post ID, title, and content are required');
      expect(data.type).toBe('VALIDATION');
    });

    it('should return 400 when title is missing', async () => {
      const requestData = {
        post_id: 1,
        content: 'This is updated article content',
      };

      const request = new NextRequest('http://localhost:3000/api/articles', {
        method: 'PUT',
        body: JSON.stringify(requestData),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Post ID, title, and content are required');
    });

    it('should return 400 when content is missing', async () => {
      const requestData = {
        post_id: 1,
        title: 'Updated Article',
      };

      const request = new NextRequest('http://localhost:3000/api/articles', {
        method: 'PUT',
        body: JSON.stringify(requestData),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Post ID, title, and content are required');
    });

    it('should handle database errors during update', async () => {
      const dbError = new Error('Database update failed');
      mockPrismaClient.post.update.mockRejectedValue(dbError);

      const requestData = {
        post_id: 1,
        title: 'Updated Article',
        content: 'This is updated article content',
      };

      const request = new NextRequest('http://localhost:3000/api/articles', {
        method: 'PUT',
        body: JSON.stringify(requestData),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBeDefined();
    });

    it('should handle empty strings as missing fields', async () => {
      const requestData = {
        post_id: 1,
        title: '',
        content: 'This is updated article content',
      };

      const request = new NextRequest('http://localhost:3000/api/articles', {
        method: 'PUT',
        body: JSON.stringify(requestData),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Post ID, title, and content are required');
    });
  });

  describe('DELETE /api/articles', () => {
    it('should delete an existing article with valid post_id', async () => {
      const mockDeletedArticle = {
        post_id: 1,
        title: 'Deleted Article',
        content: 'This article will be deleted',
        author_id: 'user123',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      };

      const requestData = {
        post_id: 1,
      };

      mockPrismaClient.post.delete.mockResolvedValue(mockDeletedArticle);

      const request = new NextRequest('http://localhost:3000/api/articles', {
        method: 'DELETE',
        body: JSON.stringify(requestData),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.post_id).toBe(mockDeletedArticle.post_id);
      expect(data.title).toBe(mockDeletedArticle.title);
      expect(data.content).toBe(mockDeletedArticle.content);
      expect(data.author_id).toBe(mockDeletedArticle.author_id);
      expect(data.createdAt).toBe('2024-01-01T00:00:00.000Z');
      expect(data.updatedAt).toBe('2024-01-01T00:00:00.000Z');
      expect(mockPrismaClient.post.delete).toHaveBeenCalledWith({
        where: { post_id: 1 },
      });
    });

    it('should return 400 when post_id is missing', async () => {
      const requestData = {};

      const request = new NextRequest('http://localhost:3000/api/articles', {
        method: 'DELETE',
        body: JSON.stringify(requestData),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Post ID is required');
      expect(data.type).toBe('VALIDATION');
    });

    it('should handle database errors during deletion', async () => {
      const dbError = new Error('Database delete failed');
      mockPrismaClient.post.delete.mockRejectedValue(dbError);

      const requestData = {
        post_id: 1,
      };

      const request = new NextRequest('http://localhost:3000/api/articles', {
        method: 'DELETE',
        body: JSON.stringify(requestData),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBeDefined();
    });

    it('should handle record not found during deletion', async () => {
      const dbError = { code: 'P2025', message: 'Record to delete does not exist.' };
      mockPrismaClient.post.delete.mockRejectedValue(dbError);

      const requestData = {
        post_id: 999,
      };

      const request = new NextRequest('http://localhost:3000/api/articles', {
        method: 'DELETE',
        body: JSON.stringify(requestData),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBeDefined();
    });

    it('should handle null or undefined post_id', async () => {
      const requestData = {
        post_id: null,
      };

      const request = new NextRequest('http://localhost:3000/api/articles', {
        method: 'DELETE',
        body: JSON.stringify(requestData),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Post ID is required');
    });
  });

  describe('Edge Cases and Error Scenarios', () => {
    it('should handle empty request body', async () => {
      const request = new NextRequest('http://localhost:3000/api/articles', {
        method: 'POST',
        body: '',
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBeDefined();
    });

    it('should handle large article content', async () => {
      const largeContent = 'A'.repeat(10000); // 10KB content
      const mockNewArticle = {
        post_id: 1,
        title: 'Large Article',
        content: largeContent,
        author_id: 'user123',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaClient.post.create.mockResolvedValue(mockNewArticle);

      const requestData = {
        title: 'Large Article',
        content: largeContent,
        author_id: 'user123',
      };

      const request = new NextRequest('http://localhost:3000/api/articles', {
        method: 'POST',
        body: JSON.stringify(requestData),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.content).toBe(largeContent);
    });

    it('should handle special characters in content', async () => {
      const specialContent = 'Article with 特殊文字, emojis 🚀🎉, and symbols @#$%^&*()';
      const mockNewArticle = {
        post_id: 1,
        title: 'Special Characters Article',
        content: specialContent,
        author_id: 'user123',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaClient.post.create.mockResolvedValue(mockNewArticle);

      const requestData = {
        title: 'Special Characters Article',
        content: specialContent,
        author_id: 'user123',
      };

      const request = new NextRequest('http://localhost:3000/api/articles', {
        method: 'POST',
        body: JSON.stringify(requestData),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.content).toBe(specialContent);
    });

    it('should handle numeric post_id as string in URL parameters', async () => {
      const mockArticle = {
        post_id: 123,
        title: 'Numeric ID Article',
        content: 'Article with numeric ID',
        createdAt: new Date(),
      };

      mockPrismaClient.post.findUnique.mockResolvedValue(mockArticle);

      const request = new NextRequest('http://localhost:3000/api/articles?post_id=123');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.post_id).toBe(123);
      expect(data.title).toBe('Numeric ID Article');
      expect(data.content).toBe('Article with numeric ID');
      expect(typeof data.createdAt).toBe('string'); // Should be ISO string
      expect(mockPrismaClient.post.findUnique).toHaveBeenCalledWith({
        where: { post_id: 123 },
        select: {
          post_id: true,
          title: true,
          content: true,
          createdAt: true,
        },
      });
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle complete CRUD workflow', async () => {
      // CREATE
      const newArticleData = {
        title: 'Integration Test Article',
        content: 'This is for integration testing',
        author_id: 'user123',
      };

      const createdArticle = {
        post_id: 1,
        ...newArticleData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaClient.post.create.mockResolvedValue(createdArticle);

      const createRequest = new NextRequest('http://localhost:3000/api/articles', {
        method: 'POST',
        body: JSON.stringify(newArticleData),
        headers: { 'Content-Type': 'application/json' },
      });

      const createResponse = await POST(createRequest);
      expect(createResponse.status).toBe(201);

      // READ
      mockPrismaClient.post.findUnique.mockResolvedValue(createdArticle);

      const readRequest = new NextRequest('http://localhost:3000/api/articles?post_id=1');
      const readResponse = await GET(readRequest);
      expect(readResponse.status).toBe(200);

      // UPDATE
      const updateData = {
        post_id: 1,
        title: 'Updated Integration Test Article',
        content: 'This content has been updated',
      };

      const updatedArticle = {
        ...createdArticle,
        ...updateData,
        updatedAt: new Date(),
      };

      mockPrismaClient.post.update.mockResolvedValue(updatedArticle);

      const updateRequest = new NextRequest('http://localhost:3000/api/articles', {
        method: 'PUT',
        body: JSON.stringify(updateData),
        headers: { 'Content-Type': 'application/json' },
      });

      const updateResponse = await PUT(updateRequest);
      expect(updateResponse.status).toBe(200);

      // DELETE
      mockPrismaClient.post.delete.mockResolvedValue(updatedArticle);

      const deleteRequest = new NextRequest('http://localhost:3000/api/articles', {
        method: 'DELETE',
        body: JSON.stringify({ post_id: 1 }),
        headers: { 'Content-Type': 'application/json' },
      });

      const deleteResponse = await DELETE(deleteRequest);
      expect(deleteResponse.status).toBe(200);
    });
  });
});