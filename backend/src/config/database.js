/**
 * ============================================
 * SINGLETON DE PRISMA CLIENT
 * ============================================
 * Evita múltiples instancias y agotamiento del pool de conexiones
 * Patrón Singleton para garantizar una sola instancia en toda la aplicación
 */

const { PrismaClient } = require('@prisma/client');
const logger = require('../utils/logger');

// Instancia única de PrismaClient
let prismaInstance = null;

/**
 * Obtener instancia única de PrismaClient
 * @returns {PrismaClient} Instancia de PrismaClient
 */
const getPrismaClient = () => {
  if (!prismaInstance) {
    prismaInstance = new PrismaClient({
      log: process.env.NODE_ENV === 'development' 
        ? ['query', 'error', 'warn'] 
        : ['error'],
      errorFormat: 'pretty',
      // Configuración del pool de conexiones
      datasources: {
        db: {
          url: process.env.DATABASE_URL
        }
      }
    });

    // Manejar errores de conexión
    prismaInstance.$on('error', (e) => {
      logger.error('Prisma Client Error:', e);
    });

    // Log de queries en desarrollo
    if (process.env.NODE_ENV === 'development') {
      prismaInstance.$on('query', (e) => {
        if (e.duration > 1000) { // Log queries lentas (>1s)
          logger.warn(`Slow query detected: ${e.duration}ms - ${e.query}`);
        }
      });
    }

    logger.info('✅ Prisma Client singleton inicializado');
  }

  return prismaInstance;
};

/**
 * Cerrar conexión de Prisma (para shutdown graceful)
 */
const disconnectPrisma = async () => {
  if (prismaInstance) {
    await prismaInstance.$disconnect();
    prismaInstance = null;
    logger.info('✅ Prisma Client desconectado');
  }
};

module.exports = {
  getPrismaClient,
  disconnectPrisma,
  // Exportar directamente para compatibilidad
  prisma: getPrismaClient()
};
