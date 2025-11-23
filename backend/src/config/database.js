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
    // Verificar configuración de connection pooling en DATABASE_URL
    const databaseUrl = process.env.DATABASE_URL || '';
    const isSupabase = databaseUrl.includes('supabase.co');
    
    // Para Supabase: usar connection_limit apropiado
    // Free tier: máximo 4 conexiones directas, pero se recomienda usar pooling
    // Si no tiene connection_limit en la URL, Prisma usará el default (10)
    // Para Supabase, es mejor usar connection_limit más bajo (4-6) para evitar errores
    if (isSupabase && !databaseUrl.includes('connection_limit')) {
      logger.warn('⚠️  DATABASE_URL de Supabase sin connection_limit. Considera agregar ?connection_limit=4&pool_timeout=20');
    }

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
        // Para Supabase, ajustar umbral de queries lentas (más latencia de red)
        const slowQueryThreshold = isSupabase ? 2000 : 1000; // 2s para Supabase, 1s para local
        if (e.duration > slowQueryThreshold) {
          logger.warn(`Slow query detected: ${e.duration}ms - ${e.query.substring(0, 200)}...`);
        }
      });
    }

    logger.info(`✅ Prisma Client singleton inicializado${isSupabase ? ' (Supabase)' : ' (Local)'}`);
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
