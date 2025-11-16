/**
 * Rutas de Leaks
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const XLSX = require('xlsx');
const { getPrismaClient } = require('../config/database');
const { authenticate, requireVendedor } = require('../middleware/auth');
const { NotFoundError, ValidationError } = require('../middleware/errorHandler');
const { asignarSalonPorInvitados, validarYCorregirSalon, calcularFechaProximoContacto } = require('../utils/leakAssignment');
const { obtenerDatosGoogleSheet, procesarCantidadInvitados, procesarSalon } = require('../utils/googleSheetsService');

const prisma = getPrismaClient();

// Configurar multer para archivos en memoria
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
        file.mimetype === 'application/vnd.ms-excel' ||
        file.originalname.endsWith('.xlsx') ||
        file.originalname.endsWith('.xls')) {
      cb(null, true);
    } else {
      cb(new ValidationError('Solo se permiten archivos Excel (.xlsx, .xls)'), false);
    }
  }
});

/**
 * @route   GET /api/leaks
 * @desc    Listar leaks del vendedor autenticado
 * @access  Private (Vendedor)
 */
router.get('/', authenticate, requireVendedor, async (req, res, next) => {
  try {
    const { estado, salon, fuente, fecha_desde, fecha_hasta, search } = req.query;

    const where = {
      vendedor_id: req.user.id
    };

    if (estado) {
      where.estado = estado;
    }

    if (salon) {
      where.salon_preferido = salon;
    }

    if (fuente) {
      where.fuente = { contains: fuente, mode: 'insensitive' };
    }

    if (search) {
      where.OR = [
        { nombre_completo: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { telefono: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (fecha_desde || fecha_hasta) {
      where.fecha_recepcion = {};
      if (fecha_desde) {
        where.fecha_recepcion.gte = new Date(fecha_desde);
      }
      if (fecha_hasta) {
        where.fecha_recepcion.lte = new Date(fecha_hasta + 'T23:59:59');
      }
    }

    const { getPaginationParams, createPaginationResponse } = require('../utils/pagination');
    const { page, limit, skip } = getPaginationParams(req.query);

    const [leaks, total] = await Promise.all([
      prisma.leaks.findMany({
        where,
        orderBy: [
          { fecha_proximo_contacto: 'asc' },
          { fecha_recepcion: 'desc' }
        ],
        take: limit,
        skip: skip
      }),
      prisma.leaks.count({ where })
    ]);

    res.json(createPaginationResponse(leaks, total, page, limit));

  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/leaks/disponibles
 * @desc    Listar leaks disponibles para tomar (sin asignar)
 * @access  Private (Vendedor)
 */
router.get('/disponibles', authenticate, requireVendedor, async (req, res, next) => {
  try {
    const { salon } = req.query;

    const where = {
      vendedor_id: null,
      estado: { not: 'convertido' }
    };

    if (salon) {
      where.salon_preferido = salon;
    }

    const { getPaginationParams, createPaginationResponse } = require('../utils/pagination');
    const { page, limit, skip } = getPaginationParams(req.query);

    const [leaks, total] = await Promise.all([
      prisma.leaks.findMany({
        where,
        orderBy: { fecha_recepcion: 'desc' },
        take: limit,
        skip: skip
      }),
      prisma.leaks.count({ where })
    ]);

    res.json(createPaginationResponse(leaks, total, page, limit));

  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/leaks/pendientes-contacto
 * @desc    Obtener leaks pendientes de contacto (recordatorios)
 * @access  Private (Vendedor)
 */
router.get('/pendientes-contacto', authenticate, requireVendedor, async (req, res, next) => {
  try {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const leaks = await prisma.leaks.findMany({
      where: {
        vendedor_id: req.user.id,
        estado: {
          in: ['no_contesta', 'contactado_llamar_otra_vez']
        },
        fecha_proximo_contacto: {
          lte: hoy
        }
      },
      orderBy: { fecha_proximo_contacto: 'asc' }
    });

    res.json({
      success: true,
      count: leaks.length,
      leaks
    });

  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/leaks/:id
 * @desc    Obtener detalle de un leak
 * @access  Private (Vendedor)
 */
router.get('/:id', authenticate, requireVendedor, async (req, res, next) => {
  try {
    const { id } = req.params;

    const leak = await prisma.leaks.findUnique({
      where: { id: parseInt(id) },
      include: {
        vendedores: {
          select: {
            id: true,
            nombre_completo: true,
            codigo_vendedor: true
          }
        },
        clientes: {
          select: {
            id: true,
            nombre_completo: true,
            email: true
          }
        }
      }
    });

    if (!leak) {
      throw new NotFoundError('Leak no encontrado');
    }

    if (leak.vendedor_id && leak.vendedor_id !== req.user.id) {
      throw new ValidationError('No tienes permiso para ver este leak');
    }

    res.json({
      success: true,
      leak
    });

  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/leaks/:id/tomar
 * @desc    Tomar un leak (asignarlo al vendedor)
 * @access  Private (Vendedor)
 */
router.post('/:id/tomar', authenticate, requireVendedor, async (req, res, next) => {
  try {
    const { id } = req.params;

    const leak = await prisma.leaks.findUnique({
      where: { id: parseInt(id) }
    });

    if (!leak) {
      throw new NotFoundError('Leak no encontrado');
    }

    if (leak.vendedor_id) {
      throw new ValidationError('Este leak ya está asignado a otro vendedor');
    }

    if (leak.estado === 'convertido') {
      throw new ValidationError('Este leak ya fue convertido en cliente');
    }

    const leakActualizado = await prisma.leaks.update({
      where: { id: parseInt(id) },
      data: {
        vendedor_id: req.user.id,
        fecha_asignacion: new Date()
      },
      include: {
        vendedores: {
          select: {
            id: true,
            nombre_completo: true,
            codigo_vendedor: true
          }
        }
      }
    });

    res.json({
      success: true,
      message: 'Leak asignado exitosamente',
      leak: leakActualizado
    });

  } catch (error) {
    next(error);
  }
});

/**
 * @route   PUT /api/leaks/:id/estado
 * @desc    Cambiar estado de un leak
 * @access  Private (Vendedor)
 */
router.put('/:id/estado', authenticate, requireVendedor, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { estado, fecha_cita_salon, detalles_interesado, motivo_no_interesado, fecha_proximo_contacto, notas_vendedor } = req.body;

    const estadosValidos = ['nuevo', 'interesado', 'contactado_llamar_luego', 'no_contesta_llamar_luego', 'contactado_no_interesado'];

    if (!estado || !estadosValidos.includes(estado)) {
      throw new ValidationError('Estado inválido');
    }

    const leak = await prisma.leaks.findUnique({
      where: { id: parseInt(id) }
    });

    if (!leak) {
      throw new NotFoundError('Leak no encontrado');
    }

    if (leak.vendedor_id && leak.vendedor_id !== req.user.id) {
      throw new ValidationError('No tienes permiso para modificar este leak');
    }

    // Validaciones específicas según el estado
    if (estado === 'interesado' && !fecha_cita_salon) {
      throw new ValidationError('La fecha para ver el salón es requerida para el estado "interesado"');
    }

    if (estado === 'contactado_no_interesado' && !motivo_no_interesado) {
      throw new ValidationError('El motivo de por qué no está interesado es requerido');
    }

    if (estado === 'contactado_llamar_luego' && !fecha_proximo_contacto) {
      throw new ValidationError('La fecha para contactar nuevamente es requerida');
    }

    if (estado === 'no_contesta_llamar_luego' && !fecha_proximo_contacto) {
      throw new ValidationError('La fecha y hora para llamar luego es requerida');
    }

    const dataUpdate = {
      estado,
      fecha_ultimo_contacto: new Date(),
      fecha_actualizacion: new Date()
    };

    // Campos específicos según el estado
    if (estado === 'interesado') {
      if (fecha_cita_salon) {
        dataUpdate.fecha_cita_salon = new Date(fecha_cita_salon);
      }
      if (detalles_interesado) {
        dataUpdate.detalles_interesado = detalles_interesado;
      }
    }

    if (estado === 'contactado_no_interesado' && motivo_no_interesado) {
      dataUpdate.motivo_no_interesado = motivo_no_interesado;
    }

    if ((estado === 'contactado_llamar_luego' || estado === 'no_contesta_llamar_luego') && fecha_proximo_contacto) {
      dataUpdate.fecha_proximo_contacto = new Date(fecha_proximo_contacto);
    }

    if (notas_vendedor) {
      dataUpdate.notas_vendedor = notas_vendedor;
    }

    const leakActualizado = await prisma.leaks.update({
      where: { id: parseInt(id) },
      data: dataUpdate,
      include: {
        vendedores: {
          select: {
            id: true,
            nombre_completo: true,
            codigo_vendedor: true
          }
        }
      }
    });

    res.json({
      success: true,
      message: 'Estado actualizado exitosamente',
      leak: leakActualizado
    });

  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/leaks/:id/convertir-cliente
 * @desc    Convertir leak en cliente
 * @access  Private (Vendedor)
 */
router.post('/:id/convertir-cliente', authenticate, requireVendedor, async (req, res, next) => {
  try {
    const { id } = req.params;

    const leak = await prisma.leaks.findUnique({
      where: { id: parseInt(id) }
    });

    if (!leak) {
      throw new NotFoundError('Leak no encontrado');
    }

    if (leak.vendedor_id && leak.vendedor_id !== req.user.id) {
      throw new ValidationError('No tienes permiso para convertir este leak');
    }

    if (leak.cliente_id) {
      throw new ValidationError('Este leak ya fue convertido en cliente');
    }

    const clienteExistente = await prisma.clientes.findFirst({
      where: {
        OR: [
          { email: leak.email },
          { telefono: leak.telefono }
        ]
      }
    });

    let cliente;

    if (clienteExistente) {
      cliente = clienteExistente;
    } else {
      cliente = await prisma.clientes.create({
        data: {
          nombre_completo: leak.nombre_completo,
          email: leak.email,
          telefono: leak.telefono,
          tipo_evento: leak.tipo_evento,
          como_nos_conocio: leak.fuente || 'Leak',
          vendedor_id: req.user.id
        }
      });
    }

    const leakActualizado = await prisma.leaks.update({
      where: { id: parseInt(id) },
      data: {
        cliente_id: cliente.id,
        estado: 'convertido',
        fecha_actualizacion: new Date()
      },
      include: {
        clientes: {
          select: {
            id: true,
            nombre_completo: true,
            email: true
          }
        }
      }
    });

    res.json({
      success: true,
      message: 'Leak convertido en cliente exitosamente',
      leak: leakActualizado,
      cliente
    });

  } catch (error) {
    next(error);
  }
});

/**
 * @route   DELETE /api/leaks/disponibles
 * @desc    Eliminar todos los leaks disponibles (sin asignar)
 * @access  Private (Vendedor)
 */
router.delete('/disponibles', authenticate, requireVendedor, async (req, res, next) => {
  try {
    const resultado = await prisma.leaks.deleteMany({
      where: {
        vendedor_id: null, // Solo leaks sin asignar
        estado: { not: 'convertido' } // Excluir convertidos
      }
    });

    res.json({
      success: true,
      message: `Se eliminaron ${resultado.count} leaks disponibles`,
      eliminados: resultado.count
    });

  } catch (error) {
    next(error);
  }
});

/**
 * @route   DELETE /api/leaks/mios
 * @desc    Eliminar todos los leaks del vendedor autenticado
 * @access  Private (Vendedor)
 */
router.delete('/mios', authenticate, requireVendedor, async (req, res, next) => {
  try {
    const resultado = await prisma.leaks.deleteMany({
      where: {
        vendedor_id: req.user.id,
        estado: { not: 'convertido' } // Excluir convertidos
      }
    });

    res.json({
      success: true,
      message: `Se eliminaron ${resultado.count} leaks`,
      count: resultado.count
    });

  } catch (error) {
    next(error);
  }
});

/**
 * @route   DELETE /api/leaks/:id
 * @desc    Eliminar un leak individual
 * @access  Private (Vendedor)
 */
router.delete('/:id', authenticate, requireVendedor, async (req, res, next) => {
  try {
    const { id } = req.params;

    const leak = await prisma.leaks.findUnique({
      where: { id: parseInt(id) }
    });

    if (!leak) {
      throw new NotFoundError('Leak no encontrado');
    }

    // Solo puede eliminar si es su leak o si es un leak disponible (sin asignar)
    if (leak.vendedor_id && leak.vendedor_id !== req.user.id) {
      throw new ValidationError('No tienes permiso para eliminar este leak');
    }

    // No permitir eliminar leaks convertidos
    if (leak.estado === 'convertido') {
      throw new ValidationError('No se puede eliminar un leak convertido');
    }

    await prisma.leaks.delete({
      where: { id: parseInt(id) }
    });

    res.json({
      success: true,
      message: 'Leak eliminado exitosamente'
    });

  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/leaks/sincronizar
 * @desc    Sincronizar leaks desde Google Sheets
 * @access  Private (Vendedor)
 */
router.post('/sincronizar', authenticate, requireVendedor, async (req, res, next) => {
  try {
    // Obtener datos del Google Sheet
    const datos = await obtenerDatosGoogleSheet();

    if (!datos || datos.length === 0) {
      throw new ValidationError('No se encontraron datos en el Google Sheet');
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
      const fechaRecepcionExcel = obtenerValor(fila, mapeoColumnas.fecha_recepcion);
      if (fechaRecepcionExcel) {
        try {
          // Parsear fecha sin problemas de zona horaria
          const fechaStr = String(fechaRecepcionExcel).trim();
          if (fechaStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
            // Formato YYYY-MM-DD, parsear como fecha local
            const [year, month, day] = fechaStr.split('-').map(Number);
            fechaRecepcion = new Date(year, month - 1, day);
          } else {
            // Otro formato, intentar parseo normal
            const fechaParsed = new Date(fechaRecepcionExcel);
            if (!isNaN(fechaParsed.getTime())) {
              fechaRecepcion = fechaParsed;
            }
          }
        } catch (e) {}
      }

      const tipoEventoRaw = obtenerValor(fila, mapeoColumnas.tipo_evento);
      const tipoEvento = tipoEventoRaw ? String(tipoEventoRaw).trim() : null;

      // Procesar cantidad de invitados (puede venir como "30-50", "Diamond", etc.)
      const cantidadInvitadosRaw = obtenerValor(fila, mapeoColumnas.cantidad_invitados);
      const cantidadInvitados = procesarCantidadInvitados(cantidadInvitadosRaw);

      // Procesar salón (limpiar y normalizar)
      const salonPreferidoRaw = obtenerValor(fila, mapeoColumnas.salon_preferido);
      const salonPreferidoLimpio = procesarSalon(salonPreferidoRaw);

      const fechaEventoRaw = obtenerValor(fila, mapeoColumnas.fecha_evento);
      let fechaEvento = null;
      if (fechaEventoRaw) {
        try {
          // Parsear fecha sin problemas de zona horaria
          // Si viene en formato YYYY-MM-DD, parsear como fecha local
          const fechaStr = String(fechaEventoRaw).trim();
          if (fechaStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
            // Formato YYYY-MM-DD, parsear como fecha local
            const [year, month, day] = fechaStr.split('-').map(Number);
            fechaEvento = new Date(year, month - 1, day);
          } else {
            // Otro formato, intentar parseo normal
            const fechaParsed = new Date(fechaEventoRaw);
            if (!isNaN(fechaParsed.getTime())) {
              fechaEvento = fechaParsed;
            }
          }
        } catch (e) {}
      }

      // Verificar si alguno de los campos críticos está vacío
      // People (cantidad_invitados), Location (salon_preferido), Event Date (fecha_evento), Event Type (tipo_evento)
      const camposCriticosVacios = 
        !cantidadInvitados || cantidadInvitados <= 0 || isNaN(cantidadInvitados) ||
        !salonPreferidoLimpio || salonPreferidoLimpio.trim() === '' ||
        !fechaEvento ||
        !tipoEvento || tipoEvento.trim() === '';

      // Si algún campo crítico está vacío, asignar "?" (Desconocido) al salón
      let salonPreferido;
      if (camposCriticosVacios) {
        salonPreferido = '?';
      } else {
        // VALIDAR Y CORREGIR EL SALÓN SEGÚN LA CANTIDAD DE INVITADOS
        salonPreferido = validarYCorregirSalon(salonPreferidoLimpio, cantidadInvitados);
      }

      const fuenteRaw = obtenerValor(fila, mapeoColumnas.fuente);
      const fuente = fuenteRaw ? String(fuenteRaw).trim() : null;

      const leakData = {
        nombre_completo: String(nombre).trim(),
        telefono: String(telefono).trim(),
        email: String(email).trim().toLowerCase(),
        tipo_evento: tipoEvento,
        cantidad_invitados: cantidadInvitados,
        salon_preferido: salonPreferido,
        fecha_evento: fechaEvento,
        fuente: fuente,
        horario_contactar: obtenerValor(fila, mapeoColumnas.horario_contactar) ? String(obtenerValor(fila, mapeoColumnas.horario_contactar)).trim() : null,
        observaciones: obtenerValor(fila, mapeoColumnas.observaciones) ? String(obtenerValor(fila, mapeoColumnas.observaciones)).trim() : null,
        fecha_recepcion: fechaRecepcion
      };

      leaksParaImportar.push(leakData);
    }

    if (leaksParaImportar.length === 0) {
      throw new ValidationError('No se encontraron datos válidos en el Google Sheet');
    }

    const leaksCreados = [];
    const leaksDuplicados = [];
    const errores = [];

    for (const leakData of leaksParaImportar) {
      try {
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
          error: error.message
        });
      }
    }

    res.json({
      success: true,
      message: `Sincronización completada: ${leaksCreados.length} creados, ${leaksDuplicados.length} duplicados, ${errores.length} errores`,
      creados: leaksCreados.length,
      duplicados: leaksDuplicados.length,
      errores: errores.length,
      detalles: {
        leaksCreados,
        leaksDuplicados,
        errores
      }
    });

  } catch (error) {
    next(error);
  }
});

module.exports = router;

