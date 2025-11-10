const { getPrismaClient } = require('../src/config/database');

const prisma = getPrismaClient();

async function verificarContrato() {
  try {
    // Buscar el contrato por código
    const contrato = await prisma.contratos.findFirst({
      where: {
        codigo_contrato: 'CONT-2025-11-0034'
      },
      include: {
        clientes: {
          select: {
            id: true,
            nombre_completo: true
          }
        },
        salones: {
          select: {
            id: true,
            nombre: true
          }
        },
        vendedores: {
          select: {
            id: true,
            nombre_completo: true,
            codigo_vendedor: true
          }
        }
      }
    });

    if (!contrato) {
      console.log('❌ Contrato no encontrado');
      return;
    }

    console.log('\n📋 Información del Contrato:');
    console.log('================================');
    console.log('ID:', contrato.id);
    console.log('Código:', contrato.codigo_contrato);
    console.log('Estado:', contrato.estado);
    console.log('Fecha Evento:', contrato.fecha_evento);
    console.log('Cliente:', contrato.clientes?.nombre_completo);
    console.log('Salón ID:', contrato.salon_id);
    console.log('Salón Nombre:', contrato.salones?.nombre || 'NO ASIGNADO');
    console.log('Vendedor:', contrato.vendedores?.nombre_completo || 'NO ASIGNADO');
    console.log('================================\n');

    // Buscar todos los salones
    const salones = await prisma.salones.findMany({
      select: {
        id: true,
        nombre: true
      }
    });

    console.log('🏢 Salones disponibles:');
    salones.forEach(s => {
      console.log(`  - ID: ${s.id}, Nombre: ${s.nombre}`);
    });
    console.log('');

    // Verificar si el salon_id del contrato coincide con algún salón
    if (contrato.salon_id) {
      const salonCoincide = salones.find(s => s.id === contrato.salon_id);
      if (salonCoincide) {
        console.log(`✅ El contrato tiene salon_id=${contrato.salon_id} que corresponde a "${salonCoincide.nombre}"`);
      } else {
        console.log(`❌ El contrato tiene salon_id=${contrato.salon_id} pero NO existe ningún salón con ese ID`);
      }
    } else {
      console.log('❌ El contrato NO tiene salon_id asignado');
    }

    // Buscar todos los contratos activos del salón Doral
    if (contrato.salon_id) {
      const contratosDoral = await prisma.contratos.findMany({
        where: {
          salon_id: contrato.salon_id,
          estado: 'activo'
        },
        select: {
          id: true,
          codigo_contrato: true,
          estado: true,
          fecha_evento: true
        }
      });

      console.log(`\n📊 Contratos activos del salón ID ${contrato.salon_id} (${contrato.salones?.nombre || 'Desconocido'}):`);
      console.log(`Total: ${contratosDoral.length}`);
      contratosDoral.forEach(c => {
        console.log(`  - ${c.codigo_contrato} (${c.fecha_evento})`);
      });
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verificarContrato();

