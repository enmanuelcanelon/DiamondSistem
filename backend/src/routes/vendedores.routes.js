/**
 * Rutas de Vendedores
 */

const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authenticate, requireVendedor } = require('../middleware/auth');
const { NotFoundError } = require('../middleware/errorHandler');

const prisma = new PrismaClient();

/**
 * @route   GET /api/vendedores
 * @desc    Listar vendedores activos
 * @access  Private (Vendedor)
 */
router.get('/', authenticate, requireVendedor, async (req, res, next) => {
  try {
    const vendedores = await prisma.vendedores.findMany({
      where: { activo: true },
      select: {
        id: true,
        nombre_completo: true,
        codigo_vendedor: true,
        email: true,
        telefono: true,
        comision_porcentaje: true,
        total_ventas: true,
        total_comisiones: true,
        fecha_registro: true
      },
      orderBy: { fecha_registro: 'desc' }
    });

    res.json({
      success: true,
      count: vendedores.length,
      vendedores
    });

  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/vendedores/:id
 * @desc    Obtener vendedor por ID
 * @access  Private (Vendedor)
 */
router.get('/:id', authenticate, requireVendedor, async (req, res, next) => {
  try {
    const { id } = req.params;

    const vendedor = await prisma.vendedores.findUnique({
      where: { id: parseInt(id) },
      select: {
        id: true,
        nombre_completo: true,
        codigo_vendedor: true,
        email: true,
        telefono: true,
        comision_porcentaje: true,
        total_ventas: true,
        total_comisiones: true,
        activo: true,
        fecha_registro: true
      }
    });

    if (!vendedor) {
      throw new NotFoundError('Vendedor no encontrado');
    }

    res.json({
      success: true,
      vendedor
    });

  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/vendedores/:id/stats
 * @desc    Obtener estadísticas del vendedor
 * @access  Private (Vendedor)
 */
router.get('/:id/stats', authenticate, requireVendedor, async (req, res, next) => {
  try {
    const { id } = req.params;

    // Verificar que el vendedor existe
    const vendedor = await prisma.vendedores.findUnique({
      where: { id: parseInt(id) }
    });

    if (!vendedor) {
      throw new NotFoundError('Vendedor no encontrado');
    }

    // Obtener estadísticas
    const [
      totalClientes,
      totalOfertas,
      ofertasAceptadas,
      ofertasPendientes,
      ofertasRechazadas,
      totalContratos,
      contratosActivos,
      contratosPagados
    ] = await Promise.all([
      prisma.clientes.count({ where: { vendedor_id: parseInt(id) } }),
      prisma.ofertas.count({ where: { vendedor_id: parseInt(id) } }),
      prisma.ofertas.count({ where: { vendedor_id: parseInt(id), estado: 'aceptada' } }),
      prisma.ofertas.count({ where: { vendedor_id: parseInt(id), estado: 'pendiente' } }),
      prisma.ofertas.count({ where: { vendedor_id: parseInt(id), estado: 'rechazada' } }),
      prisma.contratos.count({ where: { vendedor_id: parseInt(id) } }),
      prisma.contratos.count({ where: { vendedor_id: parseInt(id), estado: 'activo' } }),
      prisma.contratos.count({ where: { vendedor_id: parseInt(id), estado_pago: 'completado' } })
    ]);

    // Calcular tasa de conversión
    const tasaConversion = totalOfertas > 0 
      ? ((ofertasAceptadas / totalOfertas) * 100).toFixed(2) 
      : 0;

    res.json({
      success: true,
      vendedor: {
        id: vendedor.id,
        nombre_completo: vendedor.nombre_completo,
        codigo_vendedor: vendedor.codigo_vendedor
      },
      estadisticas: {
        clientes: {
          total: totalClientes
        },
        ofertas: {
          total: totalOfertas,
          aceptadas: ofertasAceptadas,
          pendientes: ofertasPendientes,
          rechazadas: ofertasRechazadas,
          tasa_conversion: `${tasaConversion}%`
        },
        contratos: {
          total: totalContratos,
          activos: contratosActivos,
          pagados_completo: contratosPagados
        },
        finanzas: {
          total_ventas: parseFloat(vendedor.total_ventas),
          total_comisiones: parseFloat(vendedor.total_comisiones),
          comision_porcentaje: parseFloat(vendedor.comision_porcentaje)
        }
      }
    });

  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/vendedores/:id/clientes
 * @desc    Obtener clientes del vendedor
 * @access  Private (Vendedor)
 */
router.get('/:id/clientes', authenticate, requireVendedor, async (req, res, next) => {
  try {
    const { id } = req.params;

    const clientes = await prisma.clientes.findMany({
      where: { vendedor_id: parseInt(id) },
      include: {
        _count: {
          select: {
            contratos: true,
            ofertas: true
          }
        }
      },
      orderBy: { fecha_registro: 'desc' }
    });

    res.json({
      success: true,
      count: clientes.length,
      clientes
    });

  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/vendedores/:id/contratos
 * @desc    Obtener contratos del vendedor
 * @access  Private (Vendedor)
 */
router.get('/:id/contratos', authenticate, requireVendedor, async (req, res, next) => {
  try {
    const { id } = req.params;

    const contratos = await prisma.contratos.findMany({
      where: { vendedor_id: parseInt(id) },
      include: {
        clientes: {
          select: {
            id: true,
            nombre_completo: true,
            email: true,
            telefono: true
          }
        },
        paquetes: {
          select: {
            id: true,
            nombre: true
          }
        },
        eventos: {
          select: {
            id: true,
            nombre_evento: true,
            estado: true
          }
        }
      },
      orderBy: { fecha_firma: 'desc' }
    });

    res.json({
      success: true,
      count: contratos.length,
      contratos
    });

  } catch (error) {
    next(error);
  }
});

module.exports = router;
