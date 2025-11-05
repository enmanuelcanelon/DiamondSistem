/**
 * Logger estructurado con Winston
 */

const winston = require('winston');
const path = require('path');

// Definir niveles de log personalizados
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Colores para cada nivel
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

winston.addColors(colors);

// Formato para logs
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Formato para consola (solo en desarrollo)
const consoleFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}${info.stack ? '\n' + info.stack : ''}`
  )
);

// Transportes (dónde se guardan los logs)
const transports = [
  // Console (solo en desarrollo)
  new winston.transports.Console({
    format: process.env.NODE_ENV === 'production' ? format : consoleFormat,
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  }),
];

// En producción, agregar archivo de logs
if (process.env.NODE_ENV === 'production') {
  transports.push(
    new winston.transports.File({
      filename: path.join(__dirname, '../../logs/error.log'),
      level: 'error',
      format: format,
    }),
    new winston.transports.File({
      filename: path.join(__dirname, '../../logs/combined.log'),
      format: format,
    })
  );
}

// Crear el logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
  levels,
  format,
  transports,
  // No salir del proceso si hay un error
  exitOnError: false,
});

// Stream para Express morgan (si se usa en el futuro)
logger.stream = {
  write: (message) => {
    logger.http(message.trim());
  },
};

module.exports = logger;

