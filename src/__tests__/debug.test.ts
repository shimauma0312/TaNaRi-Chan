/**
 * Simple debugging test to identify the issue
 */

import { NextRequest } from 'next/server';
import { AppError, ErrorType } from '../utils/errorHandler';

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
import { GET, POST, PUT, DELETE } from '../app/api/articles/route';
import { PrismaClient } from '@prisma/client';

// Get mock instance
const mockPrisma = new PrismaClient() as jest.Mocked<PrismaClient>;
const mockPrismaPost = mockPrisma.post;

// Helper function to create a mock Request
function createMockRequest(method: string, url: string, body?: any): NextRequest {
  const headers = new Headers();
  headers.set('content-type', 'application/json');
  
  return new NextRequest(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  }) as NextRequest;
}

describe('Simple Debug Test', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should debug successful GET request', async () => {
    const mockArticles = [
      {
        post_id: 1,
        title: 'Test Article',
        content: 'Test content',
        createdAt: new Date('2024-01-01'),
      },
    ];

    mockPrismaPost.findMany.mockResolvedValue(mockArticles);

    const request = createMockRequest('GET', 'http://localhost:3000/api/articles');
    
    console.log('About to call GET with request:', request.url);
    const response = await GET(request);
    console.log('Response status:', response.status);
    
    const data = await response.json();
    console.log('Response data:', data);

    console.log('mockPrismaPost.findMany calls:', mockPrismaPost.findMany.mock.calls);
  });

  test('should debug POST request', async () => {
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
    
    console.log('About to call POST with data:', newArticleData);
    const response = await POST(request);
    console.log('POST Response status:', response.status);
    
    const data = await response.json();
    console.log('POST Response data:', data);
  });

  test('should debug validation error', async () => {
    const incompleteData = {
      content: 'Content without title',
      author_id: 'user123',
    };

    const request = createMockRequest('POST', 'http://localhost:3000/api/articles', incompleteData);
    const response = await POST(request);
    const data = await response.json();

    console.log('Validation error status:', response.status);
    console.log('Validation error data:', data);
  });
});