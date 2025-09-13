# Test Examples and Patterns

This document provides specific examples and patterns for different types of tests in the TaNaRi-Chan project.

## Table of Contents

1. [Unit Test Examples](#unit-test-examples)
2. [Integration Test Examples](#integration-test-examples)
3. [Mocking Patterns](#mocking-patterns)
4. [Error Testing Patterns](#error-testing-patterns)
5. [Async Testing Patterns](#async-testing-patterns)
6. [API Testing Patterns](#api-testing-patterns)

## Unit Test Examples

### Testing Utility Functions

```typescript
// Example: Testing a validation utility
import { validateEmail, validatePassword } from '../utils/validation';

describe('Validation Utilities', () => {
  describe('validateEmail', () => {
    test('should return true for valid email', () => {
      const validEmails = [
        'user@example.com',
        'test.email@domain.co.uk',
        'user+tag@example.org'
      ];

      validEmails.forEach(email => {
        expect(validateEmail(email)).toBe(true);
      });
    });

    test('should return false for invalid email', () => {
      const invalidEmails = [
        'invalid-email',
        '@domain.com',
        'user@',
        'user..double.dot@example.com'
      ];

      invalidEmails.forEach(email => {
        expect(validateEmail(email)).toBe(false);
      });
    });
  });

  describe('validatePassword', () => {
    test('should return true for strong password', () => {
      const strongPasswords = [
        'StrongP@ssw0rd',
        'MySecure123!',
        'C0mpl3x&Pass'
      ];

      strongPasswords.forEach(password => {
        expect(validatePassword(password)).toBe(true);
      });
    });

    test('should return false for weak password', () => {
      const weakPasswords = [
        '123456',
        'password',
        'short',
        'NoSpecialChars123'
      ];

      weakPasswords.forEach(password => {
        expect(validatePassword(password)).toBe(false);
      });
    });
  });
});
```

### Testing Custom Hooks

```typescript
// Example: Testing useAuth hook
import { renderHook, act } from '@testing-library/react';
import { useAuth } from '../hooks/useAuth';

// Mock Firebase
jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(),
  signInWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
}));

describe('useAuth Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should initialize with default state', () => {
    const { result } = renderHook(() => useAuth());

    expect(result.current.user).toBeNull();
    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBeNull();
  });

  test('should handle login success', async () => {
    const mockUser = { uid: '123', email: 'test@example.com' };
    const mockSignIn = require('firebase/auth').signInWithEmailAndPassword;
    mockSignIn.mockResolvedValue({ user: mockUser });

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.login('test@example.com', 'password');
    });

    expect(result.current.user).toEqual(mockUser);
    expect(result.current.error).toBeNull();
  });

  test('should handle login error', async () => {
    const mockError = new Error('Invalid credentials');
    const mockSignIn = require('firebase/auth').signInWithEmailAndPassword;
    mockSignIn.mockRejectedValue(mockError);

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.login('test@example.com', 'wrongpassword');
    });

    expect(result.current.user).toBeNull();
    expect(result.current.error).toBe('Invalid credentials');
  });
});
```

## Integration Test Examples

### Testing Component with API Integration

```typescript
// Example: Testing ArticleForm component
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ArticleForm } from '../components/ArticleForm';

// Mock API calls
jest.mock('../api/articles', () => ({
  createArticle: jest.fn(),
  updateArticle: jest.fn(),
}));

describe('ArticleForm Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should create new article successfully', async () => {
    const mockCreateArticle = require('../api/articles').createArticle;
    mockCreateArticle.mockResolvedValue({ id: '123', title: 'Test Article' });

    const onSuccess = jest.fn();
    render(<ArticleForm onSuccess={onSuccess} />);

    // Fill form
    fireEvent.change(screen.getByLabelText(/title/i), {
      target: { value: 'Test Article' }
    });
    fireEvent.change(screen.getByLabelText(/content/i), {
      target: { value: 'Test content' }
    });

    // Submit form
    fireEvent.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => {
      expect(mockCreateArticle).toHaveBeenCalledWith({
        title: 'Test Article',
        content: 'Test content'
      });
      expect(onSuccess).toHaveBeenCalledWith({ id: '123', title: 'Test Article' });
    });
  });

  test('should display error when API call fails', async () => {
    const mockCreateArticle = require('../api/articles').createArticle;
    mockCreateArticle.mockRejectedValue(new Error('Network error'));

    render(<ArticleForm />);

    fireEvent.change(screen.getByLabelText(/title/i), {
      target: { value: 'Test Article' }
    });
    fireEvent.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => {
      expect(screen.getByText(/network error/i)).toBeInTheDocument();
    });
  });
});
```

## Mocking Patterns

### Mocking External Services

```typescript
// Mock Prisma Client
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    user: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    article: {
      create: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    $disconnect: jest.fn(),
  })),
}));

// Mock Next.js Router
jest.mock('next/router', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    pathname: '/',
    query: {},
  })),
}));

// Mock Environment Variables
jest.mock('process', () => ({
  env: {
    NODE_ENV: 'test',
    DATABASE_URL: 'postgresql://test:test@localhost:5432/test_db',
    FIREBASE_API_KEY: 'test-api-key',
  },
}));
```

### Partial Mocking

```typescript
// Mock only specific functions from a module
jest.mock('../utils/logger', () => ({
  ...jest.requireActual('../utils/logger'),
  error: jest.fn(),
}));

// Mock with implementation
jest.mock('../services/userService', () => ({
  getUserById: jest.fn().mockImplementation((id) => {
    if (id === 'valid-id') {
      return Promise.resolve({ id: 'valid-id', name: 'Test User' });
    }
    return Promise.reject(new Error('User not found'));
  }),
}));
```

## Error Testing Patterns

### Testing Error Boundaries

```typescript
// Example: Testing error boundary component
import { render, screen } from '@testing-library/react';
import { ErrorBoundary } from '../components/ErrorBoundary';

const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>No error</div>;
};

describe('ErrorBoundary', () => {
  test('should display error message when child throws', () => {
    // Suppress console.error for this test
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    
    consoleSpy.mockRestore();
  });

  test('should render children when no error', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    );

    expect(screen.getByText('No error')).toBeInTheDocument();
  });
});
```

### Testing Custom Errors

```typescript
// Example: Testing custom error handling
import { AppError, ErrorType, handleApiError } from '../utils/errorHandler';

describe('Error Handling', () => {
  test('should throw AppError with correct properties', () => {
    expect(() => {
      throw new AppError('Test error', ErrorType.VALIDATION, 400);
    }).toThrow(AppError);

    try {
      throw new AppError('Test error', ErrorType.VALIDATION, 400);
    } catch (error) {
      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe('Test error');
      expect(error.type).toBe(ErrorType.VALIDATION);
      expect(error.statusCode).toBe(400);
    }
  });

  test('should handle error chain correctly', () => {
    const originalError = new Error('Original error');
    const wrappedError = new AppError(
      'Wrapped error',
      ErrorType.SERVER_ERROR,
      500
    );

    const result = handleApiError(wrappedError, 'Fallback');
    expect(result).toBe('Wrapped error');
  });
});
```

## Async Testing Patterns

### Testing Promises

```typescript
// Example: Testing async functions
import { fetchUserData, createUser } from '../services/userService';

describe('User Service', () => {
  test('should fetch user data successfully', async () => {
    const userData = { id: '123', name: 'John Doe' };
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(userData),
    });
    global.fetch = mockFetch;

    const result = await fetchUserData('123');

    expect(result).toEqual(userData);
    expect(mockFetch).toHaveBeenCalledWith('/api/users/123');
  });

  test('should handle fetch error', async () => {
    const mockFetch = jest.fn().mockRejectedValue(new Error('Network error'));
    global.fetch = mockFetch;

    await expect(fetchUserData('123')).rejects.toThrow('Network error');
  });

  test('should handle HTTP error status', async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 404,
      statusText: 'Not Found',
    });
    global.fetch = mockFetch;

    await expect(fetchUserData('invalid-id')).rejects.toThrow('Not Found');
  });
});
```

### Testing with Timers

```typescript
// Example: Testing functions with delays
import { debounce, retry } from '../utils/helpers';

describe('Helper Functions', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('should debounce function calls', () => {
    const mockFn = jest.fn();
    const debouncedFn = debounce(mockFn, 1000);

    debouncedFn();
    debouncedFn();
    debouncedFn();

    expect(mockFn).not.toHaveBeenCalled();

    jest.advanceTimersByTime(1000);

    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  test('should retry failed operations', async () => {
    const mockFn = jest
      .fn()
      .mockRejectedValueOnce(new Error('First attempt'))
      .mockRejectedValueOnce(new Error('Second attempt'))
      .mockResolvedValue('Success');

    const promise = retry(mockFn, 3, 1000);

    // Advance timers for retry delays
    jest.advanceTimersByTime(3000);

    const result = await promise;

    expect(result).toBe('Success');
    expect(mockFn).toHaveBeenCalledTimes(3);
  });
});
```

## API Testing Patterns

### Testing Next.js API Routes

```typescript
// Example: Testing API route handlers
import { createMocks } from 'node-mocks-http';
import handler from '../pages/api/users/[id]';

describe('/api/users/[id]', () => {
  test('should return user for GET request', async () => {
    const { req, res } = createMocks({
      method: 'GET',
      query: { id: '123' },
    });

    // Mock database call
    const mockPrisma = require('@prisma/client').PrismaClient();
    mockPrisma.user.findUnique.mockResolvedValue({
      id: '123',
      name: 'John Doe',
      email: 'john@example.com',
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    const data = JSON.parse(res._getData());
    expect(data.user.id).toBe('123');
    expect(data.user.name).toBe('John Doe');
  });

  test('should return 404 for non-existent user', async () => {
    const { req, res } = createMocks({
      method: 'GET',
      query: { id: 'non-existent' },
    });

    const mockPrisma = require('@prisma/client').PrismaClient();
    mockPrisma.user.findUnique.mockResolvedValue(null);

    await handler(req, res);

    expect(res._getStatusCode()).toBe(404);
    const data = JSON.parse(res._getData());
    expect(data.error).toBe('User not found');
  });

  test('should handle database errors', async () => {
    const { req, res } = createMocks({
      method: 'GET',
      query: { id: '123' },
    });

    const mockPrisma = require('@prisma/client').PrismaClient();
    mockPrisma.user.findUnique.mockRejectedValue(new Error('Database connection failed'));

    await handler(req, res);

    expect(res._getStatusCode()).toBe(500);
    const data = JSON.parse(res._getData());
    expect(data.error).toBe('Internal server error');
  });
});
```

### Testing API Client Functions

```typescript
// Example: Testing API client
import { apiClient } from '../lib/apiClient';

describe('API Client', () => {
  beforeEach(() => {
    fetchMock.resetMocks();
  });

  test('should make GET request with correct headers', async () => {
    const mockData = { users: [{ id: '1', name: 'John' }] };
    fetchMock.mockResponseOnce(JSON.stringify(mockData));

    const result = await apiClient.get('/users');

    expect(fetchMock).toHaveBeenCalledWith('/api/users', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    expect(result).toEqual(mockData);
  });

  test('should make POST request with body', async () => {
    const userData = { name: 'John', email: 'john@example.com' };
    const mockResponse = { id: '123', ...userData };
    fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

    const result = await apiClient.post('/users', userData);

    expect(fetchMock).toHaveBeenCalledWith('/api/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });
    expect(result).toEqual(mockResponse);
  });

  test('should handle authentication', async () => {
    const token = 'test-token';
    apiClient.setAuthToken(token);

    fetchMock.mockResponseOnce(JSON.stringify({ data: 'protected' }));

    await apiClient.get('/protected');

    expect(fetchMock).toHaveBeenCalledWith('/api/protected', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });
  });
});
```

This document provides comprehensive examples and patterns for testing various aspects of the TaNaRi-Chan project. Use these patterns as templates for creating your own tests.
