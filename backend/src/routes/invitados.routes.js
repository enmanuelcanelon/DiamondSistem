const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');

const prisma = new PrismaClient();

// ====================================
// OBTENER TODOS LOS INVITADOS DE UN CONTRATO
// ====================================
router.get('/contrato/:contratoId', authenticate, async (req, res, next) => {
  try {
    const { contratoId } = req.params;

    const invitados = await prisma.invitados.findMany({
      where: { contrato_id: parseInt(contratoId) },
      include: {
        mesas: true
      },
      orderBy: { nombre_completo: 'asc' }
    });

    // Agrupar invitados por estado de asignación
    const sinMesa = invitados.filter(inv => !inv.mesa_id);
    const conMesa = invitados.filter(inv => inv.mesa_id);

    res.json({
      success: true,
      invitados,
      total: invitados.length,
      sin_mesa: sinMesa.length,
      con_mesa: conMesa.length,
      agrupado: {
        sin_mesa: sinMesa,
        con_mesa: conMesa
      }
    });
  } catch (error) {
    next(error);
  }
});

// ====================================
// OBTENER UN INVITADO
// ====================================
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;

    const invitado = await prisma.invitados.findUnique({
      where: { id: parseInt(id) },
      include: {
        mesas: true,
        contratos: {
          include: {
            clientes: true
          }
        }
      }
    });

    if (!invitado) {
      return res.status(404).json({
        success: false,
        message: 'Invitado no encontrado'
      });
    }

    res.json({
      success: true,
      invitado
    });
  } catch (error) {
    next(error);
  }
});

// ====================================
// CREAR INVITADO (UNO O VARIOS)
// ====================================
router.post('/', authenticate, async (req, res, next) => {
  try {
    const { contrato_id, invitados } = req.body;

    // Validar datos requeridos
    if (!contrato_id) {
      return res.status(400).json({
        success: false,
        message: 'Falta el contrato_id'
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

    // Si se envía un solo invitado (objeto)
    if (!Array.isArray(invitados)) {
      const { nombre_completo, email, telefono, tipo, mesa_id, restricciones_alimentarias, notas } = invitados;

      if (!nombre_completo) {
        return res.status(400).json({
          success: false,
          message: 'Falta el nombre_completo del invitado'
        });
      }

      const nuevoInvitado = await prisma.invitados.create({
        data: {
          contrato_id: parseInt(contrato_id),
          nombre_completo,
          email: email || null,
          telefono: telefono || null,
          tipo: tipo || 'adulto',
          mesa_id: mesa_id ? parseInt(mesa_id) : null,
          restricciones_alimentarias: restricciones_alimentarias || null,
          notas: notas || null
        },
        include: {
          mesas: true
        }
      });

      return res.status(201).json({
        success: true,
        message: 'Invitado creado exitosamente',
        invitado: nuevoInvitado
      });
    }

    // Si se envían múltiples invitados (array)
    if (invitados.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Debe proporcionar al menos un invitado'
      });
    }

    const invitadosCrear = invitados.map(inv => ({
      contrato_id: parseInt(contrato_id),
      nombre_completo: inv.nombre_completo,
      email: inv.email || null,
      telefono: inv.telefono || null,
      tipo: inv.tipo || 'adulto',
      mesa_id: inv.mesa_id ? parseInt(inv.mesa_id) : null,
      restricciones_alimentarias: inv.restricciones_alimentarias || null,
      notas: inv.notas || null
    }));

    const resultado = await prisma.invitados.createMany({
      data: invitadosCrear,
      skipDuplicates: true
    });

    res.status(201).json({
      success: true,
      message: `${resultado.count} invitado(s) creado(s) exitosamente`,
      count: resultado.count
    });
  } catch (error) {
    next(error);
  }
});

// ====================================
// ACTUALIZAR INVITADO
// ====================================
router.put('/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      nombre_completo,
      email,
      telefono,
      tipo,
      mesa_id,
      confirmado,
      asistira,
      restricciones_alimentarias,
      notas
    } = req.body;

    const invitadoExistente = await prisma.invitados.findUnique({
      where: { id: parseInt(id) }
    });

    if (!invitadoExistente) {
      return res.status(404).json({
        success: false,
        message: 'Invitado no encontrado'
      });
    }

    // Si se asigna a una mesa, verificar que existe y tiene espacio
    if (mesa_id && mesa_id !== invitadoExistente.mesa_id) {
      const mesa = await prisma.mesas.findUnique({
        where: { id: parseInt(mesa_id) },
        include: {
          invitados: true
        }
      });

      if (!mesa) {
        return res.status(404).json({
          success: false,
          message: 'Mesa no encontrada'
        });
      }

      if (mesa.invitados.length >= mesa.capacidad) {
        return res.status(400).json({
          success: false,
          message: `La mesa ${mesa.numero_mesa} ya está llena (capacidad: ${mesa.capacidad})`
        });
      }
    }

    const invitadoActualizado = await prisma.invitados.update({
      where: { id: parseInt(id) },
      data: {
        nombre_completo: nombre_completo || invitadoExistente.nombre_completo,
        email: email !== undefined ? email : invitadoExistente.email,
        telefono: telefono !== undefined ? telefono : invitadoExistente.telefono,
        tipo: tipo || invitadoExistente.tipo,
        mesa_id: mesa_id !== undefined ? (mesa_id ? parseInt(mesa_id) : null) : invitadoExistente.mesa_id,
        confirmado: confirmado !== undefined ? confirmado : invitadoExistente.confirmado,
        asistira: asistira !== undefined ? asistira : invitadoExistente.asistira,
        restricciones_alimentarias: restricciones_alimentarias !== undefined ? restricciones_alimentarias : invitadoExistente.restricciones_alimentarias,
        notas: notas !== undefined ? notas : invitadoExistente.notas,
        fecha_actualizacion: new Date()
      },
      include: {
        mesas: true
      }
    });

    res.json({
      success: true,
      message: 'Invitado actualizado exitosamente',
      invitado: invitadoActualizado
    });
  } catch (error) {
    next(error);
  }
});

