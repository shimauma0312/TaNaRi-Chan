/**
 * Articles API Test Suite
 * 
 * Features tested:
 * - GET /api/articles (get all articles)
 * - GET /api/articles?post_id=X (get specific article)
 * - POST /api/articles (create new article)
 * - PUT /api/articles (update existing article)
 * - DELETE /api/articles (delete article)
 * - Error handling for all endpoints
 * - Database error scenarios
 * - Validation error scenarios
 */

import { NextRequest } from 'next/server';
import { ErrorType } from '../utils/errorHandler';

// Mock PrismaClient with proper structure
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    post: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  })),
}));

// Mock logger - need to match the correct import path
jest.mock('@/logging/logging', () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

// Import after mocking
import { PrismaClient } from '@prisma/client';
import { DELETE, GET, POST, PUT } from '../app/api/articles/route';

// Get mock instance
const mockPrisma = new PrismaClient() as jest.Mocked<PrismaClient>;
const mockPrismaPost = mockPrisma.post;

// Helper function to create a mock Request using built-in Request
function createMockRequest(method: string, url: string, body?: any): Request {
  const headers = new Headers();
  headers.set('content-type', 'application/json');

  const request = new Request(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  return request as NextRequest;
}

describe('Articles API - GET Endpoint', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/articles (get all articles)', () => {
    test('should return all articles successfully', async () => {
      const mockArticles = [
        {
          post_id: 1,
          title: 'First Article',
          content: 'First content',
          createdAt: new Date('2024-01-01'),
        },
        {
          post_id: 2,
          title: 'Second Article',
          content: 'Second content',
          createdAt: new Date('2024-01-02'),
        },
      ];

      mockPrismaPost.findMany.mockResolvedValue(mockArticles);

      const request = createMockRequest('GET', 'http://localhost:3000/api/articles');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(mockArticles);
      expect(mockPrismaPost.findMany).toHaveBeenCalledWith({
        select: {
          post_id: true,
          title: true,
          content: true,
          createdAt: true,
        },
      });
    });

    test('should handle database error when fetching all articles', async () => {
      const dbError = {
        code: 'P2021',
        message: 'Table does not exist',
        name: 'PrismaError',
      };

      mockPrismaPost.findMany.mockRejectedValue(dbError);

      const request = createMockRequest('GET', 'http://localhost:3000/api/articles');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toContain('Failed to fetch articles');
      expect(data.type).toBe(ErrorType.SERVER_ERROR);
    });
  });

  describe('GET /api/articles?post_id=X (get specific article)', () => {
    test('should return specific article successfully', async () => {
      const mockArticle = {
        post_id: 1,
        title: 'Specific Article',
        content: 'Specific content',
        createdAt: new Date('2024-01-01'),
      };

      mockPrismaPost.findUnique.mockResolvedValue(mockArticle);

      const request = createMockRequest('GET', 'http://localhost:3000/api/articles?post_id=1');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(mockArticle);
      expect(mockPrismaPost.findUnique).toHaveBeenCalledWith({
        where: { post_id: 1 },
        select: {
          post_id: true,
          title: true,
          content: true,
          createdAt: true,
        },
      });
    });

    test('should return 404 when article not found', async () => {
      mockPrismaPost.findUnique.mockResolvedValue(null);

      const request = createMockRequest('GET', 'http://localhost:3000/api/articles?post_id=999');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Article not found');
      expect(data.type).toBe(ErrorType.NOT_FOUND);
    });

    test('should handle invalid post_id parameter', async () => {
      const request = createMockRequest('GET', 'http://localhost:3000/api/articles?post_id=invalid');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Article not found');
    });
  });
});

