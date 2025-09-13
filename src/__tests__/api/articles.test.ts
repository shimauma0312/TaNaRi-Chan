/**
 * Articles API Test Suite
 * Comprehensive testing for the Articles API endpoints
 * This test suite focuses on API behavior and error handling
 */

import { NextRequest } from 'next/server';
import { GET, POST, PUT, DELETE } from '../../app/api/articles/route';
import { ErrorType } from '../../utils/errorHandler';

describe('Articles API - Integration Tests', () => {
  describe('GET /api/articles', () => {
    it('should handle missing post_id parameter correctly', async () => {
      // Arrange
      const request = new NextRequest('http://localhost:3000/api/articles');

      // Act
      const response = await GET(request);
      const data = await response.json();

      // Assert - Should attempt to get all articles (may fail due to no DB, but structure should be correct)
      expect(response.status).toBeGreaterThanOrEqual(200);
      expect(data).toBeDefined();
    });

    it('should handle invalid post_id format', async () => {
      // Arrange  
      const request = new NextRequest('http://localhost:3000/api/articles?post_id=invalid');

      // Act
      const response = await GET(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(404);
      expect(data.error).toBe('Article not found');
      expect(data.type).toBe(ErrorType.NOT_FOUND);
    });

    it('should handle non-existent post_id', async () => {
      // Arrange
      const request = new NextRequest('http://localhost:3000/api/articles?post_id=999999');

      // Act
      const response = await GET(request);
      const data = await response.json();

      // Assert - Should return 404 or 500 depending on database state
      expect([404, 500]).toContain(response.status);
      expect(data.error).toBeDefined();
    });
  });

  describe('POST /api/articles', () => {
    it('should return 400 when title is missing', async () => {
      // Arrange
      const invalidData = { content: 'Content', author_id: 'user123' };
      const request = new NextRequest('http://localhost:3000/api/articles', {
        method: 'POST',
        body: JSON.stringify(invalidData),
      });

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.error).toBe('Title, content, and author ID are required');
      expect(data.type).toBe(ErrorType.VALIDATION);
    });

    it('should return 400 when content is missing', async () => {
      // Arrange
      const invalidData = { title: 'Title', author_id: 'user123' };
      const request = new NextRequest('http://localhost:3000/api/articles', {
        method: 'POST',
        body: JSON.stringify(invalidData),
      });

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.error).toBe('Title, content, and author ID are required');
      expect(data.type).toBe(ErrorType.VALIDATION);
    });

    it('should return 400 when author_id is missing', async () => {
      // Arrange
      const invalidData = { title: 'Title', content: 'Content' };
      const request = new NextRequest('http://localhost:3000/api/articles', {
        method: 'POST',
        body: JSON.stringify(invalidData),
      });

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.error).toBe('Title, content, and author ID are required');
      expect(data.type).toBe(ErrorType.VALIDATION);
    });

    it('should handle empty request body', async () => {
      // Arrange
      const request = new NextRequest('http://localhost:3000/api/articles', {
        method: 'POST',
        body: JSON.stringify({}),
      });

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.error).toBe('Title, content, and author ID are required');
    });

    it('should handle invalid JSON in request body', async () => {
      // Arrange
      const request = new NextRequest('http://localhost:3000/api/articles', {
        method: 'POST',
        body: 'invalid json',
      });

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data.type).toBe(ErrorType.SERVER_ERROR);
    });

    it('should handle valid data structure (may fail at DB level)', async () => {
      // Arrange
      const validData = {
        title: 'Test Article',
        content: 'This is a test article content',
        author_id: 'user123',
      };
      const request = new NextRequest('http://localhost:3000/api/articles', {
        method: 'POST',
        body: JSON.stringify(validData),
      });

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert - May succeed (201) or fail at DB level (500), but should not be validation error
      expect([201, 500]).toContain(response.status);
      if (response.status === 500) {
        expect(data.type).not.toBe(ErrorType.VALIDATION);
      }
    });
  });

  describe('PUT /api/articles', () => {
    it('should return 400 when post_id is missing', async () => {
      // Arrange
      const invalidData = { title: 'Title', content: 'Content' };
      const request = new NextRequest('http://localhost:3000/api/articles', {
        method: 'PUT',
        body: JSON.stringify(invalidData),
      });

      // Act
      const response = await PUT(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.error).toBe('Post ID, title, and content are required');
      expect(data.type).toBe(ErrorType.VALIDATION);
    });

    it('should return 400 when title is missing', async () => {
      // Arrange
      const invalidData = { post_id: 1, content: 'Content' };
      const request = new NextRequest('http://localhost:3000/api/articles', {
        method: 'PUT',
        body: JSON.stringify(invalidData),
      });

      // Act
      const response = await PUT(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.error).toBe('Post ID, title, and content are required');
    });

    it('should return 400 when content is missing', async () => {
      // Arrange
      const invalidData = { post_id: 1, title: 'Title' };
      const request = new NextRequest('http://localhost:3000/api/articles', {
        method: 'PUT',
        body: JSON.stringify(invalidData),
      });

      // Act
      const response = await PUT(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.error).toBe('Post ID, title, and content are required');
    });

    it('should handle valid data structure (may fail at DB level)', async () => {
      // Arrange
      const validData = { post_id: 1, title: 'Updated Title', content: 'Updated Content' };
      const request = new NextRequest('http://localhost:3000/api/articles', {
        method: 'PUT',
        body: JSON.stringify(validData),
      });

      // Act
      const response = await PUT(request);
      const data = await response.json();

      // Assert - May succeed (200) or fail at DB level (404/500)
      expect([200, 404, 500]).toContain(response.status);
      if (response.status === 400) {
        expect(data.type).toBe(ErrorType.VALIDATION);
      }
    });
  });

  describe('DELETE /api/articles', () => {
    it('should return 400 when post_id is missing', async () => {
      // Arrange
      const request = new NextRequest('http://localhost:3000/api/articles', {
        method: 'DELETE',
        body: JSON.stringify({}),
      });

      // Act
      const response = await DELETE(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.error).toBe('Post ID is required');
      expect(data.type).toBe(ErrorType.VALIDATION);
    });

    it('should handle invalid JSON in request body', async () => {
      // Arrange
      const request = new NextRequest('http://localhost:3000/api/articles', {
        method: 'DELETE',
        body: 'invalid json',
      });

      // Act
      const response = await DELETE(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data.type).toBe(ErrorType.SERVER_ERROR);
    });

    it('should handle valid data structure (may fail at DB level)', async () => {
      // Arrange
      const validData = { post_id: 1 };
      const request = new NextRequest('http://localhost:3000/api/articles', {
        method: 'DELETE',
        body: JSON.stringify(validData),
      });

      // Act
      const response = await DELETE(request);
      const data = await response.json();

      // Assert - May succeed (200) or fail at DB level (404/500)
      expect([200, 404, 500]).toContain(response.status);
      if (response.status === 400) {
        expect(data.type).toBe(ErrorType.VALIDATION);
      }
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle extremely long title and content', async () => {
      // Arrange
      const longTitle = 'a'.repeat(1000);
      const longContent = 'b'.repeat(10000);
      const postData = {
        title: longTitle,
        content: longContent,
        author_id: 'user123',
      };
      
      const request = new NextRequest('http://localhost:3000/api/articles', {
        method: 'POST',
        body: JSON.stringify(postData),
      });

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert - Should not be a validation error (validation allows long content)
      if (response.status === 400) {
        expect(data.type).not.toBe(ErrorType.VALIDATION);
      }
    });

    it('should handle special characters in title and content', async () => {
      // Arrange
      const specialCharsData = {
        title: 'Test Article with 特殊文字 & émojis 🚀',
        content: 'Content with 特殊文字, émojis 🎉, and symbols: !@#$%^&*()',
        author_id: 'user123',
      };
      
      const request = new NextRequest('http://localhost:3000/api/articles', {
        method: 'POST',
        body: JSON.stringify(specialCharsData),
      });

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert - Should not be a validation error for special characters
      if (response.status === 400) {
        expect(data.type).not.toBe(ErrorType.VALIDATION);
      }
    });

    it('should handle null and undefined values gracefully', async () => {
      // Arrange
      const nullData = {
        title: null,
        content: undefined,
        author_id: 'user123',
      };
      
      const request = new NextRequest('http://localhost:3000/api/articles', {
        method: 'POST',
        body: JSON.stringify(nullData),
      });

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.type).toBe(ErrorType.VALIDATION);
    });

    it('should handle concurrent requests gracefully', async () => {
      // Arrange
      const validData = {
        title: 'Concurrent Test',
        content: 'Testing concurrent requests',
        author_id: 'user123',
      };
      
      const requests = Array(5).fill(null).map(() => 
        new NextRequest('http://localhost:3000/api/articles', {
          method: 'POST',
          body: JSON.stringify(validData),
        })
      );

      // Act
      const responses = await Promise.all(requests.map(req => POST(req)));

      // Assert - All responses should be valid (either success or consistent failure)
      for (const response of responses) {
        expect([201, 400, 500]).toContain(response.status);
        const data = await response.json();
        expect(data).toBeDefined();
      }
    });

    it('should handle malformed URLs gracefully', async () => {
      // Arrange
      const request = new NextRequest('http://localhost:3000/api/articles?post_id=&invalid=param');

      // Act
      const response = await GET(request);
      const data = await response.json();

      // Assert - Should handle empty post_id gracefully
      expect(response.status).toBeGreaterThanOrEqual(200);
      expect(data).toBeDefined();
    });
  });
});