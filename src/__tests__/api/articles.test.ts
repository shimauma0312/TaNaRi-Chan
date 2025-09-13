/**
 * Articles API Test Suite
 * 
 * Features tested:
 * - GET /api/articles (all articles and single article)
 * - POST /api/articles (create new article)
 * - PUT /api/articles (update existing article)
 * - DELETE /api/articles (delete article)
 * - Error handling and validation
 */

import { DELETE, GET, POST, PUT } from '../../app/api/articles/route';
import { AppError, ErrorType } from '../../utils/errorHandler';

// Mock Prisma client
const mockPrismaPost = {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
};

jest.mock('@prisma/client', () => ({
    PrismaClient: jest.fn().mockImplementation(() => ({
        post: mockPrismaPost,
    })),
}));

// Mock logger to avoid actual file operations during tests
jest.mock('../../logging/logging', () => ({
    error: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
}));

// Mock errorHandler
jest.mock('../../utils/errorHandler', () => ({
    ...jest.requireActual('../../utils/errorHandler'),
    handleDatabaseError: jest.fn((error: any) => {
        if (error.code === 'P2025') {
            return new AppError('Record not found', ErrorType.NOT_FOUND, 404);
        }
        return new AppError('Database error', ErrorType.DATABASE_ERROR, 500);
    }),
}));

// Test data
const mockArticles = [
    {
        post_id: 1,
        title: 'Test Article 1',
        content: 'This is test content 1',
        createdAt: new Date('2023-01-01T00:00:00.000Z'),
    },
    {
        post_id: 2,
        title: 'Test Article 2',
        content: 'This is test content 2',
        createdAt: new Date('2023-01-02T00:00:00.000Z'),
    },
];

const mockSingleArticle = {
    post_id: 1,
    title: 'Test Article 1',
    content: 'This is test content 1',
    createdAt: new Date('2023-01-01T00:00:00.000Z'),
};

// Helper to create mock Request object
const createMockRequest = (url: string, options: any = {}): Request => {
    const mockRequest = {
        url,
        method: options.method || 'GET',
        json: jest.fn().mockResolvedValue(options.body || {}),
        headers: new Map(),
    };

    return mockRequest as unknown as Request;
};

