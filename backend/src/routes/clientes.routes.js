/**
 * Rutas de Clientes
 */

const express = require('express');
const router = express.Router();
const { getPrismaClient } = require('../config/database');
const { authenticate, requireVendedor } = require('../middleware/auth');
const { validarDatosCliente, sanitizarObjeto } = require('../utils/validators');
const { NotFoundError, ValidationError } = require('../middleware/errorHandler');

const prisma = getPrismaClient();

/**
 * @route   GET /api/clientes
 * @desc    Listar todos los clientes (con filtros)
 * @access  Private (Vendedor)
 */
router.get('/', authenticate, requireVendedor, async (req, res, next) => {
  try {
    const { tipo_evento, search } = req.query;

    // CRÍTICO: Forzar que el vendedor solo vea SUS clientes
    const where = {
      vendedor_id: req.user.id // Solo clientes del vendedor autenticado
    };

    // Filtro por tipo de evento
    if (tipo_evento) {
      where.tipo_evento = tipo_evento;
    }

    // Búsqueda por nombre o email
    if (search) {
      where.OR = [
        { nombre_completo: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }

    const { getPaginationParams, createPaginationResponse } = require('../utils/pagination');
    const { page, limit, skip } = getPaginationParams(req.query);

    const [clientes, total] = await Promise.all([
      prisma.clientes.findMany({
        where,
        include: {
          vendedores: {
            select: {
              id: true,
              nombre_completo: true,
              codigo_vendedor: true
            }
          },
          _count: {
            select: {
              contratos: true,
              ofertas: true
            }
          }
        },
        orderBy: { fecha_registro: 'desc' },
        take: limit,
        skip: skip
      }),
      prisma.clientes.count({ where })
    ]);

    res.json(createPaginationResponse(clientes, total, page, limit));

  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/clientes/:id
 * @desc    Obtener cliente por ID
 * @access  Private (Vendedor)
 */
router.get('/:id', authenticate, requireVendedor, async (req, res, next) => {
  try {
    const { id } = req.params;

    const cliente = await prisma.clientes.findUnique({
      where: { id: parseInt(id) },
      include: {
        vendedores: {
          select: {
            id: true,
            nombre_completo: true,
            codigo_vendedor: true,
            email: true
          }
        },
        ofertas: {
          select: {
            id: true,
            codigo_oferta: true,
            fecha_evento: true,
            total_final: true,
            estado: true,
            fecha_creacion: true
          },
          orderBy: { fecha_creacion: 'desc' }
        },
        contratos: {
          select: {
            id: true,
            codigo_contrato: true,
            fecha_evento: true,
            total_contrato: true,
            estado_pago: true,
            estado: true
          }
        }
      }
    });

    if (!cliente) {
      throw new NotFoundError('Cliente no encontrado');
    }

    res.json({
      success: true,
      cliente
    });

  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/clientes
 * @desc    Crear nuevo cliente
 * @access  Private (Vendedor)
 */
router.post('/', authenticate, requireVendedor, async (req, res, next) => {
  try {
    const datos = sanitizarObjeto(req.body);
    
    // Validar datos
    validarDatosCliente(datos);

    // Crear cliente
    const cliente = await prisma.clientes.create({
      data: {
        nombre_completo: datos.nombre_completo,
        email: datos.email,
        telefono: datos.telefono,
        direccion: datos.direccion || null,
        como_nos_conocio: datos.como_nos_conocio || null,
        tipo_evento: datos.tipo_evento || null,
        vendedor_id: datos.vendedor_id || req.user.id
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

    res.status(201).json({
      success: true,
      message: 'Cliente creado exitosamente',
      cliente
    });

  } catch (error) {
    next(error);
  }
});

/**
 * @route   PUT /api/clientes/:id
 * @desc    Actualizar cliente
 * @access  Private (Vendedor)
 */
router.put('/:id', authenticate, requireVendedor, async (req, res, next) => {
  try {
    const { id } = req.params;
    const datos = sanitizarObjeto(req.body);

    // Verificar que existe
    const clienteExistente = await prisma.clientes.findUnique({
      where: { id: parseInt(id) }
    });

    if (!clienteExistente) {
      throw new NotFoundError('Cliente no encontrado');
    }

    // Actualizar cliente
    const cliente = await prisma.clientes.update({
      where: { id: parseInt(id) },
      data: {
        nombre_completo: datos.nombre_completo,
        email: datos.email,
        telefono: datos.telefono,
        direccion: datos.direccion,
        como_nos_conocio: datos.como_nos_conocio,
        tipo_evento: datos.tipo_evento
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
      message: 'Cliente actualizado exitosamente',
      cliente
    });

  } catch (error) {
    next(error);
  }
});

/**
 * @route   DELETE /api/clientes/:id
 * @desc    Eliminar cliente (soft delete o validar que no tenga contratos)
 * @access  Private (Vendedor)
 */
router.delete('/:id', authenticate, requireVendedor, async (req, res, next) => {
  try {
    const { id } = req.params;

    // Verificar que existe
    const cliente = await prisma.clientes.findUnique({
      where: { id: parseInt(id) },
      include: {
        _count: {
          select: {
            contratos: true
          }
        }
      }
    });

    if (!cliente) {
      throw new NotFoundError('Cliente no encontrado');
    }

    // Verificar que no tenga contratos activos
    if (cliente._count.contratos > 0) {
      throw new ValidationError(
        'No se puede eliminar un cliente con contratos asociados',
        ['El cliente tiene contratos activos']
      );
    }

    // Eliminar cliente
    await prisma.clientes.delete({
      where: { id: parseInt(id) }
    });

    res.json({
      success: true,
      message: 'Cliente eliminado exitosamente'
    });

  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/clientes/:id/contratos
 * @desc    Obtener contratos de un cliente
 * @access  Private (Vendedor)
 */
router.get('/:id/contratos', authenticate, requireVendedor, async (req, res, next) => {
  try {
    const { id } = req.params;

    const contratos = await prisma.contratos.findMany({
      where: { cliente_id: parseInt(id) },
      include: {
        paquetes: {
          select: {
            id: true,
            nombre: true,
            precio_base: true
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
