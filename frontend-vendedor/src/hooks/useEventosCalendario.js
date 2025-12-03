/**
 * Hook personalizado para manejo de eventos del calendario
 * Centraliza la lógica de obtención, filtrado y deduplicación de eventos
 */

import { useQuery } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import api from '../config/api';
import {
  deduplicarEventos,
  filtrarEventosPorSalon,
  filtrarEventosPasados
} from '../utils/calendarioHelpers';

/**
 * Hook para obtener y gestionar eventos del calendario
 * @param {number} mes - Mes del calendario (1-12)
 * @param {number} año - Año del calendario
 * @param {string|number} salonId - ID del salón seleccionado
 * @param {Object} filtrosSalones - Filtros activos {doral, kendall, diamond, otros}
 * @param {boolean} enabled - Si el query debe estar habilitado
 * @returns {Object} { eventosCalendario, isLoading, obtenerEventosDelDia }
 */
export function useEventosCalendario(mes, año, salonId, filtrosSalones, enabled = true) {
  // Query para obtener eventos del calendario
  const { data: eventosCalendario, isLoading } = useQuery({
    queryKey: ['calendario-ofertas', mes, año, salonId],
    queryFn: async () => {
      const response = await api.get(`/google-calendar/eventos/todos-vendedores/${mes}/${año}`);
      return response.data;
    },
    enabled: enabled && !!salonId && salonId !== '',
    staleTime: 5 * 60 * 1000, // 5 minutos - los eventos del calendario pueden cambiar
    refetchInterval: false, // Sin refresco automático - solo cuando cambia el mes/año
    refetchOnWindowFocus: false, // No refetch al cambiar de pestaña
  });

  /**
   * Obtiene eventos de un día específico con todos los filtros aplicados
   * @param {number} dia - Día del mes (1-31)
   * @returns {Array} Array de eventos filtrados y deduplicados
   */
  const obtenerEventosDelDia = useCallback((dia) => {
    if (!eventosCalendario?.eventos_por_dia) {
      return [];
    }

    let eventos = eventosCalendario.eventos_por_dia[dia] || [];

    // 1. Solo mostrar eventos de Google Calendar
    // NO mostrar contratos ni ofertas de la base de datos porque tienen bugs
    eventos = eventos.filter(evento => {
      return evento.es_google_calendar === true || 
             evento.calendario === 'principal' || 
             evento.calendario === 'citas';
    });

    // 2. Deduplicar eventos por ID
    // El backend ya deduplica, pero aplicamos una capa adicional de seguridad
    eventos = deduplicarEventos(eventos);

    // 3. Filtrar eventos pasados
    eventos = filtrarEventosPasados(eventos);

    // 4. Filtrar por salones activos
    if (filtrosSalones) {
      eventos = filtrarEventosPorSalon(eventos, filtrosSalones);
    }

    return eventos;
  }, [eventosCalendario, filtrosSalones]);

  /**
   * Estadísticas de eventos del mes
   */
  const estadisticas = useMemo(() => {
    if (!eventosCalendario?.eventos_por_dia) {
      return {
        totalEventos: 0,
        diasConEventos: 0,
        eventosPorTipo: {}
      };
    }

    const dias = Object.keys(eventosCalendario.eventos_por_dia);
    let totalEventos = 0;
    const eventosPorTipo = {};

    dias.forEach(dia => {
      const eventosDelDia = obtenerEventosDelDia(parseInt(dia, 10));
      totalEventos += eventosDelDia.length;

      eventosDelDia.forEach(evento => {
        const tipo = evento.calendario || 'desconocido';
        eventosPorTipo[tipo] = (eventosPorTipo[tipo] || 0) + 1;
      });
    });

    return {
      totalEventos,
      diasConEventos: dias.length,
      eventosPorTipo
    };
  }, [eventosCalendario, obtenerEventosDelDia]);

  return {
    eventosCalendario,
    isLoading,
    obtenerEventosDelDia,
    estadisticas
  };
}

