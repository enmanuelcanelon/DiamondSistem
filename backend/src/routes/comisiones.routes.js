/**
 * Rutas para gestión de comisiones (Administración)
 */

const express = require('express');
const router = express.Router();
const { getPrismaClient } = require('../config/database');
const { authenticate, requireInventario } = require('../middleware/auth');
const { NotFoundError, ValidationError } = require('../middleware/errorHandler');
const { calcularComisionesDesbloqueadasVendedor } = require('../utils/comisionCalculator');
const { generarResumenComisionesPDF } = require('../utils/pdfComisiones');
const logger = require('../utils/logger');

const prisma = getPrismaClient();

/**
 * @route   GET /api/inventario/comisiones
 * @desc    Obtener todas las comisiones desbloqueadas de todos los vendedores
 * @access  Private (Inventario)
 */
router.get('/', authenticate, requireInventario, async (req, res, next) => {
  try {
    const { mes, año } = req.query;
    
    // Construir filtro de fecha si se proporciona
    let fechaFiltro = null;
    if (mes && año) {
      const mesNum = parseInt(mes);
      const añoNum = parseInt(año);
      const fechaInicio = new Date(añoNum, mesNum - 1, 1);
      const fechaFin = new Date(añoNum, mesNum, 0, 23, 59, 59);
      fechaFiltro = {
        gte: fechaInicio,
        lte: fechaFin
      };
    }

    // Obtener todos los vendedores activos
    const vendedores = await prisma.usuarios.findMany({
      where: { 
        rol: 'vendedor',
        activo: true
      },
      select: {
        id: true,
        nombre_completo: true,
        codigo_usuario: true,
        email: true
      },
      orderBy: { nombre_completo: 'asc' }
    });

    // Adaptar estructura para compatibilidad
    const vendedoresAdaptados = vendedores.map(v => ({
      ...v,
      codigo_vendedor: v.codigo_usuario
    }));

    // Calcular comisiones desbloqueadas para cada vendedor
    const vendedoresConComisiones = await Promise.all(
      vendedoresAdaptados.map(async (vendedor) => {
        // Calcular comisiones desbloqueadas (con filtro de fecha si aplica)
        const comisionesData = await calcularComisionesDesbloqueadasVendedor(
          vendedor.id,
          fechaFiltro ? { gte: fechaFiltro.gte, lte: fechaFiltro.lte } : null
        );
        
        // Obtener todos los contratos del vendedor para verificar comisiones desbloqueadas
        const contratos = await prisma.contratos.findMany({
          where: { vendedor_id: vendedor.id },
          include: {
            clientes: {
              select: {
                nombre_completo: true
              }
            },
            pagos: {
              where: { estado: 'completado' },
              orderBy: { fecha_pago: 'asc' }
            }
          },
          orderBy: { fecha_creacion_contrato: 'desc' }
        });

        // Obtener montos pagados usando SQL directo para cada contrato
        const contratosConMontosPagados = await Promise.all(
          contratos.map(async (contrato) => {
            const montos = await prisma.$queryRaw`
              SELECT 
                COALESCE(comision_primera_mitad_pagada_monto, 0) as comision_primera_mitad_pagada_monto,
                COALESCE(comision_segunda_mitad_pagada_monto, 0) as comision_segunda_mitad_pagada_monto
              FROM contratos
              WHERE id = ${contrato.id}
            `;
            return {
              ...contrato,
              comision_primera_mitad_pagada_monto: parseFloat(montos[0]?.comision_primera_mitad_pagada_monto || 0),
              comision_segunda_mitad_pagada_monto: parseFloat(montos[0]?.comision_segunda_mitad_pagada_monto || 0)
            };
          })
        );

        // Calcular comisiones pendientes de pago por contrato
        const comisionesPendientes = [];
        for (const contrato of contratosConMontosPagados) {
          const totalContrato = parseFloat(contrato.total_contrato || 0);
          const totalPagado = contrato.pagos.reduce((sum, p) => sum + parseFloat(p.monto_total || 0), 0);
          const porcentajePagado = totalContrato > 0 ? (totalPagado / totalContrato) * 100 : 0;

          // Verificar primera mitad
          let primeraMitadCumplida = false;
          if (contrato.fecha_creacion_contrato && contrato.pagos.length > 0) {
            const fechaCreacion = new Date(contrato.fecha_creacion_contrato);
            const primerPago = contrato.pagos[0];
            const montoPrimerPago = parseFloat(primerPago.monto_total || 0);
            
            if (montoPrimerPago >= 500) {
              const fechaLimite = new Date(fechaCreacion);
              fechaLimite.setDate(fechaLimite.getDate() + 10);
              
              const pagosEnPlazo = contrato.pagos.filter((pago, index) => {
                if (index === 0) return false;
                const fechaPago = new Date(pago.fecha_pago);
                return fechaPago > fechaCreacion && 
                       fechaPago <= fechaLimite &&
                       parseFloat(pago.monto_total) >= 500;
              });

              if (pagosEnPlazo.length > 0) {
                const montoEnPlazo = pagosEnPlazo.reduce((sum, p) => 
                  sum + parseFloat(p.monto_total), 0
                );
                
                if (montoEnPlazo >= 500 && (montoPrimerPago + montoEnPlazo) >= 1000) {
                  primeraMitadCumplida = true;
                }
              }
            }
          }

          const segundaMitadCumplida = porcentajePagado >= 50;
          const comisionPrimeraMitad = (totalContrato * 1.5) / 100;
          const comisionSegundaMitad = (totalContrato * 1.5) / 100;

          // Mostrar como pendiente si está desbloqueada y no está completamente pagada
          const montoPagadoPrimera = parseFloat((contrato.comision_primera_mitad_pagada_monto || 0).toFixed(2));
          const estaCompletamentePagadaPrimera = montoPagadoPrimera >= comisionPrimeraMitad;
          
          if (primeraMitadCumplida && !estaCompletamentePagadaPrimera) {
            // Encontrar la fecha en que se desbloqueó (fecha del segundo pago o fecha límite)
            let fechaDesbloqueo = contrato.fecha_creacion_contrato;
            if (contrato.pagos.length > 1) {
              const fechaCreacion = new Date(contrato.fecha_creacion_contrato);
              const fechaLimite = new Date(fechaCreacion);
              fechaLimite.setDate(fechaLimite.getDate() + 10);
              
              const segundoPago = contrato.pagos.find((pago, index) => {
                if (index === 0) return false;
                const fechaPago = new Date(pago.fecha_pago);
                return fechaPago > fechaCreacion && fechaPago <= fechaLimite;
              });
              
              if (segundoPago) {
                fechaDesbloqueo = segundoPago.fecha_pago;
              } else {
                fechaDesbloqueo = fechaLimite;
              }
            }

            // Filtrar por mes si se proporciona
            if (!fechaFiltro || (fechaDesbloqueo >= fechaFiltro.gte && fechaDesbloqueo <= fechaFiltro.lte)) {
              // Obtener primer y segundo pago
              const primerPago = contrato.pagos[0];
              const segundoPago = contrato.pagos.find((pago, index) => {
                if (index === 0) return false;
                const fechaCreacion = new Date(contrato.fecha_creacion_contrato);
                const fechaLimite = new Date(fechaCreacion);
                fechaLimite.setDate(fechaLimite.getDate() + 10);
                const fechaPago = new Date(pago.fecha_pago);
                return fechaPago > fechaCreacion && fechaPago <= fechaLimite;
              });

              // Calcular monto pagado (si hay pagos parciales)
              const montoPagado = montoPagadoPrimera;
              const montoPendiente = parseFloat((comisionPrimeraMitad - montoPagado).toFixed(2));

              comisionesPendientes.push({
                contrato_id: contrato.id,
                codigo_contrato: contrato.codigo_contrato,
                cliente: contrato.clientes?.nombre_completo || 'Sin cliente',
                tipo: 'primera_mitad',
                total_contrato: totalContrato,
                primer_pago: primerPago ? {
                  monto: parseFloat(primerPago.monto_total || 0),
                  fecha: primerPago.fecha_pago
                } : null,
                segundo_pago: segundoPago ? {
                  monto: parseFloat(segundoPago.monto_total || 0),
                  fecha: segundoPago.fecha_pago
                } : null,
                monto_total: parseFloat(comisionPrimeraMitad.toFixed(2)),
                monto_pagado: montoPagado,
                monto_pendiente: montoPendiente,
                fecha_desbloqueo: fechaDesbloqueo,
                pagada: false
              });
            }
          }

          // Mostrar como pendiente si está desbloqueada y no está completamente pagada
          const montoPagadoSegunda = parseFloat((contrato.comision_segunda_mitad_pagada_monto || 0).toFixed(2));
          const estaCompletamentePagadaSegunda = montoPagadoSegunda >= comisionSegundaMitad;
          
          if (segundaMitadCumplida && !estaCompletamentePagadaSegunda) {
            // Encontrar la fecha en que se alcanzó el 50%
            let fechaDesbloqueo = contrato.fecha_creacion_contrato;
            let acumulado = 0;
            for (const pago of contrato.pagos) {
              acumulado += parseFloat(pago.monto_total || 0);
              const porcentaje = (acumulado / totalContrato) * 100;
              if (porcentaje >= 50) {
                fechaDesbloqueo = pago.fecha_pago;
                break;
              }
            }

            // Filtrar por mes si se proporciona
            if (!fechaFiltro || (fechaDesbloqueo >= fechaFiltro.gte && fechaDesbloqueo <= fechaFiltro.lte)) {
              // Encontrar el pago que alcanzó el 50%
              let pago50Porciento = null;
              let acumulado = 0;
              for (const pago of contrato.pagos) {
                acumulado += parseFloat(pago.monto_total || 0);
                const porcentaje = (acumulado / totalContrato) * 100;
                if (porcentaje >= 50 && !pago50Porciento) {
                  pago50Porciento = pago;
                  break;
                }
              }

              // Calcular monto pagado (si hay pagos parciales)
              const montoPagado = montoPagadoSegunda;
              const montoPendiente = parseFloat((comisionSegundaMitad - montoPagado).toFixed(2));

              comisionesPendientes.push({
                contrato_id: contrato.id,
                codigo_contrato: contrato.codigo_contrato,
                cliente: contrato.clientes?.nombre_completo || 'Sin cliente',
                tipo: 'segunda_mitad',
                total_contrato: totalContrato,
                pago_50_porciento: pago50Porciento ? {
                  monto: parseFloat(pago50Porciento.monto_total || 0),
                  fecha: pago50Porciento.fecha_pago
                } : null,
                monto_total: parseFloat(comisionSegundaMitad.toFixed(2)),
                monto_pagado: montoPagado,
                monto_pendiente: montoPendiente,
                fecha_desbloqueo: fechaDesbloqueo,
                pagada: false
              });
            }
          }
        }

        // Obtener comisiones ya pagadas (con filtro de fecha si aplica)
        // Solo mostrar como pagadas las que están completamente pagadas (usando el booleano)
        const whereContratosPagados = {
          vendedor_id: vendedor.id,
          OR: [
            {
              comision_primera_mitad_pagada: true
            },
            {
              comision_segunda_mitad_pagada: true
            }
          ]
        };
        
        // Si hay filtro de fecha, filtrar por fecha de pago de comisión
        if (fechaFiltro) {
          whereContratosPagados.OR = [
            {
              AND: [
                { comision_primera_mitad_pagada: true },
                { fecha_pago_comision_primera: fechaFiltro }
              ]
            },
            {
              AND: [
                { comision_segunda_mitad_pagada: true },
                { fecha_pago_comision_segunda: fechaFiltro }
              ]
            }
          ];
        }

        // Obtener contratos con pagos para comisiones pagadas
        const contratosPagadosConPagosRaw = await prisma.contratos.findMany({
          where: whereContratosPagados,
          include: {
            clientes: {
              select: {
                nombre_completo: true
              }
            },
            pagos: {
              where: { estado: 'completado' },
              orderBy: { fecha_pago: 'asc' }
            }
          },
          orderBy: { fecha_creacion_contrato: 'desc' }
        });

        // Obtener montos pagados usando SQL directo para cada contrato pagado
        const contratosPagadosConPagos = await Promise.all(
          contratosPagadosConPagosRaw.map(async (contrato) => {
            const montos = await prisma.$queryRaw`
              SELECT 
                COALESCE(comision_primera_mitad_pagada_monto, 0) as comision_primera_mitad_pagada_monto,
                COALESCE(comision_segunda_mitad_pagada_monto, 0) as comision_segunda_mitad_pagada_monto
              FROM contratos
              WHERE id = ${contrato.id}
            `;
            return {
              ...contrato,
              comision_primera_mitad_pagada_monto: parseFloat(montos[0]?.comision_primera_mitad_pagada_monto || 0),
              comision_segunda_mitad_pagada_monto: parseFloat(montos[0]?.comision_segunda_mitad_pagada_monto || 0)
            };
          })
        );

        const comisionesPagadas = [];
        for (const contrato of contratosPagadosConPagos) {
          const totalContrato = parseFloat(contrato.total_contrato || 0);
          const montoPrimeraMitad = parseFloat((contrato.comision_primera_mitad || 0).toFixed(2));
          const montoSegundaMitad = parseFloat((contrato.comision_segunda_mitad || 0).toFixed(2));
          const montoPagadoPrimera = parseFloat((contrato.comision_primera_mitad_pagada_monto || 0).toFixed(2));
          const montoPagadoSegunda = parseFloat((contrato.comision_segunda_mitad_pagada_monto || 0).toFixed(2));

          // Solo mostrar como pagada si está completamente pagada
          if (montoPagadoPrimera > 0 && montoPagadoPrimera >= montoPrimeraMitad && contrato.fecha_pago_comision_primera) {
            const primerPago = contrato.pagos[0];
            const segundoPago = contrato.pagos.find((pago, index) => {
              if (index === 0) return false;
              const fechaCreacion = new Date(contrato.fecha_creacion_contrato);
              const fechaLimite = new Date(fechaCreacion);
              fechaLimite.setDate(fechaLimite.getDate() + 10);
              const fechaPago = new Date(pago.fecha_pago);
              return fechaPago > fechaCreacion && fechaPago <= fechaLimite;
            });

            // Filtrar por mes si se proporciona
            if (!fechaFiltro || (contrato.fecha_pago_comision_primera >= fechaFiltro.gte && contrato.fecha_pago_comision_primera <= fechaFiltro.lte)) {
              comisionesPagadas.push({
                contrato_id: contrato.id,
                codigo_contrato: contrato.codigo_contrato,
                cliente: contrato.clientes?.nombre_completo || 'Sin cliente',
                tipo: 'primera_mitad',
                total_contrato: totalContrato,
                primer_pago: primerPago ? {
                  monto: parseFloat(primerPago.monto_total || 0),
                  fecha: primerPago.fecha_pago
                } : null,
                segundo_pago: segundoPago ? {
                  monto: parseFloat(segundoPago.monto_total || 0),
                  fecha: segundoPago.fecha_pago
                } : null,
                monto_total: montoPrimeraMitad,
                monto_pagado: montoPagadoPrimera,
                fecha_desbloqueo: contrato.fecha_creacion_contrato,
                fecha_pago: contrato.fecha_pago_comision_primera,
                pagada: true
              });
            }
          }

          if (montoPagadoSegunda > 0 && montoPagadoSegunda >= montoSegundaMitad && contrato.fecha_pago_comision_segunda) {
            let pago50Porciento = null;
            let acumulado = 0;
            for (const pago of contrato.pagos) {
              acumulado += parseFloat(pago.monto_total || 0);
              const porcentaje = (acumulado / totalContrato) * 100;
              if (porcentaje >= 50 && !pago50Porciento) {
                pago50Porciento = pago;
                break;
              }
            }

            // Filtrar por mes si se proporciona
            if (!fechaFiltro || (contrato.fecha_pago_comision_segunda >= fechaFiltro.gte && contrato.fecha_pago_comision_segunda <= fechaFiltro.lte)) {
              comisionesPagadas.push({
                contrato_id: contrato.id,
                codigo_contrato: contrato.codigo_contrato,
                cliente: contrato.clientes?.nombre_completo || 'Sin cliente',
                tipo: 'segunda_mitad',
                total_contrato: totalContrato,
                pago_50_porciento: pago50Porciento ? {
                  monto: parseFloat(pago50Porciento.monto_total || 0),
                  fecha: pago50Porciento.fecha_pago
                } : null,
                monto_total: montoSegundaMitad,
                monto_pagado: montoPagadoSegunda,
                fecha_desbloqueo: contrato.fecha_creacion_contrato,
                fecha_pago: contrato.fecha_pago_comision_segunda,
                pagada: true
              });
            }
          }
        }

        return {
          vendedor: {
            id: vendedor.id,
            nombre_completo: vendedor.nombre_completo,
            codigo_vendedor: vendedor.codigo_vendedor,
            email: vendedor.email
          },
          comisiones: {
            total_desbloqueadas: comisionesData.totalComisionesDesbloqueadas,
            total: comisionesData.totalComisiones,
            pendientes: comisionesPendientes.reduce((sum, c) => sum + c.monto, 0),
            pagadas: comisionesPagadas.reduce((sum, c) => sum + c.monto, 0)
          },
          comisiones_pendientes: comisionesPendientes,
          comisiones_pagadas: comisionesPagadas
        };
      })
    );

    res.json({
      success: true,
      vendedores: vendedoresConComisiones
    });
  } catch (error) {
    logger.error('Error al obtener comisiones:', error);
    next(error);
  }
});

