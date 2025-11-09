const express = require('express');
const router = express.Router();
const { getPrismaClient } = require('../config/database');
const { authenticate, requireVendedor } = require('../middleware/auth');
const { NotFoundError } = require('../middleware/errorHandler');

const prisma = getPrismaClient();

// ====================================
// OBTENER TODOS LOS SALONES ACTIVOS
// ====================================
router.get('/', authenticate, requireVendedor, async (req, res, next) => {
  try {
    const salones = await prisma.salones.findMany({
      where: { activo: true },
      orderBy: { capacidad_maxima: 'desc' }
    });

    res.json({
      success: true,
      salones
    });
  } catch (error) {
    next(error);
  }
});

// ====================================
// OBTENER PAQUETES DISPONIBLES POR SALÓN
// ====================================
router.get('/:salonId/paquetes', authenticate, requireVendedor, async (req, res, next) => {
  try {
    const { salonId } = req.params;

    // Obtener información del salón
    const salon = await prisma.salones.findUnique({
      where: { id: parseInt(salonId) }
    });

    if (!salon) {
      throw new NotFoundError('Salón no encontrado');
    }

    const paquetes = await prisma.paquetes_salones.findMany({
      where: {
        salon_id: parseInt(salonId),
        disponible: true
      },
      include: {
        paquetes: {
          include: {
            paquetes_servicios: {
              include: {
                servicios: true
              }
            }
          }
        }
      }
    });

    // Formatear respuesta para incluir precio específico del salón
    const paquetesFormateados = paquetes.map(ps => {
      // Si el salón es Kendall, filtrar la Máquina de Chispas de los servicios incluidos
      let serviciosIncluidos = ps.paquetes.paquetes_servicios || [];
      if (salon.nombre === 'Kendall') {
        serviciosIncluidos = serviciosIncluidos.filter(ps_serv => 
          !ps_serv.servicios?.nombre?.toLowerCase().includes('chispas')
        );
      }
      
      return {
        ...ps.paquetes,
        precio_base_salon: ps.precio_base,
        invitados_minimo_salon: ps.invitados_minimo,
        disponible_salon: ps.disponible,
        paquetes_servicios: serviciosIncluidos
      };
    });

    res.json({
      success: true,
      paquetes: paquetesFormateados
    });
  } catch (error) {
    next(error);
  }
});

// ====================================
// OBTENER PRECIO DE UN PAQUETE EN UN SALÓN
// ====================================
router.get('/:salonId/paquetes/:paqueteId/precio', authenticate, requireVendedor, async (req, res, next) => {
  try {
    const { salonId, paqueteId } = req.params;

    const precioSalon = await prisma.paquetes_salones.findFirst({
      where: {
        salon_id: parseInt(salonId),
        paquete_id: parseInt(paqueteId)
      }
    });

    if (!precioSalon) {
      return res.status(404).json({
        success: false,
        message: 'Paquete no disponible en este salón'
      });
    }

    res.json({
      success: true,
      precio_base: precioSalon.precio_base,
      invitados_minimo: precioSalon.invitados_minimo,
      disponible: precioSalon.disponible
    });
  } catch (error) {
    next(error);
  }
});