describe('Articles API - POST Endpoint', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should create new article successfully', async () => {
    const newArticleData = {
      title: 'New Article',
      content: 'New article content',
      author_id: 'user123',
    };

    const createdArticle = {
      post_id: 3,
      ...newArticleData,
      createdAt: new Date('2024-01-03'),
    };

    mockPrismaPost.create.mockResolvedValue(createdArticle);

    const request = createMockRequest('POST', 'http://localhost:3000/api/articles', newArticleData);
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data).toEqual(createdArticle);
    expect(mockPrismaPost.create).toHaveBeenCalledWith({
      data: newArticleData,
    });
  });

  test('should return 400 when title is missing', async () => {
    const incompleteData = {
      content: 'Content without title',
      author_id: 'user123',
    };

    const request = createMockRequest('POST', 'http://localhost:3000/api/articles', incompleteData);
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Title, content, and author ID are required');
    expect(data.type).toBe(ErrorType.VALIDATION);
    expect(mockPrismaPost.create).not.toHaveBeenCalled();
  });

  test('should return 400 when content is missing', async () => {
    const incompleteData = {
      title: 'Title without content',
      author_id: 'user123',
    };

    const request = createMockRequest('POST', 'http://localhost:3000/api/articles', incompleteData);
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Title, content, and author ID are required');
    expect(data.type).toBe(ErrorType.VALIDATION);
  });

  test('should return 400 when author_id is missing', async () => {
    const incompleteData = {
      title: 'Title',
      content: 'Content',
    };

    const request = createMockRequest('POST', 'http://localhost:3000/api/articles', incompleteData);
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Title, content, and author ID are required');
    expect(data.type).toBe(ErrorType.VALIDATION);
  });

  test('should handle database constraint violation', async () => {
    const newArticleData = {
      title: 'Duplicate Title',
      content: 'Content',
      author_id: 'user123',
    };

    const dbError = {
      code: 'P2002',
      message: 'Unique constraint failed',
      name: 'PrismaError',
      meta: { target: ['title'] },
    };

    mockPrismaPost.create.mockRejectedValue(dbError);

    const request = createMockRequest('POST', 'http://localhost:3000/api/articles', newArticleData);
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('Duplicate data constraint violation');
    expect(data.type).toBe(ErrorType.VALIDATION);
  });

  test('should handle malformed JSON request', async () => {
    const request = new NextRequest('http://localhost:3000/api/articles', {
      method: 'POST',
      body: 'invalid json',
      headers: { 'content-type': 'application/json' },
    }) as NextRequest;

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toContain('Failed to create article');
  });
});