// ====================================
// ASIGNAR INVITADO A MESA
// ====================================
router.patch('/:id/asignar-mesa', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { mesa_id } = req.body;

    const invitado = await prisma.invitados.findUnique({
      where: { id: parseInt(id) }
    });

    if (!invitado) {
      return res.status(404).json({
        success: false,
        message: 'Invitado no encontrado'
      });
    }

    // Si mesa_id es null, desasignar de la mesa
    if (!mesa_id) {
      const invitadoActualizado = await prisma.invitados.update({
        where: { id: parseInt(id) },
        data: {
          mesa_id: null,
          fecha_actualizacion: new Date()
        },
        include: {
          mesas: true
        }
      });

      return res.json({
        success: true,
        message: 'Invitado desasignado de la mesa',
        invitado: invitadoActualizado
      });
    }

    // Verificar que la mesa existe y tiene espacio
    const mesa = await prisma.mesas.findUnique({
      where: { id: parseInt(mesa_id) },
      include: {
        invitados: true
      }
    });

    if (!mesa) {
      return res.status(404).json({
        success: false,
        message: 'Mesa no encontrada'
      });
    }

    // Verificar que la mesa pertenece al mismo contrato
    if (mesa.contrato_id !== invitado.contrato_id) {
      return res.status(400).json({
        success: false,
        message: 'La mesa no pertenece al mismo contrato'
      });
    }

    // Si el invitado ya está en esta mesa, no hacer nada
    if (invitado.mesa_id === parseInt(mesa_id)) {
      return res.json({
        success: true,
        message: 'El invitado ya está asignado a esta mesa',
        invitado: await prisma.invitados.findUnique({
          where: { id: parseInt(id) },
          include: { mesas: true }
        })
      });
    }

    // Verificar capacidad (sin contar al invitado actual si ya está en la mesa)
    const invitadosEnMesa = mesa.invitados.filter(inv => inv.id !== parseInt(id));
    if (invitadosEnMesa.length >= mesa.capacidad) {
      return res.status(400).json({
        success: false,
        message: `La mesa ${mesa.numero_mesa} ya está llena (capacidad: ${mesa.capacidad}, ocupados: ${invitadosEnMesa.length})`
      });
    }

    const invitadoActualizado = await prisma.invitados.update({
      where: { id: parseInt(id) },
      data: {
        mesa_id: parseInt(mesa_id),
        fecha_actualizacion: new Date()
      },
      include: {
        mesas: true
      }
    });

    res.json({
      success: true,
      message: `Invitado asignado a la mesa ${mesa.numero_mesa}`,
      invitado: invitadoActualizado
    });
  } catch (error) {
    next(error);
  }
});

// ====================================
// ELIMINAR INVITADO
// ====================================
router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;

    const invitadoExistente = await prisma.invitados.findUnique({
      where: { id: parseInt(id) }
    });

    if (!invitadoExistente) {
      return res.status(404).json({
        success: false,
        message: 'Invitado no encontrado'
      });
    }

    await prisma.invitados.delete({
      where: { id: parseInt(id) }
    });

    res.json({
      success: true,
      message: 'Invitado eliminado exitosamente'
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

