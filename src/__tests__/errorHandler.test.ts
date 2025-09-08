/**
 * Error Handler Test Suite
 * 
 * Features tested:
 * - AppError class functionality
 * - Error type classification
 * - API error response generation
 * - Database error handling
 * - Authentication error handling
 * - Network error handling
 */

import {
    AppError,
    createApiErrorResponse,
    ErrorType,
    handleApiError,
    handleAuthError,
    handleClientError,
    handleDatabaseError,
    handleNetworkError,
} from '../utils/errorHandler';

// Mock logger to avoid actual file operations during tests
jest.mock('../utils/logger', () => ({
  error: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
}));

describe('AppError Class', () => {
  test('should create AppError with default values', () => {
    const error = new AppError('Test error');
    
    expect(error.message).toBe('Test error');
    expect(error.type).toBe(ErrorType.SERVER_ERROR);
    expect(error.statusCode).toBe(500);
    expect(error.isOperational).toBe(true);
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(AppError);
  });

  test('should create AppError with custom values', () => {
    const error = new AppError(
      'User not found',
      ErrorType.NOT_FOUND,
      404,
      true
    );
    
    expect(error.message).toBe('User not found');
    expect(error.type).toBe(ErrorType.NOT_FOUND);
    expect(error.statusCode).toBe(404);
    expect(error.isOperational).toBe(true);
  });

  test('should create AppError for validation errors', () => {
    const error = new AppError(
      'Invalid email format',
      ErrorType.VALIDATION,
      400
    );
    
    expect(error.message).toBe('Invalid email format');
    expect(error.type).toBe(ErrorType.VALIDATION);
    expect(error.statusCode).toBe(400);
    expect(error.isOperational).toBe(true);
  });

  test('should have proper stack trace', () => {
    const error = new AppError('Stack trace test');
    expect(error.stack).toBeDefined();
    expect(error.stack).toContain('Stack trace test');
  });
});

describe('handleApiError Function', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should handle AppError correctly', () => {
    const appError = new AppError('User not found', ErrorType.NOT_FOUND, 404);
    const result = handleApiError(appError, 'Fallback message');
    
    expect(result).toBe('User not found');
  });

  test('should handle standard Error correctly', () => {
    const standardError = new Error('Standard error message');
    const result = handleApiError(standardError, 'Fallback message');
    
    expect(result).toBe('Standard error message');
  });

  test('should handle unknown error with fallback message', () => {
    const unknownError = 'String error';
    const result = handleApiError(unknownError, 'Fallback message');
    
    expect(result).toBe('Fallback message');
  });

  test('should handle null/undefined error', () => {
    const result1 = handleApiError(null, 'Fallback message');
    const result2 = handleApiError(undefined, 'Fallback message');
    
    expect(result1).toBe('Fallback message');
    expect(result2).toBe('Fallback message');
  });
});

describe('createApiErrorResponse Function', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should create API error response for AppError', () => {
    const appError = new AppError('User not found', ErrorType.NOT_FOUND, 404);
    const response = createApiErrorResponse(appError);
    
    expect(response.error).toBe('User not found');
    expect(response.type).toBe(ErrorType.NOT_FOUND);
    expect(response.statusCode).toBe(404);
    expect(response.timestamp).toBeDefined();
    expect(new Date(response.timestamp)).toBeInstanceOf(Date);
  });

  test('should create API error response for standard Error', () => {
    const standardError = new Error('Database connection failed');
    const response = createApiErrorResponse(standardError);
    
    expect(response.error).toBe('Database connection failed');
    expect(response.type).toBe(ErrorType.SERVER_ERROR);
    expect(response.statusCode).toBe(500);
    expect(response.timestamp).toBeDefined();
  });

  test('should create API error response for unknown error', () => {
    const unknownError = { message: 'Unknown error' };
    const response = createApiErrorResponse(unknownError, 'Custom fallback');
    
    expect(response.error).toBe('Custom fallback');
    expect(response.type).toBe(ErrorType.SERVER_ERROR);
    expect(response.statusCode).toBe(500);
    expect(response.timestamp).toBeDefined();
  });

  test('should use default fallback message', () => {
    const response = createApiErrorResponse('string error');
    
    expect(response.error).toBe('Internal server error occurred');
    expect(response.type).toBe(ErrorType.SERVER_ERROR);
    expect(response.statusCode).toBe(500);
  });
});

