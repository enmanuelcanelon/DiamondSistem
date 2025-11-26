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

    // Buscar leaks asignados al usuario (usuario_id) o al vendedor (vendedor_id deprecated para compatibilidad)
    const where = {
      OR: [
        { usuario_id: req.user.id },
        { vendedor_id: req.user.id }
      ]
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
 * @route   GET /api/leaks/stats
 * @desc    Obtener estadísticas de leaks del vendedor
 * @access  Private (Vendedor)
 */
router.get('/stats', authenticate, requireVendedor, async (req, res, next) => {
  try {
    const vendedorId = req.user.id;

    // Total leaks disponibles (sin asignar y no convertidos)
    // Debe coincidir con el filtro de /api/leaks/disponibles
    const totalDisponibles = await prisma.leaks.count({
      where: {
        usuario_id: null, // Solo leaks sin asignar (usar usuario_id en lugar de vendedor_id deprecated)
        estado: { not: 'convertido' } // Excluir convertidos
      }
    });

    // Total mis leaks (usuario_id o vendedor_id para compatibilidad)
    const totalMios = await prisma.leaks.count({
      where: {
        OR: [
          { usuario_id: vendedorId },
          { vendedor_id: vendedorId }
        ]
      }
    });

    // Leaks por estado (mis leaks)
    const leaksPorEstado = await prisma.leaks.groupBy({
      by: ['estado'],
      where: {
        OR: [
          { usuario_id: vendedorId },
          { vendedor_id: vendedorId }
        ]
      },
      _count: {
        id: true
      }
    });

    // Leaks por salón (mis leaks)
    const leaksPorSalon = await prisma.leaks.groupBy({
      by: ['salon_preferido'],
      where: {
        OR: [
          { usuario_id: vendedorId },
          { vendedor_id: vendedorId }
        ]
      },
      _count: {
        id: true
      }
    });

    // Leaks convertidos a clientes
    const leaksConvertidos = await prisma.leaks.count({
      where: {
        OR: [
          { usuario_id: vendedorId },
          { vendedor_id: vendedorId }
        ],
        estado: 'convertido'
      }
    });

    // Tasa de conversión
    const tasaConversion = totalMios > 0 
      ? ((leaksConvertidos / totalMios) * 100).toFixed(2)
      : '0.00';

    // Leaks pendientes de contacto
    // Incluye: contactado_llamar_luego, no_contesta_llamar_luego
    // Cuenta todos los leaks con estos estados (requieren seguimiento)
    const pendientesContacto = await prisma.leaks.count({
      where: {
        OR: [
          { usuario_id: vendedorId },
          { vendedor_id: vendedorId }
        ],
        estado: {
          in: ['contactado_llamar_luego', 'no_contesta_llamar_luego']
        }
      }
    });

    // Leaks por fecha (últimos 30 días)
    const fechaInicio = new Date();
    fechaInicio.setDate(fechaInicio.getDate() - 30);
    fechaInicio.setHours(0, 0, 0, 0);

    const leaksPorFecha = await prisma.leaks.findMany({
      where: {
        OR: [
          { usuario_id: vendedorId },
          { vendedor_id: vendedorId }
        ],
        fecha_recepcion: {
          gte: fechaInicio
        }
      },
      select: {
        fecha_recepcion: true
      }
    });

    // Agrupar por día
    const leaksPorDia = {};
    leaksPorFecha.forEach(leak => {
      const fecha = new Date(leak.fecha_recepcion);
      const fechaStr = fecha.toISOString().split('T')[0];
      leaksPorDia[fechaStr] = (leaksPorDia[fechaStr] || 0) + 1;
    });

    // Convertir a array para gráfica
    const graficaPorFecha = Object.entries(leaksPorDia)
      .map(([fecha, count]) => ({
        fecha,
        cantidad: count
      }))
      .sort((a, b) => a.fecha.localeCompare(b.fecha));

    res.json({
      success: true,
      stats: {
        totalDisponibles,
        totalMios,
        leaksConvertidos,
        tasaConversion: `${tasaConversion}%`,
        pendientesContacto,
        porEstado: leaksPorEstado.map(item => ({
          estado: item.estado || 'sin_estado',
          cantidad: item._count.id
        })),
        porSalon: leaksPorSalon.map(item => ({
          salon: item.salon_preferido || 'Desconocido',
          cantidad: item._count.id
        })),
        graficaPorFecha
      }
    });

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
    const { salon, ordenar, search, mes, año, ano, limit } = req.query;

    // Mostrar solo leaks DISPONIBLES (sin asignar a ningún vendedor y no convertidos)
    // Esto permite que todos los vendedores vean los mismos leaks disponibles
    // Cuando un vendedor toma un leak, desaparece de esta lista para todos
    const where = {
      usuario_id: null, // Solo leaks sin asignar (usar usuario_id en lugar de vendedor_id deprecated)
      estado: { not: 'convertido' } // Excluir convertidos
    };

    if (salon) {
      if (salon === '?') {
        where.salon_preferido = '?';
      } else {
      where.salon_preferido = salon;
      }
    }

    // Búsqueda por nombre, email o teléfono
    if (search) {
      where.OR = [
        { nombre_completo: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { telefono: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Filtro por mes y año (fecha_recepcion)
    const añoFiltro = año || ano;
    if (mes && añoFiltro) {
      const mesNum = parseInt(mes);
      const añoNum = parseInt(añoFiltro);
      if (mesNum >= 1 && mesNum <= 12 && añoNum >= 2000 && añoNum <= 2100) {
        // Crear fechas en UTC para evitar problemas de zona horaria
        // fechaInicio: primer día del mes a las 00:00:00 UTC
        const fechaInicio = new Date(Date.UTC(añoNum, mesNum - 1, 1, 0, 0, 0, 0));
        // fechaFin: último día del mes a las 23:59:59.999 UTC
        const fechaFin = new Date(Date.UTC(añoNum, mesNum, 0, 23, 59, 59, 999));
        
        where.fecha_recepcion = {
          gte: fechaInicio,
          lte: fechaFin
        };
      }
    }

    // Ordenamiento: soporta fecha_evento y fecha_recepcion
    // Priorizar fecha_evento si está especificado, sino usar fecha_recepcion
    let orderBy = { fecha_recepcion: 'desc' }; // Por defecto
    let ordenarPorFechaEvento = false;
    let direccionFechaEvento = null;
    
    if (ordenar && ordenar.startsWith('fecha_evento_')) {
      ordenarPorFechaEvento = true;
      direccionFechaEvento = ordenar.replace('fecha_evento_', '');
      // Para ordenamiento inteligente, primero obtenemos todos y luego ordenamos manualmente
      orderBy = { fecha_evento: 'asc' }; // Orden temporal, se reordenará después
    } else if (ordenar && ordenar.startsWith('fecha_recepcion_')) {
      const direccion = ordenar.replace('fecha_recepcion_', '');
      orderBy = { fecha_recepcion: direccion === 'asc' ? 'asc' : 'desc' };
    } else if (ordenar === 'asc') {
      // Compatibilidad con el valor anterior
      orderBy = { fecha_recepcion: 'asc' };
    } else if (ordenar === 'desc') {
      // Compatibilidad con el valor anterior
      orderBy = { fecha_recepcion: 'desc' };
    }

    // Obtener leaks con o sin paginación según el parámetro limit
    const limitNum = limit && limit !== 'todos' ? parseInt(limit) : undefined;
    const skip = limitNum ? 0 : undefined;
    const take = limitNum || undefined;

    const [leaks, total] = await Promise.all([
      prisma.leaks.findMany({
        where,
        orderBy,
        ...(take && { take }),
        ...(skip !== undefined && { skip })
      }),
      prisma.leaks.count({ where })
    ]);

    // Ordenamiento inteligente por fecha_evento (más cercano a hoy)
    if (ordenarPorFechaEvento && direccionFechaEvento) {
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0); // Inicio del día de hoy
      
      leaks.sort((a, b) => {
        const fechaA = a.fecha_evento ? new Date(a.fecha_evento) : null;
        const fechaB = b.fecha_evento ? new Date(b.fecha_evento) : null;
        
        // Si alguna fecha es null, ponerla al final
        if (!fechaA && !fechaB) return 0;
        if (!fechaA) return 1;
        if (!fechaB) return -1;
        
        // Normalizar fechas a medianoche para comparación
        fechaA.setHours(0, 0, 0, 0);
        fechaB.setHours(0, 0, 0, 0);
        
        // Calcular diferencia absoluta con hoy (en días)
        const diffA = Math.abs(fechaA - hoy);
        const diffB = Math.abs(fechaB - hoy);
        
        if (direccionFechaEvento === 'desc') {
          // "Más reciente" = más cercano a hoy
          // Primero los eventos futuros más cercanos, luego los pasados más recientes
          const esFuturoA = fechaA >= hoy;
          const esFuturoB = fechaB >= hoy;
          
          // Priorizar eventos futuros sobre pasados
          if (esFuturoA && !esFuturoB) return -1;
          if (!esFuturoA && esFuturoB) return 1;
          
          // Si ambos son futuros o ambos son pasados, ordenar por proximidad a hoy
          return diffA - diffB;
        } else {
          // "Más antigua" = más lejano a hoy
          // Primero los eventos pasados más antiguos, luego los futuros más lejanos
          const esFuturoA = fechaA >= hoy;
          const esFuturoB = fechaB >= hoy;
          
          // Priorizar eventos pasados sobre futuros
          if (!esFuturoA && esFuturoB) return -1;
          if (esFuturoA && !esFuturoB) return 1;
          
          // Si ambos son pasados o ambos son futuros, ordenar por distancia a hoy (mayor primero)
          return diffB - diffA;
        }
      });
    }

    // Si el ordenamiento es 'desc' (más reciente) para fecha_recepcion, ordenar manualmente
    if (ordenar === 'desc' && !ordenarPorFechaEvento) {
      const hoy = new Date();
      hoy.setHours(23, 59, 59, 999); // Fin del día de hoy
      
      leaks.sort((a, b) => {
        const fechaA = new Date(a.fecha_recepcion);
        const fechaB = new Date(b.fecha_recepcion);
        
        // Normalizar fechas a medianoche para comparación
        fechaA.setHours(0, 0, 0, 0);
        fechaB.setHours(0, 0, 0, 0);
        const hoyNormalizado = new Date(hoy);
        hoyNormalizado.setHours(0, 0, 0, 0);
        
        const esFuturoA = fechaA > hoyNormalizado;
        const esFuturoB = fechaB > hoyNormalizado;
        
        // Si ambas son futuras o ambas son pasadas/presentes, ordenar por fecha
        if (esFuturoA === esFuturoB) {
          return fechaB - fechaA; // Descendente (más reciente primero)
        }
        
        // Las fechas pasadas/presentes van antes que las futuras
        return esFuturoA ? 1 : -1;
      });
    }

    // Devolver todos los leaks sin paginación
    res.json({
      success: true,
      count: leaks.length,
      total,
      data: leaks
    });

  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/leaks/corregir-salon-desconocido
 * @desc    Corregir leaks que tienen datos faltantes pero tienen salón asignado
 * @access  Private (Vendedor)
 */
router.post('/corregir-salon-desconocido', authenticate, requireVendedor, async (req, res, next) => {
  try {
    // Buscar leaks que deberían tener "?" como salón pero tienen otro valor
    // Criterios: cantidad_invitados es null o 0, y salon_preferido no es "?"
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

    if (leaksACorregir.length === 0) {
      return res.json({
        success: true,
        message: 'No hay leaks que necesiten corrección',
        corregidos: 0
      });
    }

    // Actualizar todos los leaks encontrados
    const resultado = await prisma.leaks.updateMany({
      where: {
        id: { in: leaksACorregir.map(l => l.id) }
      },
      data: {
        salon_preferido: '?'
      }
    });

    res.json({
      success: true,
      message: `Se corrigieron ${resultado.count} leaks asignándoles salón "Desconocido"`,
      corregidos: resultado.count,
      totalEncontrados: leaksACorregir.length
    });

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
        OR: [
          { usuario_id: req.user.id },
          { vendedor_id: req.user.id }
        ],
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
        usuarios: {
          select: {
            id: true,
            nombre_completo: true,
            codigo_usuario: true
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

    // Verificar permisos: debe ser el usuario asignado (usuario_id) o el vendedor asignado (vendedor_id deprecated)
    if ((leak.vendedor_id || leak.usuario_id) && 
        !(leak.usuario_id === req.user.id || leak.vendedor_id === req.user.id)) {
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

    if (leak.vendedor_id || leak.usuario_id) {
      throw new ValidationError('Este leak ya está asignado a otro vendedor');
    }

    if (leak.estado === 'convertido') {
      throw new ValidationError('Este leak ya fue convertido en cliente');
    }

    const leakActualizado = await prisma.leaks.update({
      where: { id: parseInt(id) },
      data: {
        usuario_id: req.user.id, // Usar usuario_id en lugar de vendedor_id (deprecated)
        fecha_asignacion: new Date()
      },
      include: {
        usuarios: {
          select: {
            id: true,
            nombre_completo: true,
            codigo_usuario: true
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

    // Verificar permisos: debe ser el usuario asignado (usuario_id) o el vendedor asignado (vendedor_id deprecated)
    if ((leak.vendedor_id || leak.usuario_id) && 
        !(leak.usuario_id === req.user.id || leak.vendedor_id === req.user.id)) {
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
        usuarios: {
          select: {
            id: true,
            nombre_completo: true,
            codigo_usuario: true
          }
        }
      }
    });

    // El leak ya está guardado con fecha_cita_salon, aparecerá automáticamente en el calendario de CITAS

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

    // Verificar permisos: debe ser el usuario asignado (usuario_id) o el vendedor asignado (vendedor_id deprecated)
    if ((leak.vendedor_id || leak.usuario_id) && 
        !(leak.usuario_id === req.user.id || leak.vendedor_id === req.user.id)) {
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
          usuario_id: req.user.id, // Usar usuario_id en lugar de vendedor_id (deprecated)
          vendedor_id: null // Mantener null para compatibilidad
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
    // Obtener los leaks que se van a eliminar para guardarlos en exclusiones
    const leaksAEliminar = await prisma.leaks.findMany({
      where: {
        usuario_id: null, // Solo leaks sin asignar (usar usuario_id en lugar de vendedor_id deprecated)
        estado: { not: 'convertido' } // Excluir convertidos
      },
      select: {
        email: true,
        telefono: true,
        nombre_completo: true
      }
    });

    // Guardar en tabla de exclusiones antes de eliminar
    if (leaksAEliminar.length > 0) {
      const exclusionesData = leaksAEliminar
        .filter(leak => leak.email || leak.telefono) // Solo los que tienen email o teléfono
        .map(leak => ({
          email: leak.email || null,
          telefono: leak.telefono || null,
          nombre_completo: leak.nombre_completo || null,
          motivo: 'Eliminado permanentemente (limpieza masiva)',
          eliminado_por: req.user.id
        }));

      if (exclusionesData.length > 0) {
        await prisma.leaks_exclusiones.createMany({
          data: exclusionesData,
          skipDuplicates: true // Evitar duplicados si ya existe
        });
      }
    }

    const resultado = await prisma.leaks.deleteMany({
      where: {
        usuario_id: null, // Solo leaks sin asignar (usar usuario_id en lugar de vendedor_id deprecated)
        estado: { not: 'convertido' } // Excluir convertidos
      }
    });

    res.json({
      success: true,
      message: `Se eliminaron ${resultado.count} leaks disponibles permanentemente. No se volverán a sincronizar.`,
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
        OR: [
          { usuario_id: req.user.id },
          { vendedor_id: req.user.id }
        ],
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
    // Verificar permisos: debe ser el usuario asignado (usuario_id) o el vendedor asignado (vendedor_id deprecated)
    if ((leak.vendedor_id || leak.usuario_id) && 
        !(leak.usuario_id === req.user.id || leak.vendedor_id === req.user.id)) {
      throw new ValidationError('No tienes permiso para eliminar este leak');
    }

    // No permitir eliminar leaks convertidos
    if (leak.estado === 'convertido') {
      throw new ValidationError('No se puede eliminar un leak convertido');
    }

    // Guardar en tabla de exclusiones antes de eliminar para evitar que se vuelva a sincronizar
    if (leak.email || leak.telefono) {
      await prisma.leaks_exclusiones.create({
        data: {
          email: leak.email || null,
          telefono: leak.telefono || null,
          nombre_completo: leak.nombre_completo || null,
          motivo: 'Eliminado permanentemente por el usuario',
          eliminado_por: req.user.id
        }
      });
    }

    await prisma.leaks.delete({
      where: { id: parseInt(id) }
    });

    res.json({
      success: true,
      message: 'Leak eliminado permanentemente. No se volverá a sincronizar.'
    });

  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/leaks/sincronizar
 * @desc    Sincronizar leaks desde Google Sheets (manual)
 * @access  Private (Vendedor)
 */
router.post('/sincronizar', authenticate, requireVendedor, async (req, res, next) => {
  try {
    // Usar la función de sincronización automática
    const { sincronizarLeaksAutomaticamente } = require('../utils/sincronizarLeaks');
    const resultado = await sincronizarLeaksAutomaticamente();
    
    // Retornar TODOS los campos, incluyendo actualizados y detallesDuplicados
    res.json({
      success: resultado.success,
      message: resultado.message,
      creados: resultado.creados,
      actualizados: resultado.actualizados || 0,
      duplicados: resultado.duplicados || 0,
      errores: resultado.errores || 0,
      omitidas: resultado.omitidas || 0,
      totalProcesadas: resultado.totalProcesadas || 0,
      totalEnSheet: resultado.totalEnSheet || 0,
      detallesDuplicados: resultado.detallesDuplicados || [],
      detallesOmitidas: resultado.detallesOmitidas || []
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/leaks/sincronizar (OLD - DEPRECATED)
 * @desc    Sincronizar leaks desde Google Sheets
 * @access  Private (Vendedor)
 */
router.post('/sincronizar-old', authenticate, requireVendedor, async (req, res, next) => {
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
      // Normalizar a medianoche para evitar problemas de ordenamiento
      fechaRecepcion.setHours(0, 0, 0, 0);
      
      const fechaRecepcionExcel = obtenerValor(fila, mapeoColumnas.fecha_recepcion);
      if (fechaRecepcionExcel) {
        try {
          // Parsear fecha sin problemas de zona horaria
          const fechaStr = String(fechaRecepcionExcel).trim();
          
          // Formato YYYY-MM-DD (preferido)
          if (fechaStr.match(/^\d{4}-\d{2}-\d{2}/)) {
            const datePart = fechaStr.split('T')[0];
            const [year, month, day] = datePart.split('-').map(Number);
            // Validar que los valores sean razonables
            if (year >= 2000 && year <= 2100 && month >= 1 && month <= 12 && day >= 1 && day <= 31) {
              fechaRecepcion = new Date(year, month - 1, day);
              fechaRecepcion.setHours(0, 0, 0, 0);
            }
          }
          // Formato con barras: El Excel usa DD/MM/YYYY (día-mes-año)
          else if (fechaStr.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/)) {
            const parts = fechaStr.split('/');
            const first = parseInt(parts[0], 10);
            const second = parseInt(parts[1], 10);
            const year = parseInt(parts[2], 10);
            
            // Validar año
            if (year >= 2000 && year <= 2100) {
              // El Excel usa DD/MM/YYYY, así que first = día, second = mes
              const day = first;
              const month = second;
              
              // Validar que mes y día sean razonables
              if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
                // Crear la fecha directamente (JavaScript maneja fechas inválidas automáticamente)
                fechaRecepcion = new Date(year, month - 1, day);
                // Verificar que la fecha es válida (no es NaN)
                if (!isNaN(fechaRecepcion.getTime())) {
                  fechaRecepcion.setHours(0, 0, 0, 0);
                } else {
                  // Si la fecha es inválida (ej: 31/02), usar fecha por defecto
                  fechaRecepcion = new Date();
                  fechaRecepcion.setHours(0, 0, 0, 0);
                }
              }
            }
          }
          // Otro formato, intentar parseo normal (último recurso)
          else {
            const fechaParsed = new Date(fechaRecepcionExcel);
            if (!isNaN(fechaParsed.getTime())) {
              // Verificar que la fecha parseada sea razonable
              const year = fechaParsed.getFullYear();
              if (year >= 2000 && year <= 2100) {
                fechaRecepcion = new Date(fechaParsed);
                fechaRecepcion.setHours(0, 0, 0, 0);
              }
            }
          }
        } catch (e) {
          console.error('Error al parsear fecha_recepcion:', fechaRecepcionExcel, e);
        }
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

    res.json({
      success: true,
      message: `Sincronización completada: ${leaksCreados.length} creados, ${leaksDuplicados.length} duplicados${errores.length > 0 ? `, ${errores.length} errores` : ''}`,
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

/**
 * @route   GET /api/leaks/debug/duplicados
 * @desc    Buscar leaks duplicados en la base de datos
 * @access  Private (Vendedor)
 */
router.get('/debug/duplicados', authenticate, requireVendedor, async (req, res, next) => {
  try {
    // Buscar duplicados por email
    const duplicadosEmail = await prisma.$queryRaw`
      SELECT email, COUNT(*)::int as cantidad
      FROM leaks
      WHERE email IS NOT NULL AND email != ''
      GROUP BY email
      HAVING COUNT(*) > 1
      ORDER BY cantidad DESC
    `;

    // Buscar duplicados por teléfono
    const duplicadosTelefono = await prisma.$queryRaw`
      SELECT telefono, COUNT(*)::int as cantidad
      FROM leaks
      WHERE telefono IS NOT NULL AND telefono != ''
      GROUP BY telefono
      HAVING COUNT(*) > 1
      ORDER BY cantidad DESC
    `;

    // Obtener detalles de los duplicados
    const detallesEmail = [];
    for (const dup of duplicadosEmail) {
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
      detallesEmail.push({
        email: dup.email,
        cantidad: dup.cantidad,
        leaks
      });
    }

    const detallesTelefono = [];
    for (const dup of duplicadosTelefono) {
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
      detallesTelefono.push({
        telefono: dup.telefono,
        cantidad: dup.cantidad,
        leaks
      });
    }

    // Contar totales
    const totalLeaks = await prisma.leaks.count();
    const totalSinConvertidos = await prisma.leaks.count({
      where: { estado: { not: 'convertido' } }
    });
    const totalConvertidos = await prisma.leaks.count({
      where: { estado: 'convertido' }
    });

    res.json({
      success: true,
      resumen: {
        totalLeaks,
        totalSinConvertidos,
        totalConvertidos,
        duplicadosPorEmail: duplicadosEmail.length,
        duplicadosPorTelefono: duplicadosTelefono.length
      },
      duplicadosEmail: detallesEmail,
      duplicadosTelefono: detallesTelefono
    });

  } catch (error) {
    next(error);
  }
});

module.exports = router;