/**
 * @route   POST /api/inventario/comisiones/pagar
 * @desc    Registrar pago (parcial o completo) de una comisión desbloqueada
 * @access  Private (Inventario)
 */
router.post('/pagar', authenticate, requireInventario, async (req, res, next) => {
  try {
    const { contrato_id, tipo, monto } = req.body;

    if (!contrato_id || !tipo || !monto) {
      throw new ValidationError('Debe proporcionar contrato_id, tipo (primera_mitad o segunda_mitad) y monto');
    }

    if (tipo !== 'primera_mitad' && tipo !== 'segunda_mitad') {
      throw new ValidationError('Tipo debe ser "primera_mitad" o "segunda_mitad"');
    }

    const montoPago = parseFloat(monto);
    if (isNaN(montoPago) || montoPago <= 0) {
      throw new ValidationError('El monto debe ser un número positivo');
    }

    // Obtener contrato
    const contrato = await prisma.contratos.findUnique({
      where: { id: parseInt(contrato_id) },
      include: {
        vendedores: true
      }
    });

    if (!contrato) {
      throw new NotFoundError('Contrato no encontrado');
    }

    // Verificar que la comisión esté desbloqueada usando SQL directo
    let montoTotalComision = 0;
    let montoPagadoActual = 0;

    if (tipo === 'primera_mitad') {
      if (!contrato.comision_primera_mitad || contrato.comision_primera_mitad === 0) {
        throw new ValidationError('Esta comisión aún no está desbloqueada');
      }
      montoTotalComision = parseFloat(contrato.comision_primera_mitad);
      // Leer monto pagado usando SQL directo
      const resultado = await prisma.$queryRaw`
        SELECT comision_primera_mitad_pagada_monto 
        FROM contratos 
        WHERE id = ${parseInt(contrato_id)}
      `;
      montoPagadoActual = parseFloat((resultado[0]?.comision_primera_mitad_pagada_monto || 0).toFixed(2));
    } else {
      if (!contrato.comision_segunda_mitad || contrato.comision_segunda_mitad === 0) {
        throw new ValidationError('Esta comisión aún no está desbloqueada');
      }
      montoTotalComision = parseFloat(contrato.comision_segunda_mitad);
      // Leer monto pagado usando SQL directo
      const resultado = await prisma.$queryRaw`
        SELECT comision_segunda_mitad_pagada_monto 
        FROM contratos 
        WHERE id = ${parseInt(contrato_id)}
      `;
      montoPagadoActual = parseFloat((resultado[0]?.comision_segunda_mitad_pagada_monto || 0).toFixed(2));
    }

    // Verificar que el monto a pagar no exceda el pendiente
    const montoPendiente = montoTotalComision - montoPagadoActual;
    if (montoPago > montoPendiente) {
      throw new ValidationError(`El monto a pagar ($${montoPago.toFixed(2)}) excede el monto pendiente ($${montoPendiente.toFixed(2)})`);
    }

    // Calcular nuevo monto pagado
    const nuevoMontoPagado = montoPagadoActual + montoPago;
    const estaCompletamentePagada = nuevoMontoPagado >= montoTotalComision;

    // Actualizar contrato usando SQL directo para evitar problemas con Prisma Client
    if (tipo === 'primera_mitad') {
      if (estaCompletamentePagada) {
        await prisma.$executeRaw`
          UPDATE contratos 
          SET 
            comision_primera_mitad_pagada_monto = ${nuevoMontoPagado},
            comision_primera_mitad_pagada = true,
            fecha_pago_comision_primera = ${new Date()}
          WHERE id = ${parseInt(contrato_id)}
        `;
      } else {
        await prisma.$executeRaw`
          UPDATE contratos 
          SET comision_primera_mitad_pagada_monto = ${nuevoMontoPagado}
          WHERE id = ${parseInt(contrato_id)}
        `;
      }
    } else {
      if (estaCompletamentePagada) {
        await prisma.$executeRaw`
          UPDATE contratos 
          SET 
            comision_segunda_mitad_pagada_monto = ${nuevoMontoPagado},
            comision_segunda_mitad_pagada = true,
            fecha_pago_comision_segunda = ${new Date()}
          WHERE id = ${parseInt(contrato_id)}
        `;
      } else {
        await prisma.$executeRaw`
          UPDATE contratos 
          SET comision_segunda_mitad_pagada_monto = ${nuevoMontoPagado}
          WHERE id = ${parseInt(contrato_id)}
        `;
      }
    }

    res.json({
      success: true,
      message: estaCompletamentePagada 
        ? 'Comisión completamente pagada' 
        : `Pago parcial registrado. Pendiente: $${(montoTotalComision - nuevoMontoPagado).toFixed(2)}`,
      monto_pagado: nuevoMontoPagado,
      monto_pendiente: montoTotalComision - nuevoMontoPagado,
      completamente_pagada: estaCompletamentePagada
    });
  } catch (error) {
    logger.error('Error al registrar pago de comisión:', error);
    next(error);
  }
});

