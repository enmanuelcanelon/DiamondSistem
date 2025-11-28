/**
 * ============================================
 * DIAMONDSISTEM - Servidor Principal
 * Sistema de Gestión de Eventos y Contratos
 * ============================================
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { PrismaClient } = require('@prisma/client');
const path = require('path');
const fs = require('fs');

// Logger estructurado
const logger = require('./utils/logger');

// Importar rutas
const vendedoresRoutes = require('./routes/vendedores.routes');
const clientesRoutes = require('./routes/clientes.routes');
const paquetesRoutes = require('./routes/paquetes.routes');
const serviciosRoutes = require('./routes/servicios.routes');
const ofertasRoutes = require('./routes/ofertas.routes');
const contratosRoutes = require('./routes/contratos.routes');
const eventosRoutes = require('./routes/eventos.routes');
const pagosRoutes = require('./routes/pagos.routes');
const solicitudesRoutes = require('./routes/solicitudes.routes');
const mensajesRoutes = require('./routes/mensajes.routes');
const temporadasRoutes = require('./routes/temporadas.routes');
const mesasRoutes = require('./routes/mesas.routes');
const invitadosRoutes = require('./routes/invitados.routes');
const playlistRoutes = require('./routes/playlist.routes');
const ajustesRoutes = require('./routes/ajustes.routes');
const emailsRoutes = require('./routes/emails.routes');
const salonesRoutes = require('./routes/salones.routes');
const authRoutes = require('./routes/auth.routes');
const fotosRoutes = require('./routes/fotos.routes');
const managersRoutes = require('./routes/managers.routes');
const gerentesRoutes = require('./routes/gerentes.routes');
const inventarioRoutes = require('./routes/inventario.routes');
const comisionesRoutes = require('./routes/comisiones.routes');
const leaksRoutes = require('./routes/leaks.routes');
const googleCalendarRoutes = require('./routes/googleCalendar.routes');

// Jobs
const cron = require('node-cron');
const { asignarInventarioAutomatico } = require('./jobs/inventarioAutoAsignacion');

// Middleware personalizado
const { errorHandler } = require('./middleware/errorHandler');
const { requestLogger } = require('./middleware/logger');
const { generalLimiter, authLimiter, fotosLimiter, mensajesLimiter, leaksLimiter } = require('./middleware/security');

// Crear directorio de logs si no existe
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Inicializar Express
const app = express();
const PORT = process.env.PORT || 5000;

// Inicializar Prisma Client (singleton)
const { getPrismaClient, disconnectPrisma } = require('./config/database');
const prisma = getPrismaClient();

// ============================================
// MIDDLEWARE GLOBAL DE SEGURIDAD
// ============================================

// Helmet - Headers de seguridad HTTP
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      // Removido 'http:' por seguridad - solo HTTPS en producción
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      connectSrc: ["'self'", "https:"],
      fontSrc: ["'self'", "https:", "data:"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null,
    },
  },
  crossOriginEmbedderPolicy: false, // Permitir PDFs embebidos
  crossOriginResourcePolicy: { policy: "cross-origin" }, // Permitir recursos cross-origin (imágenes)
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },
}));

// CORS - Configuración segura
const corsOptions = {
  origin: (origin, callback) => {
    // En desarrollo, permitir localhost y IPs locales para pruebas multi-dispositivo
    if (process.env.NODE_ENV === 'development' || !process.env.NODE_ENV) {
      const allowedOrigins = process.env.CORS_ORIGINS 
        ? process.env.CORS_ORIGINS.split(',').map(o => o.trim())
        : [
            // Frontends separados - cada uno en su puerto
            'http://localhost:5173', // frontend-vendedor
            'http://localhost:5174', // frontend-cliente
            'http://localhost:5175', // frontend-manager
            'http://localhost:5176', // frontend-gerente
            'http://localhost:5177', // frontend-inventario
            'http://localhost:3000',
            'http://127.0.0.1:5173',
            'http://127.0.0.1:5174',
            'http://127.0.0.1:5175',
            'http://127.0.0.1:5176',
            'http://127.0.0.1:5177',
            'http://127.0.0.1:3000',
            // Permitir IPs locales (10.x.x.x, 192.168.x.x) en cualquier puerto
            /^http:\/\/10\.\d+\.\d+\.\d+:\d+$/,
            /^http:\/\/192\.168\.\d+\.\d+:\d+$/,
          ];
      
      // Si no hay origin (misma origen, mobile apps, etc.), permitir
      if (!origin) {
        return callback(null, true);
      }
      
      // Verificar si el origen está permitido
      const isAllowed = allowedOrigins.some(allowed => {
        if (allowed instanceof RegExp) {
          return allowed.test(origin);
        }
        return allowed === origin;
      });
      
      if (isAllowed) {
        callback(null, true);
      } else {
        logger.warn(`CORS bloqueado: ${origin}`);
        callback(new Error('No permitido por CORS'));
      }
    } else {
      // En producción, solo orígenes específicos
      const allowedOrigins = process.env.CORS_ORIGINS 
        ? process.env.CORS_ORIGINS.split(',').map(o => o.trim())
        : ['http://localhost:5173'];
      
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        logger.warn(`CORS bloqueado en producción: ${origin}`);
        callback(new Error('No permitido por CORS'));
      }
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
};

app.use(cors(corsOptions));

// Rate limiting general (aumentado para uso normal)
// Nota: Rutas específicas tienen sus propios limiters más permisivos
app.use(generalLimiter);

// Servir archivos estáticos (fotos, etc.) con CORS habilitado
app.use('/fotos', express.static(path.join(__dirname, '../public/fotos'), {
  setHeaders: (res, path) => {
    // Permitir CORS para imágenes
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET');
    res.set('Cache-Control', 'public, max-age=31536000'); // Cache por 1 año
  }
}));

// Servir imágenes de distribución de mesas desde information_general
// Con caché reducido para permitir actualizaciones rápidas
app.use('/distribucion_mesas', express.static(path.join(__dirname, '../../information_general/distribucion_mesas'), {
  setHeaders: (res, filePath) => {
    // Permitir CORS
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET');
    // Cache reducido (1 hora) o sin cache en desarrollo para permitir actualizaciones rápidas
    if (process.env.NODE_ENV === 'development') {
      res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.set('Pragma', 'no-cache');
      res.set('Expires', '0');
    } else {
      res.set('Cache-Control', 'public, max-age=3600'); // 1 hora en producción
    }
  }
}));

// Servir otros archivos estáticos normalmente
app.use(express.static(path.join(__dirname, '../public')));

// Body parser con límites de tamaño más restrictivos
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// Logger de requests
if (process.env.NODE_ENV === 'development') {
  app.use(requestLogger);
} else {
  // En producción, usar logger estructurado
  app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      logger.http(`${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`, {
        method: req.method,
        path: req.path,
        status: res.statusCode,
        duration,
        ip: req.ip || req.connection.remoteAddress,
      });
    });
    next();
  });
}

// ============================================
// RUTAS
// ============================================

// Ruta de prueba
app.get('/', (req, res) => {
  res.json({
    message: '🎉 DiamondSistem API v1.0',
    status: 'online',
    timestamp: new Date().toISOString(),
    endpoints: {
      auth: '/api/auth',
      vendedores: '/api/vendedores',
      clientes: '/api/clientes',
      paquetes: '/api/paquetes',
      servicios: '/api/servicios',
      ofertas: '/api/ofertas',
      contratos: '/api/contratos',
      eventos: '/api/eventos',
      pagos: '/api/pagos',
      solicitudes: '/api/solicitudes',
      mensajes: '/api/mensajes',
      temporadas: '/api/temporadas',
      mesas: '/api/mesas',
      invitados: '/api/invitados',
      playlist: '/api/playlist',
      ajustes: '/api/ajustes',
      inventario: '/api/inventario'
    }
  });
});

// Health check
app.get('/health', async (req, res) => {
  try {
    // Verificar conexión a la base de datos
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      status: 'healthy',
      database: 'connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      database: 'disconnected',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Rutas de la API
// Rate limiting estricto para autenticación
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/vendedores', vendedoresRoutes);
app.use('/api/clientes', clientesRoutes);
app.use('/api/paquetes', paquetesRoutes);
app.use('/api/servicios', serviciosRoutes);
app.use('/api/ofertas', ofertasRoutes);
app.use('/api/contratos', contratosRoutes);
app.use('/api/eventos', eventosRoutes);
app.use('/api/pagos', pagosRoutes);
app.use('/api/solicitudes', solicitudesRoutes);
// Rutas de mensajes con rate limiting muy permisivo (chat en tiempo real)
app.use('/api/mensajes', mensajesLimiter, mensajesRoutes);
app.use('/api/temporadas', temporadasRoutes);
app.use('/api/mesas', mesasRoutes);
app.use('/api/invitados', invitadosRoutes);
app.use('/api/playlist', playlistRoutes);
app.use('/api/ajustes', ajustesRoutes);
app.use('/api/ajustes-evento', ajustesRoutes); // Alias para compatibilidad
app.use('/api/emails', emailsRoutes);
app.use('/api/salones', salonesRoutes);
// Rutas de fotos con rate limiting más permisivo
app.use('/api/fotos', fotosLimiter, fotosRoutes);
app.use('/api/managers', managersRoutes);
app.use('/api/gerentes', gerentesRoutes);
app.use('/api/inventario', inventarioRoutes);
app.use('/api/inventario/comisiones', comisionesRoutes);
// Rutas de leaks con rate limiting permisivo (múltiples vendedores, auto-refresh)
app.use('/api/leaks', leaksLimiter, leaksRoutes);
app.use('/api/google-calendar', googleCalendarRoutes);

// Ruta 404 - Debe ir al final de todas las rutas
app.use((req, res) => {
  res.status(404).json({
    error: 'Endpoint no encontrado',
    path: req.originalUrl,
    method: req.method
  });
});

// ============================================
// MIDDLEWARE DE MANEJO DE ERRORES
// ============================================
app.use(errorHandler);

// ============================================
// INICIAR SERVIDOR
// ============================================

const startServer = async () => {
  try {
    // Verificar conexión a la base de datos (ya está conectado por el singleton)
    await prisma.$queryRaw`SELECT 1`;
    logger.info('✅ Conexión a la base de datos establecida');

    // Verificar e inicializar salones y paquetes si no existen
    const { execSync } = require('child_process');
    const pathModule = require('path');

    try {
      logger.info('🔍 Verificando datos esenciales de base de datos...');

      const salonesCount = await prisma.salones.count({ where: { activo: true } });
      const paquetesCount = await prisma.paquetes.count({ where: { activo: true } });
      const paquetesSalonesCount = await prisma.paquetes_salones.count({ where: { disponible: true } });

      const backendDir = pathModule.resolve(__dirname, '..');

      // Si no hay salones, crearlos
      if (salonesCount === 0) {
        logger.warn('⚠️  No se encontraron salones. Inicializando...');
        execSync('node scripts/crear_salones.js', {
          stdio: 'inherit',
          cwd: backendDir
        });
        logger.info('✅ Salones inicializados');
      } else {
        logger.info(`✅ Salones: ${salonesCount} encontrados`);
      }

      // Si no hay relaciones paquetes-salones, crearlas
      if (paquetesCount > 0 && salonesCount > 0 && paquetesSalonesCount === 0) {
        logger.warn('⚠️  No se encontraron relaciones paquetes-salones. Inicializando...');
        execSync('node scripts/crear_paquetes_salones.js', {
          stdio: 'inherit',
          cwd: backendDir
        });
        logger.info('✅ Relaciones paquetes-salones inicializadas');
      } else if (paquetesSalonesCount > 0) {
        logger.info(`✅ Relaciones paquetes-salones: ${paquetesSalonesCount} encontradas`);
      }
    } catch (initError) {
      logger.error('⚠️  Error al verificar/inicializar datos:', initError.message);
      // Continuar con el servidor incluso si hay error en la inicialización
    }

    // Configurar job de asignación automática de inventario
    // Se ejecuta diariamente a las 2:00 AM
    cron.schedule('0 2 * * *', async () => {
      logger.info('🔄 Ejecutando asignación automática de inventario...');
      try {
        const resultado = await asignarInventarioAutomatico();
        logger.info(`✅ Asignación automática completada: ${resultado.asignados} contratos asignados`);
      } catch (error) {
        logger.error('❌ Error en asignación automática de inventario:', error);
      }
    }, {
      scheduled: true,
      timezone: "America/New_York" // Ajustar según tu zona horaria
    });
    logger.info('✅ Job de asignación automática de inventario configurado (diario a las 2:00 AM)');

    // DESHABILITADO: Job de sincronización automática de leaks
    // La sincronización ahora solo se ejecuta manualmente cuando el usuario hace clic en el botón
    // El endpoint manual está disponible en POST /api/leaks/sincronizar
    logger.info('ℹ️  Sincronización automática de leaks DESHABILITADA - Solo manual mediante botón');

    // Iniciar el servidor
    app.listen(PORT, '0.0.0.0', () => {
      // Obtener IP de red para acceso multi-dispositivo
      const os = require('os');
      const networkInterfaces = os.networkInterfaces();
      let localIP = 'localhost';
      
      // Buscar IP local (no loopback)
      for (const interfaceName in networkInterfaces) {
        const interfaces = networkInterfaces[interfaceName];
        for (const iface of interfaces) {
          if (iface.family === 'IPv4' && !iface.internal) {
            localIP = iface.address;
            break;
          }
        }
        if (localIP !== 'localhost') break;
      }
      
      logger.info('\n🚀 ============================================');
      logger.info(`   DiamondSistem API v${process.env.APP_VERSION || '1.0.0'}`);
      logger.info('   ============================================');
      logger.info(`   🌐 Servidor local: http://localhost:${PORT}`);
      logger.info(`   🌐 Servidor red:   http://${localIP}:${PORT}`);
      logger.info(`   📊 Health check: http://localhost:${PORT}/health`);
      logger.info(`   📚 API Docs: http://localhost:${PORT}/`);
      logger.info(`   🔧 Entorno: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`   🔒 Seguridad: Helmet + Rate Limiting activado`);
      logger.info('   ============================================\n');
    });
  } catch (error) {
    logger.error('❌ Error al iniciar el servidor:', error);
    process.exit(1);
  }
};

// Manejo de cierre graceful
process.on('SIGINT', async () => {
  logger.info('\n⚠️  Cerrando servidor...');
  await disconnectPrisma();
  logger.info('✅ Conexión a la base de datos cerrada');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('\n⚠️  Cerrando servidor...');
  await disconnectPrisma();
  logger.info('✅ Conexión a la base de datos cerrada');
  process.exit(0);
});

// Manejo de errores no capturados
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

// Iniciar servidor
startServer();

module.exports = app;



