const express = require('express');
const router = express.Router();
const { getPrismaClient } = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { generarPDFAjustesEvento } = require('../utils/pdfAjustesEvento');

const prisma = getPrismaClient();

// ====================================
// OBTENER AJUSTES DE UN CONTRATO
// ====================================
router.get('/contrato/:contratoId', authenticate, async (req, res, next) => {
  try {
    const { contratoId } = req.params;

    let ajustes = await prisma.ajustes_evento.findUnique({
      where: { contrato_id: parseInt(contratoId) }
    });

    // Si no existen ajustes, crearlos automáticamente
    if (!ajustes) {
      ajustes = await prisma.ajustes_evento.create({
        data: {
          contrato_id: parseInt(contratoId)
        }
      });
    }

    res.json({
      success: true,
      ajustes
    });
  } catch (error) {
    next(error);
  }
});

// ====================================
// ACTUALIZAR AJUSTES
// ====================================
router.put('/contrato/:contratoId', authenticate, async (req, res, next) => {
  try {
    const { contratoId } = req.params;
    const datosAjustes = req.body;

    // Verificar que el contrato existe
    const contrato = await prisma.contratos.findUnique({
      where: { id: parseInt(contratoId) }
    });

    if (!contrato) {
      return res.status(404).json({
        success: false,
        message: 'Contrato no encontrado'
      });
    }

    // Preparar datos para actualizar
    const datosParaGuardar = { ...datosAjustes };
    
    // Convertir hora_limosina de string "HH:MM" a formato Time si existe
    if (datosParaGuardar.hora_limosina !== undefined) {
      if (datosParaGuardar.hora_limosina === '' || datosParaGuardar.hora_limosina === null) {
        datosParaGuardar.hora_limosina = null;
      } else if (typeof datosParaGuardar.hora_limosina === 'string') {
        // Si viene como "HH:MM", convertir a formato Time para PostgreSQL
        const horaMatch = datosParaGuardar.hora_limosina.match(/^(\d{2}):(\d{2})$/);
        if (horaMatch) {
          // Para Prisma con @db.Time, necesitamos crear un Date válido
          // Usar una fecha base y establecer solo la hora
          const horas = parseInt(horaMatch[1]);
          const minutos = parseInt(horaMatch[2]);
          // Crear Date con formato ISO completo (necesario para Prisma)
          const fechaHora = new Date();
          fechaHora.setFullYear(1970, 0, 1); // 1970-01-01
          fechaHora.setHours(horas, minutos, 0, 0);
          datosParaGuardar.hora_limosina = fechaHora;
        } else {
          // Si no es formato válido, establecer como null
          datosParaGuardar.hora_limosina = null;
        }
      }
    }

    // Manejar campos JSON: servilletas
    if (datosParaGuardar.servilletas !== undefined) {
      if (Array.isArray(datosParaGuardar.servilletas)) {
        // Ya es un array, mantenerlo así (Prisma maneja JSON automáticamente)
        datosParaGuardar.servilletas = datosParaGuardar.servilletas;
      } else if (typeof datosParaGuardar.servilletas === 'string') {
        try {
          // Intentar parsear si viene como string JSON
          datosParaGuardar.servilletas = JSON.parse(datosParaGuardar.servilletas);
        } catch (e) {
          // Si falla el parse, establecer como null
          datosParaGuardar.servilletas = null;
        }
      } else if (datosParaGuardar.servilletas === '' || datosParaGuardar.servilletas === null) {
        datosParaGuardar.servilletas = null;
      }
    }

    // Manejar campos JSON: protocolo
    if (datosParaGuardar.protocolo !== undefined) {
      if (typeof datosParaGuardar.protocolo === 'object' && datosParaGuardar.protocolo !== null) {
        // Si es un objeto, convertirlo a string JSON
        datosParaGuardar.protocolo = JSON.stringify(datosParaGuardar.protocolo);
      } else if (typeof datosParaGuardar.protocolo === 'string') {
        // Si ya es string, validar que sea JSON válido
        if (datosParaGuardar.protocolo === '' || datosParaGuardar.protocolo === null) {
          datosParaGuardar.protocolo = null;
        } else {
          try {
            // Validar que sea JSON válido
            JSON.parse(datosParaGuardar.protocolo);
          } catch (e) {
            // Si no es JSON válido, establecer como null
            datosParaGuardar.protocolo = null;
          }
        }
      } else if (datosParaGuardar.protocolo === '' || datosParaGuardar.protocolo === null) {
        datosParaGuardar.protocolo = null;
      }
    }

    // Manejar campos JSON: bailes_adicionales
    if (datosParaGuardar.bailes_adicionales !== undefined) {
      if (Array.isArray(datosParaGuardar.bailes_adicionales)) {
        // Convertir array a string JSON
        datosParaGuardar.bailes_adicionales = JSON.stringify(datosParaGuardar.bailes_adicionales);
      } else if (typeof datosParaGuardar.bailes_adicionales === 'string') {
        // Si ya es string, validar que sea JSON válido
        if (datosParaGuardar.bailes_adicionales === '' || datosParaGuardar.bailes_adicionales === null) {
          datosParaGuardar.bailes_adicionales = null;
        } else {
          try {
            // Validar que sea JSON válido
            JSON.parse(datosParaGuardar.bailes_adicionales);
          } catch (e) {
            // Si no es JSON válido, establecer como null
            datosParaGuardar.bailes_adicionales = null;
          }
        }
      } else if (datosParaGuardar.bailes_adicionales === '' || datosParaGuardar.bailes_adicionales === null) {
        datosParaGuardar.bailes_adicionales = null;
      }
    }

    // Remover campos que no existen en el schema
    const camposValidos = [
      'sabor_torta', 'tamano_torta', 'tipo_relleno', 'diseno_torta', 'notas_torta',
      'estilo_decoracion', 'colores_principales', 'flores_preferidas', 'tematica', 'notas_decoracion',
      'tipo_servicio', 'entrada', 'plato_principal', 'acompanamientos', 'opciones_vegetarianas',
      'opciones_veganas', 'restricciones_alimentarias', 'bebidas_incluidas', 'notas_menu',
      'musica_ceremonial', 'primer_baile', 'baile_padre_hija', 'baile_madre_hijo', 'hora_show',
      'actividades_especiales', 'bailes_adicionales', 'cancion_sorpresa', 'notas_entretenimiento',
      'playlist_urls', 'momentos_especiales', 'poses_especificas', 'ubicaciones_fotos', 'notas_fotografia',
      'invitado_honor', 'brindis_especial', 'sorpresas_planeadas', 'solicitudes_especiales',
      'vestido_nina', 'observaciones_adicionales', 'items_especiales', 'protocolo',
      'tipo_decoracion', 'cojines_color', 'centro_mesa_1', 'centro_mesa_2', 'centro_mesa_3',
      'base_color', 'challer_color', 'servilletas', 'aros_color', 'aros_nota',
      'runner_tipo', 'runner_nota', 'stage_tipo', 'stage_color_globos', 'decoracion_premium_detalles',
      'decoracion_completada', 'estilo_decoracion_otro', 'hora_limosina', 'pisos_torta',
      'sabor_otro', 'diseno_otro', 'hay_teenagers', 'cantidad_teenagers', 'teenagers_tipo_comida',
      'teenagers_tipo_pasta', 'acompanamiento_seleccionado'
    ];

    // Filtrar solo campos válidos
    const datosFiltrados = {};
    Object.keys(datosParaGuardar).forEach(key => {
      if (camposValidos.includes(key)) {
        datosFiltrados[key] = datosParaGuardar[key];
      }
    });

    // Buscar o crear ajustes
    let ajustes = await prisma.ajustes_evento.findUnique({
      where: { contrato_id: parseInt(contratoId) }
    });

    if (ajustes) {
      // Actualizar ajustes existentes
      ajustes = await prisma.ajustes_evento.update({
        where: { contrato_id: parseInt(contratoId) },
        data: {
          ...datosFiltrados,
          fecha_actualizacion: new Date()
        }
      });
    } else {
      // Crear nuevos ajustes
      ajustes = await prisma.ajustes_evento.create({
        data: {
          contrato_id: parseInt(contratoId),
          ...datosFiltrados
        }
      });
    }

    res.json({
      success: true,
      message: 'Ajustes actualizados exitosamente',
      ajustes
    });
  } catch (error) {
    console.error('Error al actualizar ajustes:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al actualizar los ajustes',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Error interno del servidor'
    });
  }
});

