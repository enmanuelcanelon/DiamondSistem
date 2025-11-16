/**
 * Función para sincronizar leaks desde Google Sheets automáticamente
 * Evita duplicados actualizando leaks disponibles existentes en lugar de crear nuevos
 */

const { obtenerDatosGoogleSheet, procesarCantidadInvitados, procesarSalon } = require('./googleSheetsService');
const { validarYCorregirSalon } = require('./leakAssignment');
const { getPrismaClient } = require('../config/database');
const prisma = getPrismaClient();

async function sincronizarLeaksAutomaticamente() {
  try {
    // Obtener datos del Google Sheet
    const datos = await obtenerDatosGoogleSheet();

    if (!datos || datos.length === 0) {
      return {
        success: false,
        message: 'No se encontraron datos en el Google Sheet',
        creados: 0,
        duplicados: 0,
        errores: 0
      };
    }

    // Mapear columnas del Google Sheet a campos de leaks
    const mapeoColumnas = {
      nombre_completo: ['Name', 'name', 'nombre_completo', 'nombre', 'Nombre Completo', 'Nombre', 'NOMBRE', 'Full Name', 'full_name'],
      telefono: ['Phone', 'phone', 'telefono', 'teléfono', 'Teléfono', 'TELEFONO', 'celular', 'Celular', 'Phone Number', 'phone_number'],
      email: ['Email', 'email', 'EMAIL', 'correo', 'Correo', 'CORREO', 'e-mail', 'E-mail', 'E-Mail'],
      tipo_evento: ['Event Type', 'event type', 'event_type', 'tipo_evento', 'Tipo Evento', 'tipo de evento', 'Tipo de Evento', 'evento', 'Evento', 'Type', 'type'],
      cantidad_invitados: ['People', 'people', 'cantidad_invitados', 'Cantidad Invitados', 'invitados', 'Invitados', 'cantidad', 'Cantidad', 'guests', 'Guests', 'Guest Count', 'guest_count', 'Number of Guests', 'number_of_guests'],
      salon_preferido: ['Location', 'location', 'salon_preferido', 'Salón Preferido', 'salon', 'Salón', 'salón', 'SALON', 'Venue', 'venue', 'Salon', 'Preferred Location', 'preferred_location'],
      fecha_evento: ['Event Date', 'event date', 'event_date', 'fecha_evento', 'Fecha Evento', 'fecha del evento', 'Fecha del Evento', 'Date', 'date', 'Fecha', 'fecha'],
      fecha_recepcion: ['Unformatted Date', 'unformatted date', 'unformatted_date', 'fecha_recepcion', 'Fecha Recepción', 'Fecha de Recepción', 'fecha de recepción', 'Date Received', 'date_received'],
      fuente: ['SOURCE', 'Source', 'source', 'fuente', 'Fuente', 'FUENTE', 'origen', 'Origen', 'Origin', 'origin'],
      horario_contactar: ['Horario para Contactar', 'Horario para contactar', 'horario_contactar', 'Horario Contactar', 'horario', 'Horario', 'best_time', 'Best Time', 'best_time_to_contact', 'Best Time to Contact', 'Contact Time', 'contact_time'],
      observaciones: ['Observaciones', 'observaciones', 'OBSERVACIONES', 'notas', 'Notas', 'notes', 'Notes', 'comentarios', 'Comentarios', 'Comments', 'comments', 'Remarks', 'remarks']
    };

    const normalizarNombre = (nombre) => {
      if (!nombre) return '';
      return String(nombre).trim().toLowerCase().replace(/\s+/g, ' ').trim();
    };

    const obtenerValor = (fila, posiblesNombres) => {
      for (const nombre of posiblesNombres) {
        if (fila[nombre] !== undefined && fila[nombre] !== null && fila[nombre] !== '') {
          return fila[nombre];
        }
      }
      
      for (const nombre of posiblesNombres) {
        for (const key in fila) {
          if (key.toLowerCase() === nombre.toLowerCase() && fila[key] !== undefined && fila[key] !== null && fila[key] !== '') {
            return fila[key];
          }
        }
      }
      
      const nombresNormalizados = posiblesNombres.map(n => normalizarNombre(n));
      for (const key in fila) {
        const keyNormalizada = normalizarNombre(key);
        if (nombresNormalizados.includes(keyNormalizada) && fila[key] !== undefined && fila[key] !== null && fila[key] !== '') {
          return fila[key];
        }
      }
      
      return null;
    };

    // Función helper para parsear fechas en múltiples formatos
    const parsearFechaFlexible = (fechaValor) => {
        if (!fechaValor) return null;
        
        try {
          const fechaStr = String(fechaValor).trim();
          if (!fechaStr || fechaStr === '' || fechaStr.toLowerCase() === 'null' || fechaStr.toLowerCase() === 'undefined') {
            return null;
          }
          
          // Si es un número (timestamp de Excel), convertirlo
          if (!isNaN(fechaStr) && fechaStr.length > 5) {
            // Puede ser un timestamp de Excel (días desde 1900-01-01)
            const excelTimestamp = parseFloat(fechaStr);
            if (excelTimestamp > 1 && excelTimestamp < 100000) {
              // Fecha base de Excel: 1900-01-01
              const fechaBase = new Date(1900, 0, 1);
              const dias = Math.floor(excelTimestamp - 2); // Excel cuenta desde 1900-01-01 como día 1, pero tiene un bug con 1900 (año bisiesto)
              fechaBase.setDate(fechaBase.getDate() + dias);
              fechaBase.setHours(0, 0, 0, 0);
              return fechaBase;
            }
          }
          
          // Formato YYYY-MM-DD o YYYY-MM-DD HH:MM:SS
          if (fechaStr.match(/^\d{4}-\d{2}-\d{2}/)) {
            const datePart = fechaStr.split('T')[0].split(' ')[0];
            const [year, month, day] = datePart.split('-').map(Number);
            if (year >= 2000 && year <= 2100 && month >= 1 && month <= 12 && day >= 1 && day <= 31) {
              const fecha = new Date(year, month - 1, day);
              fecha.setHours(0, 0, 0, 0);
              return fecha;
            }
          }
          
          // Formato DD/MM/YYYY o MM/DD/YYYY
          if (fechaStr.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/)) {
            const partes = fechaStr.split('/');
            const first = parseInt(partes[0]);
            const second = parseInt(partes[1]);
            const year = parseInt(partes[2]);
            
            if (year >= 2000 && year <= 2100) {
              // Intentar ambos formatos: DD/MM/YYYY y MM/DD/YYYY
              let fecha;
              if (first > 12) {
                // Claramente DD/MM/YYYY (día > 12)
                fecha = new Date(year, second - 1, first);
              } else if (second > 12) {
                // Claramente MM/DD/YYYY (mes > 12)
                fecha = new Date(year, first - 1, second);
              } else {
                // Ambiguo: asumir DD/MM/YYYY (formato más común en español)
                fecha = new Date(year, second - 1, first);
              }
              fecha.setHours(0, 0, 0, 0);
              return fecha;
            }
          }
          
          // Formato DD-MM-YYYY
          if (fechaStr.match(/^\d{1,2}-\d{1,2}-\d{4}$/)) {
            const partes = fechaStr.split('-');
            const first = parseInt(partes[0]);
            const second = parseInt(partes[1]);
            const year = parseInt(partes[2]);
            
            if (year >= 2000 && year <= 2100) {
              let fecha;
              if (first > 12) {
                fecha = new Date(year, second - 1, first);
              } else if (second > 12) {
                fecha = new Date(year, first - 1, second);
              } else {
                fecha = new Date(year, second - 1, first);
              }
              fecha.setHours(0, 0, 0, 0);
              return fecha;
            }
          }
          
          // Intentar parsear con Date nativo (último recurso)
          const fechaNativa = new Date(fechaStr);
          if (!isNaN(fechaNativa.getTime())) {
            // Verificar que sea una fecha razonable
            const year = fechaNativa.getFullYear();
            if (year >= 2000 && year <= 2100) {
              fechaNativa.setHours(0, 0, 0, 0);
              return fechaNativa;
            }
          }
          
        } catch (error) {
          // Si falla cualquier parseo, retornar null
        }
        
        return null;
    };
    
    const leaksParaImportar = [];
    const filasOmitidas = [];
    
    for (let i = 0; i < datos.length; i++) {
      const fila = datos[i];
      
      const nombre = obtenerValor(fila, mapeoColumnas.nombre_completo);
      const telefono = obtenerValor(fila, mapeoColumnas.telefono);
      const email = obtenerValor(fila, mapeoColumnas.email);

      if (!nombre || !telefono || !email) {
        filasOmitidas.push({
          fila: i + 1,
          motivo: !nombre ? 'Falta nombre' : !telefono ? 'Falta teléfono' : 'Falta email',
          datos: {
            nombre: nombre || '(vacío)',
            telefono: telefono || '(vacío)',
            email: email || '(vacío)'
          }
        });
        continue;
      }

      let fechaRecepcion = new Date();
      fechaRecepcion.setHours(0, 0, 0, 0);
      
      const fechaRecepcionExcel = obtenerValor(fila, mapeoColumnas.fecha_recepcion);
      if (fechaRecepcionExcel) {
        const fechaParseada = parsearFechaFlexible(fechaRecepcionExcel);
        if (fechaParseada) {
          fechaRecepcion = fechaParseada;
        }
        // Si no se puede parsear, usar fecha actual (no es crítico)
      }

      let fechaEvento = null;
      const fechaEventoExcel = obtenerValor(fila, mapeoColumnas.fecha_evento);
      if (fechaEventoExcel) {
        fechaEvento = parsearFechaFlexible(fechaEventoExcel);
        // Si no se puede parsear, dejar null (no es crítico)
      }

      const cantidadInvitadosRaw = obtenerValor(fila, mapeoColumnas.cantidad_invitados);
      const cantidadInvitados = procesarCantidadInvitados(cantidadInvitadosRaw);
      let salonPreferido = procesarSalon(obtenerValor(fila, mapeoColumnas.salon_preferido));
      
      // Si la cantidad de invitados es "-" (indicador de datos faltantes), asignar "Desconocido"
      if (cantidadInvitadosRaw && String(cantidadInvitadosRaw).trim() === '-') {
        salonPreferido = '?';
      } else {
        // Validar y corregir salón basándose en cantidad de invitados
        salonPreferido = validarYCorregirSalon(salonPreferido, cantidadInvitados);
      }
      
      // Si faltan datos críticos, asignar "Desconocido"
      if (!cantidadInvitados && !salonPreferido && !fechaEvento && !obtenerValor(fila, mapeoColumnas.tipo_evento)) {
        salonPreferido = '?';
      }
      
      // Si no hay cantidad de invitados válida y el salón es "Diamond" sin otros datos, asignar "Desconocido"
      if (!cantidadInvitados && salonPreferido === 'Diamond' && !fechaEvento && !obtenerValor(fila, mapeoColumnas.tipo_evento)) {
        salonPreferido = '?';
      }

      leaksParaImportar.push({
        fecha_recepcion: fechaRecepcion,
        nombre_completo: nombre.trim(),
        telefono: String(telefono).trim(),
        email: String(email).trim().toLowerCase(),
        tipo_evento: obtenerValor(fila, mapeoColumnas.tipo_evento) || null,
        cantidad_invitados: cantidadInvitados,
        salon_preferido: salonPreferido || '?',
        fecha_evento: fechaEvento,
        fuente: obtenerValor(fila, mapeoColumnas.fuente) || null,
        horario_contactar: obtenerValor(fila, mapeoColumnas.horario_contactar) || null,
        observaciones: obtenerValor(fila, mapeoColumnas.observaciones) || null
      });
    }

    if (leaksParaImportar.length === 0) {
      return {
        success: false,
        message: `No se encontraron datos válidos en el Google Sheet. Total filas: ${datos.length}, Omitidas: ${filasOmitidas.length}`,
        creados: 0,
        duplicados: 0,
        errores: 0,
        omitidas: filasOmitidas.length,
        totalEnSheet: datos.length,
        detallesOmitidas: filasOmitidas.slice(0, 10)
      };
    }

    const leaksCreados = [];
    const leaksActualizados = [];
    const leaksDuplicados = [];
    const errores = [];

    // Crear o actualizar leaks - evitar duplicados entre leaks disponibles
    for (const leakData of leaksParaImportar) {
      try {
        // Verificar si ya existe un leak DISPONIBLE (no asignado y no convertido) con este email o teléfono
        const leakExistente = await prisma.leaks.findFirst({
          where: {
            AND: [
              {
                OR: [
                  { email: leakData.email },
                  { telefono: leakData.telefono }
                ]
              },
              { vendedor_id: null },
              { estado: { not: 'convertido' } }
            ]
          }
        });

        if (leakExistente) {
          // Si existe un leak disponible, actualizarlo con la información más reciente
          const leakActualizado = await prisma.leaks.update({
            where: { id: leakExistente.id },
            data: {
              fecha_recepcion: leakData.fecha_recepcion,
              nombre_completo: leakData.nombre_completo,
              telefono: leakData.telefono,
              email: leakData.email,
              tipo_evento: leakData.tipo_evento || leakExistente.tipo_evento,
              cantidad_invitados: leakData.cantidad_invitados || leakExistente.cantidad_invitados,
              // Si el nuevo salón es "?", siempre usar "?" (incluso si el existente tiene otro valor)
              salon_preferido: leakData.salon_preferido === '?' ? '?' : (leakData.salon_preferido || leakExistente.salon_preferido),
              fecha_evento: leakData.fecha_evento || leakExistente.fecha_evento,
              fuente: leakData.fuente || leakExistente.fuente,
              horario_contactar: leakData.horario_contactar || leakExistente.horario_contactar,
              observaciones: leakData.observaciones || leakExistente.observaciones,
              // Mantener el estado actual si ya tiene uno diferente de 'nuevo'
              estado: leakExistente.estado === 'nuevo' ? 'nuevo' : leakExistente.estado
            }
          });

          leaksActualizados.push(leakActualizado);
          leaksDuplicados.push({
            id_existente: leakExistente.id,
            nombre: leakData.nombre_completo,
            email: leakData.email,
            telefono: leakData.telefono,
            accion: 'actualizado',
            fecha_recepcion_anterior: leakExistente.fecha_recepcion,
            fecha_recepcion_nueva: leakData.fecha_recepcion
          });
          continue;
        }

        // Si no existe un leak disponible, crear uno nuevo
        const leak = await prisma.leaks.create({
          data: {
            fecha_recepcion: leakData.fecha_recepcion,
            nombre_completo: leakData.nombre_completo,
            telefono: leakData.telefono,
            email: leakData.email,
            tipo_evento: leakData.tipo_evento,
            cantidad_invitados: leakData.cantidad_invitados,
            salon_preferido: leakData.salon_preferido,
            fecha_evento: leakData.fecha_evento,
            fuente: leakData.fuente,
            horario_contactar: leakData.horario_contactar,
            observaciones: leakData.observaciones,
            estado: 'nuevo'
          }
        });

        leaksCreados.push(leak);
      } catch (error) {
        errores.push({
          email: leakData.email,
          telefono: leakData.telefono,
          error: error.message
        });
      }
    }

    // Corregir automáticamente leaks existentes que tienen datos faltantes pero tienen salón asignado
    const leaksACorregir = await prisma.leaks.findMany({
      where: {
        AND: [
          {
            OR: [
              { cantidad_invitados: null },
              { cantidad_invitados: 0 }
            ]
          },
          {
            salon_preferido: { not: '?' }
          },
          {
            OR: [
              { fecha_evento: null },
              { tipo_evento: null }
            ]
          }
        ]
      }
    });

    let leaksCorregidos = 0;
    if (leaksACorregir.length > 0) {
      const resultadoCorreccion = await prisma.leaks.updateMany({
        where: {
          id: { in: leaksACorregir.map(l => l.id) }
        },
        data: {
          salon_preferido: '?'
        }
      });
      leaksCorregidos = resultadoCorreccion.count;
    }

    const totalProcesadas = leaksCreados.length + leaksActualizados.length + errores.length + filasOmitidas.length;
    let mensaje = `Sincronización automática: ${leaksCreados.length} creados, ${leaksActualizados.length} actualizados, ${errores.length} errores`;
    if (filasOmitidas.length > 0) {
      mensaje += `, ${filasOmitidas.length} filas omitidas (faltan datos obligatorios)`;
    }
    
    return {
      success: true,
      message: mensaje,
      creados: leaksCreados.length,
      actualizados: leaksActualizados.length,
      duplicados: leaksDuplicados.length,
      errores: errores.length,
      omitidas: filasOmitidas.length,
      corregidos: leaksCorregidos,
      totalProcesadas: totalProcesadas,
      totalEnSheet: datos.length,
      detallesOmitidas: filasOmitidas.length > 0 ? filasOmitidas.slice(0, 10) : [], // Mostrar solo las primeras 10 para no saturar
      detallesDuplicados: leaksDuplicados.slice(0, 50) // Mostrar hasta 50 duplicados para debugging
    };

  } catch (error) {
    console.error('Error en sincronización automática de leaks:', error);
    return {
      success: false,
      message: `Error en sincronización: ${error.message}`,
      creados: 0,
      duplicados: 0,
      errores: 0
    };
  }
}

module.exports = {
  sincronizarLeaksAutomaticamente
};