describe('handleClientError Function', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock console methods
    global.console = {
      ...console,
      error: jest.fn(),
    };
  });

  test('should handle AppError on client side', () => {
    const appError = new AppError('Client error', ErrorType.VALIDATION, 400);
    const result = handleClientError(appError, 'Fallback message');
    
    expect(result).toBe('Client error');
    expect(console.error).toHaveBeenCalledWith('Client Error:', {
      message: 'Client error',
      type: ErrorType.VALIDATION,
      statusCode: 400,
    });
  });

  test('should handle standard Error on client side', () => {
    const standardError = new Error('Network timeout');
    const result = handleClientError(standardError, 'Fallback message');
    
    expect(result).toBe('Network timeout');
    expect(console.error).toHaveBeenCalledWith('Unexpected Client Error:', 'Network timeout');
  });

  test('should handle unknown error on client side', () => {
    const unknownError = { code: 'UNKNOWN' };
    const result = handleClientError(unknownError, 'Fallback message');
    
    expect(result).toBe('Fallback message');
    expect(console.error).toHaveBeenCalledWith('Unknown Client Error:', unknownError);
  });
});

describe('handleDatabaseError Function', () => {
  test('should handle P2002 (unique constraint violation)', () => {
    const prismaError = { code: 'P2002', message: 'Unique constraint failed' };
    const result = handleDatabaseError(prismaError);
    
    expect(result).toBeInstanceOf(AppError);
    expect(result.message).toBe('Duplicate data constraint violation');
    expect(result.type).toBe(ErrorType.VALIDATION);
    expect(result.statusCode).toBe(400);
  });

  test('should handle P2003 (foreign key constraint violation)', () => {
    const prismaError = { code: 'P2003', message: 'Foreign key constraint failed' };
    const result = handleDatabaseError(prismaError);
    
    expect(result).toBeInstanceOf(AppError);
    expect(result.message).toBe('Related data does not exist');
    expect(result.type).toBe(ErrorType.VALIDATION);
    expect(result.statusCode).toBe(400);
  });

  test('should handle P2025 (record not found)', () => {
    const prismaError = { code: 'P2025', message: 'Record not found' };
    const result = handleDatabaseError(prismaError);
    
    expect(result).toBeInstanceOf(AppError);
    expect(result.message).toBe('Requested data not found');
    expect(result.type).toBe(ErrorType.NOT_FOUND);
    expect(result.statusCode).toBe(404);
  });

  test('should handle unknown database error', () => {
    const prismaError = { code: 'P9999', message: 'Unknown database error' };
    const result = handleDatabaseError(prismaError);
    
    expect(result).toBeInstanceOf(AppError);
    expect(result.message).toBe('Database error occurred');
    expect(result.type).toBe(ErrorType.DATABASE_ERROR);
    expect(result.statusCode).toBe(500);
  });

  test('should handle database error without code', () => {
    const databaseError = { message: 'Connection timeout' };
    const result = handleDatabaseError(databaseError);
    
    expect(result).toBeInstanceOf(AppError);
    expect(result.message).toBe('Database error occurred');
    expect(result.type).toBe(ErrorType.DATABASE_ERROR);
    expect(result.statusCode).toBe(500);
  });
});

describe('handleAuthError Function', () => {
  test('should handle auth/user-not-found', () => {
    const firebaseError = { code: 'auth/user-not-found' };
    const result = handleAuthError(firebaseError);
    
    expect(result).toBeInstanceOf(AppError);
    expect(result.message).toBe('User not found');
    expect(result.type).toBe(ErrorType.AUTHENTICATION);
    expect(result.statusCode).toBe(401);
  });

  test('should handle auth/wrong-password', () => {
    const firebaseError = { code: 'auth/wrong-password' };
    const result = handleAuthError(firebaseError);
    
    expect(result).toBeInstanceOf(AppError);
    expect(result.message).toBe('Invalid password');
    expect(result.type).toBe(ErrorType.AUTHENTICATION);
    expect(result.statusCode).toBe(401);
  });

  test('should handle auth/email-already-in-use', () => {
    const firebaseError = { code: 'auth/email-already-in-use' };
    const result = handleAuthError(firebaseError);
    
    expect(result).toBeInstanceOf(AppError);
    expect(result.message).toBe('Email address is already in use');
    expect(result.type).toBe(ErrorType.VALIDATION);
    expect(result.statusCode).toBe(400);
  });

  test('should handle auth/weak-password', () => {
    const firebaseError = { code: 'auth/weak-password' };
    const result = handleAuthError(firebaseError);
    
    expect(result).toBeInstanceOf(AppError);
    expect(result.message).toBe('Password is too weak. Please use at least 6 characters');
    expect(result.type).toBe(ErrorType.VALIDATION);
    expect(result.statusCode).toBe(400);
  });

  test('should handle auth/invalid-email', () => {
    const firebaseError = { code: 'auth/invalid-email' };
    const result = handleAuthError(firebaseError);
    
    expect(result).toBeInstanceOf(AppError);
    expect(result.message).toBe('Invalid email address format');
    expect(result.type).toBe(ErrorType.VALIDATION);
    expect(result.statusCode).toBe(400);
  });

  test('should handle unknown authentication error', () => {
    const firebaseError = { code: 'auth/unknown-error' };
    const result = handleAuthError(firebaseError);
    
    expect(result).toBeInstanceOf(AppError);
    expect(result.message).toBe('Authentication error occurred');
    expect(result.type).toBe(ErrorType.AUTHENTICATION);
    expect(result.statusCode).toBe(401);
  });

  test('should handle auth error without code', () => {
    const authError = { message: 'Auth service unavailable' };
    const result = handleAuthError(authError);
    
    expect(result).toBeInstanceOf(AppError);
    expect(result.message).toBe('Authentication error occurred');
    expect(result.type).toBe(ErrorType.AUTHENTICATION);
    expect(result.statusCode).toBe(401);
  });
});

