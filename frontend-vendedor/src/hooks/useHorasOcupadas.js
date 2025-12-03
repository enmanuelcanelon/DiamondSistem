/**
 * Hook personalizado para gestionar las horas ocupadas de un salón
 * Centraliza la lógica de obtención y verificación de disponibilidad
 */

import { useState, useCallback, useEffect } from 'react';
import api from '../config/api';

/**
 * Hook para obtener y verificar horas ocupadas de un salón
 * @param {string|number} salonId - ID del salón
 * @param {string} fechaEvento - Fecha del evento en formato YYYY-MM-DD
 * @returns {Object} { horasOcupadas, cargando, error, obtenerHorasOcupadas, verificarRangoOcupado }
 */
export function useHorasOcupadas(salonId, fechaEvento) {
  const [horasOcupadas, setHorasOcupadas] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Obtiene las horas ocupadas del backend
   * El backend ya maneja: deduplicación, filtrado por salón, y zona horaria correcta
   */
  const obtenerHorasOcupadas = useCallback(async (salonIdParam, fechaEventoParam) => {
    const idSalon = salonIdParam || salonId;
    const fecha = fechaEventoParam || fechaEvento;

    if (!idSalon || idSalon === 'otro' || !fecha) {
      setHorasOcupadas([]);
      return [];
    }

    try {
      setCargando(true);
      setError(null);

      const response = await api.get('/salones/horarios-ocupados', {
        params: {
          salon_id: idSalon,
          fecha_evento: fecha
        }
      });

      if (response.data.success) {
        const horasBackend = response.data.horasOcupadas || [];
        // El backend ya deduplica, filtra por salón, y calcula correctamente
        setHorasOcupadas(horasBackend);
        return horasBackend;
      }

      setHorasOcupadas([]);
      return [];
    } catch (err) {
      console.error('Error al obtener horas ocupadas:', err);
      setError(err.message || 'Error al obtener horas ocupadas');
      setHorasOcupadas([]);
      return [];
    } finally {
      setCargando(false);
    }
  }, [salonId, fechaEvento]);

  /**
   * Verifica si un rango de horas está ocupado
   * @param {string} horaInicio - Hora inicio (HH:mm)
   * @param {string} horaFin - Hora fin (HH:mm)
   * @param {Array} horasOcupadasParam - Array opcional de horas ocupadas (si no se pasa, usa el estado)
   * @returns {boolean} True si hay solapamiento
   */
  const verificarRangoOcupado = useCallback((horaInicio, horaFin, horasOcupadasParam = null) => {
    const horas = horasOcupadasParam || horasOcupadas;

    if (!horaInicio || !horaFin || !horas || horas.length === 0) {
      return false;
    }

    // Convertir horas a números (solo la hora, sin minutos para simplificar)
    const [horaInicioNum] = horaInicio.split(':').map(Number);
    let [horaFinNum] = horaFin.split(':').map(Number);

    // Si la hora de fin es menor que la de inicio, significa que cruza medianoche
    const cruzaMedianoche = horaFinNum < horaInicioNum;
    if (cruzaMedianoche) {
      horaFinNum += 24;
    }

    // Verificar si alguna hora ocupada está dentro del rango
    for (const horaOcupada of horas) {
      if (!cruzaMedianoche) {
        // Caso normal: rango no cruza medianoche
        if (horaOcupada >= horaInicioNum && horaOcupada <= horaFinNum) {
          return true; // Hay solapamiento
        }
      } else {
        // Caso: rango cruza medianoche (ej: 10 PM a 2 AM)
        if ((horaOcupada >= horaInicioNum && horaOcupada <= 23) ||
          (horaOcupada >= 0 && horaOcupada <= (horaFinNum - 24))) {
          return true; // Hay solapamiento
        }
      }
    }

    return false; // No hay solapamiento
  }, [horasOcupadas]);

  /**
   * Obtiene las horas disponibles (no ocupadas)
   * @param {number} horaMinima - Hora mínima permitida (default: 10)
   * @param {number} horaMaxima - Hora máxima permitida (default: 2 del día siguiente)
   * @returns {Array} Array de horas disponibles
   */
  const obtenerHorasDisponibles = useCallback((horaMinima = 10, horaMaxima = 26) => {
    const horasDisponibles = [];

    for (let h = horaMinima; h < horaMaxima; h++) {
      const horaActual = h >= 24 ? h - 24 : h; // Ajustar si cruza medianoche
      if (!horasOcupadas.includes(horaActual)) {
        horasDisponibles.push(horaActual);
      }
    }

    return horasDisponibles;
  }, [horasOcupadas]);

  /**
   * Auto-fetch cuando cambian las dependencias
   */
  useEffect(() => {
    if (salonId && salonId !== 'otro' && fechaEvento) {
      obtenerHorasOcupadas();
    }
  }, [salonId, fechaEvento, obtenerHorasOcupadas]);

  return {
    horasOcupadas,
    cargando,
    error,
    obtenerHorasOcupadas,
    verificarRangoOcupado,
    obtenerHorasDisponibles,
    // Helpers
    hayHorasOcupadas: horasOcupadas.length > 0,
    cantidadHorasOcupadas: horasOcupadas.length
  };
}