/**
 * @route   POST /api/inventario/comisiones/revertir
 * @desc    Revertir pago de una comisión (resetear monto pagado a 0)
 * @access  Private (Inventario)
 */
router.post('/revertir', authenticate, requireInventario, async (req, res, next) => {
  try {
    const { contrato_id, tipo } = req.body;

    if (!contrato_id || !tipo) {
      throw new ValidationError('Debe proporcionar contrato_id y tipo (primera_mitad o segunda_mitad)');
    }

    if (tipo !== 'primera_mitad' && tipo !== 'segunda_mitad') {
      throw new ValidationError('Tipo debe ser "primera_mitad" o "segunda_mitad"');
    }

    // Obtener contrato
    const contrato = await prisma.contratos.findUnique({
      where: { id: parseInt(contrato_id) },
      include: {
        vendedores: true
      }
    });

    if (!contrato) {
      throw new NotFoundError('Contrato no encontrado');
    }

    // Verificar que haya un monto pagado usando SQL directo
    let montoPagado = 0;
    if (tipo === 'primera_mitad') {
      const resultado = await prisma.$queryRaw`
        SELECT comision_primera_mitad_pagada_monto 
        FROM contratos 
        WHERE id = ${parseInt(contrato_id)}
      `;
      montoPagado = parseFloat((resultado[0]?.comision_primera_mitad_pagada_monto || 0).toFixed(2));
    } else {
      const resultado = await prisma.$queryRaw`
        SELECT comision_segunda_mitad_pagada_monto 
        FROM contratos 
        WHERE id = ${parseInt(contrato_id)}
      `;
      montoPagado = parseFloat((resultado[0]?.comision_segunda_mitad_pagada_monto || 0).toFixed(2));
    }
    
    if (montoPagado === 0) {
      throw new ValidationError('No hay pagos registrados para esta comisión');
    }

    // Revertir pago (resetear a 0) usando SQL directo
    if (tipo === 'primera_mitad') {
      await prisma.$executeRaw`
        UPDATE contratos 
        SET 
          comision_primera_mitad_pagada_monto = 0,
          comision_primera_mitad_pagada = false,
          fecha_pago_comision_primera = NULL
        WHERE id = ${parseInt(contrato_id)}
      `;
    } else {
      await prisma.$executeRaw`
        UPDATE contratos 
        SET 
          comision_segunda_mitad_pagada_monto = 0,
          comision_segunda_mitad_pagada = false,
          fecha_pago_comision_segunda = NULL
        WHERE id = ${parseInt(contrato_id)}
      `;
    }

    res.json({
      success: true,
      message: 'Pago de comisión revertido'
    });
  } catch (error) {
    logger.error('Error al revertir pago de comisión:', error);
    next(error);
  }
});

