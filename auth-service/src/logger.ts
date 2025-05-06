import { createLogger, format, transports } from 'winston';

const { combine, timestamp, printf, colorize } = format;

// Define the custom format for log messages
const customFormat = printf(({ level, message, timestamp }) => {
    return `${new Date(timestamp).toLocaleString()} [${level}]: ${message}`;
});

// Create the logger instance
const logger = createLogger({
    level: 'info', // Set the default log level
    format: combine(
        colorize(), // Colorize the output
        timestamp(), // Add a timestamp
        customFormat // Use the custom format
    ),
    transports: [
        new transports.Console(), // Log to the console
        new transports.File({ filename: 'logs/app.log' }) // Log to a file
    ]
});

export default logger;
