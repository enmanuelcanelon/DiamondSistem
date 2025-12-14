/**
 * ============================================
 * DIAMONDSISTEM - Inicialización del Servidor
 * Módulo para inicialización y configuración automática
 * ============================================
 */

const { execSync } = require('child_process');
const path = require('path');
const os = require('os');
const cron = require('node-cron');
const { getPrismaClient } = require('../config/database');
const { asignarInventarioAutomatico } = require('../jobs/inventarioAutoAsignacion');
const logger = require('../middleware/logger');

class ServerInitializer {
  constructor(prisma) {
    this.prisma = prisma;
    this.backendDir = path.resolve(__dirname, '../..');
  }

  /**
   * Verifica e inicializa datos esenciales de la base de datos
   */
  async initializeDatabaseData() {
    try {
      logger.info('🔍 Verificando datos esenciales de base de datos...');

      // Verificar salones
      const salonesCount = await this.prisma.salones.count({ where: { activo: true } });
      const paquetesCount = await this.prisma.paquetes.count({ where: { activo: true } });
      const paquetesSalonesCount = await this.prisma.paquetes_salones.count({ where: { disponible: true } });

      // Inicializar salones si no existen
      if (salonesCount === 0) {
        logger.warn('⚠️  No se encontraron salones. Inicializando...');
        execSync('node scripts/crear_salones.js', {
          stdio: 'inherit',
          cwd: this.backendDir
        });
        logger.info('✅ Salones inicializados');
      } else {
        logger.info(`✅ Salones: ${salonesCount} encontrados`);
      }

      // Inicializar relaciones paquetes-salones si no existen
      if (paquetesCount > 0 && salonesCount > 0 && paquetesSalonesCount === 0) {
        logger.warn('⚠️  No se encontraron relaciones paquetes-salones. Inicializando...');
        execSync('node scripts/crear_paquetes_salones.js', {
          stdio: 'inherit',
          cwd: this.backendDir
        });
        logger.info('✅ Relaciones paquetes-salones inicializadas');
      } else if (paquetesSalonesCount > 0) {
        logger.info(`✅ Relaciones paquetes-salones: ${paquetesSalonesCount} encontradas`);
      }

    } catch (initError) {
      logger.error('⚠️  Error al verificar/inicializar datos:', initError.message);
      // Continuar con el servidor incluso si hay error en la inicialización
    }
  }

  /**
   * Configura los jobs programados (cron jobs)
   */
  setupScheduledJobs() {
    // Job de asignación automática de inventario
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
  }

  /**
   * Obtiene la dirección IP local para acceso multi-dispositivo
   */
  getLocalIP() {
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

    return localIP;
  }

  /**
   * Inicia el servidor con toda la configuración necesaria
   */
  async startServer(app, PORT) {
    try {
      // Iniciar el servidor PRIMERO (antes de verificar BD)
      // Esto permite que el healthcheck pase mientras la BD se conecta
      app.listen(PORT, '0.0.0.0', async () => {
        const localIP = this.getLocalIP();

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

        // Ahora verificar conexión a la base de datos (en background)
        try {
          await this.prisma.$queryRaw`SELECT 1`;
          logger.info('✅ Conexión a la base de datos establecida');

          // Inicializar datos de base de datos
          await this.initializeDatabaseData();

          // Configurar jobs programados
          this.setupScheduledJobs();
        } catch (dbError) {
          logger.error('⚠️  Error al conectar con la base de datos:', dbError);
          logger.warn('⚠️  El servidor está funcionando pero algunas funcionalidades pueden no estar disponibles');
        }
      });

    } catch (error) {
      logger.error('❌ Error al iniciar el servidor:', error);
      process.exit(1);
    }
  }

  /**
   * Configura los manejadores de cierre graceful
   */
  setupGracefulShutdown(disconnectPrisma) {
    const shutdown = async (signal) => {
      logger.info(`\n⚠️  Cerrando servidor (${signal})...`);
      await disconnectPrisma();
      logger.info('✅ Conexión a la base de datos cerrada');
      process.exit(0);
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));

    // Manejo de errores no capturados
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
    });

    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception:', error);
      process.exit(1);
    });
  }
}

module.exports = { ServerInitializer };