/**
 * @route   GET /api/inventario/comisiones/resumen-pdf
 * @desc    Descargar PDF de resumen de pagos de comisiones por mes
 * @access  Private (Inventario)
 */
router.get('/resumen-pdf', authenticate, requireInventario, async (req, res, next) => {
  try {
    const { mes, año } = req.query;

    if (!mes || !año) {
      throw new ValidationError('Debe proporcionar mes y año');
    }

    const mesNum = parseInt(mes);
    const añoNum = parseInt(año);

    if (mesNum < 1 || mesNum > 12) {
      throw new ValidationError('Mes inválido');
    }

    // Obtener todos los vendedores activos
    const vendedores = await prisma.usuarios.findMany({
      where: { 
        rol: 'vendedor',
        activo: true
      },
      select: {
        id: true,
        nombre_completo: true,
        codigo_usuario: true,
        email: true
      },
      orderBy: { nombre_completo: 'asc' }
    });

    // Adaptar estructura para compatibilidad
    const vendedoresAdaptados = vendedores.map(v => ({
      ...v,
      codigo_vendedor: v.codigo_usuario
    }));

    // Construir filtro de fecha
    const fechaInicio = new Date(añoNum, mesNum - 1, 1);
    const fechaFin = new Date(añoNum, mesNum, 0, 23, 59, 59);
    const fechaFiltro = {
      gte: fechaInicio,
      lte: fechaFin
    };

    // Obtener comisiones para cada vendedor (reutilizar lógica del endpoint principal)
    const vendedoresConComisiones = await Promise.all(
      vendedoresAdaptados.map(async (vendedor) => {
        const comisionesData = await calcularComisionesDesbloqueadasVendedor(
          vendedor.id,
          fechaFiltro
        );
        
        // Obtener contratos con pagos
        const contratos = await prisma.contratos.findMany({
          where: { vendedor_id: vendedor.id },
          include: {
            clientes: {
              select: {
                nombre_completo: true
              }
            },
            pagos: {
              where: { estado: 'completado' },
              orderBy: { fecha_pago: 'asc' }
            }
          },
          orderBy: { fecha_creacion_contrato: 'desc' }
        });

        // Obtener montos pagados usando SQL directo
        const contratosConMontosPagados = await Promise.all(
          contratos.map(async (contrato) => {
            const montos = await prisma.$queryRaw`
              SELECT 
                COALESCE(comision_primera_mitad_pagada_monto, 0) as comision_primera_mitad_pagada_monto,
                COALESCE(comision_segunda_mitad_pagada_monto, 0) as comision_segunda_mitad_pagada_monto
              FROM contratos
              WHERE id = ${contrato.id}
            `;
            return {
              ...contrato,
              comision_primera_mitad_pagada_monto: parseFloat(montos[0]?.comision_primera_mitad_pagada_monto || 0),
              comision_segunda_mitad_pagada_monto: parseFloat(montos[0]?.comision_segunda_mitad_pagada_monto || 0)
            };
          })
        );

        // Calcular comisiones pendientes y pagadas (simplificado para PDF)
        const comisionesPendientes = [];
        const comisionesPagadas = [];

        for (const contrato of contratosConMontosPagados) {
          const totalContrato = parseFloat(contrato.total_contrato || 0);
          const totalPagado = contrato.pagos.reduce((sum, p) => sum + parseFloat(p.monto_total || 0), 0);
          const porcentajePagado = totalContrato > 0 ? (totalPagado / totalContrato) * 100 : 0;

          // Verificar primera mitad
          let primeraMitadCumplida = false;
          if (contrato.fecha_creacion_contrato && contrato.pagos.length > 0) {
            const fechaCreacion = new Date(contrato.fecha_creacion_contrato);
            const primerPago = contrato.pagos[0];
            const montoPrimerPago = parseFloat(primerPago.monto_total || 0);
            
            if (montoPrimerPago >= 500) {
              const fechaLimite = new Date(fechaCreacion);
              fechaLimite.setDate(fechaLimite.getDate() + 10);
              
              const pagosEnPlazo = contrato.pagos.filter((pago, index) => {
                if (index === 0) return false;
                const fechaPago = new Date(pago.fecha_pago);
                return fechaPago > fechaCreacion && 
                       fechaPago <= fechaLimite &&
                       parseFloat(pago.monto_total) >= 500;
              });

              if (pagosEnPlazo.length > 0) {
                const montoEnPlazo = pagosEnPlazo.reduce((sum, p) => 
                  sum + parseFloat(p.monto_total), 0
                );
                
                if (montoEnPlazo >= 500 && (montoPrimerPago + montoEnPlazo) >= 1000) {
                  primeraMitadCumplida = true;
                }
              }
            }
          }

          const segundaMitadCumplida = porcentajePagado >= 50;
          const comisionPrimeraMitad = (totalContrato * 1.5) / 100;
          const comisionSegundaMitad = (totalContrato * 1.5) / 100;

          const montoPagadoPrimera = contrato.comision_primera_mitad_pagada_monto;
          const montoPagadoSegunda = contrato.comision_segunda_mitad_pagada_monto;
          const estaCompletamentePagadaPrimera = montoPagadoPrimera >= comisionPrimeraMitad;
          const estaCompletamentePagadaSegunda = montoPagadoSegunda >= comisionSegundaMitad;

          // Primera mitad
          if (primeraMitadCumplida) {
            if (estaCompletamentePagadaPrimera) {
              comisionesPagadas.push({
                codigo_contrato: contrato.codigo_contrato,
                tipo: 'primera_mitad',
                total_contrato: totalContrato,
                monto_total: comisionPrimeraMitad,
                monto_pagado: montoPagadoPrimera,
                monto_pendiente: 0,
                pagada: true,
                fecha_pago: contrato.fecha_pago_comision_primera
              });
            } else {
              comisionesPendientes.push({
                codigo_contrato: contrato.codigo_contrato,
                tipo: 'primera_mitad',
                total_contrato: totalContrato,
                monto_total: comisionPrimeraMitad,
                monto_pagado: montoPagadoPrimera,
                monto_pendiente: comisionPrimeraMitad - montoPagadoPrimera,
                pagada: false
              });
            }
          }

          // Segunda mitad
          if (segundaMitadCumplida) {
            if (estaCompletamentePagadaSegunda) {
              comisionesPagadas.push({
                codigo_contrato: contrato.codigo_contrato,
                tipo: 'segunda_mitad',
                total_contrato: totalContrato,
                monto_total: comisionSegundaMitad,
                monto_pagado: montoPagadoSegunda,
                monto_pendiente: 0,
                pagada: true,
                fecha_pago: contrato.fecha_pago_comision_segunda
              });
            } else {
              comisionesPendientes.push({
                codigo_contrato: contrato.codigo_contrato,
                tipo: 'segunda_mitad',
                total_contrato: totalContrato,
                monto_total: comisionSegundaMitad,
                monto_pagado: montoPagadoSegunda,
                monto_pendiente: comisionSegundaMitad - montoPagadoSegunda,
                pagada: false
              });
            }
          }
        }

        return {
          vendedor: {
            id: vendedor.id,
            nombre_completo: vendedor.nombre_completo,
            codigo_vendedor: vendedor.codigo_vendedor,
            email: vendedor.email
          },
          comisiones: {
            total_desbloqueadas: comisionesData.totalComisionesDesbloqueadas,
            total: comisionesData.totalComisiones,
            pendientes: comisionesPendientes.reduce((sum, c) => sum + c.monto_pendiente, 0),
            pagadas: comisionesPagadas.reduce((sum, c) => sum + c.monto_pagado, 0)
          },
          comisiones_pendientes: comisionesPendientes,
          comisiones_pagadas: comisionesPagadas
        };
      })
    );

    // Generar PDF
    const pdfBuffer = await generarResumenComisionesPDF(vendedoresConComisiones, mesNum, añoNum);

    const nombresMeses = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    const nombreMes = nombresMeses[mesNum - 1];

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="Resumen-Comisiones-${nombreMes}-${añoNum}.pdf"`);
    res.send(pdfBuffer);
  } catch (error) {
    logger.error('Error al generar PDF de resumen de comisiones:', error);
    next(error);
  }
});

module.exports = router;

