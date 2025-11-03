/**
 * Middleware para logging de requests
 */

const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  // Log cuando la respuesta termine
  res.on('finish', () => {
    const duration = Date.now() - start;
    const log = {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('user-agent')
    };

    // Color según el status code
    const statusColor = 
      res.statusCode >= 500 ? '\x1b[31m' : // Rojo para 5xx
      res.statusCode >= 400 ? '\x1b[33m' : // Amarillo para 4xx
      res.statusCode >= 300 ? '\x1b[36m' : // Cyan para 3xx
      '\x1b[32m'; // Verde para 2xx

    console.log(
      `${statusColor}${req.method}\x1b[0m ${req.path} - ${statusColor}${res.statusCode}\x1b[0m - ${duration}ms`
    );
  });

  next();
};

module.exports = {
  requestLogger
};



