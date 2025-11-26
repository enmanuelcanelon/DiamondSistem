const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Script para limpiar completamente la base de datos
 * Mantiene: usuarios, salones, paquetes, servicios, temporadas
 * Elimina: clientes, contratos, ofertas, pagos, comisiones, leaks
 */

(async () => {
  try {
    console.log('🧹 Iniciando limpieza completa de la base de datos...\n');

    // 1. Eliminar pagos (tienen FK a contratos)
    const pagosEliminados = await prisma.pagos.deleteMany({});
    console.log(`✅ Pagos eliminados: ${pagosEliminados.count}`);

    // 2. Eliminar playlist_canciones (tienen FK a contratos)
    const playlistEliminadas = await prisma.playlist_canciones.deleteMany({});
    console.log(`✅ Playlist canciones eliminadas: ${playlistEliminadas.count}`);

    // 3. Eliminar invitados (tienen FK a contratos/mesas)
    const invitadosEliminados = await prisma.invitados.deleteMany({});
    console.log(`✅ Invitados eliminados: ${invitadosEliminados.count}`);

    // 4. Eliminar mesas (tienen FK a contratos)
    const mesasEliminadas = await prisma.mesas.deleteMany({});
    console.log(`✅ Mesas eliminadas: ${mesasEliminadas.count}`);

    // 5. Eliminar ajustes_evento (tienen FK a contratos)
    const ajustesEliminados = await prisma.ajustes_evento.deleteMany({});
    console.log(`✅ Ajustes de evento eliminados: ${ajustesEliminados.count}`);

    // 6. Eliminar versiones_contratos_pdf (tienen FK a contratos)
    const versionesEliminadas = await prisma.versiones_contratos_pdf.deleteMany({});
    console.log(`✅ Versiones de contratos PDF eliminadas: ${versionesEliminadas.count}`);

    // 7. Eliminar checklist_servicios_externos (tienen FK a contratos)
    const checklistEliminados = await prisma.checklist_servicios_externos.deleteMany({});
    console.log(`✅ Checklist servicios externos eliminados: ${checklistEliminados.count}`);

    // 8. Eliminar contratos_servicios (tienen FK a contratos)
    const contratosServiciosEliminados = await prisma.contratos_servicios.deleteMany({});
    console.log(`✅ Contratos servicios eliminados: ${contratosServiciosEliminados.count}`);

    // 9. Eliminar eventos (tienen FK a contratos)
    const eventosEliminados = await prisma.eventos.deleteMany({});
    console.log(`✅ Eventos eliminados: ${eventosEliminados.count}`);

    // 10. Eliminar contratos
    const contratosEliminados = await prisma.contratos.deleteMany({});
    console.log(`✅ Contratos eliminados: ${contratosEliminados.count}`);

    // 11. Eliminar ofertas_servicios_adicionales (tienen FK a ofertas)
    const ofertasServiciosEliminados = await prisma.ofertas_servicios_adicionales.deleteMany({});
    console.log(`✅ Ofertas servicios adicionales eliminados: ${ofertasServiciosEliminados.count}`);

    // 12. Eliminar ofertas
    const ofertasEliminadas = await prisma.ofertas.deleteMany({});
    console.log(`✅ Ofertas eliminadas: ${ofertasEliminadas.count}`);

    // 13. Eliminar solicitudes_cliente (tienen FK a clientes)
    const solicitudesEliminadas = await prisma.solicitudes_cliente.deleteMany({});
    console.log(`✅ Solicitudes de cliente eliminadas: ${solicitudesEliminadas.count}`);

    // 14. Eliminar mensajes (tienen FK a clientes)
    const mensajesEliminados = await prisma.mensajes.deleteMany({});
    console.log(`✅ Mensajes eliminados: ${mensajesEliminados.count}`);

    // 15. Eliminar leaks
    const leaksEliminados = await prisma.leaks.deleteMany({});
    console.log(`✅ Leaks eliminados: ${leaksEliminados.count}`);

    // 16. Eliminar clientes
    const clientesEliminados = await prisma.clientes.deleteMany({});
    console.log(`✅ Clientes eliminados: ${clientesEliminados.count}`);

    console.log('\n✅ ¡Limpieza completa exitosa!');
    console.log('📊 Datos que se mantuvieron:');

    const usuarios = await prisma.usuarios.count();
    const salones = await prisma.salones.count();
    const paquetes = await prisma.paquetes.count();
    const servicios = await prisma.servicios.count();
    const temporadas = await prisma.temporadas.count();

    console.log(`   - Usuarios: ${usuarios}`);
    console.log(`   - Salones: ${salones}`);
    console.log(`   - Paquetes: ${paquetes}`);
    console.log(`   - Servicios: ${servicios}`);
    console.log(`   - Temporadas: ${temporadas}`);

  } catch (error) {
    console.error('❌ Error durante la limpieza:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
})();