describe('Articles API - PUT Endpoint', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should update article successfully', async () => {
    const updateData = {
      post_id: 1,
      title: 'Updated Title',
      content: 'Updated content',
    };

    const updatedArticle = {
      ...updateData,
      author_id: 'user123',
      createdAt: new Date('2024-01-01'),
    };

    mockPrismaPost.update.mockResolvedValue(updatedArticle);

    const request = createMockRequest('PUT', 'http://localhost:3000/api/articles', updateData);
    const response = await PUT(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual(updatedArticle);
    expect(mockPrismaPost.update).toHaveBeenCalledWith({
      where: { post_id: updateData.post_id },
      data: {
        title: updateData.title,
        content: updateData.content,
      },
    });
  });

  test('should return 400 when post_id is missing', async () => {
    const incompleteData = {
      title: 'Updated Title',
      content: 'Updated content',
    };

    const request = createMockRequest('PUT', 'http://localhost:3000/api/articles', incompleteData);
    const response = await PUT(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Post ID, title, and content are required');
    expect(data.type).toBe(ErrorType.VALIDATION);
    expect(mockPrismaPost.update).not.toHaveBeenCalled();
  });

  test('should return 400 when title is missing', async () => {
    const incompleteData = {
      post_id: 1,
      content: 'Updated content',
    };

    const request = createMockRequest('PUT', 'http://localhost:3000/api/articles', incompleteData);
    const response = await PUT(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Post ID, title, and content are required');
    expect(data.type).toBe(ErrorType.VALIDATION);
  });

  test('should return 400 when content is missing', async () => {
    const incompleteData = {
      post_id: 1,
      title: 'Updated Title',
    };

    const request = createMockRequest('PUT', 'http://localhost:3000/api/articles', incompleteData);
    const response = await PUT(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Post ID, title, and content are required');
    expect(data.type).toBe(ErrorType.VALIDATION);
  });

  test('should handle article not found during update', async () => {
    const updateData = {
      post_id: 999,
      title: 'Updated Title',
      content: 'Updated content',
    };

    const dbError = {
      code: 'P2025',
      message: 'Record not found',
      name: 'PrismaError',
    };

    mockPrismaPost.update.mockRejectedValue(dbError);

    const request = createMockRequest('PUT', 'http://localhost:3000/api/articles', updateData);
    const response = await PUT(request);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Requested data not found');
    expect(data.type).toBe(ErrorType.NOT_FOUND);
  });
});

describe('Articles API - DELETE Endpoint', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should delete article successfully', async () => {
    const deleteData = { post_id: 1 };
    const deletedArticle = {
      post_id: 1,
      title: 'Deleted Article',
      content: 'Deleted content',
      author_id: 'user123',
      createdAt: new Date('2024-01-01'),
    };

    mockPrismaPost.delete.mockResolvedValue(deletedArticle);

    const request = createMockRequest('DELETE', 'http://localhost:3000/api/articles', deleteData);
    const response = await DELETE(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual(deletedArticle);
    expect(mockPrismaPost.delete).toHaveBeenCalledWith({
      where: { post_id: deleteData.post_id },
    });
  });

  test('should return 400 when post_id is missing', async () => {
    const incompleteData = {};

    const request = createMockRequest('DELETE', 'http://localhost:3000/api/articles', incompleteData);
    const response = await DELETE(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Post ID is required');
    expect(data.type).toBe(ErrorType.VALIDATION);
    expect(mockPrismaPost.delete).not.toHaveBeenCalled();
  });

  test('should handle article not found during deletion', async () => {
    const deleteData = { post_id: 999 };

    const dbError = {
      code: 'P2025',
      message: 'Record not found',
      name: 'PrismaError',
    };

    mockPrismaPost.delete.mockRejectedValue(dbError);

    const request = createMockRequest('DELETE', 'http://localhost:3000/api/articles', deleteData);
    const response = await DELETE(request);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Requested data not found');
    expect(data.type).toBe(ErrorType.NOT_FOUND);
  });

  test('should handle database constraint violation during deletion', async () => {
    const deleteData = { post_id: 1 };

    const dbError = {
      code: 'P2003',
      message: 'Foreign key constraint failed',
      name: 'PrismaError',
    };

    mockPrismaPost.delete.mockRejectedValue(dbError);

    const request = createMockRequest('DELETE', 'http://localhost:3000/api/articles', deleteData);
    const response = await DELETE(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Related data does not exist');
    expect(data.type).toBe(ErrorType.VALIDATION);
  });
});

describe('Articles API - Edge Cases and Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should handle empty string values in POST', async () => {
    const emptyData = {
      title: '',
      content: '',
      author_id: '',
    };

    const request = createMockRequest('POST', 'http://localhost:3000/api/articles', emptyData);
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Title, content, and author ID are required');
    expect(data.type).toBe(ErrorType.VALIDATION);
  });

  test('should handle whitespace-only values in POST', async () => {
    const whitespaceData = {
      title: '   ',
      content: '   ',
      author_id: '   ',
    };

    const request = createMockRequest('POST', 'http://localhost:3000/api/articles', whitespaceData);
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Title, content, and author ID are required');
    expect(data.type).toBe(ErrorType.VALIDATION);
  });

  test('should handle numeric post_id as string in GET request', async () => {
    const mockArticle = {
      post_id: 1,
      title: 'Article with numeric ID',
      content: 'Content',
      createdAt: new Date('2024-01-01'),
    };

    mockPrismaPost.findUnique.mockResolvedValue(mockArticle);

    const request = createMockRequest('GET', 'http://localhost:3000/api/articles?post_id=1');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual(mockArticle);
    expect(mockPrismaPost.findUnique).toHaveBeenCalledWith({
      where: { post_id: 1 },
      select: {
        post_id: true,
        title: true,
        content: true,
        createdAt: true,
      },
    });
  });

  test('should handle very large article content', async () => {
    const largeContent = 'x'.repeat(10000); // 10KB content
    const articleData = {
      title: 'Large Article',
      content: largeContent,
      author_id: 'user123',
    };

    const createdArticle = {
      post_id: 1,
      ...articleData,
      createdAt: new Date('2024-01-01'),
    };

    mockPrismaPost.create.mockResolvedValue(createdArticle);

    const request = createMockRequest('POST', 'http://localhost:3000/api/articles', articleData);
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.content).toBe(largeContent);
    expect(mockPrismaPost.create).toHaveBeenCalledWith({
      data: articleData,
    });
  });

  test('should maintain data integrity across operations', async () => {
    // Test sequence: Create -> Read -> Update -> Read -> Delete
    const originalData = {
      title: 'Test Article',
      content: 'Original content',
      author_id: 'user123',
    };

    const createdArticle = {
      post_id: 1,
      ...originalData,
      createdAt: new Date('2024-01-01'),
    };

    // Create
    mockPrismaPost.create.mockResolvedValue(createdArticle);

    let request = createMockRequest('POST', 'http://localhost:3000/api/articles', originalData);
    let response = await POST(request);

    expect(response.status).toBe(201);

    // Read
    mockPrismaPost.findUnique.mockResolvedValue(createdArticle);

    request = createMockRequest('GET', 'http://localhost:3000/api/articles?post_id=1');
    response = await GET(request);
    let data = await response.json();

    expect(response.status).toBe(200);
    expect(data.post_id).toBe(1);

    // Update
    const updateData = {
      post_id: 1,
      title: 'Updated Article',
      content: 'Updated content',
    };

    const updatedArticle = {
      ...createdArticle,
      ...updateData,
    };

    mockPrismaPost.update.mockResolvedValue(updatedArticle);

    request = createMockRequest('PUT', 'http://localhost:3000/api/articles', updateData);
    response = await PUT(request);

    expect(response.status).toBe(200);

    // Delete
    mockPrismaPost.delete.mockResolvedValue(updatedArticle);

    request = createMockRequest('DELETE', 'http://localhost:3000/api/articles', { post_id: 1 });
    response = await DELETE(request);

    expect(response.status).toBe(200);
  });
});
