const express = require('express');
const router = express.Router();
const { getPrismaClient } = require('../config/database');
const { authenticate } = require('../middleware/auth');

const prisma = getPrismaClient();

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
    const { sanitizarId, sanitizarString } = require('../utils/validators');
    const { contrato_id, invitados } = req.body;

    // Sanitizar contrato_id
    const contratoIdSanitizado = sanitizarId(contrato_id, 'contrato_id');

    // Verificar que el contrato existe
    const contrato = await prisma.contratos.findUnique({
      where: { id: contratoIdSanitizado }
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
          contrato_id: contratoIdSanitizado, // Ya sanitizado
          nombre_completo: sanitizarString(nombre_completo, 255),
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

    // Verificar capacidad del contrato antes de crear invitados
    const contratoCompleto = await prisma.contratos.findUnique({
      where: { id: contratoIdSanitizado }, // Ya sanitizado
      include: {
        salones: true
      }
    });

    if (!contratoCompleto) {
      return res.status(404).json({
        success: false,
        message: 'Contrato no encontrado'
      });
    }

    // Verificar capacidad máxima del salón
    const capacidadMaxima = contratoCompleto.salones?.capacidad_maxima || contratoCompleto.cantidad_invitados;
    const invitadosActuales = await prisma.invitados.count({
      where: { contrato_id: contratoIdSanitizado } // Ya sanitizado
    });

    if (invitadosActuales + invitados.length > capacidadMaxima) {
      return res.status(400).json({
        success: false,
        message: `No se pueden agregar ${invitados.length} invitados. Capacidad máxima: ${capacidadMaxima}, Invitados actuales: ${invitadosActuales}, Nuevos: ${invitados.length}, Total: ${invitadosActuales + invitados.length}`
      });
    }

    const invitadosCrear = invitados.map(inv => ({
      contrato_id: contratoIdSanitizado, // Ya sanitizado
      nombre_completo: sanitizarString(inv.nombre_completo, 255),
      email: inv.email || null,
      telefono: inv.telefono || null,
      tipo: inv.tipo || 'adulto',
      mesa_id: inv.mesa_id ? parseInt(inv.mesa_id) : null,
      restricciones_alimentarias: inv.restricciones_alimentarias || null,
      notas: inv.notas || null
    }));

    // Crear invitados en transacción
    const resultado = await prisma.$transaction(async (tx) => {
      return await tx.invitados.createMany({
        data: invitadosCrear,
        skipDuplicates: true
      });
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

    // Actualizar invitado en transacción (si se asigna a mesa, verificar capacidad)
    const invitadoActualizado = await prisma.$transaction(async (tx) => {
      // Si se asigna a una mesa, verificar que existe y tiene espacio dentro de la transacción
      if (mesa_id && mesa_id !== invitadoExistente.mesa_id) {
        const mesa = await tx.mesas.findUnique({
          where: { id: parseInt(mesa_id) },
          include: {
            invitados: true
          }
        });

        if (!mesa) {
          throw new Error('Mesa no encontrada');
        }

        // Verificar capacidad (sin contar al invitado actual)
        const invitadosEnMesa = mesa.invitados.filter(inv => inv.id !== parseInt(id));
        if (invitadosEnMesa.length >= mesa.capacidad) {
          throw new Error(`La mesa ${mesa.numero_mesa} ya está llena (capacidad: ${mesa.capacidad})`);
        }
      }

      return await tx.invitados.update({
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
    });

    res.json({
      success: true,
      message: 'Invitado actualizado exitosamente',
      invitado: invitadoActualizado
    });
  } catch (error) {
    // Manejar errores de transacción
    if (error.message.includes('Mesa') || error.message.includes('capacidad') || error.message.includes('no encontrada')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
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

    // Asignar invitado a mesa en transacción (para evitar race conditions)
    const invitadoActualizado = await prisma.$transaction(async (tx) => {
      // Verificar capacidad dentro de la transacción (evita race conditions)
      const mesaActualizada = await tx.mesas.findUnique({
        where: { id: parseInt(mesa_id) },
        include: {
          invitados: true
        }
      });

      if (!mesaActualizada) {
        throw new Error('Mesa no encontrada');
      }

      // Verificar capacidad (sin contar al invitado actual si ya está en la mesa)
      const invitadosEnMesa = mesaActualizada.invitados.filter(inv => inv.id !== parseInt(id));
      if (invitadosEnMesa.length >= mesaActualizada.capacidad) {
        throw new Error(`La mesa ${mesaActualizada.numero_mesa} ya está llena (capacidad: ${mesaActualizada.capacidad}, ocupados: ${invitadosEnMesa.length})`);
      }

      // Actualizar invitado
      return await tx.invitados.update({
        where: { id: parseInt(id) },
        data: {
          mesa_id: parseInt(mesa_id),
          fecha_actualizacion: new Date()
        },
        include: {
          mesas: true
        }
      });
    });

    // Obtener la mesa actualizada para el mensaje
    const mesaInfo = await prisma.mesas.findUnique({
      where: { id: parseInt(mesa_id) },
      select: { numero_mesa: true }
    });

    res.json({
      success: true,
      message: `Invitado asignado a la mesa ${mesaInfo?.numero_mesa || mesa_id}`,
      invitado: invitadoActualizado
    });
  } catch (error) {
    // Manejar errores de transacción
    if (error.message.includes('Mesa') || error.message.includes('capacidad') || error.message.includes('no encontrada')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
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