// ====================================
// ACTUALIZAR SECCIÓN ESPECÍFICA
// ====================================
router.patch('/contrato/:contratoId/:seccion', authenticate, async (req, res, next) => {
  try {
    const { contratoId, seccion } = req.params;
    const datos = req.body;

    // Validar sección
    const seccionesValidas = ['torta', 'decoracion', 'menu', 'entretenimiento', 'bar', 'otros'];
    if (!seccionesValidas.includes(seccion)) {
      return res.status(400).json({
        success: false,
        message: 'Sección inválida'
      });
    }

    // Preparar datos para actualizar
    const datosParaGuardar = { ...datos };
    
    // Convertir hora_limosina de string "HH:MM" a formato Time si existe
    if (datosParaGuardar.hora_limosina !== undefined) {
      if (datosParaGuardar.hora_limosina === '' || datosParaGuardar.hora_limosina === null) {
        datosParaGuardar.hora_limosina = null;
      } else if (typeof datosParaGuardar.hora_limosina === 'string') {
        // Si viene como "HH:MM", convertir a formato Time para PostgreSQL
        const horaMatch = datosParaGuardar.hora_limosina.match(/^(\d{2}):(\d{2})$/);
        if (horaMatch) {
          // Para Prisma con @db.Time, necesitamos crear un Date válido
          // Usar una fecha base y establecer solo la hora
          const horas = parseInt(horaMatch[1]);
          const minutos = parseInt(horaMatch[2]);
          // Crear Date con formato ISO completo (necesario para Prisma)
          const fechaHora = new Date();
          fechaHora.setFullYear(1970, 0, 1); // 1970-01-01
          fechaHora.setHours(horas, minutos, 0, 0);
          datosParaGuardar.hora_limosina = fechaHora;
        } else {
          // Si no es formato válido, establecer como null
          datosParaGuardar.hora_limosina = null;
        }
      }
    }

    // Buscar o crear ajustes
    let ajustes = await prisma.ajustes_evento.findUnique({
      where: { contrato_id: parseInt(contratoId) }
    });

    if (!ajustes) {
      ajustes = await prisma.ajustes_evento.create({
        data: {
          contrato_id: parseInt(contratoId),
          ...datosParaGuardar
        }
      });
    } else {
      ajustes = await prisma.ajustes_evento.update({
        where: { contrato_id: parseInt(contratoId) },
        data: {
          ...datosParaGuardar,
          fecha_actualizacion: new Date()
        }
      });
    }

    res.json({
      success: true,
      message: `Sección "${seccion}" actualizada exitosamente`,
      ajustes
    });
  } catch (error) {
    next(error);
  }
});

