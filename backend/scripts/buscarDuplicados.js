require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function buscarDuplicados() {
  try {
    console.log('🔍 Buscando leaks duplicados...\n');

    // Buscar duplicados por email
    const duplicadosEmail = await prisma.$queryRaw`
      SELECT email, COUNT(*) as cantidad
      FROM leaks
      WHERE email IS NOT NULL AND email != ''
      GROUP BY email
      HAVING COUNT(*) > 1
      ORDER BY cantidad DESC
    `;

    // Buscar duplicados por teléfono
    const duplicadosTelefono = await prisma.$queryRaw`
      SELECT telefono, COUNT(*) as cantidad
      FROM leaks
      WHERE telefono IS NOT NULL AND telefono != ''
      GROUP BY telefono
      HAVING COUNT(*) > 1
      ORDER BY cantidad DESC
    `;

    console.log('📧 Duplicados por EMAIL:');
    if (duplicadosEmail.length === 0) {
      console.log('   No se encontraron duplicados por email\n');
    } else {
      for (const dup of duplicadosEmail) {
        console.log(`   Email: ${dup.email} - Cantidad: ${dup.cantidad}`);
        
        // Obtener todos los leaks con este email
        const leaks = await prisma.leaks.findMany({
          where: { email: dup.email },
          select: {
            id: true,
            nombre_completo: true,
            email: true,
            telefono: true,
            fecha_recepcion: true,
            estado: true,
            vendedor_id: true,
            fecha_creacion: true
          },
          orderBy: { fecha_creacion: 'asc' }
        });
        
        console.log(`   Leaks encontrados (${leaks.length}):`);
        leaks.forEach((leak, index) => {
          console.log(`     ${index + 1}. ID: ${leak.id} | Nombre: ${leak.nombre_completo} | Tel: ${leak.telefono} | Estado: ${leak.estado || 'sin estado'} | Vendedor: ${leak.vendedor_id || 'sin asignar'} | Fecha: ${leak.fecha_recepcion}`);
        });
        console.log('');
      }
    }

    console.log('📱 Duplicados por TELÉFONO:');
    if (duplicadosTelefono.length === 0) {
      console.log('   No se encontraron duplicados por teléfono\n');
    } else {
      for (const dup of duplicadosTelefono) {
        console.log(`   Teléfono: ${dup.telefono} - Cantidad: ${dup.cantidad}`);
        
        // Obtener todos los leaks con este teléfono
        const leaks = await prisma.leaks.findMany({
          where: { telefono: dup.telefono },
          select: {
            id: true,
            nombre_completo: true,
            email: true,
            telefono: true,
            fecha_recepcion: true,
            estado: true,
            vendedor_id: true,
            fecha_creacion: true
          },
          orderBy: { fecha_creacion: 'asc' }
        });
        
        console.log(`   Leaks encontrados (${leaks.length}):`);
        leaks.forEach((leak, index) => {
          console.log(`     ${index + 1}. ID: ${leak.id} | Nombre: ${leak.nombre_completo} | Email: ${leak.email || 'N/A'} | Estado: ${leak.estado || 'sin estado'} | Vendedor: ${leak.vendedor_id || 'sin asignar'} | Fecha: ${leak.fecha_recepcion}`);
        });
        console.log('');
      }
    }

    // Contar total de leaks
    const totalLeaks = await prisma.leaks.count();
    const totalSinConvertidos = await prisma.leaks.count({
      where: { estado: { not: 'convertido' } }
    });
    const totalConvertidos = await prisma.leaks.count({
      where: { estado: 'convertido' }
    });

    console.log('📊 RESUMEN:');
    console.log(`   Total leaks: ${totalLeaks}`);
    console.log(`   Sin convertir: ${totalSinConvertidos}`);
    console.log(`   Convertidos: ${totalConvertidos}`);
    console.log(`   Duplicados por email: ${duplicadosEmail.length} grupos`);
    console.log(`   Duplicados por teléfono: ${duplicadosTelefono.length} grupos`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

buscarDuplicados();

