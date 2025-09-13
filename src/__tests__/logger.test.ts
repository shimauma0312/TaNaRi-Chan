/**
 * Logger Utility Test Suite
 * 
 * Features tested:
 * - Client-side logger functionality
 * - Environment-based logger switching
 * - Log level methods (info, error, warn, debug)
 */

// Mock winston to avoid file system operations in tests
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

// Mock fs to avoid file system operations
jest.mock('fs', () => ({
  existsSync: jest.fn(() => true),
  mkdirSync: jest.fn(),
}));

describe('Logger Utility', () => {
  let logger: any;
  
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset modules to get fresh logger instance
    jest.resetModules();
    
    // Mock console methods
    global.console = {
      ...console,
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
    };
  });

  describe('Server-side Logger (winston)', () => {
    beforeEach(() => {
      // Mock server environment
      Object.defineProperty(global, 'window', {
        value: undefined,
        writable: true,
      });
      
      // Import logger after setting up environment
      logger = require('../utils/logger').default;
    });

    test('should create winston logger for server environment', () => {
      expect(logger).toBeDefined();
      expect(typeof logger.info).toBe('function');
      expect(typeof logger.error).toBe('function');
      expect(typeof logger.warn).toBe('function');
      expect(typeof logger.debug).toBe('function');
    });

    test('should have winston logger methods', () => {
      // Simply check that logger has the required methods
      expect(typeof logger.info).toBe('function');
      expect(typeof logger.error).toBe('function');
      expect(typeof logger.warn).toBe('function');
      expect(typeof logger.debug).toBe('function');
    });
  });

  describe('Client-side Logger (console)', () => {
    beforeEach(() => {
      // Mock browser environment
      Object.defineProperty(global, 'window', {
        value: {},
        writable: true,
      });
      
      // Import logger after setting up environment
      logger = require('../utils/logger').default;
    });

    test('should use console logger for client environment', () => {
      expect(logger).toBeDefined();
      expect(typeof logger.info).toBe('function');
      expect(typeof logger.error).toBe('function');
      expect(typeof logger.warn).toBe('function');
      expect(typeof logger.debug).toBe('function');
    });

    test('should log info messages with proper format', () => {
      const message = 'Test info message';
      const context = { userId: '123' };
      
      logger.info(message, context);
      
      expect(console.log).toHaveBeenCalledWith('[INFO] Test info message', context);
    });

    test('should log error messages with proper format', () => {
      const message = 'Test error message';
      const context = { error: 'Something went wrong' };
      
      logger.error(message, context);
      
      expect(console.error).toHaveBeenCalledWith('[ERROR] Test error message', context);
    });

    test('should log warning messages with proper format', () => {
      const message = 'Test warning message';
      const context = { warning: 'Deprecated feature' };
      
      logger.warn(message, context);
      
      expect(console.warn).toHaveBeenCalledWith('[WARN] Test warning message', context);
    });

    test('should log debug messages with proper format', () => {
      const message = 'Test debug message';
      const context = { debug: 'Debug info' };
      
      logger.debug(message, context);
      
      expect(console.debug).toHaveBeenCalledWith('[DEBUG] Test debug message', context);
    });

    test('should handle logging without context', () => {
      logger.info('Simple message');
      logger.error('Error message');
      logger.warn('Warning message');
      logger.debug('Debug message');
      
      expect(console.log).toHaveBeenCalledWith('[INFO] Simple message', '');
      expect(console.error).toHaveBeenCalledWith('[ERROR] Error message', '');
      expect(console.warn).toHaveBeenCalledWith('[WARN] Warning message', '');
      expect(console.debug).toHaveBeenCalledWith('[DEBUG] Debug message', '');
    });

    test('should handle empty context object', () => {
      const emptyContext = {};
      
      logger.info('Message with empty context', emptyContext);
      
      expect(console.log).toHaveBeenCalledWith('[INFO] Message with empty context', emptyContext);
    });

    test('should handle null context', () => {
      logger.info('Message with null context', null);
      
      expect(console.log).toHaveBeenCalledWith('[INFO] Message with null context', '');
    });

    test('should handle undefined context', () => {
      logger.info('Message with undefined context', undefined);
      
      expect(console.log).toHaveBeenCalledWith('[INFO] Message with undefined context', '');
    });
  });

  describe('Logger Interface Consistency', () => {
    test('should maintain consistent interface across environments', () => {
      // Test server environment
      Object.defineProperty(global, 'window', {
        value: undefined,
        writable: true,
      });
      
      jest.resetModules();
      const serverLogger = require('../utils/logger').default;
      
      // Test client environment
      Object.defineProperty(global, 'window', {
        value: {},
        writable: true,
      });
      
      jest.resetModules();
      const clientLogger = require('../utils/logger').default;
      
      // Both should have the same interface
      const requiredMethods = ['info', 'error', 'warn', 'debug'];
      
      requiredMethods.forEach(method => {
        expect(typeof serverLogger[method]).toBe('function');
        expect(typeof clientLogger[method]).toBe('function');
      });
    });
  });

  describe('Error Scenarios', () => {
    beforeEach(() => {
      // Mock browser environment
      Object.defineProperty(global, 'window', {
        value: {},
        writable: true,
      });
      
      logger = require('../utils/logger').default;
    });

    test('should handle large context objects', () => {
      const largeContext = {
        data: new Array(1000).fill('test'),
        nested: {
          deep: {
            object: {
              with: 'many properties'
            }
          }
        }
      };
      
      expect(() => {
        logger.info('Large context test', largeContext);
      }).not.toThrow();
      
      expect(console.log).toHaveBeenCalledWith('[INFO] Large context test', largeContext);
    });

    test('should handle circular reference in context', () => {
      const circularContext: any = { name: 'test' };
      circularContext.self = circularContext;
      
      expect(() => {
        logger.info('Circular reference test', circularContext);
      }).not.toThrow();
      
      expect(console.log).toHaveBeenCalledWith('[INFO] Circular reference test', circularContext);
    });

    test('should handle special characters in messages', () => {
      const specialMessage = 'Message with 特殊文字 and émojis 🚀 and symbols @#$%^&*()';
      
      logger.info(specialMessage);
      
      expect(console.log).toHaveBeenCalledWith(`[INFO] ${specialMessage}`, '');
    });
  });
});