// ====================================
// OBTENER PORCENTAJE DE COMPLETADO
// ====================================
router.get('/contrato/:contratoId/progreso', authenticate, async (req, res, next) => {
  try {
    const { contratoId } = req.params;

    const ajustes = await prisma.ajustes_evento.findUnique({
      where: { contrato_id: parseInt(contratoId) },
      select: {
        porcentaje_completado: true,
        sabor_torta: true,
        estilo_decoracion: true,
        tipo_servicio: true,
        plato_principal: true,
        colores_principales: true,
        musica_ceremonial: true,
        primer_baile: true,
        momentos_especiales: true,
        bebidas_incluidas: true,
        tematica: true
      }
    });

    if (!ajustes) {
      return res.json({
        success: true,
        porcentaje: 0,
        campos_completados: 0,
        campos_totales: 10
      });
    }

    // Contar campos completados
    const camposImportantes = [
      ajustes.sabor_torta,
      ajustes.estilo_decoracion,
      ajustes.tipo_servicio,
      ajustes.plato_principal,
      ajustes.colores_principales,
      ajustes.musica_ceremonial,
      ajustes.primer_baile,
      ajustes.momentos_especiales,
      ajustes.bebidas_incluidas,
      ajustes.tematica
    ];

    const completados = camposImportantes.filter(campo => campo !== null && campo !== '').length;

    res.json({
      success: true,
      porcentaje: ajustes.porcentaje_completado,
      campos_completados: completados,
      campos_totales: 10
    });
  } catch (error) {
    next(error);
  }
});

// ====================================
// ELIMINAR AJUSTES (RESETEAR)
// ====================================
router.delete('/contrato/:contratoId', authenticate, async (req, res, next) => {
  try {
    const { contratoId } = req.params;

    const ajustes = await prisma.ajustes_evento.findUnique({
      where: { contrato_id: parseInt(contratoId) }
    });

    if (!ajustes) {
      return res.status(404).json({
        success: false,
        message: 'No hay ajustes para este contrato'
      });
    }

    await prisma.ajustes_evento.delete({
      where: { contrato_id: parseInt(contratoId) }
    });

    res.json({
      success: true,
      message: 'Ajustes eliminados exitosamente'
    });
  } catch (error) {
    next(error);
  }
});

// ====================================
// DESCARGAR PDF DE AJUSTES DEL EVENTO
// ====================================
router.get('/contrato/:contratoId/pdf', authenticate, async (req, res, next) => {
  try {
    const { contratoId } = req.params;

    // Obtener contrato con relaciones
    const contrato = await prisma.contratos.findUnique({
      where: { id: parseInt(contratoId) },
      include: {
        clientes: true,
        vendedores: {
          select: {
            id: true,
            nombre_completo: true,
            codigo_vendedor: true
          }
        },
        salones: true,
        paquetes: {
          include: {
            paquetes_servicios: {
              include: {
                servicios: true
              }
            }
          }
        },
        contratos_servicios: {
          include: {
            servicios: true
          }
        }
      }
    });

    if (!contrato) {
      return res.status(404).json({
        success: false,
        message: 'Contrato no encontrado'
      });
    }

    // Verificar acceso
    if (req.user.tipo === 'cliente' && contrato.cliente_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'No tienes acceso a este contrato'
      });
    }

    // Obtener ajustes
    const ajustes = await prisma.ajustes_evento.findUnique({
      where: { contrato_id: parseInt(contratoId) }
    });

    if (!ajustes) {
      return res.status(404).json({
        success: false,
        message: 'No hay ajustes configurados para este evento'
      });
    }

    // Generar PDF
    const doc = generarPDFAjustesEvento(ajustes, contrato);

    // Configurar headers para descarga
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Ajustes-Evento-${contrato.codigo_contrato}.pdf`);

    // Enviar el PDF
    doc.pipe(res);
    doc.end();

  } catch (error) {
    next(error);
  }
});

module.exports = router;



