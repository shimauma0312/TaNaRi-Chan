# Testing Configuration Reference

This document provides detailed configuration information for the testing setup in the TaNaRi-Chan project.

## Configuration Files Overview

| File | Purpose | Location |
|------|---------|----------|
| `jest.config.js` | Main Jest configuration | `src/jest.config.js` |
| `jest.setup.js` | Test environment setup | `src/jest.setup.js` |
| `tsconfig.test.json` | TypeScript config for tests | `src/tsconfig.test.json` |
| `package.json` | Test scripts and dependencies | `src/package.json` |

## Jest Configuration (`jest.config.js`)

### Basic Configuration

```javascript
const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files
  dir: './',
})

const customJestConfig = {
  // Setup file to run before tests
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  
  // Test environment
  testEnvironment: 'jest-environment-node',
  
  // Module name mapping for TypeScript path aliases
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  
  // Test file patterns
  testMatch: [
    '**/__tests__/**/*.(ts|tsx|js)',
    '**/*.(test|spec).(ts|tsx|js)'
  ],
  
  // Coverage collection patterns
  collectCoverageFrom: [
    'utils/**/*.{ts,tsx}',
    'app/api/**/*.{ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
  ],
  
  // TypeScript configuration
  preset: 'ts-jest',
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.test.json'
    }
  },
}

module.exports = createJestConfig(customJestConfig)
```

### Advanced Configuration Options

```javascript
const customJestConfig = {
  // ... basic config

  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
    './src/utils/': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90,
    },
  },

  // Coverage reporters
  coverageReporters: [
    'text',
    'lcov',
    'html',
    'json-summary'
  ],

  // Clear mocks between tests
  clearMocks: true,

  // Restore mocks after each test
  restoreMocks: true,

  // Verbose output
  verbose: true,

  // Test timeout (30 seconds)
  testTimeout: 30000,

  // Maximum worker processes
  maxWorkers: '50%',

  // Transform ignore patterns
  transformIgnorePatterns: [
    'node_modules/(?!(.*\\.mjs$))'
  ],

  // Module file extensions
  moduleFileExtensions: [
    'ts',
    'tsx',
    'js',
    'jsx',
    'json',
    'node'
  ],

  // Ignore patterns
  testPathIgnorePatterns: [
    '<rootDir>/.next/',
    '<rootDir>/node_modules/',
    '<rootDir>/coverage/',
  ],

  // Watch plugins
  watchPlugins: [
    'jest-watch-typeahead/filename',
    'jest-watch-typeahead/testname',
  ],
}
```

## Test Setup (`jest.setup.js`)

### Basic Setup

```javascript
// Import jest-dom matchers
import '@testing-library/jest-dom'

// Mock console methods for cleaner test output
global.console = {
  ...console,
  // Suppress console.log in tests
  log: jest.fn(),
  // Keep error and warn for debugging
  error: jest.fn(),
  warn: jest.fn(),
}
```

### Extended Setup

```javascript
import '@testing-library/jest-dom'

// Global test utilities
global.testUtils = {
  // Helper to create mock user data
  createMockUser: (overrides = {}) => ({
    id: '123',
    email: 'test@example.com',
    name: 'Test User',
    createdAt: new Date().toISOString(),
    ...overrides,
  }),

  // Helper to create mock article data
  createMockArticle: (overrides = {}) => ({
    id: '456',
    title: 'Test Article',
    content: 'Test content',
    authorId: '123',
    createdAt: new Date().toISOString(),
    ...overrides,
  }),
}

// Mock environment variables
process.env = {
  ...process.env,
  NODE_ENV: 'test',
  DATABASE_URL: 'postgresql://test:test@localhost:5432/test_db',
  NEXTAUTH_SECRET: 'test-secret',
  NEXTAUTH_URL: 'http://localhost:3000',
}

// Mock fetch globally
global.fetch = jest.fn()

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}
global.localStorage = localStorageMock

// Mock sessionStorage
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}
global.sessionStorage = sessionStorageMock

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))

// Custom matchers
expect.extend({
  toBeValidEmail(received) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const pass = emailRegex.test(received)
    
    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid email`,
        pass: true,
      }
    } else {
      return {
        message: () => `expected ${received} to be a valid email`,
        pass: false,
      }
    }
  },
})

// Setup and teardown
beforeEach(() => {
  // Clear all mocks before each test
  jest.clearAllMocks()
  
  // Reset fetch mock
  if (global.fetch) {
    global.fetch.mockClear()
  }
  
  // Clear localStorage and sessionStorage
  localStorageMock.clear.mockClear()
  sessionStorageMock.clear.mockClear()
})

