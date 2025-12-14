/**
 * ============================================
 * DIAMONDSISTEM - Configuración Centralizada
 * Todas las configuraciones del sistema en un solo lugar
 * ============================================
 */

require('dotenv').config();

/**
 * Configuración de la aplicación
 */
const app = {
  name: 'DiamondSistem API',
  version: process.env.APP_VERSION || '1.0.0',
  port: process.env.PORT || 5000,
  env: process.env.NODE_ENV || 'development',
  corsOrigins: process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',').map(o => o.trim())
    : [
        // Desarrollo: permitir localhost en puertos comunes de Vite
        /^http:\/\/localhost:\d+$/,
        /^http:\/\/127\.0\.0\.1:\d+$/,
        // Permitir IPs locales en cualquier puerto
        /^http:\/\/10\.\d+\.\d+\.\d+:\d+$/,
        /^http:\/\/192\.168\.\d+\.\d+:\d+$/,
      ]
};

/**
 * Configuración de base de datos
 */
const database = {
  url: process.env.DATABASE_URL,
  pool: {
    min: parseInt(process.env.DB_POOL_MIN) || 2,
    max: parseInt(process.env.DB_POOL_MAX) || 10,
  },
  timeout: parseInt(process.env.DB_TIMEOUT) || 60000, // 60 segundos
};

/**
 * Configuración de autenticación y seguridad
 */
const auth = {
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },
  bcrypt: {
    rounds: parseInt(process.env.BCRYPT_ROUNDS) || 12,
  },
};

/**
 * Configuración de emails
 */
const email = {
  service: process.env.EMAIL_SERVICE || 'gmail',
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT) || 587,
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  from: process.env.EMAIL_FROM || 'noreply@diamondsistem.com',
};

/**
 * Configuración de Google Calendar
 */
const googleCalendar = {
  clientId: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  redirectUri: process.env.GOOGLE_REDIRECT_URI,
  calendarId: process.env.GOOGLE_CALENDAR_ID,
};

/**
 * Configuración de rate limiting
 */
const rateLimit = {
  general: {
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // límite de 100 requests por windowMs
    message: 'Demasiadas solicitudes desde esta IP, por favor intenta más tarde.',
  },
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 5, // límite de 5 requests por windowMs para auth
    message: 'Demasiados intentos de autenticación, por favor intenta más tarde.',
  },
  mensajes: {
    windowMs: 60 * 1000, // 1 minuto
    max: 30, // límite de 30 mensajes por minuto
    message: 'Demasiados mensajes enviados, por favor espera un momento.',
  },
  fotos: {
    windowMs: 60 * 1000, // 1 minuto
    max: 10, // límite de 10 uploads por minuto
    message: 'Demasiadas imágenes subidas, por favor espera un momento.',
  },
  leaks: {
    windowMs: 30 * 1000, // 30 segundos
    max: 20, // límite de 20 requests por 30 segundos
    message: 'Demasiadas solicitudes de leaks, por favor espera un momento.',
  },
};

/**
 * Configuración de archivos y uploads
 */
const uploads = {
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024, // 5MB
  allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
  tempDir: process.env.TEMP_DIR || './temp',
  imagesDir: process.env.IMAGES_DIR || './public/fotos',
};

/**
 * Configuración de jobs programados
 */
const jobs = {
  inventarioAsignacion: {
    cron: '0 2 * * *', // Todos los días a las 2:00 AM
    timezone: process.env.JOBS_TIMEZONE || 'America/New_York',
    enabled: process.env.JOBS_INVENTARIO_ENABLED !== 'false',
  },
  leaksSync: {
    enabled: false, // Deshabilitado por defecto, solo manual
  },
};

/**
 * Configuración de logging
 */
const logging = {
  level: process.env.LOG_LEVEL || 'info',
  file: {
    enabled: process.env.LOG_TO_FILE === 'true',
    path: process.env.LOG_FILE_PATH || './logs/app.log',
    maxSize: process.env.LOG_MAX_SIZE || '20m',
    maxFiles: process.env.LOG_MAX_FILES || '5',
  },
  console: {
    enabled: process.env.LOG_TO_CONSOLE !== 'false',
    colorize: process.env.LOG_COLORIZE !== 'false',
  },
};

/**
 * Configuración de Helmet (seguridad HTTP)
 */
const helmet = {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      connectSrc: ["'self'", "https:"],
      fontSrc: ["'self'", "https:", "data:"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: app.env === 'production' ? [] : null,
    },
  },
  crossOriginEmbedderPolicy: false, // Permitir PDFs embebidos
  crossOriginResourcePolicy: { policy: "cross-origin" }, // Permitir recursos cross-origin
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },
};

/**
 * Configuración de CORS
 */
const cors = {
  origin: (origin, callback) => {
    // Permitir requests sin origin (mobile apps, Postman, etc.)
    if (!origin) {
      return callback(null, true);
    }

    // Verificar si el origen está permitido
    const isAllowed = app.corsOrigins.some(allowed => {
      if (allowed instanceof RegExp) {
        return allowed.test(origin);
      }
      return allowed === origin;
    });

    if (isAllowed) {
      callback(null, true);
    } else {
      console.warn(`CORS bloqueado: ${origin}`);
      callback(new Error('No permitido por CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'Access-Control-Request-Method',
    'Access-Control-Request-Headers'
  ],
  exposedHeaders: ['Authorization'],
  preflightContinue: false,
};

/**
 * Configuración de sesiones y caché
 */
const cache = {
  redis: {
    enabled: process.env.REDIS_ENABLED === 'true',
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD,
  },
  ttl: {
    contratos: parseInt(process.env.CACHE_CONTRATOS_TTL) || 300, // 5 minutos
    usuarios: parseInt(process.env.CACHE_USUARIOS_TTL) || 600, // 10 minutos
    paquetes: parseInt(process.env.CACHE_PAQUETES_TTL) || 1800, // 30 minutos
  },
};

/**
 * Función para validar configuración crítica
 */
const validateConfig = () => {
  const required = [
    { key: 'database.url', value: database.url },
    { key: 'auth.jwt.secret', value: auth.jwt.secret },
    { key: 'email.auth.user', value: email.auth.user },
    { key: 'email.auth.pass', value: email.auth.pass },
  ];

  const missing = required.filter(item => !item.value);

  if (missing.length > 0) {
    console.error('❌ Variables de entorno requeridas faltantes:');
    missing.forEach(item => {
      console.error(`   - ${item.key}`);
    });
    process.exit(1);
  }

  console.log('✅ Configuración validada correctamente');
};

/**
 * Función para imprimir resumen de configuración (desarrollo)
 */
const printConfigSummary = () => {
  if (app.env === 'development') {
    console.log('\n🔧 Configuración cargada:');
    console.log(`   - Entorno: ${app.env}`);
    console.log(`   - Puerto: ${app.port}`);
    console.log(`   - Base de datos: ${database.url ? '✅ Configurada' : '❌ No configurada'}`);
    console.log(`   - JWT: ${auth.jwt.secret ? '✅ Configurado' : '❌ No configurado'}`);
    console.log(`   - Email: ${email.auth.user ? '✅ Configurado' : '❌ No configurado'}`);
    console.log('');
  }
};

// Exportar todas las configuraciones
module.exports = {
  app,
  database,
  auth,
  email,
  googleCalendar,
  rateLimit,
  uploads,
  jobs,
  logging,
  helmet,
  cors,
  cache,
  validateConfig,
  printConfigSummary,
};