describe('Articles API', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('GET /api/articles', () => {
        describe('Get all articles', () => {
            it('should return all articles when no post_id parameter is provided', async () => {
                // Setup
                mockPrismaPost.findMany.mockResolvedValue(mockArticles);
                const request = createMockRequest('http://localhost:3000/api/articles');

                // Execute
                const response = await GET(request);
                const data = await response.json();

                // Assert
                expect(response.status).toBe(200);
                expect(data).toEqual(mockArticles);
                expect(mockPrismaPost.findMany).toHaveBeenCalledWith({
                    select: {
                        post_id: true,
                        title: true,
                        content: true,
                        createdAt: true,
                    }
                });
            });

            it('should return empty array when no articles exist', async () => {
                // Setup
                mockPrismaPost.findMany.mockResolvedValue([]);
                const request = createMockRequest('http://localhost:3000/api/articles');

                // Execute
                const response = await GET(request);
                const data = await response.json();

                // Assert
                expect(response.status).toBe(200);
                expect(data).toEqual([]);
            });
        });

        describe('Get single article', () => {
            it('should return a specific article when post_id parameter is provided', async () => {
                // Setup
                mockPrismaPost.findUnique.mockResolvedValue(mockSingleArticle);
                const request = createMockRequest('http://localhost:3000/api/articles?post_id=1');

                // Execute
                const response = await GET(request);
                const data = await response.json();

                // Assert
                expect(response.status).toBe(200);
                expect(data).toEqual(mockSingleArticle);
                expect(mockPrismaPost.findUnique).toHaveBeenCalledWith({
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
            });

            it('should return 404 when article with specified post_id does not exist', async () => {
                // Setup
                mockPrismaPost.findUnique.mockResolvedValue(null);
                const request = createMockRequest('http://localhost:3000/api/articles?post_id=999');

                // Execute
                const response = await GET(request);
                const data = await response.json();

                // Assert
                expect(response.status).toBe(404);
                expect(data.error).toBe('Article not found');
                expect(data.type).toBe(ErrorType.NOT_FOUND);
            });

            it('should handle invalid post_id parameter', async () => {
                // Setup
                mockPrismaPost.findUnique.mockResolvedValue(null);
                const request = createMockRequest('http://localhost:3000/api/articles?post_id=invalid');

                // Execute
                const response = await GET(request);
                const data = await response.json();

                // Assert
                expect(response.status).toBe(404);
                expect(data.error).toBe('Article not found');
            });
        });

        describe('Error handling', () => {
            it('should handle database errors gracefully', async () => {
                // Setup
                const dbError = new Error('Database connection failed');
                mockPrismaPost.findMany.mockRejectedValue(dbError);
                const request = createMockRequest('http://localhost:3000/api/articles');

                // Execute
                const response = await GET(request);
                const data = await response.json();

                // Assert
                expect(response.status).toBe(500);
                expect(data.error).toBe('Failed to fetch articles');
                expect(data.details).toBe('Database connection failed');
            });
        });
    });

    describe('POST /api/articles', () => {
        const validArticleData = {
            title: 'New Test Article',
            content: 'This is new test content',
            author_id: 'user123',
        };

        describe('Successful creation', () => {
            it('should create a new article with valid data', async () => {
                // Setup
                const createdArticle = {
                    post_id: 3,
                    ...validArticleData,
                    createdAt: new Date('2023-01-03T00:00:00.000Z'),
                    updatedAt: new Date('2023-01-03T00:00:00.000Z'),
                };
                mockPrismaPost.create.mockResolvedValue(createdArticle);

                const request = createMockRequest('http://localhost:3000/api/articles', {
                    method: 'POST',
                    body: validArticleData,
                });

                // Execute
                const response = await POST(request);
                const data = await response.json();

                // Assert
                expect(response.status).toBe(201);
                expect(data).toEqual(createdArticle);
                expect(mockPrismaPost.create).toHaveBeenCalledWith({
                    data: validArticleData,
                });
            });
        });

        describe('Validation errors', () => {
            it('should return 400 when title is missing', async () => {
                // Setup
                const invalidData = {
                    content: 'Content without title',
                    author_id: 'user123',
                };

                const request = createMockRequest('http://localhost:3000/api/articles', {
                    method: 'POST',
                    body: invalidData,
                });

                // Execute
                const response = await POST(request);
                const data = await response.json();

                // Assert
                expect(response.status).toBe(400);
                expect(data.error).toBe('Title, content, and author ID are required');
                expect(data.type).toBe(ErrorType.VALIDATION);
            });

            it('should return 400 when content is missing', async () => {
                // Setup
                const invalidData = {
                    title: 'Title without content',
                    author_id: 'user123',
                };

                const request = createMockRequest('http://localhost:3000/api/articles', {
                    method: 'POST',
                    body: invalidData,
                });

                // Execute
                const response = await POST(request);
                const data = await response.json();

                // Assert
                expect(response.status).toBe(400);
                expect(data.error).toBe('Title, content, and author ID are required');
                expect(data.type).toBe(ErrorType.VALIDATION);
            });

            it('should return 400 when author_id is missing', async () => {
                // Setup
                const invalidData = {
                    title: 'Title without author',
                    content: 'Content without author',
                };

                const request = createMockRequest('http://localhost:3000/api/articles', {
                    method: 'POST',
                    body: invalidData,
                });

                // Execute
                const response = await POST(request);
                const data = await response.json();

                // Assert
                expect(response.status).toBe(400);
                expect(data.error).toBe('Title, content, and author ID are required');
                expect(data.type).toBe(ErrorType.VALIDATION);
            });

            it('should return 400 when all required fields are missing', async () => {
                // Setup
                const invalidData = {};

                const request = createMockRequest('http://localhost:3000/api/articles', {
                    method: 'POST',
                    body: invalidData,
                });

                // Execute
                const response = await POST(request);
                const data = await response.json();

                // Assert
                expect(response.status).toBe(400);
                expect(data.error).toBe('Title, content, and author ID are required');
            });
        });

        describe('Error handling', () => {
            it('should handle database errors during creation', async () => {
                // Setup
                const dbError = { code: 'P2003', message: 'Foreign key constraint failed' };
                mockPrismaPost.create.mockRejectedValue(dbError);

                const request = createMockRequest('http://localhost:3000/api/articles', {
                    method: 'POST',
                    body: validArticleData,
                });

                // Execute
                const response = await POST(request);
                const data = await response.json();

                // Assert
                expect(response.status).toBe(500);
                expect(data.error).toBe('Failed to create article');
            });

            it('should handle invalid JSON in request body', async () => {
                // Setup
                const request = createMockRequest('http://localhost:3000/api/articles', {
                    method: 'POST',
                    body: 'invalid json',
                });

                // Override the json method to simulate JSON parsing error
                request.json = jest.fn().mockRejectedValue(new Error('Invalid JSON'));

                // Execute
                const response = await POST(request);
                const data = await response.json();

                // Assert
                expect(response.status).toBe(500);
                expect(data.error).toBe('Failed to create article');
            });
        });
    });

    describe('PUT /api/articles', () => {
        const validUpdateData = {
            post_id: 1,
            title: 'Updated Article Title',
            content: 'Updated article content',
        };

        describe('Successful update', () => {
            it('should update an existing article with valid data', async () => {
                // Setup
                const updatedArticle = {
                    ...validUpdateData,
                    author_id: 'user123',
                    createdAt: new Date('2023-01-01T00:00:00.000Z'),
                    updatedAt: new Date('2023-01-03T00:00:00.000Z'),
                };
                mockPrismaPost.update.mockResolvedValue(updatedArticle);

                const request = createMockRequest('http://localhost:3000/api/articles', {
                    method: 'PUT',
                    body: validUpdateData,
                });

                // Execute
                const response = await PUT(request);
                const data = await response.json();

                // Assert
                expect(response.status).toBe(200);
                expect(data).toEqual(updatedArticle);
                expect(mockPrismaPost.update).toHaveBeenCalledWith({
                    where: { post_id: validUpdateData.post_id },
                    data: {
                        title: validUpdateData.title,
                        content: validUpdateData.content,
                    },
                });
            });
        });

        describe('Validation errors', () => {
            it('should return 400 when post_id is missing', async () => {
                // Setup
                const invalidData = {
                    title: 'Updated Title',
                    content: 'Updated Content',
                };

                const request = createMockRequest('http://localhost:3000/api/articles', {
                    method: 'PUT',
                    body: invalidData,
                });

                // Execute
                const response = await PUT(request);
                const data = await response.json();

                // Assert
                expect(response.status).toBe(400);
                expect(data.error).toBe('Post ID, title, and content are required');
                expect(data.type).toBe(ErrorType.VALIDATION);
            });

            it('should return 400 when title is missing', async () => {
                // Setup
                const invalidData = {
                    post_id: 1,
                    content: 'Updated Content',
                };

                const request = createMockRequest('http://localhost:3000/api/articles', {
                    method: 'PUT',
                    body: invalidData,
                });

                // Execute
                const response = await PUT(request);
                const data = await response.json();

                // Assert
                expect(response.status).toBe(400);
                expect(data.error).toBe('Post ID, title, and content are required');
            });

            it('should return 400 when content is missing', async () => {
                // Setup
                const invalidData = {
                    post_id: 1,
                    title: 'Updated Title',
                };

                const request = createMockRequest('http://localhost:3000/api/articles', {
                    method: 'PUT',
                    body: invalidData,
                });

                // Execute
                const response = await PUT(request);
                const data = await response.json();

                // Assert
                expect(response.status).toBe(400);
                expect(data.error).toBe('Post ID, title, and content are required');
            });
        });

        describe('Error handling', () => {
            it('should handle article not found error', async () => {
                // Setup
                const notFoundError = { code: 'P2025', message: 'Record not found' };
                mockPrismaPost.update.mockRejectedValue(notFoundError);

                const request = createMockRequest('http://localhost:3000/api/articles', {
                    method: 'PUT',
                    body: validUpdateData,
                });

                // Execute
                const response = await PUT(request);
                const data = await response.json();

                // Assert
                expect(response.status).toBe(404);
                expect(data.error).toBe('Failed to update article');
            });

            it('should handle general database errors', async () => {
                // Setup
                const dbError = new Error('Database connection failed');
                mockPrismaPost.update.mockRejectedValue(dbError);

                const request = createMockRequest('http://localhost:3000/api/articles', {
                    method: 'PUT',
                    body: validUpdateData,
                });

                // Execute
                const response = await PUT(request);
                const data = await response.json();

                // Assert
                expect(response.status).toBe(500);
                expect(data.error).toBe('Failed to update article');
            });
        });
    });

    describe('DELETE /api/articles', () => {
        const validDeleteData = {
            post_id: 1,
        };

        describe('Successful deletion', () => {
            it('should delete an existing article', async () => {
                // Setup
                const deletedArticle = {
                    post_id: 1,
                    title: 'Deleted Article',
                    content: 'This article was deleted',
                    author_id: 'user123',
                    createdAt: new Date('2023-01-01T00:00:00.000Z'),
                    updatedAt: new Date('2023-01-01T00:00:00.000Z'),
                };
                mockPrismaPost.delete.mockResolvedValue(deletedArticle);

                const request = createMockRequest('http://localhost:3000/api/articles', {
                    method: 'DELETE',
                    body: validDeleteData,
                });

                // Execute
                const response = await DELETE(request);
                const data = await response.json();

                // Assert
                expect(response.status).toBe(200);
                expect(data).toEqual(deletedArticle);
                expect(mockPrismaPost.delete).toHaveBeenCalledWith({
                    where: { post_id: validDeleteData.post_id },
                });
            });
        });

        describe('Validation errors', () => {
            it('should return 400 when post_id is missing', async () => {
                // Setup
                const invalidData = {};

                const request = createMockRequest('http://localhost:3000/api/articles', {
                    method: 'DELETE',
                    body: invalidData,
                });

                // Execute
                const response = await DELETE(request);
                const data = await response.json();

                // Assert
                expect(response.status).toBe(400);
                expect(data.error).toBe('Post ID is required');
                expect(data.type).toBe(ErrorType.VALIDATION);
            });

            it('should return 400 when post_id is null', async () => {
                // Setup
                const invalidData = {
                    post_id: null,
                };

                const request = createMockRequest('http://localhost:3000/api/articles', {
                    method: 'DELETE',
                    body: invalidData,
                });

                // Execute
                const response = await DELETE(request);
                const data = await response.json();

                // Assert
                expect(response.status).toBe(400);
                expect(data.error).toBe('Post ID is required');
            });
        });

        describe('Error handling', () => {
            it('should handle article not found error', async () => {
                // Setup
                const notFoundError = { code: 'P2025', message: 'Record not found' };
                mockPrismaPost.delete.mockRejectedValue(notFoundError);

                const request = createMockRequest('http://localhost:3000/api/articles', {
                    method: 'DELETE',
                    body: validDeleteData,
                });

                // Execute
                const response = await DELETE(request);
                const data = await response.json();

                // Assert
                expect(response.status).toBe(404);
                expect(data.error).toBe('Failed to delete article');
            });

            it('should handle general database errors', async () => {
                // Setup
                const dbError = new Error('Database connection failed');
                mockPrismaPost.delete.mockRejectedValue(dbError);

                const request = createMockRequest('http://localhost:3000/api/articles', {
                    method: 'DELETE',
                    body: validDeleteData,
                });

                // Execute
                const response = await DELETE(request);
                const data = await response.json();

                // Assert
                expect(response.status).toBe(500);
                expect(data.error).toBe('Failed to delete article');
            });

            it('should handle invalid JSON in request body', async () => {
                // Setup
                const request = createMockRequest('http://localhost:3000/api/articles', {
                    method: 'DELETE',
                    body: 'invalid json',
                });

                // Override the json method to simulate JSON parsing error
                request.json = jest.fn().mockRejectedValue(new Error('Invalid JSON'));

                // Execute
                const response = await DELETE(request);
                const data = await response.json();

                // Assert
                expect(response.status).toBe(500);
                expect(data.error).toBe('Failed to delete article');
            });
        });
    });

    describe('Edge cases and integration scenarios', () => {
        it('should handle very long article content', async () => {
            // Setup
            const longContent = 'A'.repeat(10000); // 10KB content
            const articleData = {
                title: 'Long Article',
                content: longContent,
                author_id: 'user123',
            };

            const createdArticle = {
                post_id: 1,
                ...articleData,
                createdAt: new Date(),
                updatedAt: new Date(),
            };
            mockPrismaPost.create.mockResolvedValue(createdArticle);

            const request = createMockRequest('http://localhost:3000/api/articles', {
                method: 'POST',
                body: articleData,
            });

            // Execute
            const response = await POST(request);
            const data = await response.json();

            // Assert
            expect(response.status).toBe(201);
            expect(data.content).toBe(longContent);
        });

        it('should handle special characters in article content', async () => {
            // Setup
            const specialContent = '特殊文字テスト: 🎌 日本語 & <script>alert("test")</script>';
            const articleData = {
                title: 'Special Characters Article',
                content: specialContent,
                author_id: 'user123',
            };

            const createdArticle = {
                post_id: 1,
                ...articleData,
                createdAt: new Date(),
                updatedAt: new Date(),
            };
            mockPrismaPost.create.mockResolvedValue(createdArticle);

            const request = createMockRequest('http://localhost:3000/api/articles', {
                method: 'POST',
                body: articleData,
            });

            // Execute
            const response = await POST(request);
            const data = await response.json();

            // Assert
            expect(response.status).toBe(201);
            expect(data.content).toBe(specialContent);
        });

        it('should handle concurrent operations gracefully', async () => {
            // Setup
            mockPrismaPost.findMany.mockResolvedValue(mockArticles);

            const requests = Array.from({ length: 5 }, () =>
                createMockRequest('http://localhost:3000/api/articles')
            );

            // Execute
            const responses = await Promise.all(requests.map(req => GET(req)));
            const results = await Promise.all(responses.map((res: any) => res.json()));

            // Assert
            results.forEach((data: any, index: number) => {
                expect(responses[index].status).toBe(200);
                expect(data).toEqual(mockArticles);
            });
        });
    });
});
