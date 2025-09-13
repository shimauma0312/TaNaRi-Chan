// Optional: configure or set up a testing framework before each test.
// If you delete this file, remove `setupFilesAfterEnv` from `jest.config.js`

// Used for __tests__/testing-library.js
// Learn more: https://github.com/testing-library/jest-dom
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