afterEach(() => {
  // Cleanup after each test
  jest.restoreAllMocks()
})
```

## TypeScript Configuration (`tsconfig.test.json`)

### Basic Configuration

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "types": ["jest", "node", "@testing-library/jest-dom"],
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "moduleResolution": "node",
    "strict": true,
    "skipLibCheck": true
  },
  "include": [
    "**/__tests__/**/*",
    "**/*.test.ts",
    "**/*.test.tsx",
    "jest.setup.js"
  ],
  "exclude": [
    "node_modules",
    ".next",
    "coverage"
  ]
}
```

### Extended Configuration

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "target": "es2020",
    "lib": ["dom", "dom.iterable", "es6"],
    "allowJs": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "incremental": true,
    "types": [
      "jest",
      "node",
      "@testing-library/jest-dom",
      "@types/testing-library__jest-dom"
    ],
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"],
      "@/components/*": ["./components/*"],
      "@/utils/*": ["./utils/*"],
      "@/hooks/*": ["./hooks/*"],
      "@/lib/*": ["./lib/*"]
    }
  },
  "include": [
    "next-env.d.ts",
    "**/*.ts",
    "**/*.tsx",
    "**/__tests__/**/*",
    "**/*.test.ts",
    "**/*.test.tsx",
    "jest.setup.js",
    "jest.config.js"
  ],
  "exclude": [
    "node_modules",
    ".next",
    "coverage",
    "dist",
    "build"
  ]
}
```

## Package.json Test Scripts

### Basic Scripts

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:ci": "jest --ci --coverage --watchAll=false"
  }
}
```

### Extended Scripts

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:ci": "jest --ci --coverage --watchAll=false",
    "test:debug": "jest --detectOpenHandles --verbose",
    "test:silent": "jest --silent",
    "test:unit": "jest --testPathPattern=__tests__",
    "test:integration": "jest --testPathPattern=integration",
    "test:e2e": "jest --testPathPattern=e2e",
    "test:specific": "jest --testNamePattern",
    "test:update-snapshots": "jest --updateSnapshot",
    "test:clear-cache": "jest --clearCache"
  }
}
```

## Environment-Specific Configuration

### Development Environment

```javascript
// jest.config.dev.js
const baseConfig = require('./jest.config.js')

module.exports = {
  ...baseConfig,
  verbose: true,
  collectCoverage: false,
  watchman: true,
  watchPlugins: [
    'jest-watch-typeahead/filename',
    'jest-watch-typeahead/testname',
  ],
}
```

### CI/CD Environment

```javascript
// jest.config.ci.js
const baseConfig = require('./jest.config.js')

module.exports = {
  ...baseConfig,
  ci: true,
  coverage: true,
  watchAll: false,
  maxWorkers: 2,
  forceExit: true,
  detectOpenHandles: true,
  coverageReporters: ['text', 'lcov', 'json-summary'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
}
```

## Mock Configurations

### Global Mocks

```javascript
// __mocks__/global.js
global.TextEncoder = require('util').TextEncoder
global.TextDecoder = require('util').TextDecoder

// Mock Next.js modules
jest.mock('next/router', () => require('next-router-mock'))
jest.mock('next/image', () => ({ src, alt }) => <img src={src} alt={alt} />)

// Mock environment variables
process.env = {
  ...process.env,
  NODE_ENV: 'test',
}
```

### Module-Specific Mocks

```javascript
// __mocks__/@prisma/client.js
export const PrismaClient = jest.fn().mockImplementation(() => ({
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
  $connect: jest.fn(),
  $disconnect: jest.fn(),
}))

// __mocks__/winston.js
export const createLogger = jest.fn(() => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
}))

export const format = {
  combine: jest.fn(),
  timestamp: jest.fn(),
  printf: jest.fn(),
  colorize: jest.fn(),
  errors: jest.fn(),
}

export const transports = {
  Console: jest.fn(),
  File: jest.fn(),
}
```

## Performance Configuration

### Optimized Settings

```javascript
const customJestConfig = {
  // Use multiple workers
  maxWorkers: '50%',
  
  // Cache directory
  cacheDirectory: '<rootDir>/.jest-cache',
  
  // Only test changed files in watch mode
  watchman: true,
  
  // Bail on first test failure
  bail: 1,
  
  // Faster test runs
  testTimeout: 10000,
  
  // Minimize file watching
  watchPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/.next/',
    '<rootDir>/coverage/',
  ],
  
  // Transform only necessary files
  transformIgnorePatterns: [
    'node_modules/(?!(module-to-transform)/)',
  ],
}
```

## Troubleshooting Configuration

### Debug Configuration

```javascript
const debugConfig = {
  // Detect hanging tests
  detectOpenHandles: true,
  
  // Force exit after tests
  forceExit: true,
  
  // Verbose output
  verbose: true,
  
  // Log heap usage
  logHeapUsage: true,
  
  // Expose garbage collection
  expose-gc: true,
  
  // Maximum heap size
  max_old_space_size: 4096,
}
```

This configuration reference provides comprehensive settings for testing in the TaNaRi-Chan project. Use these configurations as a starting point and adjust based on your specific needs.
