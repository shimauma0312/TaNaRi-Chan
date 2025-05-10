import fs from 'fs';
import path from 'path';
import winston from 'winston';

// Define the directory for log files
const logDir = 'logs';

// Create the log directory if it does not exist
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir);
}

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
        new winston.transports.File({ filename: path.join(logDir, 'combined.log') }),
        // Output error logs to a file named 'error.log'
        new winston.transports.File({ filename: path.join(logDir, 'error.log'), level: 'error' })
    ],
});

// Export the logger instance for use in other parts of the application
export default logger;
