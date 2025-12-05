const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function actualizarPaquetesModificaciones() {
  try {
    console.log('🔄 Actualizando paquetes con las nuevas modificaciones...\n');

    // 1. Actualizar precios de Paquete Personalizado
    console.log('💰 Actualizando precios del Paquete Personalizado...');

    // Diamond: 6000 → 2400
    await prisma.paquetes_salones.updateMany({
      where: {
        paquetes: { nombre: 'Personalizado' },
        salones: { nombre: 'Diamond' }
      },
      data: {
        precio_base: 2400
      }
    });

    // Kendall: 3500 → 1600
    await prisma.paquetes_salones.updateMany({
      where: {
        paquetes: { nombre: 'Personalizado' },
        salones: { nombre: 'Kendall' }
      },
      data: {
        precio_base: 1600
      }
    });

    // Doral: 3500 → 1600
    await prisma.paquetes_salones.updateMany({
      where: {
        paquetes: { nombre: 'Personalizado' },
        salones: { nombre: 'Doral' }
      },
      data: {
        precio_base: 1600
      }
    });

    console.log('✅ Precios del Paquete Personalizado actualizados');

    // 2. Quitar DJ del Paquete Especial
    console.log('🎵 Removiendo DJ del Paquete Especial...');

    const paqueteEspecial = await prisma.paquetes.findFirst({
      where: { nombre: 'Especial' }
    });

    if (paqueteEspecial) {
      const servicioDJ = await prisma.servicios.findFirst({
        where: { nombre: 'DJ Profesional' }
      });

      if (servicioDJ) {
        await prisma.paquetes_servicios.deleteMany({
          where: {
            paquete_id: paqueteEspecial.id,
            servicio_id: servicioDJ.id
          }
        });
        console.log('✅ DJ removido del Paquete Especial');
      }
    }

    // 3. Actualizar Photobooth según salón
    console.log('📸 Actualizando configuración de Photobooth...');

    const paqueteDiamond = await prisma.paquetes.findFirst({
      where: { nombre: 'Diamond' }
    });

    const paqueteDeluxe = await prisma.paquetes.findFirst({
      where: { nombre: 'Deluxe' }
    });

    const photobooth360 = await prisma.servicios.findFirst({
      where: { nombre: 'Photobooth 360' }
    });

    const photoboothPrint = await prisma.servicios.findFirst({
      where: { nombre: 'Photobooth Print' }
    });

    if (paqueteDiamond && photobooth360 && photoboothPrint) {
      // Para Diamond: quitar Photobooth 360, dejar Photobooth Print
      await prisma.paquetes_servicios.deleteMany({
        where: {
          paquete_id: paqueteDiamond.id,
          servicio_id: photobooth360.id
        }
      });
      console.log('✅ Photobooth 360 removido del Paquete Diamond');
    }

    if (paqueteDeluxe && photobooth360 && photoboothPrint) {
      // Para Deluxe: quitar Photobooth 360, dejar Photobooth Print
      await prisma.paquetes_servicios.deleteMany({
        where: {
          paquete_id: paqueteDeluxe.id,
          servicio_id: photobooth360.id
        }
      });
      console.log('✅ Photobooth 360 removido del Paquete Deluxe');
    }

    console.log('\n🎉 Todas las modificaciones aplicadas exitosamente!');
    console.log('\n📋 Resumen de cambios:');
    console.log('   - Paquete Personalizado: Diamond $2400, Kendall/Doral $1600');
    console.log('   - Paquete Especial: DJ removido (solo como extra)');
    console.log('   - Paquete Diamond/Deluxe: Solo Photobooth Print incluido');
    console.log('   - Restricción Baby Shower: Implementar en frontend');

  } catch (error) {
    console.error('❌ Error actualizando paquetes:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

actualizarPaquetesModificaciones()
  .then(() => {
    console.log('\n✅ Proceso finalizado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Error fatal:', error);
    process.exit(1);
  });
