const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function eliminarPersonaAdicional() {
  try {
    // Desactivar los servicios de Persona Adicional
    const result = await prisma.servicios.updateMany({
      where: {
        OR: [
          { nombre: 'Persona Adicional Temporada Alta' },
          { nombre: 'Persona Adicional Temporada Baja/Media' }
        ]
      },
      data: {
        activo: false
      }
    });
    
    console.log(`✅ Servicios de Persona Adicional desactivados`);
    console.log(`   Registros actualizados: ${result.count}`);
    
    // Verificar que están desactivados
    const servicios = await prisma.servicios.findMany({
      where: {
        OR: [
          { nombre: 'Persona Adicional Temporada Alta' },
          { nombre: 'Persona Adicional Temporada Baja/Media' }
        ]
      },
      select: {
        id: true,
        nombre: true,
        activo: true
      }
    });
    
    servicios.forEach(servicio => {
      console.log(`   - ${servicio.nombre}: activo = ${servicio.activo}`);
    });
    
  } catch (error) {
    console.error('❌ Error al desactivar servicios:', error);
  } finally {
    await prisma.$disconnect();
  }
}

eliminarPersonaAdicional();














