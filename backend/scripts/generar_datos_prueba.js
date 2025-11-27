const { PrismaClient } = require('@prisma/client');
const { hashPassword } = require('../src/utils/password');

const prisma = new PrismaClient();

// Datos de prueba
const vendedores = [
  {
    nombre_completo: 'María González',
    codigo_usuario: 'VEN001',
    email: 'maria.gonzalez@diamondsistem.com',
    telefono: '3051234567',
    comision_porcentaje: 10.00
  },
  {
    nombre_completo: 'Carlos Rodríguez',
    codigo_usuario: 'VEN002',
    email: 'carlos.rodriguez@diamondsistem.com',
    telefono: '3052345678',
    comision_porcentaje: 12.00
  },
  {
    nombre_completo: 'Ana Martínez',
    codigo_usuario: 'VEN003',
    email: 'ana.martinez@diamondsistem.com',
    telefono: '3053456789',
    comision_porcentaje: 11.00
  },
  {
    nombre_completo: 'Luis Fernández',
    codigo_usuario: 'VEN004',
    email: 'luis.fernandez@diamondsistem.com',
    telefono: '3054567890',
    comision_porcentaje: 10.50
  },
  {
    nombre_completo: 'Sofía López',
    codigo_usuario: 'VEN005',
    email: 'sofia.lopez@diamondsistem.com',
    telefono: '3055678901',
    comision_porcentaje: 11.50
  }
];

const tiposEvento = ['Quinceañera', 'Boda', 'Baby Shower', 'Kids Parties', 'Corporativo', 'Adult Party'];

const nombresClientes = [
  'Juan Pérez', 'María García', 'Carlos López', 'Ana Martínez', 'Luis Rodríguez',
  'Carmen Sánchez', 'Roberto Díaz', 'Laura Fernández', 'Miguel Torres', 'Isabel Ramírez',
  'Pedro Gómez', 'Elena Ruiz', 'Javier Moreno', 'Patricia Jiménez', 'Fernando Castro',
  'Lucía Hernández', 'Diego Morales', 'Andrea Vargas', 'Ricardo Soto', 'Valeria Rojas'
];

const nombresLeads = [
  'Daniela Vega', 'Andrés Mendoza', 'Camila Herrera', 'Sebastián Ochoa', 'Natalia Cárdenas',
  'Felipe Restrepo', 'Mariana Zapata', 'Esteban Giraldo', 'Juliana Mejía', 'Santiago Uribe',
  'Valentina Agudelo', 'Nicolás Betancur', 'Isabella Arango', 'Mateo Cardona', 'Sofía Montoya'
];

