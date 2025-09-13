/**
 * Articles API Test Suite
 * 
 * Comprehensive tests for the Articles API including:
 * - GET endpoint (all articles and single article by ID)
 * - POST endpoint (create article with validation)
 * - PUT endpoint (update article with validation)
 * - DELETE endpoint (delete article)
 * - Error handling scenarios
 * - Edge cases and validation
 */

import { NextRequest } from 'next/server';

// Mock Prisma Client using __mocks__
jest.mock('@prisma/client');

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

// Import after mocking
import { GET, POST, PUT, DELETE } from '../app/api/articles/route';
import { ErrorType } from '../utils/errorHandler';
// @ts-ignore
const { mockPost } = require('../__mocks__/@prisma/client');

describe('Articles API', () => {
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    mockPost.findMany.mockReset();
    mockPost.findUnique.mockReset();
    mockPost.create.mockReset();
    mockPost.update.mockReset();
    mockPost.delete.mockReset();
  });

  describe('GET /api/articles', () => {
    describe('Get all articles', () => {
      it('should return all articles when no post_id is provided', async () => {
        const mockArticles = [
          {
            post_id: 1,
            title: 'First Article',
            content: 'Content of first article',
            createdAt: new Date('2024-01-01'),
          },
          {
            post_id: 2,
            title: 'Second Article',
            content: 'Content of second article',
            createdAt: new Date('2024-01-02'),
          },
        ];

        mockPost.findMany.mockResolvedValue(mockArticles);
        
        const request = new NextRequest('http://localhost:3000/api/articles');
        const response = await GET(request);
        const responseData = await response.json();

        expect(mockPost.findMany).toHaveBeenCalledWith({
          select: {
            post_id: true,
            title: true,
            content: true,
            createdAt: true,
          }
        });
        expect(response.status).toBe(200);
        // Verify that dates are serialized correctly in the response
        expect(responseData[0]).toMatchObject({
          post_id: 1,
          title: 'First Article',
          content: 'Content of first article',
          createdAt: '2024-01-01T00:00:00.000Z',
        });
        expect(responseData[1]).toMatchObject({
          post_id: 2,
          title: 'Second Article',
          content: 'Content of second article',
          createdAt: '2024-01-02T00:00:00.000Z',
        });
      });

      it('should handle empty articles list', async () => {
        mockPost.findMany.mockResolvedValue([]);
        
        const request = new NextRequest('http://localhost:3000/api/articles');
        const response = await GET(request);
        const responseData = await response.json();

        expect(mockPost.findMany).toHaveBeenCalled();
        expect(response.status).toBe(200);
        expect(responseData).toEqual([]);
      });
    });

    describe('Get single article', () => {
      it('should return specific article when valid post_id is provided', async () => {
        const mockArticle = {
          post_id: 1,
          title: 'Specific Article',
          content: 'Content of specific article',
          createdAt: new Date('2024-01-01'),
        };

        mockPost.findUnique.mockResolvedValue(mockArticle);
        
        const request = new NextRequest('http://localhost:3000/api/articles?post_id=1');
        const response = await GET(request);
        const responseData = await response.json();

        expect(mockPost.findUnique).toHaveBeenCalledWith({
          where: {
            post_id: 1
          },
          select: {
            post_id: true,
            title: true,
            content: true,
            createdAt: true,
          }
        });
        expect(response.status).toBe(200);
        expect(responseData).toMatchObject({
          post_id: 1,
          title: 'Specific Article',
          content: 'Content of specific article',
          createdAt: '2024-01-01T00:00:00.000Z',
        });
      });

      it('should return 404 error when article is not found', async () => {
        mockPost.findUnique.mockResolvedValue(null);
        
        const request = new NextRequest('http://localhost:3000/api/articles?post_id=999');
        const response = await GET(request);
        const responseData = await response.json();

        expect(mockPost.findUnique).toHaveBeenCalledWith({
          where: {
            post_id: 999
          },
          select: {
            post_id: true,
            title: true,
            content: true,
            createdAt: true,
          }
        });
        expect(response.status).toBe(404);
        expect(responseData.error).toBe('Article not found');
        expect(responseData.type).toBe(ErrorType.NOT_FOUND);
      });

      it('should handle invalid post_id format gracefully', async () => {
        // Invalid number should be converted to NaN and then handled
        mockPost.findUnique.mockResolvedValue(null);
        
        const request = new NextRequest('http://localhost:3000/api/articles?post_id=invalid');
        const response = await GET(request);
        const responseData = await response.json();

        expect(mockPost.findUnique).toHaveBeenCalledWith({
          where: {
            post_id: NaN
          },
          select: {
            post_id: true,
            title: true,
            content: true,
            createdAt: true,
          }
        });
        // Should return null for invalid post_id, which triggers 404
        expect(response.status).toBe(404);
      });
    });

    describe('Error handling', () => {
      it('should handle database errors gracefully', async () => {
        const dbError = new Error('Database connection failed');
        mockPost.findMany.mockRejectedValue(dbError);
        
        const request = new NextRequest('http://localhost:3000/api/articles');
        const response = await GET(request);
        const responseData = await response.json();

        expect(response.status).toBe(500);
        expect(responseData.error).toBe('Database connection failed');
      });
    });
  });

  describe('POST /api/articles', () => {
    describe('Valid article creation', () => {
      it('should create article with valid data', async () => {
        const newArticleData = {
          title: 'New Article',
          content: 'Content of new article',
          author_id: 'user123',
        };

        const createdArticle = {
          post_id: 1,
          ...newArticleData,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        mockPost.create.mockResolvedValue(createdArticle);
        
        const request = new NextRequest('http://localhost:3000/api/articles', {
          method: 'POST',
          body: JSON.stringify(newArticleData),
          headers: {
            'Content-Type': 'application/json',
          },
        });

        const response = await POST(request);
        const responseData = await response.json();

        expect(mockPost.create).toHaveBeenCalledWith({
          data: {
            title: newArticleData.title,
            content: newArticleData.content,
            author_id: newArticleData.author_id,
          },
        });
        expect(response.status).toBe(201);
        expect(responseData).toMatchObject({
          post_id: 1,
          title: 'New Article',
          content: 'Content of new article',
          author_id: 'user123',
        });
      });

      it('should handle article with special characters', async () => {
        const newArticleData = {
          title: 'Article with 特殊文字 and émojis 🚀',
          content: 'Content with special chars: @#$%^&*()',
          author_id: 'user123',
        };

        const createdArticle = {
          post_id: 1,
          ...newArticleData,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        mockPost.create.mockResolvedValue(createdArticle);
        
        const request = new NextRequest('http://localhost:3000/api/articles', {
          method: 'POST',
          body: JSON.stringify(newArticleData),
          headers: {
            'Content-Type': 'application/json',
          },
        });

        const response = await POST(request);

        expect(mockPost.create).toHaveBeenCalledWith({
          data: newArticleData,
        });
        expect(response.status).toBe(201);
      });
    });

    describe('Validation errors', () => {
      it('should return 400 error when title is missing', async () => {
        const invalidData = {
          content: 'Content without title',
          author_id: 'user123',
        };

        const request = new NextRequest('http://localhost:3000/api/articles', {
          method: 'POST',
          body: JSON.stringify(invalidData),
          headers: {
            'Content-Type': 'application/json',
          },
        });

        const response = await POST(request);
        const responseData = await response.json();

        expect(mockPost.create).not.toHaveBeenCalled();
        expect(response.status).toBe(400);
        expect(responseData.error).toBe('Title, content, and author ID are required');
        expect(responseData.type).toBe(ErrorType.VALIDATION);
      });

      it('should return 400 error when content is missing', async () => {
        const invalidData = {
          title: 'Title without content',
          author_id: 'user123',
        };

        const request = new NextRequest('http://localhost:3000/api/articles', {
          method: 'POST',
          body: JSON.stringify(invalidData),
          headers: {
            'Content-Type': 'application/json',
          },
        });

        const response = await POST(request);
        const responseData = await response.json();

        expect(mockPost.create).not.toHaveBeenCalled();
        expect(response.status).toBe(400);
        expect(responseData.error).toBe('Title, content, and author ID are required');
      });

      it('should return 400 error when author_id is missing', async () => {
        const invalidData = {
          title: 'Title',
          content: 'Content without author',
        };

        const request = new NextRequest('http://localhost:3000/api/articles', {
          method: 'POST',
          body: JSON.stringify(invalidData),
          headers: {
            'Content-Type': 'application/json',
          },
        });

        const response = await POST(request);
        const responseData = await response.json();

        expect(mockPost.create).not.toHaveBeenCalled();
        expect(response.status).toBe(400);
        expect(responseData.error).toBe('Title, content, and author ID are required');
      });

      it('should return 400 error when all required fields are missing', async () => {
        const invalidData = {};

        const request = new NextRequest('http://localhost:3000/api/articles', {
          method: 'POST',
          body: JSON.stringify(invalidData),
          headers: {
            'Content-Type': 'application/json',
          },
        });

        const response = await POST(request);
        const responseData = await response.json();

        expect(mockPost.create).not.toHaveBeenCalled();
        expect(response.status).toBe(400);
        expect(responseData.error).toBe('Title, content, and author ID are required');
      });

      it('should handle empty string values', async () => {
        const invalidData = {
          title: '',
          content: '',
          author_id: '',
        };

        const request = new NextRequest('http://localhost:3000/api/articles', {
          method: 'POST',
          body: JSON.stringify(invalidData),
          headers: {
            'Content-Type': 'application/json',
          },
        });

        const response = await POST(request);
        const responseData = await response.json();

        expect(mockPost.create).not.toHaveBeenCalled();
        expect(response.status).toBe(400);
        expect(responseData.error).toBe('Title, content, and author ID are required');
      });
    });

    describe('Database errors', () => {
      it('should handle database constraint violations', async () => {
        const validData = {
          title: 'Valid Title',
          content: 'Valid Content',
          author_id: 'user123',
        };

        const dbError = {
          code: 'P2003',
          message: 'Foreign key constraint failed',
        };

        mockPost.create.mockRejectedValue(dbError);
        
        const request = new NextRequest('http://localhost:3000/api/articles', {
          method: 'POST',
          body: JSON.stringify(validData),
          headers: {
            'Content-Type': 'application/json',
          },
        });

        const response = await POST(request);
        const responseData = await response.json();

        expect(response.status).toBe(400);
        expect(responseData.error).toBe('Related data does not exist');
        expect(responseData.type).toBe(ErrorType.VALIDATION);
      });

      it('should handle general database errors', async () => {
        const validData = {
          title: 'Valid Title',
          content: 'Valid Content',
          author_id: 'user123',
        };

        const dbError = new Error('Database connection lost');
        mockPost.create.mockRejectedValue(dbError);
        
        const request = new NextRequest('http://localhost:3000/api/articles', {
          method: 'POST',
          body: JSON.stringify(validData),
          headers: {
            'Content-Type': 'application/json',
          },
        });

        const response = await POST(request);
        const responseData = await response.json();

        expect(response.status).toBe(500);
        expect(responseData.error).toBe('Database error occurred: Database connection lost');
      });
    });

    describe('Request parsing errors', () => {
      it('should handle malformed JSON', async () => {
        const request = new NextRequest('http://localhost:3000/api/articles', {
          method: 'POST',
          body: 'invalid json',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        const response = await POST(request);
        const responseData = await response.json();

        expect(mockPost.create).not.toHaveBeenCalled();
        expect(response.status).toBe(500);
        expect(responseData.error).toBe('Failed to create article');
      });
    });
  });

  describe('PUT /api/articles', () => {
    describe('Valid article updates', () => {
      it('should update article with valid data', async () => {
        const updateData = {
          post_id: 1,
          title: 'Updated Title',
          content: 'Updated Content',
        };

        const updatedArticle = {
          ...updateData,
          author_id: 'user123',
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date(),
        };

        mockPost.update.mockResolvedValue(updatedArticle);
        
        const request = new NextRequest('http://localhost:3000/api/articles', {
          method: 'PUT',
          body: JSON.stringify(updateData),
          headers: {
            'Content-Type': 'application/json',
          },
        });

        const response = await PUT(request);
        const responseData = await response.json();

        expect(mockPost.update).toHaveBeenCalledWith({
          where: {
            post_id: updateData.post_id,
          },
          data: {
            title: updateData.title,
            content: updateData.content,
          },
        });
        expect(response.status).toBe(200);
        expect(responseData).toMatchObject({
          post_id: 1,
          title: 'Updated Title',
          content: 'Updated Content',
          author_id: 'user123',
        });
      });

      it('should handle partial updates', async () => {
        const updateData = {
          post_id: 1,
          title: 'Only Title Updated',
          content: 'Original content',
        };

        const updatedArticle = { ...updateData, author_id: 'user123' };
        mockPost.update.mockResolvedValue(updatedArticle);
        
        const request = new NextRequest('http://localhost:3000/api/articles', {
          method: 'PUT',
          body: JSON.stringify(updateData),
          headers: {
            'Content-Type': 'application/json',
          },
        });

        const response = await PUT(request);
        const responseData = await response.json();

        expect(mockPost.update).toHaveBeenCalledWith({
          where: { post_id: 1 },
          data: {
            title: 'Only Title Updated',
            content: 'Original content',
          },
        });
        expect(responseData).toEqual(updatedArticle);
      });
    });

    describe('Validation errors', () => {
      it('should return 400 error when post_id is missing', async () => {
        const invalidData = {
          title: 'Updated Title',
          content: 'Updated Content',
        };

        const request = new NextRequest('http://localhost:3000/api/articles', {
          method: 'PUT',
          body: JSON.stringify(invalidData),
          headers: {
            'Content-Type': 'application/json',
          },
        });

        const response = await PUT(request);
        const responseData = await response.json();

        expect(mockPost.update).not.toHaveBeenCalled();
        expect(response.status).toBe(400);
        expect(responseData.error).toBe('Post ID, title, and content are required');
        expect(responseData.type).toBe(ErrorType.VALIDATION);
      });

      it('should return 400 error when title is missing', async () => {
        const invalidData = {
          post_id: 1,
          content: 'Updated Content',
        };

        const request = new NextRequest('http://localhost:3000/api/articles', {
          method: 'PUT',
          body: JSON.stringify(invalidData),
          headers: {
            'Content-Type': 'application/json',
          },
        });

        const response = await PUT(request);
        const responseData = await response.json();

        expect(mockPost.update).not.toHaveBeenCalled();
        expect(response.status).toBe(400);
        expect(responseData.error).toBe('Post ID, title, and content are required');
      });

      it('should return 400 error when content is missing', async () => {
        const invalidData = {
          post_id: 1,
          title: 'Updated Title',
        };

        const request = new NextRequest('http://localhost:3000/api/articles', {
          method: 'PUT',
          body: JSON.stringify(invalidData),
          headers: {
            'Content-Type': 'application/json',
          },
        });

        const response = await PUT(request);
        const responseData = await response.json();

        expect(mockPost.update).not.toHaveBeenCalled();
        expect(response.status).toBe(400);
        expect(responseData.error).toBe('Post ID, title, and content are required');
      });

      it('should handle empty string values', async () => {
        const invalidData = {
          post_id: 1,
          title: '',
          content: '',
        };

        const request = new NextRequest('http://localhost:3000/api/articles', {
          method: 'PUT',
          body: JSON.stringify(invalidData),
          headers: {
            'Content-Type': 'application/json',
          },
        });

        const response = await PUT(request);
        const responseData = await response.json();

        expect(mockPost.update).not.toHaveBeenCalled();
        expect(response.status).toBe(400);
        expect(responseData.error).toBe('Post ID, title, and content are required');
      });
    });

    describe('Database errors', () => {
      it('should handle record not found error', async () => {
        const updateData = {
          post_id: 999,
          title: 'Updated Title',
          content: 'Updated Content',
        };

        const dbError = {
          code: 'P2025',
          message: 'Record to update not found',
        };

        mockPost.update.mockRejectedValue(dbError);
        
        const request = new NextRequest('http://localhost:3000/api/articles', {
          method: 'PUT',
          body: JSON.stringify(updateData),
          headers: {
            'Content-Type': 'application/json',
          },
        });

        const response = await PUT(request);
        const responseData = await response.json();

        expect(response.status).toBe(404);
        expect(responseData.error).toBe('Requested data not found');
        expect(responseData.type).toBe(ErrorType.NOT_FOUND);
      });

      it('should handle general database errors', async () => {
        const updateData = {
          post_id: 1,
          title: 'Updated Title',
          content: 'Updated Content',
        };

        const dbError = new Error('Database connection failed');
        mockPost.update.mockRejectedValue(dbError);
        
        const request = new NextRequest('http://localhost:3000/api/articles', {
          method: 'PUT',
          body: JSON.stringify(updateData),
          headers: {
            'Content-Type': 'application/json',
          },
        });

        const response = await PUT(request);
        const responseData = await response.json();

        expect(response.status).toBe(500);
        expect(responseData.error).toBe('Database error occurred: Database connection failed');
      });
    });
  });

  describe('DELETE /api/articles', () => {
    describe('Valid article deletion', () => {
      it('should delete article with valid post_id', async () => {
        const deleteData = { post_id: 1 };
        const deletedArticle = {
          post_id: 1,
          title: 'Deleted Article',
          content: 'Content of deleted article',
          author_id: 'user123',
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        mockPost.delete.mockResolvedValue(deletedArticle);
        
        const request = new NextRequest('http://localhost:3000/api/articles', {
          method: 'DELETE',
          body: JSON.stringify(deleteData),
          headers: {
            'Content-Type': 'application/json',
          },
        });

        const response = await DELETE(request);
        const responseData = await response.json();

        expect(mockPost.delete).toHaveBeenCalledWith({
          where: {
            post_id: deleteData.post_id,
          },
        });
        expect(response.status).toBe(200);
        expect(responseData).toMatchObject({
          post_id: 1,
          title: 'Deleted Article',
          content: 'Content of deleted article',
          author_id: 'user123',
        });
      });

      it('should handle deletion with number post_id', async () => {
        const deleteData = { post_id: 123 };
        const deletedArticle = { post_id: 123, title: 'Test' };

        mockPost.delete.mockResolvedValue(deletedArticle);
        
        const request = new NextRequest('http://localhost:3000/api/articles', {
          method: 'DELETE',
          body: JSON.stringify(deleteData),
          headers: {
            'Content-Type': 'application/json',
          },
        });

        const response = await DELETE(request);
        const responseData = await response.json();

        expect(mockPost.delete).toHaveBeenCalledWith({
          where: { post_id: 123 },
        });
        expect(responseData).toEqual(deletedArticle);
      });
    });

    describe('Validation errors', () => {
      it('should return 400 error when post_id is missing', async () => {
        const invalidData = {};

        const request = new NextRequest('http://localhost:3000/api/articles', {
          method: 'DELETE',
          body: JSON.stringify(invalidData),
          headers: {
            'Content-Type': 'application/json',
          },
        });

        const response = await DELETE(request);
        const responseData = await response.json();

        expect(mockPost.delete).not.toHaveBeenCalled();
        expect(response.status).toBe(400);
        expect(responseData.error).toBe('Post ID is required');
        expect(responseData.type).toBe(ErrorType.VALIDATION);
      });

      it('should return 400 error when post_id is null', async () => {
        const invalidData = { post_id: null };

        const request = new NextRequest('http://localhost:3000/api/articles', {
          method: 'DELETE',
          body: JSON.stringify(invalidData),
          headers: {
            'Content-Type': 'application/json',
          },
        });

        const response = await DELETE(request);
        const responseData = await response.json();

        expect(mockPost.delete).not.toHaveBeenCalled();
        expect(response.status).toBe(400);
        expect(responseData.error).toBe('Post ID is required');
      });

      it('should return 400 error when post_id is undefined', async () => {
        const invalidData = { post_id: undefined };

        const request = new NextRequest('http://localhost:3000/api/articles', {
          method: 'DELETE',
          body: JSON.stringify(invalidData),
          headers: {
            'Content-Type': 'application/json',
          },
        });

        const response = await DELETE(request);
        const responseData = await response.json();

        expect(mockPost.delete).not.toHaveBeenCalled();
        expect(response.status).toBe(400);
        expect(responseData.error).toBe('Post ID is required');
      });
    });

    describe('Database errors', () => {
      it('should handle record not found error', async () => {
        const deleteData = { post_id: 999 };
        const dbError = {
          code: 'P2025',
          message: 'Record to delete does not exist',
        };

        mockPost.delete.mockRejectedValue(dbError);
        
        const request = new NextRequest('http://localhost:3000/api/articles', {
          method: 'DELETE',
          body: JSON.stringify(deleteData),
          headers: {
            'Content-Type': 'application/json',
          },
        });

        const response = await DELETE(request);
        const responseData = await response.json();

        expect(response.status).toBe(404);
        expect(responseData.error).toBe('Requested data not found');
        expect(responseData.type).toBe(ErrorType.NOT_FOUND);
      });

      it('should handle foreign key constraint violations', async () => {
        const deleteData = { post_id: 1 };
        const dbError = {
          code: 'P2003',
          message: 'Foreign key constraint failed',
        };

        mockPost.delete.mockRejectedValue(dbError);
        
        const request = new NextRequest('http://localhost:3000/api/articles', {
          method: 'DELETE',
          body: JSON.stringify(deleteData),
          headers: {
            'Content-Type': 'application/json',
          },
        });

        const response = await DELETE(request);
        const responseData = await response.json();

        expect(response.status).toBe(400);
        expect(responseData.error).toBe('Related data does not exist');
        expect(responseData.type).toBe(ErrorType.VALIDATION);
      });

      it('should handle general database errors', async () => {
        const deleteData = { post_id: 1 };
        const dbError = new Error('Database connection failed');

        mockPost.delete.mockRejectedValue(dbError);
        
        const request = new NextRequest('http://localhost:3000/api/articles', {
          method: 'DELETE',
          body: JSON.stringify(deleteData),
          headers: {
            'Content-Type': 'application/json',
          },
        });

        const response = await DELETE(request);
        const responseData = await response.json();

        expect(response.status).toBe(500);
        expect(responseData.error).toBe('Database error occurred: Database connection failed');
      });
    });

    describe('Request parsing errors', () => {
      it('should handle malformed JSON in delete request', async () => {
        const request = new NextRequest('http://localhost:3000/api/articles', {
          method: 'DELETE',
          body: 'invalid json',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        const response = await DELETE(request);
        const responseData = await response.json();

        expect(mockPost.delete).not.toHaveBeenCalled();
        expect(response.status).toBe(500);
        expect(responseData.error).toBe('Failed to delete article');
      });
    });
  });

  describe('Edge cases and integration scenarios', () => {
    it('should handle very long title and content', async () => {
      const longTitle = 'A'.repeat(1000);
      const longContent = 'B'.repeat(10000);
      
      const articleData = {
        title: longTitle,
        content: longContent,
        author_id: 'user123',
      };

      const createdArticle = { post_id: 1, ...articleData };
      mockPost.create.mockResolvedValue(createdArticle);
      
      const request = new NextRequest('http://localhost:3000/api/articles', {
        method: 'POST',
        body: JSON.stringify(articleData),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);

      expect(mockPost.create).toHaveBeenCalledWith({
        data: articleData,
      });
      expect(response.status).toBe(201);
    });

    it('should handle concurrent operations on same article', async () => {
      const updateData = {
        post_id: 1,
        title: 'Concurrent Update',
        content: 'Content being updated concurrently',
      };

      // Simulate concurrent modification error
      const concurrencyError = {
        code: 'P2034',
        message: 'Transaction failed due to a write conflict',
      };

      mockPost.update.mockRejectedValue(concurrencyError);
      
      const request = new NextRequest('http://localhost:3000/api/articles', {
        method: 'PUT',
        body: JSON.stringify(updateData),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await PUT(request);
      const responseData = await response.json();

      expect(response.status).toBe(500);
      expect(responseData.error).toBe('Database error occurred: Transaction failed due to a write conflict');
    });

    it('should maintain data consistency during CRUD operations', async () => {
      // Test create -> read -> update -> delete flow
      const articleData = {
        title: 'Test Article',
        content: 'Test Content',
        author_id: 'user123',
      };

      // CREATE
      const createdArticle = { post_id: 1, ...articleData };
      mockPost.create.mockResolvedValue(createdArticle);
      
      let request = new NextRequest('http://localhost:3000/api/articles', {
        method: 'POST',
        body: JSON.stringify(articleData),
        headers: {
          'Content-Type': 'application/json',
        },
      });
      let response = await POST(request);
      let responseData = await response.json();
      
      expect(response.status).toBe(201);
      expect(responseData.post_id).toBe(1);

      // READ
      mockPost.findUnique.mockResolvedValue(createdArticle);
      request = new NextRequest('http://localhost:3000/api/articles?post_id=1');
      response = await GET(request);
      responseData = await response.json();
      
      expect(responseData).toEqual(createdArticle);

      // UPDATE
      const updateData = {
        post_id: 1,
        title: 'Updated Title',
        content: 'Updated Content',
      };
      const updatedArticle = { ...createdArticle, ...updateData };
      mockPost.update.mockResolvedValue(updatedArticle);
      
      request = new NextRequest('http://localhost:3000/api/articles', {
        method: 'PUT',
        body: JSON.stringify(updateData),
        headers: {
          'Content-Type': 'application/json',
        },
      });
      response = await PUT(request);
      responseData = await response.json();
      
      expect(responseData.title).toBe('Updated Title');

      // DELETE
      mockPost.delete.mockResolvedValue(updatedArticle);
      request = new NextRequest('http://localhost:3000/api/articles', {
        method: 'DELETE',
        body: JSON.stringify({ post_id: 1 }),
        headers: {
          'Content-Type': 'application/json',
        },
      });
      response = await DELETE(request);
      responseData = await response.json();
      
      expect(responseData.post_id).toBe(1);
    });
  });

  describe('Performance and load scenarios', () => {
    it('should handle large number of articles efficiently', async () => {
      const largeArticlesList = Array.from({ length: 1000 }, (_, i) => ({
        post_id: i + 1,
        title: `Article ${i + 1}`,
        content: `Content for article ${i + 1}`,
        createdAt: new Date(),
      }));

      mockPost.findMany.mockResolvedValue(largeArticlesList);
      
      const request = new NextRequest('http://localhost:3000/api/articles');
      const response = await GET(request);
      const responseData = await response.json();

      expect(responseData).toHaveLength(1000);
      expect(mockPost.findMany).toHaveBeenCalledTimes(1);
    });

    it('should handle rapid successive requests', async () => {
      const articleData = {
        title: 'Rapid Request Test',
        content: 'Testing rapid requests',
        author_id: 'user123',
      };

      // Simulate multiple rapid requests
      const promises = Array.from({ length: 10 }, (_, i) => {
        const createdArticle = { post_id: i + 1, ...articleData, title: `${articleData.title} ${i}` };
        mockPost.create.mockResolvedValueOnce(createdArticle);
        
        const request = new NextRequest('http://localhost:3000/api/articles', {
          method: 'POST',
          body: JSON.stringify({ ...articleData, title: `${articleData.title} ${i}` }),
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        return POST(request);
      });

      const responses = await Promise.all(promises);

      expect(responses).toHaveLength(10);
      for (let i = 0; i < responses.length; i++) {
        expect(responses[i].status).toBe(201);
        const responseData = await responses[i].json();
        expect(responseData.post_id).toBe(i + 1);
      }
    });
  });
});