import winston from 'winston';

// Create a logger instance using Winston
const logger = winston.createLogger({
    // Set the logging level to 'info'
    level: 'info',
    // Combine timestamp and JSON format for log messages
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    // Define the transports for the logger
    transports: [
        // Output logs to the console
        new winston.transports.Console(),
        // Output logs to a file named 'combined.log'
        new winston.transports.File({ filename: 'combined.log' }),
        // Output error logs to a file named 'error.log'
        new winston.transports.File({ filename: 'error.log', level: 'error' })
    ],
});

// Export the logger instance for use in other parts of the application
export default logger;
