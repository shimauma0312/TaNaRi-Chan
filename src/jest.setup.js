// Optional: configure or set up a testing framework before each test.
// If you delete this file, remove `setupFilesAfterEnv` from `jest.config.js`

// Used for __tests__/testing-library.js
// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

// Polyfill for fetch, Request, Response, Headers
import 'whatwg-fetch'

// Mock console methods for cleaner test output
global.console = {
    ...console,
    // Suppress console.log in tests
    log: jest.fn(),
    // Keep error and warn for debugging
    error: jest.fn(),
    warn: jest.fn(),
}

// Mock Next.js environment
global.process.env = {
    ...process.env,
    NODE_ENV: 'test',
}

// Mock URL if not available
if (typeof global.URL === 'undefined') {
    const { URL, URLSearchParams } = require('url');
    global.URL = URL;
    global.URLSearchParams = URLSearchParams;
}