describe('handleNetworkError Function', () => {
  test('should handle NetworkError by name', () => {
    const networkError = { name: 'NetworkError', message: 'Network is unreachable' };
    const result = handleNetworkError(networkError);
    
    expect(result).toBeInstanceOf(AppError);
    expect(result.message).toBe('Network connection failed. Please check your internet connection');
    expect(result.type).toBe(ErrorType.NETWORK_ERROR);
    expect(result.statusCode).toBe(503);
  });

  test('should handle fetch-related error', () => {
    const fetchError = { name: 'TypeError', message: 'fetch failed due to network issue' };
    const result = handleNetworkError(fetchError);
    
    expect(result).toBeInstanceOf(AppError);
    expect(result.message).toBe('Network connection failed. Please check your internet connection');
    expect(result.type).toBe(ErrorType.NETWORK_ERROR);
    expect(result.statusCode).toBe(503);
  });

  test('should handle generic network error', () => {
    const genericError = { name: 'Error', message: 'Connection timeout' };
    const result = handleNetworkError(genericError);
    
    expect(result).toBeInstanceOf(AppError);
    expect(result.message).toBe('Communication error occurred');
    expect(result.type).toBe(ErrorType.NETWORK_ERROR);
    expect(result.statusCode).toBe(503);
  });

  test('should handle network error without message', () => {
    const errorWithoutMessage = { code: 'ECONNREFUSED' };
    const result = handleNetworkError(errorWithoutMessage);
    
    expect(result).toBeInstanceOf(AppError);
    expect(result.message).toBe('Communication error occurred');
    expect(result.type).toBe(ErrorType.NETWORK_ERROR);
    expect(result.statusCode).toBe(503);
  });
});

describe('ErrorType Enum', () => {
  test('should have all required error types', () => {
    expect(ErrorType.VALIDATION).toBe('VALIDATION');
    expect(ErrorType.AUTHENTICATION).toBe('AUTHENTICATION');
    expect(ErrorType.AUTHORIZATION).toBe('AUTHORIZATION');
    expect(ErrorType.NOT_FOUND).toBe('NOT_FOUND');
    expect(ErrorType.SERVER_ERROR).toBe('SERVER_ERROR');
    expect(ErrorType.NETWORK_ERROR).toBe('NETWORK_ERROR');
    expect(ErrorType.DATABASE_ERROR).toBe('DATABASE_ERROR');
  });

  test('should contain exactly 7 error types', () => {
    const errorTypeValues = Object.values(ErrorType);
    expect(errorTypeValues).toHaveLength(7);
  });
});

describe('Integration Tests', () => {
  test('should work together: database error -> API response', () => {
    const prismaError = { code: 'P2002', message: 'Unique constraint failed' };
    const appError = handleDatabaseError(prismaError);
    const apiResponse = createApiErrorResponse(appError);
    
    expect(apiResponse.error).toBe('Duplicate data constraint violation');
    expect(apiResponse.type).toBe(ErrorType.VALIDATION);
    expect(apiResponse.statusCode).toBe(400);
    expect(apiResponse.timestamp).toBeDefined();
  });

  test('should work together: auth error -> client handling', () => {
    const firebaseError = { code: 'auth/invalid-email' };
    const appError = handleAuthError(firebaseError);
    const clientMessage = handleClientError(appError, 'Auth failed');
    
    expect(clientMessage).toBe('Invalid email address format');
  });

  test('should work together: network error -> API error handling', () => {
    const networkError = { name: 'NetworkError', message: 'Connection lost' };
    const appError = handleNetworkError(networkError);
    const errorMessage = handleApiError(appError, 'Network failed');
    
    expect(errorMessage).toBe('Network connection failed. Please check your internet connection');
  });
});
