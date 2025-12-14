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

// Jobs ahora manejados por ServerInitializer

// Middleware personalizado
const { errorHandler } = require('./middleware/errorHandler');
const { requestLogger } = require('./middleware/logger');
const { generalLimiter, authLimiter, fotosLimiter, mensajesLimiter, leaksLimiter } = require('./middleware/security');

// Crear directorio de logs si no existe
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Configuración centralizada
const config = require('./config');

// Validar configuración crítica al inicio
config.validateConfig();
config.printConfigSummary();

// Inicializar Express
const app = express();

// Trust proxy - Necesario para Railway y otros servicios que usan proxy reverso
app.set('trust proxy', true);

// Inicializar Prisma Client (singleton)
const { getPrismaClient, disconnectPrisma } = require('./config/database');
const prisma = getPrismaClient();

// ============================================
// MIDDLEWARE GLOBAL DE SEGURIDAD
// ============================================

// Helmet - Headers de seguridad HTTP (desde configuración centralizada)
app.use(helmet(config.helmet));

// CORS - Configuración desde configuración centralizada
app.use(cors(config.cors));

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

// Inicializador del servidor
const { ServerInitializer } = require('./utils/serverInit');
const serverInit = new ServerInitializer(prisma);

const startServer = () => serverInit.startServer(app, config.app.port);

// Configurar cierre graceful y manejo de errores
serverInit.setupGracefulShutdown(disconnectPrisma);

// Iniciar servidor
startServer();

module.exports = app;