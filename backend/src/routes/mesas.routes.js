const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authenticate, requireVendedor } = require('../middleware/auth');

const prisma = new PrismaClient();

// ====================================
// OBTENER TODAS LAS MESAS DE UN CONTRATO
// ====================================
router.get('/contrato/:contratoId', authenticate, async (req, res, next) => {
  try {
    const { contratoId } = req.params;

    const mesas = await prisma.mesas.findMany({
      where: { contrato_id: parseInt(contratoId) },
      include: {
        invitados: {
          orderBy: { nombre_completo: 'asc' }
        }
      },
      orderBy: { numero_mesa: 'asc' }
    });

    res.json({
      success: true,
      mesas,
      total: mesas.length
    });
  } catch (error) {
    next(error);
  }
});

// ====================================
// CREAR MESA
// ====================================
router.post('/', authenticate, async (req, res, next) => {
  try {
    const {
      contrato_id,
      numero_mesa,
      nombre_mesa,
      capacidad,
      notas
    } = req.body;

    // Validar datos requeridos
    if (!contrato_id || !numero_mesa || !capacidad) {
      return res.status(400).json({
        success: false,
        message: 'Faltan datos requeridos: contrato_id, numero_mesa, capacidad'
      });
    }

    // Verificar que el contrato existe
    const contrato = await prisma.contratos.findUnique({
      where: { id: parseInt(contrato_id) }
    });

    if (!contrato) {
      return res.status(404).json({
        success: false,
        message: 'Contrato no encontrado'
      });
    }

    // Verificar que el número de mesa no exista ya para este contrato
    const mesaExistente = await prisma.mesas.findFirst({
      where: {
        contrato_id: parseInt(contrato_id),
        numero_mesa: parseInt(numero_mesa)
      }
    });

    if (mesaExistente) {
      return res.status(400).json({
        success: false,
        message: `La mesa número ${numero_mesa} ya existe para este contrato`
      });
    }

    const nuevaMesa = await prisma.mesas.create({
      data: {
        contrato_id: parseInt(contrato_id),
        numero_mesa: parseInt(numero_mesa),
        nombre_mesa: nombre_mesa || null,
        capacidad: parseInt(capacidad),
        notas: notas || null
      },
      include: {
        invitados: true
      }
    });

    res.status(201).json({
      success: true,
      message: 'Mesa creada exitosamente',
      mesa: nuevaMesa
    });
  } catch (error) {
    next(error);
  }
});

// ====================================
// ACTUALIZAR MESA
// ====================================
router.put('/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      numero_mesa,
      nombre_mesa,
      capacidad,
      forma,
      notas
    } = req.body;

    // Verificar que la mesa existe
    const mesaExistente = await prisma.mesas.findUnique({
      where: { id: parseInt(id) }
    });

    if (!mesaExistente) {
      return res.status(404).json({
        success: false,
        message: 'Mesa no encontrada'
      });
    }

    // Si se cambia el número de mesa, verificar que no exista ya
    if (numero_mesa && numero_mesa !== mesaExistente.numero_mesa) {
      const mesaConNumero = await prisma.mesas.findFirst({
        where: {
          contrato_id: mesaExistente.contrato_id,
          numero_mesa: parseInt(numero_mesa),
          NOT: { id: parseInt(id) }
        }
      });

      if (mesaConNumero) {
        return res.status(400).json({
          success: false,
          message: `La mesa número ${numero_mesa} ya existe para este contrato`
        });
      }
    }

    const mesaActualizada = await prisma.mesas.update({
      where: { id: parseInt(id) },
      data: {
        numero_mesa: numero_mesa ? parseInt(numero_mesa) : mesaExistente.numero_mesa,
        nombre_mesa: nombre_mesa !== undefined ? nombre_mesa : mesaExistente.nombre_mesa,
        capacidad: capacidad ? parseInt(capacidad) : mesaExistente.capacidad,
        forma: forma || mesaExistente.forma,
        notas: notas !== undefined ? notas : mesaExistente.notas,
        fecha_actualizacion: new Date()
      },
      include: {
        invitados: true
      }
    });

    res.json({
      success: true,
      message: 'Mesa actualizada exitosamente',
      mesa: mesaActualizada
    });
  } catch (error) {
    next(error);
  }
});

// ====================================
// ELIMINAR MESA
// ====================================
router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;

    const mesaExistente = await prisma.mesas.findUnique({
      where: { id: parseInt(id) },
      include: {
        invitados: true
      }
    });

    if (!mesaExistente) {
      return res.status(404).json({
        success: false,
        message: 'Mesa no encontrada'
      });
    }

    // Si la mesa tiene invitados asignados, desasignarlos primero
    if (mesaExistente.invitados.length > 0) {
      await prisma.invitados.updateMany({
        where: { mesa_id: parseInt(id) },
        data: { mesa_id: null }
      });
    }

    await prisma.mesas.delete({
      where: { id: parseInt(id) }
    });

    res.json({
      success: true,
      message: 'Mesa eliminada exitosamente'
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

