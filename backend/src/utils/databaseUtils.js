/**
 * ============================================
 * DIAMONDSISTEM - Utilidades de Base de Datos
 * Módulo consolidado para operaciones de limpieza y mantenimiento
 * ============================================
 */

const { PrismaClient } = require('@prisma/client');
const logger = require('../middleware/logger');

class DatabaseUtils {
  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * Ejecuta una operación de base de datos con manejo de errores estándar
   * @param {Function} operation - Función asíncrona a ejecutar
   * @param {string} operationName - Nombre de la operación para logging
   */
  async executeOperation(operation, operationName) {
    try {
      logger.info(`🔄 Iniciando operación: ${operationName}`, {
        operation: operationName,
        timestamp: new Date().toISOString()
      });

      const result = await operation();

      logger.info(`✅ Operación completada: ${operationName}`, {
        operation: operationName,
        success: true,
        timestamp: new Date().toISOString()
      });
      return result;

    } catch (error) {
      logger.error(`❌ Error en operación ${operationName}`, {
        operation: operationName,
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  }

  /**
   * Obtiene estadísticas de tablas relacionadas con contratos
   */
  async getContractStats() {
    const [
      contratos,
      eventos,
      pagos,
      solicitudes,
      mensajes,
      invitados,
      mesas,
      ajustes,
      versionesPdf,
      asignacionesInventario,
      movimientosInventario
    ] = await Promise.all([
      this.prisma.contratos.count(),
      this.prisma.eventos.count(),
      this.prisma.pagos.count(),
      this.prisma.solicitudes_cliente.count(),
      this.prisma.mensajes.count(),
      this.prisma.invitados.count(),
      this.prisma.mesas.count(),
      this.prisma.ajustes_evento.count(),
      this.prisma.versiones_contratos_pdf.count(),
      this.prisma.asignaciones_inventario.count(),
      this.prisma.movimientos_inventario.count()
    ]);

    return {
      contratos,
      eventos,
      pagos,
      solicitudes,
      mensajes,
      invitados,
      mesas,
      ajustes,
      versionesPdf,
      asignacionesInventario,
      movimientosInventario
    };
  }

  /**
   * Obtiene estadísticas de tablas relacionadas con clientes y ofertas
   */
  async getClientOfferStats() {
    const [
      clientes,
      ofertas,
      serviciosOfertas,
      contratosClientes
    ] = await Promise.all([
      this.prisma.clientes.count(),
      this.prisma.ofertas.count(),
      this.prisma.ofertas_servicios_adicionales.count(),
      this.prisma.contratos.count({ where: { cliente_id: { not: null } } })
    ]);

    return {
      clientes,
      ofertas,
      serviciosOfertas,
      contratosClientes
    };
  }

  /**
   * Elimina datos relacionados con contratos en orden de dependencias
   */
  async cleanContractRelatedData() {
    return this.executeOperation(async () => {
      console.log('📋 Eliminando datos relacionados con contratos...');

      // Eliminar en orden de dependencias (de las más profundas a las menos profundas)
      const deletions = [
        { table: 'movimientos_inventario', where: { contrato_id: { not: null } }, description: 'Movimientos de inventario' },
        { table: 'asignaciones_inventario', where: {}, description: 'Asignaciones de inventario' },
        { table: 'checklist_servicios_externos', where: {}, description: 'Checklist de servicios externos' },
        { table: 'mensajes', where: {}, description: 'Mensajes' },
        { table: 'playlist_canciones', where: {}, description: 'Playlist de canciones' },
        { table: 'invitados', where: {}, description: 'Invitados' },
        { table: 'mesas', where: {}, description: 'Mesas' },
        { table: 'versiones_contratos_pdf', where: {}, description: 'Versiones de contratos PDF' },
        { table: 'ajustes_evento', where: {}, description: 'Ajustes de evento' },
        { table: 'solicitudes_cliente', where: { contrato_id: { not: null } }, description: 'Solicitudes de cliente (con contrato)' },
        { table: 'pagos', where: {}, description: 'Pagos' },
        { table: 'eventos', where: {}, description: 'Eventos' },
        { table: 'contratos', where: {}, description: 'Contratos' }
      ];

      for (const { table, where, description } of deletions) {
        try {
          const count = await this.prisma[table].count({ where });
          if (count > 0) {
            await this.prisma[table].deleteMany({ where });
            console.log(`   ✓ ${description}: ${count} eliminados`);
          } else {
            console.log(`   ℹ️  ${description}: 0 encontrados`);
          }
        } catch (error) {
          console.log(`   ⚠️  Error eliminando ${description}:`, error.message);
        }
      }

      console.log('✅ Datos de contratos eliminados');
    }, 'Limpieza de datos relacionados con contratos');
  }

  /**
   * Elimina ofertas y servicios adicionales
   */
  async cleanOffers() {
    return this.executeOperation(async () => {
      console.log('🗑️  Eliminando servicios adicionales de ofertas...');
      const serviciosAdicionalesCount = await this.prisma.ofertas_servicios_adicionales.count();
      if (serviciosAdicionalesCount > 0) {
        await this.prisma.ofertas_servicios_adicionales.deleteMany({});
        console.log(`   ✅ ${serviciosAdicionalesCount} servicios adicionales eliminados`);
      } else {
        console.log('   ℹ️  No hay servicios adicionales para eliminar');
      }

      console.log('\n🗑️  Eliminando ofertas...');
      const ofertasCount = await this.prisma.ofertas.count();
      if (ofertasCount > 0) {
        const resultado = await this.prisma.ofertas.deleteMany({});
        console.log(`   ✅ ${resultado.count} ofertas eliminadas`);
      } else {
        console.log('   ℹ️  No hay ofertas para eliminar');
      }

      return { ofertasCount, serviciosAdicionalesCount };
    }, 'Limpieza de ofertas');
  }

  /**
   * Elimina clientes y datos relacionados
   */
  async cleanClients() {
    return this.executeOperation(async () => {
      console.log('👥 Eliminando clientes...');

      const clientesCount = await this.prisma.clientes.count();
      if (clientesCount > 0) {
        // Primero eliminar contratos relacionados con clientes
        await this.prisma.contratos.deleteMany({
          where: { cliente_id: { not: null } }
        });
        console.log('   ✓ Contratos de clientes eliminados');

        // Luego eliminar clientes
        const resultado = await this.prisma.clientes.deleteMany({});
        console.log(`   ✅ ${resultado.count} clientes eliminados`);
      } else {
        console.log('   ℹ️  No hay clientes para eliminar');
      }

      return { clientesCount };
    }, 'Limpieza de clientes');
  }

  /**
   * Verifica que las operaciones de limpieza fueron exitosas
   */
  async verifyCleanup() {
    const stats = await this.getContractStats();
    const offerStats = await this.getClientOfferStats();

    console.log('\n🔍 Verificación de limpieza:');
    console.log('📊 Contratos y relacionados:');
    Object.entries(stats).forEach(([key, value]) => {
      console.log(`   - ${key}: ${value}`);
    });

    console.log('\n📊 Clientes y ofertas:');
    Object.entries(offerStats).forEach(([key, value]) => {
      console.log(`   - ${key}: ${value}`);
    });

    const totalRemaining = Object.values(stats).reduce((sum, count) => sum + count, 0) +
                          Object.values(offerStats).reduce((sum, count) => sum + count, 0);

    return {
      ...stats,
      ...offerStats,
      totalRemaining,
      isClean: totalRemaining === 0
    };
  }

  /**
   * Limpieza completa de base de datos (equivalente a limpiar_base_datos.js)
   */
  async cleanDatabaseComplete() {
    return this.executeOperation(async () => {
      console.log('🧹 Iniciando limpieza completa de base de datos...\n');

      // Obtener estadísticas iniciales
      const initialStats = await this.getContractStats();
      console.log('📊 Estado inicial:');
      Object.entries(initialStats).forEach(([key, value]) => {
        console.log(`   - ${key}: ${value}`);
      });

      // Ejecutar limpiezas
      await this.cleanContractRelatedData();

      // Verificar resultado
      const verification = await this.verifyCleanup();

      console.log('\n✅ Limpieza completa finalizada!');
      console.log(`📊 Registros restantes: ${verification.totalRemaining}`);

      if (verification.isClean) {
        console.log('🎉 Base de datos completamente limpia!');
      } else {
        console.log('⚠️  Algunos registros permanecen en la base de datos.');
      }

      return verification;
    }, 'Limpieza completa de base de datos');
  }

  /**
   * Cierra la conexión a la base de datos
   */
  async disconnect() {
    await this.prisma.$disconnect();
  }
}

// Funciones de conveniencia para uso directo
const dbUtils = new DatabaseUtils();

const limpiarBaseDatos = () => dbUtils.cleanDatabaseComplete().finally(() => dbUtils.disconnect());
const limpiarOfertas = () => dbUtils.cleanOffers().finally(() => dbUtils.disconnect());
const limpiarClientes = () => dbUtils.cleanClients().finally(() => dbUtils.disconnect());

module.exports = {
  DatabaseUtils,
  dbUtils,
  limpiarBaseDatos,
  limpiarOfertas,
  limpiarClientes
};
