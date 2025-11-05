/**
 * ============================================
 * DIAMONDSISTEM - Servidor Principal
 * Sistema de Gestión de Eventos y Contratos
 * ============================================
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');

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

// Middleware personalizado
const { errorHandler } = require('./middleware/errorHandler');
const { requestLogger } = require('./middleware/logger');

// Inicializar Express
const app = express();
const PORT = process.env.PORT || 5000;

// Inicializar Prisma Client
const prisma = new PrismaClient();

// ============================================
// MIDDLEWARE GLOBAL
// ============================================

// CORS - Permitir peticiones desde el frontend
const corsOptions = {
  origin: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logger de requests (solo en desarrollo)
if (process.env.NODE_ENV === 'development') {
  app.use(requestLogger);
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
      ajustes: '/api/ajustes'
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
app.use('/api/auth', authRoutes);
app.use('/api/vendedores', vendedoresRoutes);
app.use('/api/clientes', clientesRoutes);
app.use('/api/paquetes', paquetesRoutes);
app.use('/api/servicios', serviciosRoutes);
app.use('/api/ofertas', ofertasRoutes);
app.use('/api/contratos', contratosRoutes);
app.use('/api/eventos', eventosRoutes);
app.use('/api/pagos', pagosRoutes);
app.use('/api/solicitudes', solicitudesRoutes);
app.use('/api/mensajes', mensajesRoutes);
app.use('/api/temporadas', temporadasRoutes);
app.use('/api/mesas', mesasRoutes);
app.use('/api/invitados', invitadosRoutes);
app.use('/api/playlist', playlistRoutes);
app.use('/api/ajustes', ajustesRoutes);
app.use('/api/ajustes-evento', ajustesRoutes); // Alias para compatibilidad
app.use('/api/emails', emailsRoutes);
app.use('/api/salones', salonesRoutes);

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
    // Verificar conexión a la base de datos
    await prisma.$connect();
    console.log('✅ Conexión a la base de datos establecida');

    // Iniciar el servidor
    app.listen(PORT, () => {
      console.log('\n🚀 ============================================');
      console.log(`   DiamondSistem API v${process.env.APP_VERSION || '1.0.0'}`);
      console.log('   ============================================');
      console.log(`   🌐 Servidor corriendo en: http://localhost:${PORT}`);
      console.log(`   📊 Health check: http://localhost:${PORT}/health`);
      console.log(`   📚 API Docs: http://localhost:${PORT}/`);
      console.log(`   🔧 Entorno: ${process.env.NODE_ENV || 'development'}`);
      console.log('   ============================================\n');
    });
  } catch (error) {
    console.error('❌ Error al iniciar el servidor:', error);
    process.exit(1);
  }
};

// Manejo de cierre graceful
process.on('SIGINT', async () => {
  console.log('\n⚠️  Cerrando servidor...');
  await prisma.$disconnect();
  console.log('✅ Conexión a la base de datos cerrada');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n⚠️  Cerrando servidor...');
  await prisma.$disconnect();
  console.log('✅ Conexión a la base de datos cerrada');
  process.exit(0);
});

// Iniciar servidor
startServer();

module.exports = app;