async function generarDatosPrueba() {
  try {
    console.log('🚀 Iniciando generación de datos de prueba...\n');

    const passwordHash = await hashPassword('prueba123');

    // 1. Crear o obtener vendedores
    console.log('👥 Creando/obteniendo vendedores...');
    const vendedoresCreados = [];
    for (const vendedor of vendedores) {
      // Verificar si el vendedor ya existe
      let vendedorCreado = await prisma.usuarios.findUnique({
        where: { codigo_usuario: vendedor.codigo_usuario }
      });
      
      if (!vendedorCreado) {
        vendedorCreado = await prisma.usuarios.create({
          data: {
            ...vendedor,
            password_hash: passwordHash,
            rol: 'vendedor',
            activo: true,
            total_ventas: 0,
            total_comisiones: 0,
            google_calendar_sync_enabled: false
          }
        });
        console.log(`   ✓ Creado: ${vendedor.nombre_completo} (${vendedor.codigo_usuario})`);
      } else {
        console.log(`   ✓ Ya existe: ${vendedor.nombre_completo} (${vendedor.codigo_usuario})`);
      }
      vendedoresCreados.push(vendedorCreado);
    }

    // 2. Obtener paquetes disponibles
    const paquetes = await prisma.paquetes.findMany({
      where: { activo: true },
      take: 5
    });
    if (paquetes.length === 0) {
      console.log('⚠️  No hay paquetes disponibles. Por favor, crea paquetes primero.');
      return;
    }
    console.log(`\n📦 Paquetes disponibles: ${paquetes.length}`);

    // 3. Obtener salones
    const salones = await prisma.salones.findMany({
      where: { activo: true }
    });
    if (salones.length === 0) {
      console.log('⚠️  No hay salones disponibles. Por favor, crea salones primero.');
      return;
    }
    console.log(`🏢 Salones disponibles: ${salones.length}`);

    // 4. Obtener temporada actual
    const temporadas = await prisma.temporadas.findMany({
      where: { activo: true }
    });
    const temporadaActual = temporadas[0] || null;
    if (!temporadaActual) {
      console.log('⚠️  No hay temporadas disponibles. Por favor, crea temporadas primero.');
      return;
    }
    console.log(`📅 Temporada: ${temporadaActual.nombre}\n`);

    // 5. Crear clientes y asignarlos a vendedores
    console.log('👤 Creando clientes...');
    const clientesCreados = [];
    let clienteIndex = 0;
    
    for (let i = 0; i < vendedoresCreados.length; i++) {
      const vendedor = vendedoresCreados[i];
      const clientesPorVendedor = 4; // 4 clientes por vendedor
      
      for (let j = 0; j < clientesPorVendedor; j++) {
        if (clienteIndex >= nombresClientes.length) break;
        
        const nombreCliente = nombresClientes[clienteIndex];
        const tipoEvento = tiposEvento[Math.floor(Math.random() * tiposEvento.length)];
        
        const cliente = await prisma.clientes.create({
          data: {
            nombre_completo: nombreCliente,
            email: `${nombreCliente.toLowerCase().replace(/\s+/g, '.')}@email.com`,
            telefono: `305${Math.floor(Math.random() * 9000000) + 1000000}`,
            tipo_evento: tipoEvento,
            usuario_id: vendedor.id,
            fecha_registro: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000), // Últimos 90 días
            fecha_actualizacion: new Date()
          }
        });
        
        clientesCreados.push({ ...cliente, vendedor_id: vendedor.id });
        clienteIndex++;
        console.log(`   ✓ ${cliente.nombre_completo} → ${vendedor.nombre_completo}`);
      }
    }

    // 6. Crear leads (leaks) para cada vendedor
    console.log('\n📞 Creando leads...');
    let leadIndex = 0;
    const leadsCreados = [];
    
    for (let i = 0; i < vendedoresCreados.length; i++) {
      const vendedor = vendedoresCreados[i];
      const leadsPorVendedor = 3; // 3 leads por vendedor
      
      for (let j = 0; j < leadsPorVendedor; j++) {
        if (leadIndex >= nombresLeads.length) break;
        
        const nombreLead = nombresLeads[leadIndex];
        const estados = ['nuevo', 'interesado', 'convertido'];
        const estado = estados[Math.floor(Math.random() * estados.length)];
        
        const lead = await prisma.leaks.create({
          data: {
            nombre_completo: nombreLead,
            email: `${nombreLead.toLowerCase().replace(/\s+/g, '.')}@email.com`,
            telefono: `305${Math.floor(Math.random() * 9000000) + 1000000}`,
            estado: estado,
            usuario_id: vendedor.id, // Solo usar usuario_id, no vendedor_id (deprecated)
            fecha_recepcion: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Últimos 30 días
            fecha_creacion: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
            fecha_actualizacion: new Date()
          }
        });
        
        leadsCreados.push(lead);
        leadIndex++;
        console.log(`   ✓ ${lead.nombre_completo} (${lead.estado}) → ${vendedor.nombre_completo}`);
      }
    }

    // 7. Crear ofertas para algunos clientes
    console.log('\n📄 Creando ofertas...');
    const ofertasCreadas = [];
    const estadosOferta = ['pendiente', 'aceptada', 'rechazada'];
    
    for (let i = 0; i < clientesCreados.length; i++) {
      const clienteData = clientesCreados[i];
      const cliente = await prisma.clientes.findUnique({ where: { id: clienteData.id } });
      
      // 70% de probabilidad de crear oferta
      if (Math.random() > 0.3) {
        const paquete = paquetes[Math.floor(Math.random() * paquetes.length)];
        const salon = salones[Math.floor(Math.random() * salones.length)];
        const estado = estadosOferta[Math.floor(Math.random() * estadosOferta.length)];
        
        // Fecha aleatoria en los próximos 60 días
        const fechaEvento = new Date();
        fechaEvento.setDate(fechaEvento.getDate() + Math.floor(Math.random() * 60));
        
        // Horas aleatorias (10 AM a 10 PM)
        const horaInicio = 10 + Math.floor(Math.random() * 12);
        const duracionPaquete = paquete.duracion_horas || 4;
        let horaFin = horaInicio + duracionPaquete;
        // Asegurar que horaFin esté en el rango 0-23
        if (horaFin >= 24) {
          horaFin = horaFin % 24;
        }
        
        // Obtener precio del paquete para el salón
        const paqueteSalon = await prisma.paquetes_salones.findFirst({
          where: {
            paquete_id: paquete.id,
            salon_id: salon.id
          }
        });
        
        const precioBase = paqueteSalon ? parseFloat(paqueteSalon.precio_base) : parseFloat(paquete.precio_base);
        const cantidadInvitados = 50 + Math.floor(Math.random() * 150); // 50-200 invitados
        
        // Calcular precios
        const ajusteTemporada = precioBase * (parseFloat(temporadaActual.porcentaje_ajuste || 0) / 100);
        const subtotalBase = precioBase + ajusteTemporada;
        const impuestoPorcentaje = 7.00;
        const impuestoMonto = subtotalBase * (impuestoPorcentaje / 100);
        const tarifaServicioPorcentaje = 18.00;
        const tarifaServicioMonto = subtotalBase * (tarifaServicioPorcentaje / 100);
        const totalFinal = subtotalBase + impuestoMonto + tarifaServicioMonto;
        
        // Generar código de oferta
        const ultimaOferta = await prisma.ofertas.findFirst({
          orderBy: { id: 'desc' }
        });
        const numeroOferta = ultimaOferta ? ultimaOferta.id + 1 : 1;
        const año = new Date().getFullYear();
        const mes = String(new Date().getMonth() + 1).padStart(2, '0');
        const codigoOferta = `OF-${año}-${mes}-${String(numeroOferta).padStart(4, '0')}`;
        
        const oferta = await prisma.ofertas.create({
          data: {
            codigo_oferta: codigoOferta,
            cliente_id: cliente.id,
            usuario_id: clienteData.vendedor_id,
            paquete_id: paquete.id,
            salon_id: salon.id,
            fecha_evento: fechaEvento,
            hora_inicio: new Date(`1970-01-01T${String(horaInicio).padStart(2, '0')}:00:00Z`),
            hora_fin: new Date(`1970-01-01T${String(horaFin).padStart(2, '0')}:00:00Z`),
            cantidad_invitados: cantidadInvitados,
            temporada_id: temporadaActual.id,
            precio_paquete_base: precioBase,
            ajuste_temporada: ajusteTemporada,
            subtotal_servicios: 0,
            subtotal: subtotalBase,
            descuento: 0,
            impuesto_porcentaje: impuestoPorcentaje,
            impuesto_monto: impuestoMonto,
            tarifa_servicio_porcentaje: tarifaServicioPorcentaje,
            tarifa_servicio_monto: tarifaServicioMonto,
            total_final: totalFinal,
            estado: estado,
            tipo_evento: cliente.tipo_evento,
            fecha_creacion: new Date(Date.now() - Math.random() * 20 * 24 * 60 * 60 * 1000), // Últimos 20 días
            fecha_actualizacion: new Date()
          }
        });
        
        ofertasCreadas.push({ ...oferta, cliente_nombre: cliente.nombre_completo });
        console.log(`   ✓ ${codigoOferta} (${estado}) → ${cliente.nombre_completo}`);
      }
    }

    // 8. Crear contratos para ofertas aceptadas
    console.log('\n📋 Creando contratos...');
    const contratosCreados = [];
    const ofertasAceptadas = ofertasCreadas.filter(o => o.estado === 'aceptada');
    
    for (const ofertaData of ofertasAceptadas) {
      const oferta = await prisma.ofertas.findUnique({
        where: { id: ofertaData.id },
        include: { paquetes: true }
      });
      
      if (!oferta) continue;
      
      // Generar código de contrato
      const ultimoContrato = await prisma.contratos.findFirst({
        orderBy: { id: 'desc' }
      });
      const numeroContrato = ultimoContrato ? ultimoContrato.id + 1 : 1;
      const año = new Date().getFullYear();
      const mes = String(new Date().getMonth() + 1).padStart(2, '0');
      const codigoContrato = `CONT-${año}-${mes}-${String(numeroContrato).padStart(4, '0')}`;
      
      // Generar código de acceso único
      const codigoAcceso = `ACC${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
      
      const totalContrato = parseFloat(oferta.total_final);
      const comisionTotal = totalContrato * 0.10; // 10% comisión
      const comisionPrimeraMitad = comisionTotal / 2;
      const comisionSegundaMitad = comisionTotal / 2;
      
      const contrato = await prisma.contratos.create({
        data: {
          codigo_contrato: codigoContrato,
          oferta_id: oferta.id,
          cliente_id: oferta.cliente_id,
          usuario_id: oferta.usuario_id,
          paquete_id: oferta.paquete_id,
          salon_id: oferta.salon_id,
          fecha_evento: oferta.fecha_evento,
          hora_inicio: oferta.hora_inicio,
          hora_fin: oferta.hora_fin,
          cantidad_invitados: oferta.cantidad_invitados,
          total_contrato: totalContrato,
          tipo_pago: 'contado',
          meses_financiamiento: 1,
          pago_mensual: totalContrato,
          total_pagado: 0,
          saldo_pendiente: totalContrato,
          codigo_acceso_cliente: codigoAcceso,
          estado_pago: 'pendiente',
          estado: 'activo',
          comision_calculada: comisionTotal, // Deprecated pero necesario
          comision_total_calculada: parseFloat(comisionTotal.toFixed(2)),
          comision_primera_mitad: parseFloat(comisionPrimeraMitad.toFixed(2)),
          comision_segunda_mitad: parseFloat(comisionSegundaMitad.toFixed(2)),
          comision_primera_mitad_pagada: false,
          comision_segunda_mitad_pagada: false,
          fecha_creacion_contrato: new Date(Date.now() - Math.random() * 10 * 24 * 60 * 60 * 1000),
          fecha_actualizacion: new Date(),
          fecha_firma: new Date(Date.now() - Math.random() * 10 * 24 * 60 * 60 * 1000),
          terminos_aceptados: true,
          homenajeado: oferta.homenajeado || null
        }
      });
      
      // Copiar servicios del paquete al contrato
      const serviciosPaquete = await prisma.paquetes_servicios.findMany({
        where: { paquete_id: oferta.paquete_id }
      });
      
      for (const servicioPaquete of serviciosPaquete) {
        await prisma.contratos_servicios.create({
          data: {
            contrato_id: contrato.id,
            servicio_id: servicioPaquete.servicio_id,
            cantidad: servicioPaquete.cantidad || 1,
            precio_unitario: 0,
            subtotal: 0,
            incluido_en_paquete: true
          }
        });
      }
      
      contratosCreados.push(contrato);
      console.log(`   ✓ ${codigoContrato} → ${ofertaData.cliente_nombre}`);
    }

    // 9. Resumen final
    console.log('\n📊 Resumen de datos generados:');
    console.log(`   - Vendedores: ${vendedoresCreados.length}`);
    console.log(`   - Clientes: ${clientesCreados.length}`);
    console.log(`   - Leads: ${leadsCreados.length}`);
    console.log(`   - Ofertas: ${ofertasCreadas.length}`);
    console.log(`   - Contratos: ${contratosCreados.length}`);
    
    console.log('\n✅ Datos de prueba generados exitosamente!');
    console.log('\n📝 Credenciales de los vendedores:');
    vendedoresCreados.forEach(v => {
      console.log(`   ${v.codigo_usuario}: ${v.email} / prueba123`);
    });

  } catch (error) {
    console.error('❌ Error durante la generación:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  generarDatosPrueba()
    .then(() => {
      console.log('\n🎉 Proceso completado exitosamente.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Error fatal:', error);
      process.exit(1);
    });
}

module.exports = { generarDatosPrueba };

