/**
 * Función para sincronizar leaks desde Google Sheets automáticamente
 * Evita duplicados verificando email y teléfono
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

    const leaksParaImportar = [];
    for (let i = 0; i < datos.length; i++) {
      const fila = datos[i];
      
      const nombre = obtenerValor(fila, mapeoColumnas.nombre_completo);
      const telefono = obtenerValor(fila, mapeoColumnas.telefono);
      const email = obtenerValor(fila, mapeoColumnas.email);

      if (!nombre || !telefono || !email) {
        continue;
      }

      let fechaRecepcion = new Date();
      fechaRecepcion.setHours(0, 0, 0, 0);
      
      const fechaRecepcionExcel = obtenerValor(fila, mapeoColumnas.fecha_recepcion);
      if (fechaRecepcionExcel) {
        try {
          const fechaStr = String(fechaRecepcionExcel).trim();
          
          if (fechaStr.match(/^\d{4}-\d{2}-\d{2}/)) {
            const datePart = fechaStr.split('T')[0];
            const [year, month, day] = datePart.split('-').map(Number);
            if (year >= 2000 && year <= 2100 && month >= 1 && month <= 12 && day >= 1 && day <= 31) {
              fechaRecepcion = new Date(year, month - 1, day);
              fechaRecepcion.setHours(0, 0, 0, 0);
            }
          }
          else if (fechaStr.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/)) {
            const partes = fechaStr.split('/');
            const first = parseInt(partes[0]);
            const second = parseInt(partes[1]);
            const year = parseInt(partes[2]);
            
            if (year >= 2000 && year <= 2100) {
              // Asumir formato DD/MM/YYYY (día-mes-año)
              if (first > 12) {
                fechaRecepcion = new Date(year, second - 1, first);
              } else if (second > 12) {
                fechaRecepcion = new Date(year, first - 1, second);
              } else {
                fechaRecepcion = new Date(year, second - 1, first);
              }
              fechaRecepcion.setHours(0, 0, 0, 0);
            }
          }
        } catch (error) {
          // Si falla el parseo, usar fecha actual
        }
      }

      let fechaEvento = null;
      const fechaEventoExcel = obtenerValor(fila, mapeoColumnas.fecha_evento);
      if (fechaEventoExcel) {
        try {
          const fechaStr = String(fechaEventoExcel).trim();
          
          if (fechaStr.match(/^\d{4}-\d{2}-\d{2}/)) {
            const datePart = fechaStr.split('T')[0];
            const [year, month, day] = datePart.split('-').map(Number);
            if (year >= 2000 && year <= 2100 && month >= 1 && month <= 12 && day >= 1 && day <= 31) {
              fechaEvento = new Date(year, month - 1, day);
              fechaEvento.setHours(0, 0, 0, 0);
            }
          }
        } catch (error) {
          // Si falla el parseo, dejar null
        }
      }

      const cantidadInvitados = procesarCantidadInvitados(obtenerValor(fila, mapeoColumnas.cantidad_invitados));
      let salonPreferido = procesarSalon(obtenerValor(fila, mapeoColumnas.salon_preferido));
      
      // Validar y corregir salón basándose en cantidad de invitados
      salonPreferido = validarYCorregirSalon(salonPreferido, cantidadInvitados);
      
      // Si faltan datos críticos, asignar "Desconocido"
      if (!cantidadInvitados && !salonPreferido && !fechaEvento && !obtenerValor(fila, mapeoColumnas.tipo_evento)) {
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
        message: 'No se encontraron datos válidos en el Google Sheet',
        creados: 0,
        duplicados: 0,
        errores: 0
      };
    }

    const leaksCreados = [];
    const leaksDuplicados = [];
    const errores = [];

    // Crear leaks verificando duplicados
    for (const leakData of leaksParaImportar) {
      try {
        // Verificar si ya existe un leak con este email o teléfono
        const leakExistente = await prisma.leaks.findFirst({
          where: {
            OR: [
              { email: leakData.email },
              { telefono: leakData.telefono }
            ]
          }
        });

        if (leakExistente) {
          leaksDuplicados.push({
            email: leakData.email,
            telefono: leakData.telefono,
            motivo: 'Ya existe un leak con este email o teléfono'
          });
          continue;
        }

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

    return {
      success: true,
      message: `Sincronización automática: ${leaksCreados.length} creados, ${leaksDuplicados.length} duplicados, ${errores.length} errores`,
      creados: leaksCreados.length,
      duplicados: leaksDuplicados.length,
      errores: errores.length
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

