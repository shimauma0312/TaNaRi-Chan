# Testing Guide for TaNaRi-Chan Project

This document provides a comprehensive guide on how to create, run, and maintain tests in the TaNaRi-Chan project.

## Table of Contents

1. [Overview](#overview)
2. [Testing Stack](#testing-stack)
3. [Project Structure](#project-structure)
4. [Writing Tests](#writing-tests)
5. [Running Tests](#running-tests)
6. [Test Coverage](#test-coverage)
7. [Best Practices](#best-practices)
8. [Troubleshooting](#troubleshooting)

## Overview

The TaNaRi-Chan project uses a comprehensive testing approach to ensure code quality and reliability. Our test suite covers:

- **Unit Tests**: Individual functions and classes
- **Integration Tests**: Component interactions
- **Error Handling Tests**: Custom error classes and handlers
- **Utility Tests**: Logger and helper functions

## Testing Stack

| Technology | Purpose | Version |
|------------|---------|---------|
| **Jest** | Test runner and framework | ^29.7.0 |
| **@types/jest** | TypeScript definitions | ^29.5.0 |
| **ts-jest** | TypeScript transformer | ^29.2.0 |
| **@testing-library/jest-dom** | DOM testing utilities | ^6.4.0 |
| **@testing-library/react** | React component testing | ^16.0.0 |

## Project Structure

```
src/
├── __tests__/                 # Test directory
│   ├── errorHandler.test.ts   # Error handling tests
│   ├── logger.test.ts         # Logger utility tests
│   └── ...                    # Additional test files
├── utils/                     # Utility functions
│   ├── errorHandler.ts        # Error handling utilities
│   ├── logger.ts              # Logging utilities
│   └── ...
├── jest.config.js             # Jest configuration
├── jest.setup.js              # Test setup file
└── tsconfig.test.json         # TypeScript config for tests
```

## Writing Tests

### 1. Test File Naming Convention

- Test files should end with `.test.ts` or `.spec.ts`
- Place test files in the `__tests__/` directory
- Mirror the structure of the source code

Example:
```
src/utils/errorHandler.ts  →  src/__tests__/errorHandler.test.ts
src/utils/logger.ts        →  src/__tests__/logger.test.ts
```

### 2. Basic Test Structure

```typescript
/**
 * Test Suite Description
 * 
 * Features tested:
 * - Feature 1
 * - Feature 2
 * - Feature 3
 */

import { functionToTest, ClassToTest } from '../utils/module';

// Mock external dependencies
jest.mock('../utils/dependency', () => ({
  mockFunction: jest.fn(),
}));

describe('Module Name', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Function Group', () => {
    test('should do something specific', () => {
      // Arrange
      const input = 'test input';
      const expected = 'expected output';

      // Act
      const result = functionToTest(input);

      // Assert
      expect(result).toBe(expected);
    });
  });
});
```

### 3. Testing Error Handlers

#### Example: Testing AppError Class

```typescript
import { AppError, ErrorType } from '../utils/errorHandler';

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
});
```

#### Example: Testing Error Handler Functions

```typescript
import { handleApiError, createApiErrorResponse } from '../utils/errorHandler';

describe('handleApiError Function', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should handle AppError correctly', () => {
    const appError = new AppError('User not found', ErrorType.NOT_FOUND, 404);
    const result = handleApiError(appError, 'Fallback message');
    
    expect(result).toBe('User not found');
  });

  test('should handle unknown error with fallback message', () => {
    const unknownError = 'String error';
    const result = handleApiError(unknownError, 'Fallback message');
    
    expect(result).toBe('Fallback message');
  });
});
```

### 4. Testing Logger Utilities

```typescript
import logger from '../utils/logger';

// Mock winston to avoid file operations
jest.mock('winston', () => ({
  createLogger: jest.fn(() => ({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  })),
  format: {
    combine: jest.fn(),
    timestamp: jest.fn(),
    printf: jest.fn(),
    colorize: jest.fn(),
    errors: jest.fn(),
  },
  transports: {
    Console: jest.fn(),
    File: jest.fn(),
  },
}));

describe('Logger Utility', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.console = {
      ...console,
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
    };
  });

  test('should log info messages with proper format', () => {
    const message = 'Test info message';
    const context = { userId: '123' };
    
    logger.info(message, context);
    
    expect(console.log).toHaveBeenCalledWith('[INFO] Test info message', context);
  });
});
```

### 5. Testing Database Error Handlers

```typescript
import { handleDatabaseError } from '../utils/errorHandler';

describe('handleDatabaseError Function', () => {
  test('should handle P2002 (unique constraint violation)', () => {
    const prismaError = { code: 'P2002', message: 'Unique constraint failed' };
    const result = handleDatabaseError(prismaError);
    
    expect(result).toBeInstanceOf(AppError);
    expect(result.message).toBe('Duplicate data constraint violation');
    expect(result.type).toBe(ErrorType.VALIDATION);
    expect(result.statusCode).toBe(400);
  });

  test('should handle unknown database error', () => {
    const prismaError = { code: 'P9999', message: 'Unknown database error' };
    const result = handleDatabaseError(prismaError);
    
    expect(result).toBeInstanceOf(AppError);
    expect(result.message).toBe('Database error occurred');
    expect(result.type).toBe(ErrorType.DATABASE_ERROR);
    expect(result.statusCode).toBe(500);
  });
});
```

### 6. Integration Tests

```typescript
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
});
```

## Running Tests

### 1. Docker Environment (Recommended)

```bash
# Run all tests
docker compose exec app bash -c "cd /app && npm test"

# Run tests with coverage
docker compose exec app bash -c "cd /app && npm run test:coverage"

# Run tests in watch mode
docker compose exec app bash -c "cd /app && npm run test:watch"
```

### 2. Local Environment

```bash
# Navigate to src directory
cd src

# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

### 3. Using Test Script

```bash
# Make script executable
chmod +x src/run-tests.sh

# Run tests
./src/run-tests.sh

# Run with coverage
./src/run-tests.sh --coverage

# Run in watch mode
./src/run-tests.sh --watch
```

## Test Coverage

### Coverage Reports

After running tests with coverage, reports are generated in:

- `coverage/lcov-report/index.html` - HTML coverage report
- `coverage/lcov.info` - LCOV format for CI/CD integration

### Coverage Targets

| File Type | Target Coverage |
|-----------|-----------------|
| Utils | 90%+ |
| API Routes | 85%+ |
| Components | 80%+ |
| Overall | 85%+ |

### Coverage Configuration

```javascript
// jest.config.js
collectCoverageFrom: [
  'utils/**/*.{ts,tsx}',
  'app/api/**/*.{ts,tsx}',
  '!**/*.d.ts',
  '!**/node_modules/**',
],
```

## Best Practices

### 1. Test Organization

- **Group related tests** using `describe()` blocks
- **Use descriptive test names** that explain what is being tested
- **Follow AAA pattern**: Arrange, Act, Assert

### 2. Mocking

- **Mock external dependencies** to isolate units under test
- **Use Jest mocks** for functions and modules
- **Reset mocks** between tests using `jest.clearAllMocks()`

### 3. Error Testing

- **Test both success and failure cases**
- **Verify error types and messages**
- **Test edge cases and boundary conditions**

### 4. Assertions

```typescript
// Good: Specific assertions
expect(error.message).toBe('User not found');
expect(error.statusCode).toBe(404);

// Avoid: Loose assertions
expect(error).toBeTruthy();
```

### 5. Test Data

- **Use meaningful test data**
- **Avoid magic numbers and strings**
- **Create test data factories** for complex objects

```typescript
// Test data factory
const createTestUser = (overrides = {}) => ({
  id: '123',
  email: 'test@example.com',
  name: 'Test User',
  ...overrides,
});
```

### 6. Async Testing

```typescript
// Testing async functions
test('should handle async error', async () => {
  const promise = asyncFunction();
  await expect(promise).rejects.toThrow('Expected error');
});

// Testing promises
test('should resolve with data', async () => {
  const result = await asyncFunction();
  expect(result).toEqual(expectedData);
});
```

## Troubleshooting

### Common Issues

#### 1. Module Not Found

```bash
Error: Cannot find module '@/utils/errorHandler'
```

**Solution**: Check `moduleNameMapper` in `jest.config.js`:

```javascript
moduleNameMapper: {
  '^@/(.*)$': '<rootDir>/$1',
}
```

#### 2. TypeScript Errors

```bash
Error: Cannot find name 'jest'
```

**Solution**: Ensure `@types/jest` is installed and configured:

```bash
npm install --save-dev @types/jest
```

#### 3. Winston Mock Issues

```bash
Error: winston.createLogger is not a function
```

**Solution**: Properly mock winston:

```typescript
jest.mock('winston', () => ({
  createLogger: jest.fn(() => ({
    info: jest.fn(),
    error: jest.fn(),
  })),
  format: {
    combine: jest.fn(),
    timestamp: jest.fn(),
  },
}));
```

#### 4. Environment Variables

```bash
Error: DATABASE_URL is not defined
```

**Solution**: Set test environment variables:

```javascript
// jest.setup.js
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db';
```

### Debug Tests

```bash
# Run specific test file
npm test __tests__/errorHandler.test.ts

# Run tests with verbose output
npm test -- --verbose

# Run tests in debug mode
npm test -- --detectOpenHandles

# Run single test
npm test -- --testNamePattern="should create AppError with default values"
```

## Configuration Files

### jest.config.js

```javascript
const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-node',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  testMatch: [
    '**/__tests__/**/*.(ts|tsx|js)',
    '**/*.(test|spec).(ts|tsx|js)'
  ],
  collectCoverageFrom: [
    'utils/**/*.{ts,tsx}',
    'app/api/**/*.{ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
  ],
  preset: 'ts-jest',
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.test.json'
    }
  },
}

module.exports = createJestConfig(customJestConfig)
```

### jest.setup.js

```javascript
import '@testing-library/jest-dom'

// Mock console methods for cleaner test output
global.console = {
  ...console,
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
}
```

### tsconfig.test.json

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "types": ["jest", "node"],
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "moduleResolution": "node"
  },
  "include": [
    "**/__tests__/**/*",
    "**/*.test.ts",
    "**/*.test.tsx",
    "jest.setup.js"
  ],
  "exclude": [
    "node_modules"
  ]
}
```

## Conclusion

This testing guide provides a foundation for writing comprehensive tests in the TaNaRi-Chan project. By following these patterns and best practices, you can ensure code quality and maintain a robust test suite.

For additional questions or clarifications, refer to the [Jest documentation](https://jestjs.io/docs/getting-started) or consult the project team.
