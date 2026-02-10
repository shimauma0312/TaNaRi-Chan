/**
 * Client Error Handler Test Suite
 *
 * Features tested:
 * - AppError class functionality in client context
 * - Error.captureStackTrace browser compatibility
 * - handleClientError function
 */

import {
  AppError,
  ErrorType,
  handleClientError,
} from '../utils/errorHandler.client';

describe('AppError Class (Client)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

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

  test('should have proper stack trace when Error.captureStackTrace is available', () => {
    const error = new AppError('Stack trace test');
    expect(error.stack).toBeDefined();
    expect(error.stack).toContain('Stack trace test');
  });

  test('should handle missing Error.captureStackTrace gracefully', () => {
    // Save original captureStackTrace
    const originalCaptureStackTrace = Error.captureStackTrace;

    // Temporarily remove Error.captureStackTrace to simulate browser without it
    delete (Error as any).captureStackTrace;

    // Should not throw error even without captureStackTrace
    expect(() => {
      const error = new AppError('Browser compatibility test');
      expect(error.message).toBe('Browser compatibility test');
      expect(error.stack).toBeDefined(); // Stack is still set by Error constructor
    }).not.toThrow();

    // Restore original captureStackTrace
    Error.captureStackTrace = originalCaptureStackTrace;
  });
});

describe('handleClientError Function', () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  test('should handle AppError on client side', () => {
    const appError = new AppError('Client error', ErrorType.VALIDATION, 400);
    const result = handleClientError(appError, 'Fallback message');

    expect(result).toBe('Client error');
    expect(consoleErrorSpy).toHaveBeenCalledWith('Client Error:', {
      message: 'Client error',
      type: ErrorType.VALIDATION,
      statusCode: 400,
    });
  });

  test('should handle standard Error on client side', () => {
    const standardError = new Error('Network timeout');
    const result = handleClientError(standardError, 'Fallback message');

    expect(result).toBe('Network timeout');
    expect(consoleErrorSpy).toHaveBeenCalledWith('Unexpected Client Error:', 'Network timeout');
  });

  test('should handle unknown error on client side', () => {
    const unknownError = { code: 'UNKNOWN' };
    const result = handleClientError(unknownError, 'Fallback message');

    expect(result).toBe('Fallback message');
    expect(consoleErrorSpy).toHaveBeenCalledWith('Unknown Client Error:', unknownError);
  });

  test('should handle null error', () => {
    const result = handleClientError(null, 'Fallback for null');

    expect(result).toBe('Fallback for null');
    expect(consoleErrorSpy).toHaveBeenCalledWith('Unknown Client Error:', null);
  });

  test('should handle undefined error', () => {
    const result = handleClientError(undefined, 'Fallback for undefined');

    expect(result).toBe('Fallback for undefined');
    expect(consoleErrorSpy).toHaveBeenCalledWith('Unknown Client Error:', undefined);
  });

  test('should handle string error', () => {
    const result = handleClientError('String error', 'Fallback message');

    expect(result).toBe('Fallback message');
    expect(consoleErrorSpy).toHaveBeenCalledWith('Unknown Client Error:', 'String error');
  });

  test('should handle number error', () => {
    const result = handleClientError(404, 'Fallback message');

    expect(result).toBe('Fallback message');
    expect(consoleErrorSpy).toHaveBeenCalledWith('Unknown Client Error:', 404);
  });
});

describe('ErrorType Enum (Client)', () => {
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

describe('Browser Compatibility', () => {
  test('AppError should work in environments without Error.captureStackTrace', () => {
    const originalCaptureStackTrace = Error.captureStackTrace;
    delete (Error as any).captureStackTrace;

    const error = new AppError('Test in old browser', ErrorType.VALIDATION, 400);

    expect(error.message).toBe('Test in old browser');
    expect(error.type).toBe(ErrorType.VALIDATION);
    expect(error.statusCode).toBe(400);
    expect(error.stack).toBeDefined(); // Stack still exists from Error base class

    Error.captureStackTrace = originalCaptureStackTrace;
  });

  test('handleClientError should work consistently across browsers', () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    const error1 = new AppError('Error 1', ErrorType.NOT_FOUND, 404);
    const result1 = handleClientError(error1, 'Fallback');

    expect(result1).toBe('Error 1');
    expect(consoleErrorSpy).toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });
});