// ====================================
// VERIFICAR DISPONIBILIDAD DE UN SALÓN
// ====================================
router.post('/disponibilidad', authenticate, requireVendedor, async (req, res, next) => {
  try {
    const { salon_id, fecha_evento, hora_inicio, hora_fin } = req.body;

    if (!salon_id || !fecha_evento || !hora_inicio || !hora_fin) {
      return res.status(400).json({
        success: false,
        message: 'Faltan datos requeridos: salon_id, fecha_evento, hora_inicio, hora_fin'
      });
    }

    // Convertir fecha y horas a objetos Date para comparación
    const fechaEvento = new Date(fecha_evento);
    fechaEvento.setHours(0, 0, 0, 0);
    
    // Normalizar formato de hora (HH:mm)
    const horaInicioStr = typeof hora_inicio === 'string' 
      ? hora_inicio.length === 5 ? hora_inicio : hora_inicio.slice(0, 5)
      : hora_inicio.toTimeString().slice(0, 5);
    const horaFinStr = typeof hora_fin === 'string'
      ? hora_fin.length === 5 ? hora_fin : hora_fin.slice(0, 5)
      : hora_fin.toTimeString().slice(0, 5);

    // Obtener todos los contratos del salón en esa fecha
    const todosContratos = await prisma.contratos.findMany({
      where: {
        salon_id: parseInt(salon_id),
        fecha_evento: fechaEvento,
        estado: {
          in: ['activo', 'completado']
        }
      },
      include: {
        clientes: {
          select: {
            nombre_completo: true
          }
        }
      }
    });

    // Función helper para verificar solapamiento de horarios
    const haySolapamiento = (inicio1, fin1, inicio2, fin2) => {
      // Convertir horas a minutos para facilitar comparación
      const toMinutes = (hora) => {
        const [h, m] = hora.split(':').map(Number);
        return h * 60 + m;
      };
      
      const inicio1Min = toMinutes(inicio1);
      const fin1Min = toMinutes(fin1);
      const inicio2Min = toMinutes(inicio2);
      const fin2Min = toMinutes(fin2);
      
      // Manejar eventos que cruzan medianoche
      const fin1Ajustado = fin1Min < inicio1Min ? fin1Min + 1440 : fin1Min;
      const fin2Ajustado = fin2Min < inicio2Min ? fin2Min + 1440 : fin2Min;
      
      // Verificar solapamiento
      return (inicio1Min < fin2Ajustado && fin1Ajustado > inicio2Min) ||
             (inicio2Min < fin1Ajustado && fin2Ajustado > inicio1Min);
    };

    // Filtrar contratos que se solapan con el horario solicitado
    const contratosOcupados = todosContratos.filter(contrato => {
      const horaInicioContrato = typeof contrato.hora_inicio === 'string'
        ? contrato.hora_inicio.slice(0, 5)
        : contrato.hora_inicio.toTimeString().slice(0, 5);
      const horaFinContrato = typeof contrato.hora_fin === 'string'
        ? contrato.hora_fin.slice(0, 5)
        : contrato.hora_fin.toTimeString().slice(0, 5);
      
      return haySolapamiento(horaInicioStr, horaFinStr, horaInicioContrato, horaFinContrato);
    });

    // Obtener todas las ofertas aceptadas del salón en esa fecha
    const todasOfertas = await prisma.ofertas.findMany({
      where: {
        salon_id: parseInt(salon_id),
        fecha_evento: fechaEvento,
        estado: 'aceptada'
      },
      include: {
        clientes: {
          select: {
            nombre_completo: true
          }
        }
      }
    });

    // Filtrar ofertas que se solapan con el horario solicitado
    const ofertasOcupadas = todasOfertas.filter(oferta => {
      const horaInicioOferta = typeof oferta.hora_inicio === 'string'
        ? oferta.hora_inicio.slice(0, 5)
        : oferta.hora_inicio.toTimeString().slice(0, 5);
      const horaFinOferta = typeof oferta.hora_fin === 'string'
        ? oferta.hora_fin.slice(0, 5)
        : oferta.hora_fin.toTimeString().slice(0, 5);
      
      return haySolapamiento(horaInicioStr, horaFinStr, horaInicioOferta, horaFinOferta);
    });

    const disponible = contratosOcupados.length === 0 && ofertasOcupadas.length === 0;

    res.json({
      success: true,
      disponible,
      conflictos: {
        contratos: contratosOcupados.map(c => ({
          codigo: c.codigo_contrato,
          cliente: c.clientes?.nombre_completo,
          hora_inicio: c.hora_inicio,
          hora_fin: c.hora_fin
        })),
        ofertas: ofertasOcupadas.map(o => ({
          codigo: o.codigo_oferta,
          cliente: o.clientes?.nombre_completo,
          hora_inicio: o.hora_inicio,
          hora_fin: o.hora_fin
        }))
      }
    });
  } catch (error) {
    next(error);
  }
});

// ====================================
// OBTENER FECHAS OCUPADAS DE UN SALÓN EN UN RANGO
// ====================================
router.get('/:salonId/disponibilidad', authenticate, requireVendedor, async (req, res, next) => {
  try {
    const { salonId } = req.params;
    const { fecha_desde, fecha_hasta } = req.query;

    const fechaDesde = fecha_desde ? new Date(fecha_desde) : new Date();
    const fechaHasta = fecha_hasta ? new Date(fecha_hasta) : new Date();
    fechaHasta.setMonth(fechaHasta.getMonth() + 3); // Por defecto, 3 meses adelante

    // Obtener contratos activos/completados
    const contratos = await prisma.contratos.findMany({
      where: {
        salon_id: parseInt(salonId),
        fecha_evento: {
          gte: fechaDesde,
          lte: fechaHasta
        },
        estado: {
          in: ['activo', 'completado']
        }
      },
      select: {
        fecha_evento: true,
        hora_inicio: true,
        hora_fin: true,
        codigo_contrato: true,
        clientes: {
          select: {
            nombre_completo: true
          }
        }
      }
    });

    // Obtener ofertas aceptadas
    const ofertas = await prisma.ofertas.findMany({
      where: {
        salon_id: parseInt(salonId),
        fecha_evento: {
          gte: fechaDesde,
          lte: fechaHasta
        },
        estado: 'aceptada'
      },
      select: {
        fecha_evento: true,
        hora_inicio: true,
        hora_fin: true,
        codigo_oferta: true,
        clientes: {
          select: {
            nombre_completo: true
          }
        }
      }
    });

    res.json({
      success: true,
      ocupaciones: {
        contratos: contratos.map(c => ({
          fecha: c.fecha_evento,
          hora_inicio: c.hora_inicio,
          hora_fin: c.hora_fin,
          codigo: c.codigo_contrato,
          cliente: c.clientes?.nombre_completo
        })),
        ofertas: ofertas.map(o => ({
          fecha: o.fecha_evento,
          hora_inicio: o.hora_inicio,
          hora_fin: o.hora_fin,
          codigo: o.codigo_oferta,
          cliente: o.clientes?.nombre_completo
        }))
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;




