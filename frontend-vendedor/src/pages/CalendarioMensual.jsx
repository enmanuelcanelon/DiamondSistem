import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  Loader2,
  MapPin,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Users,
  User,
  Phone,
  Mail,
  ExternalLink,
  DollarSign,
  RefreshCw
} from 'lucide-react';
import api from '../config/api';
import useAuthStore from '../store/useAuthStore';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '../components/ui/dialog';
import { Separator } from '../components/ui/separator';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../components/ui/select';
import { formatearHora, calcularDuracion, formatearMoneda, calcularHoraFinConExtras, obtenerHorasAdicionales } from '../utils/formatters';

function CalendarioMensual() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const fechaActual = new Date();
  const [mesSeleccionado, setMesSeleccionado] = useState(fechaActual.getMonth() + 1);
  const [añoSeleccionado, setAñoSeleccionado] = useState(fechaActual.getFullYear());
  const [diaSeleccionado, setDiaSeleccionado] = useState(null);
  const [vista, setVista] = useState('mes'); // mes, semana, dia
  const [eventoSeleccionado, setEventoSeleccionado] = useState(null);
  const [mostrarModalEvento, setMostrarModalEvento] = useState(false);
  const [semanaSeleccionada, setSemanaSeleccionada] = useState(0); // 0 = semana actual
  const [filtrosSalones, setFiltrosSalones] = useState({
    doral: true,
    kendall: true,
    diamond: true,
    otros: true
  });
  const [tipoCalendario, setTipoCalendario] = useState('vendedor'); // 'general', 'vendedor', 'leads' - 'general' oculto para vendedores
  const [refrescar, setRefrescar] = useState(false);

  // Obtener eventos del vendedor (solo contratos del vendedor)
  const { data: calendarioVendedor, isLoading: cargandoVendedor, refetch: refetchVendedor } = useQuery({
    queryKey: ['calendario-mensual', user?.id, mesSeleccionado, añoSeleccionado],
    queryFn: async () => {
      const response = await api.get(`/vendedores/${user.id}/calendario/mes/${mesSeleccionado}/${añoSeleccionado}`);
      return response.data;
    },
    enabled: !!user?.id && tipoCalendario === 'vendedor',
    staleTime: 2 * 60 * 1000, // 2 minutos
    refetchOnWindowFocus: false, // No refetch al cambiar de pestaña
  });

  // Obtener todos los eventos (calendario general) - COMENTADO: Movido a frontend-gerente
  // Esta funcionalidad ahora está disponible solo para gerentes
  const { data: calendarioTodos, isLoading: cargandoTodos, refetch: refetchTodos } = useQuery({
    queryKey: ['calendario-todos', mesSeleccionado, añoSeleccionado],
    queryFn: async () => {
      const response = await api.get(`/google-calendar/eventos/todos-vendedores/${mesSeleccionado}/${añoSeleccionado}`);
      return response.data;
    },
    enabled: false, // Deshabilitado para vendedores - solo disponible para gerentes
    staleTime: 5 * 60 * 1000, // 5 minutos - los eventos pueden cambiar pero no tan frecuentemente
    refetchOnWindowFocus: false, // No refetch al cambiar de pestaña (reduce carga)
    refetchInterval: false, // Sin refresco automático - solo manual con botón
    gcTime: 10 * 60 * 1000, // Mantener en caché por 10 minutos
  });

  // Obtener solo eventos de CITAS (leads)
  const { data: calendarioLeads, isLoading: cargandoLeads, refetch: refetchLeads } = useQuery({
    queryKey: ['calendario-citas', user?.id, mesSeleccionado, añoSeleccionado],
    queryFn: async () => {
      const response = await api.get(`/google-calendar/eventos/citas/${mesSeleccionado}/${añoSeleccionado}`);
      return response.data;
    },
    enabled: !!user?.id && tipoCalendario === 'leads',
    staleTime: 5 * 60 * 1000, // 5 minutos - los eventos pueden cambiar pero no tan frecuentemente
    refetchOnWindowFocus: false, // No refetch al cambiar de pestaña (reduce carga)
    refetchInterval: false, // Sin refresco automático - solo manual con botón
    gcTime: 10 * 60 * 1000, // Mantener en caché por 10 minutos
  });

  // Función para refrescar manualmente
  const handleRefrescar = async () => {
    setRefrescar(true);
    try {
      if (tipoCalendario === 'general') {
        await refetchTodos();
      } else if (tipoCalendario === 'leads') {
        await refetchLeads();
      } else {
        await refetchVendedor();
      }
      // Invalidar todas las queries relacionadas para forzar actualización
      queryClient.invalidateQueries({ queryKey: ['calendario-todos'] });
      queryClient.invalidateQueries({ queryKey: ['calendario-citas'] });
      queryClient.invalidateQueries({ queryKey: ['calendario-mensual'] });
    } finally {
      setRefrescar(false);
    }
  };

  const nombresMeses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const diasSemana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const diasSemanaCompletos = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

  const cambiarMes = (direccion) => {
    if (direccion === 'anterior') {
      if (mesSeleccionado === 1) {
        setMesSeleccionado(12);
        setAñoSeleccionado(añoSeleccionado - 1);
      } else {
        setMesSeleccionado(mesSeleccionado - 1);
      }
    } else {
      if (mesSeleccionado === 12) {
        setMesSeleccionado(1);
        setAñoSeleccionado(añoSeleccionado + 1);
      } else {
        setMesSeleccionado(mesSeleccionado + 1);
      }
    }
    setDiaSeleccionado(null);
    setSemanaSeleccionada(0);
  };

  const cambiarSemana = (direccion) => {
    setSemanaSeleccionada(prev => direccion === 'anterior' ? prev - 1 : prev + 1);
  };

  const obtenerDiasSemana = () => {
    const hoy = new Date();
    let fechaBase;

    if (vista === 'dia') {
      fechaBase = diaSeleccionado
        ? new Date(añoSeleccionado, mesSeleccionado - 1, diaSeleccionado)
        : new Date(añoSeleccionado, mesSeleccionado - 1, hoy.getDate());
    } else if (vista === 'semana') {
      fechaBase = diaSeleccionado
        ? new Date(añoSeleccionado, mesSeleccionado - 1, diaSeleccionado)
        : new Date(añoSeleccionado, mesSeleccionado - 1, hoy.getDate());
    } else {
      fechaBase = new Date(añoSeleccionado, mesSeleccionado - 1, 1);
    }

    if (vista === 'semana') {
      const diaSemana = fechaBase.getDay();
      const inicioSemana = new Date(fechaBase);
      inicioSemana.setDate(fechaBase.getDate() - diaSemana + (semanaSeleccionada * 7));

      const dias = [];
      for (let i = 0; i < 7; i++) {
        const dia = new Date(inicioSemana);
        dia.setDate(inicioSemana.getDate() + i);
        dias.push(dia);
      }
      return dias;
    } else if (vista === 'dia') {
      return [fechaBase];
    }
    return [];
  };

  const irAlMesActual = () => {
    const hoy = new Date();
    setMesSeleccionado(hoy.getMonth() + 1);
    setAñoSeleccionado(hoy.getFullYear());
    setDiaSeleccionado(hoy.getDate());
    setSemanaSeleccionada(0);
  };

  const obtenerDiasDelMes = () => {
    const primerDia = new Date(añoSeleccionado, mesSeleccionado - 1, 1);
    const ultimoDia = new Date(añoSeleccionado, mesSeleccionado, 0);
    const diasEnMes = ultimoDia.getDate();
    const diaInicioSemana = primerDia.getDay();
    return { diasEnMes, diaInicioSemana };
  };

  const obtenerEventosDelDia = (dia) => {
    let eventosPorDia = {};

    // Obtener eventos según el tipo de calendario seleccionado
    if (tipoCalendario === 'general') {
      eventosPorDia = calendarioTodos?.eventos_por_dia || {};
    } else if (tipoCalendario === 'leads') {
      eventosPorDia = calendarioLeads?.eventos_por_dia || {};
    } else {
      // tipoCalendario === 'vendedor'
      eventosPorDia = calendarioVendedor?.eventos_por_dia || {};
    }

    const eventos = eventosPorDia[dia] || [];

    // Para el calendario vendedor, mostrar solo contratos de la base de datos
    // Para otros tipos de calendario (leads), mostrar eventos de Google Calendar
    let eventosFiltrados = eventos;
    if (tipoCalendario === 'vendedor') {
      // En calendario vendedor, mostrar solo contratos (NO Google Calendar)
      eventosFiltrados = eventos.filter(evento => {
        return !evento.es_google_calendar && evento.calendario === 'contratos';
      });
    } else {
      // Para otros calendarios (leads), mostrar solo Google Calendar
      eventosFiltrados = eventos.filter(evento => {
        return evento.es_google_calendar === true || evento.calendario === 'principal' || evento.calendario === 'citas';
      });
    }

    // Filtrar eventos según los filtros de salones activos
    return eventosFiltrados.filter(evento => {
      let nombreSalon = '';
      if (evento.salones?.nombre) {
        nombreSalon = String(evento.salones.nombre).toLowerCase();
      } else if (evento.salon) {
        nombreSalon = String(evento.salon).toLowerCase();
      } else if (evento.ubicacion) {
        nombreSalon = String(evento.ubicacion).toLowerCase();
      }

      // Normalizar el nombre del salón
      nombreSalon = nombreSalon.toLowerCase().trim().replace(/\s+/g, ' ');

      // Verificar si el evento coincide con algún filtro activo
      // PRIORIDAD: Diamond debe verificarse ANTES que Doral porque "DIAMOND AT DORAL" contiene ambas palabras
      if (nombreSalon.includes('diamond')) {
        return filtrosSalones.diamond;
      }
      // Solo clasificar como Doral si NO contiene "diamond"
      // "doral 1", "doral", "doral 2", etc. son Doral
      if (nombreSalon.includes('doral') && !nombreSalon.includes('diamond')) {
        return filtrosSalones.doral;
      }
      if (nombreSalon.includes('kendall') || nombreSalon.includes('kendal') || nombreSalon.includes('kentall')) {
        return filtrosSalones.kendall;
      }
      // Si no coincide con ningún salón específico, usar el filtro "otros"
      // También incluir eventos de CITAS (es_citas) en el filtro "otros"
      if (evento.es_citas || evento.calendario === 'citas') {
        return filtrosSalones.otros;
      }
      return filtrosSalones.otros;
    });
  };

  const obtenerColorEvento = (evento) => {
    // Colores por salón (buscar en diferentes formatos y campos)
    // Intentar obtener el nombre del salón de diferentes formas
    let nombreSalon = '';

    // Intentar múltiples formas de obtener el nombre del salón
    if (evento.salones?.nombre) {
      nombreSalon = String(evento.salones.nombre);
    } else if (evento.salon) {
      nombreSalon = String(evento.salon);
    } else if (typeof evento.salones === 'string') {
      nombreSalon = evento.salones;
    } else if (evento.ubicacion) {
      // Para eventos de Google Calendar que pueden tener ubicacion
      nombreSalon = String(evento.ubicacion);
    }

    // Normalizar a minúsculas y limpiar (remover espacios extra)
    nombreSalon = nombreSalon.toLowerCase().trim().replace(/\s+/g, ' ');

    // Naranja = Diamond (claro y visible)
    // PRIORIDAD: Diamond debe verificarse ANTES que Doral porque "DIAMOND AT DORAL" contiene ambas palabras
    // Si dice "diamond at doral" o "diamond at doral 1", es Diamond
    if (nombreSalon && nombreSalon.includes('diamond')) {
      return {
        bg: 'bg-orange-50 dark:bg-orange-900/20',
        border: 'border-l-4 border-orange-500',
        text: 'text-orange-800 dark:text-orange-200',
        dot: 'bg-orange-500'
      };
    }

    // Verde = Doral (claro y visible)
    // Solo clasificar como Doral si NO contiene "diamond"
    // "doral 1", "doral", "doral 2", etc. son Doral
    if (nombreSalon && nombreSalon.includes('doral') && !nombreSalon.includes('diamond')) {
      return {
        bg: 'bg-green-50 dark:bg-green-900/20',
        border: 'border-l-4 border-green-500',
        text: 'text-green-800 dark:text-green-200',
        dot: 'bg-green-500'
      };
    }

    // Azul = Kendall (claro y visible)
    if (nombreSalon && (nombreSalon.includes('kendall') || nombreSalon.includes('kendal') || nombreSalon.includes('kentall'))) {
      return {
        bg: 'bg-blue-50 dark:bg-blue-900/20',
        border: 'border-l-4 border-blue-500',
        text: 'text-blue-800 dark:text-blue-200',
        dot: 'bg-blue-500'
      };
    }

    // Morado = Otros (Google Calendar y otros eventos sin salón específico)
    if (evento.es_google_calendar || evento.id?.toString().startsWith('google_')) {
      return {
        bg: 'bg-purple-50 dark:bg-purple-900/20',
        border: 'border-l-4 border-purple-500',
        text: 'text-purple-800 dark:text-purple-200',
        dot: 'bg-purple-500'
      };
    }

    // Si no es uno de los salones específicos, usar estado de pago
    switch (evento.estado_pago) {
      case 'completado':
        return {
          bg: 'bg-green-100 dark:bg-green-900/30',
          border: 'border-l-4 border-green-500',
          text: 'text-green-900 dark:text-green-100',
          dot: 'bg-green-500'
        };
      case 'parcial':
        return {
          bg: 'bg-yellow-100 dark:bg-yellow-900/30',
          border: 'border-l-4 border-yellow-500',
          text: 'text-yellow-900 dark:text-yellow-100',
          dot: 'bg-yellow-500'
        };
      case 'pendiente':
        return {
          bg: 'bg-red-100 dark:bg-red-900/30',
          border: 'border-l-4 border-red-500',
          text: 'text-red-900 dark:text-red-100',
          dot: 'bg-red-500'
        };
      default:
        // Morado = Otros (eventos sin salón específico)
        return {
          bg: 'bg-purple-50 dark:bg-purple-900/20',
          border: 'border-l-4 border-purple-500',
          text: 'text-purple-800 dark:text-purple-200',
          dot: 'bg-purple-500'
        };
    }
  };

  const renderizarCalendario = () => {
    const { diasEnMes, diaInicioSemana } = obtenerDiasDelMes();
    const eventosPorDia = calendarioVendedor?.eventos_por_dia || {};
    const eventosTodosPorDia = calendarioTodos?.eventos_por_dia || {};
    const dias = [];

    // Días vacíos al inicio
    for (let i = 0; i < diaInicioSemana; i++) {
      dias.push(
        <div key={`empty-${i}`} className="min-h-[120px] border-r border-b border-gray-200 dark:border-gray-800"></div>
      );
    }

    // Días del mes
    for (let dia = 1; dia <= diasEnMes; dia++) {
      const eventosDelDia = obtenerEventosDelDia(dia, false);
      const eventosTodosDelDia = obtenerEventosDelDia(dia, true);
      const esHoy = dia === fechaActual.getDate() &&
        mesSeleccionado === fechaActual.getMonth() + 1 &&
        añoSeleccionado === fechaActual.getFullYear();
      const estaSeleccionado = diaSeleccionado === dia;

      dias.push(
        <div
          key={dia}
          onClick={() => setDiaSeleccionado(dia === diaSeleccionado ? null : dia)}
          className={`
            min-h-[120px] border-r border-b border-gray-200 dark:border-gray-800 p-1
            transition-colors cursor-pointer
            ${estaSeleccionado
              ? 'bg-blue-50 dark:bg-blue-950/20'
              : esHoy
                ? 'bg-blue-50/50 dark:bg-blue-950/10'
                : 'hover:bg-gray-50 dark:hover:bg-gray-900/50'
            }
          `}
        >
          {/* Número del día */}
          <div className={`
            text-sm font-medium mb-1 px-1
            ${esHoy
              ? 'text-blue-600 dark:text-blue-400 font-bold'
              : estaSeleccionado
                ? 'text-blue-600 dark:text-blue-400'
                : 'text-gray-700 dark:text-gray-300'
            }
          `}>
            {dia}
          </div>

          {/* Eventos */}
          <div className="space-y-0.5">
            {eventosDelDia.slice(0, 3).map((evento, index) => {
              const color = obtenerColorEvento(evento);
              return (
                <div
                  key={evento.id || index}
                  onClick={(e) => {
                    e.stopPropagation();
                    setEventoSeleccionado(evento);
                    setMostrarModalEvento(true);
                  }}
                  className={`
                    ${color.bg} ${color.border} ${color.text}
                    text-xs px-2 py-0.5 rounded-r cursor-pointer
                    hover:opacity-80 transition-opacity truncate
                  `}
                  title={`${evento.clientes?.nombre_completo || evento.titulo || evento.summary || 'Evento'}${evento.es_todo_el_dia ? ' - Todo el día' : ` - ${formatearHora(evento.hora_inicio)}`} - ${evento.salones?.nombre || evento.salon || evento.ubicacion || 'Sin salón'}`}
                >
                  <div className="flex items-center gap-1">
                    <div className={`w-1.5 h-1.5 rounded-full ${color.dot} flex-shrink-0`} />
                    <span className="truncate">
                      {(() => {
                        // Calcular horas adicionales y hora fin con extras
                        const horasAdicionales = evento.horas_adicionales || obtenerHorasAdicionales(evento.contratos_servicios || []);
                        const horaFinConExtras = calcularHoraFinConExtras(evento.hora_fin, horasAdicionales);
                        const tipoEvento = evento.tipo_evento_contrato || evento.ofertas?.tipo_evento || evento.clientes?.tipo_evento;
                        return (
                          <>
                            {evento.es_todo_el_dia ? '📅 Todo el día: ' : `${formatearHora(evento.hora_inicio)} `}
                            {evento.clientes?.nombre_completo || evento.titulo || evento.summary || 'Evento'}
                            {tipoEvento && (
                              <span className="text-xs opacity-75 ml-1">({tipoEvento})</span>
                            )}
                          </>
                        );
                      })()}
                    </span>
                  </div>
                </div>
              );
            })}

            {/* Indicador de más eventos */}
            {eventosDelDia.length > 3 && (
              <div className="text-xs text-gray-500 dark:text-gray-400 px-2 py-0.5">
                +{eventosDelDia.length - 3} más
              </div>
            )}

            {/* Indicador de eventos de otros vendedores */}
            {eventosTodosDelDia.length > eventosDelDia.length && (
              <div className="text-xs text-blue-500 dark:text-blue-400 px-2 py-0.5 flex items-center gap-1">
                <Users className="w-3 h-3" />
                <span>{eventosTodosDelDia.length - eventosDelDia.length} otro(s)</span>
              </div>
            )}
          </div>
        </div>
      );
    }

    return dias;
  };

  const eventosDiaSeleccionado = diaSeleccionado ? obtenerEventosDelDia(diaSeleccionado) : [];

  const isLoading = tipoCalendario === 'general' ? cargandoTodos :
    tipoCalendario === 'leads' ? cargandoLeads :
      cargandoVendedor;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Cargando calendario...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 h-screen flex flex-col bg-white dark:bg-gray-950">
      {/* Header estilo Google Calendar */}
      <div className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-4 md:px-6 py-3 md:py-4">
        <div className="flex flex-col gap-3 md:gap-0 md:flex-row md:items-center md:justify-between">
          {/* Logo y título */}
          <div className="flex items-center justify-between md:justify-start gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-6 h-6 md:w-8 md:h-8 text-blue-600 dark:text-blue-400" />
              <h1 className="text-xl md:text-2xl font-normal text-gray-900 dark:text-gray-100">Calendario</h1>
            </div>
            <div className="text-sm md:text-base text-gray-500 dark:text-gray-400 md:ml-0">
              {nombresMeses[mesSeleccionado - 1]} {añoSeleccionado}
            </div>
          </div>

          {/* Controles - Responsive */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            {/* Fila 1: Selector de calendario y refrescar */}
            <div className="flex items-center gap-2">
              {/* Selector de tipo de calendario */}
              <Select value={tipoCalendario} onValueChange={setTipoCalendario}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue>
                    {tipoCalendario === 'general' ? '📅 General' :
                      tipoCalendario === 'leads' ? '📋 Leads (CITAS)' :
                        '👤 Vendedor'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="vendedor">👤 Calendario Vendedor</SelectItem>
                  <SelectItem value="leads">📋 Calendario Leads (CITAS)</SelectItem>
                </SelectContent>
              </Select>

              {/* Botón de refrescar */}
              <Button
                variant="outline"
                size="icon"
                onClick={handleRefrescar}
                disabled={refrescar}
                className="h-9 w-9 flex-shrink-0"
                title="Refrescar eventos de Google Calendar"
              >
                <RefreshCw className={`h-4 w-4 ${refrescar ? 'animate-spin' : ''}`} />
              </Button>
            </div>

            {/* Fila 2: Navegación y vista */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={irAlMesActual}
                className="text-sm flex-shrink-0"
              >
                Hoy
              </Button>

              <div className="flex items-center border border-gray-300 dark:border-gray-700 rounded">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-none rounded-l"
                  onClick={() => {
                    if (vista === 'semana') {
                      cambiarSemana('anterior');
                    } else if (vista === 'dia') {
                      const nuevoDia = new Date(añoSeleccionado, mesSeleccionado - 1, diaSeleccionado || fechaActual.getDate());
                      nuevoDia.setDate(nuevoDia.getDate() - 1);
                      setMesSeleccionado(nuevoDia.getMonth() + 1);
                      setAñoSeleccionado(nuevoDia.getFullYear());
                      setDiaSeleccionado(nuevoDia.getDate());
                    } else {
                      cambiarMes('anterior');
                    }
                  }}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-none rounded-r"
                  onClick={() => {
                    if (vista === 'semana') {
                      cambiarSemana('siguiente');
                    } else if (vista === 'dia') {
                      const nuevoDia = new Date(añoSeleccionado, mesSeleccionado - 1, diaSeleccionado || fechaActual.getDate());
                      nuevoDia.setDate(nuevoDia.getDate() + 1);
                      setMesSeleccionado(nuevoDia.getMonth() + 1);
                      setAñoSeleccionado(nuevoDia.getFullYear());
                      setDiaSeleccionado(nuevoDia.getDate());
                    } else {
                      cambiarMes('siguiente');
                    }
                  }}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex items-center gap-1 border border-gray-300 dark:border-gray-700 rounded overflow-hidden">
                <Button
                  variant={vista === 'mes' ? 'default' : 'ghost'}
                  size="sm"
                  className="rounded-none border-0 text-xs sm:text-sm px-2 sm:px-3"
                  onClick={() => {
                    setVista('mes');
                    setDiaSeleccionado(null);
                  }}
                >
                  Mes
                </Button>
                <Button
                  variant={vista === 'semana' ? 'default' : 'ghost'}
                  size="sm"
                  className="rounded-none border-0 text-xs sm:text-sm px-2 sm:px-3 hidden sm:inline-flex"
                  onClick={() => {
                    setVista('semana');
                    setSemanaSeleccionada(0);
                    if (!diaSeleccionado) {
                      setDiaSeleccionado(fechaActual.getDate());
                    }
                  }}
                >
                  Semana
                </Button>
                <Button
                  variant={vista === 'dia' ? 'default' : 'ghost'}
                  size="sm"
                  className="rounded-none border-0 text-xs sm:text-sm px-2 sm:px-3"
                  onClick={() => {
                    setVista('dia');
                    if (!diaSeleccionado) {
                      setDiaSeleccionado(fechaActual.getDate());
                    }
                  }}
                >
                  Día
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          {/* Filtros móviles - Solo visible en móvil */}
          <div className="md:hidden border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-3">
            <h3 className="text-xs font-semibold text-gray-900 dark:text-gray-100 mb-2">Filtros por Salón</h3>
            <div className="flex flex-wrap gap-2">
              <label className="flex items-center gap-1.5 cursor-pointer bg-gray-50 dark:bg-gray-900/50 px-2 py-1.5 rounded text-xs">
                <input
                  type="checkbox"
                  checked={filtrosSalones.doral}
                  onChange={(e) => setFiltrosSalones(prev => ({ ...prev, doral: e.target.checked }))}
                  className="w-3.5 h-3.5 rounded border-gray-300 text-green-600 focus:ring-green-500"
                />
                <div className="w-2.5 h-2.5 rounded-full bg-green-500 flex-shrink-0" />
                <span className="text-gray-700 dark:text-gray-300">Doral</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer bg-gray-50 dark:bg-gray-900/50 px-2 py-1.5 rounded text-xs">
                <input
                  type="checkbox"
                  checked={filtrosSalones.kendall}
                  onChange={(e) => setFiltrosSalones(prev => ({ ...prev, kendall: e.target.checked }))}
                  className="w-3.5 h-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <div className="w-2.5 h-2.5 rounded-full bg-blue-500 flex-shrink-0" />
                <span className="text-gray-700 dark:text-gray-300">Kendall</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer bg-gray-50 dark:bg-gray-900/50 px-2 py-1.5 rounded text-xs">
                <input
                  type="checkbox"
                  checked={filtrosSalones.diamond}
                  onChange={(e) => setFiltrosSalones(prev => ({ ...prev, diamond: e.target.checked }))}
                  className="w-3.5 h-3.5 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                />
                <div className="w-2.5 h-2.5 rounded-full bg-orange-500 flex-shrink-0" />
                <span className="text-gray-700 dark:text-gray-300">Diamond</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer bg-gray-50 dark:bg-gray-900/50 px-2 py-1.5 rounded text-xs">
                <input
                  type="checkbox"
                  checked={filtrosSalones.otros}
                  onChange={(e) => setFiltrosSalones(prev => ({ ...prev, otros: e.target.checked }))}
                  className="w-3.5 h-3.5 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                <div className="w-2.5 h-2.5 rounded-full bg-purple-500 flex-shrink-0" />
                <span className="text-gray-700 dark:text-gray-300">Otros</span>
              </label>
            </div>
          </div>

          {/* Calendario principal */}
          <div className="flex-1 overflow-auto">
            {vista === 'mes' && (
              <>
                {/* Días de la semana */}
                <div className="sticky top-0 z-10 bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800">
                  <div className="grid grid-cols-7">
                    {diasSemana.map((dia, index) => (
                      <div
                        key={dia}
                        className={`
                        p-2 text-xs font-medium text-center
                        ${index === 0 || index === 6
                            ? 'text-gray-500 dark:text-gray-400'
                            : 'text-gray-700 dark:text-gray-300'
                          }
                      `}
                      >
                        {dia}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Grid del calendario mensual */}
                <div className="grid grid-cols-7">
                  {renderizarCalendario()}
                </div>
              </>
            )}

            {vista === 'semana' && (() => {
              const diasSemanaActual = obtenerDiasSemana();
              return (
                <>
                  <div className="sticky top-0 z-10 bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800">
                    <div className="grid grid-cols-7">
                      {diasSemana.map((dia, index) => (
                        <div
                          key={dia}
                          className={`
                          p-2 text-xs font-medium text-center
                          ${index === 0 || index === 6
                              ? 'text-gray-500 dark:text-gray-400'
                              : 'text-gray-700 dark:text-gray-300'
                            }
                        `}
                        >
                          {dia}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-7 h-full">
                    {diasSemanaActual.map((dia, index) => {
                      const diaNum = dia.getDate();
                      const mesDia = dia.getMonth() + 1;
                      const añoDia = dia.getFullYear();

                      // Obtener eventos del día correcto (puede ser de otro mes)
                      let eventosDelDia = [];
                      if (mesDia === mesSeleccionado && añoDia === añoSeleccionado) {
                        eventosDelDia = obtenerEventosDelDia(diaNum, false);
                      } else {
                        // Si el día es de otro mes, necesitamos obtener los eventos de ese mes
                        // Por ahora, dejamos vacío - se puede mejorar después
                        eventosDelDia = [];
                      }

                      const esHoy = diaNum === fechaActual.getDate() &&
                        mesDia === fechaActual.getMonth() + 1 &&
                        añoDia === fechaActual.getFullYear();
                      const estaSeleccionado = diaSeleccionado === diaNum && mesDia === mesSeleccionado;

                      return (
                        <div
                          key={index}
                          onClick={() => setDiaSeleccionado(diaNum === diaSeleccionado ? null : diaNum)}
                          className={`
                          border-r border-b border-gray-200 dark:border-gray-800 p-2
                          transition-colors cursor-pointer min-h-[600px]
                          ${estaSeleccionado
                              ? 'bg-blue-50 dark:bg-blue-950/20'
                              : esHoy
                                ? 'bg-blue-50/50 dark:bg-blue-950/10'
                                : 'hover:bg-gray-50 dark:hover:bg-gray-900/50'
                            }
                        `}
                        >
                          <div className={`
                          text-sm font-medium mb-2
                          ${esHoy
                              ? 'text-blue-600 dark:text-blue-400 font-bold'
                              : estaSeleccionado
                                ? 'text-blue-600 dark:text-blue-400'
                                : 'text-gray-700 dark:text-gray-300'
                            }
                        `}>
                            {diaNum} {nombresMeses[mesDia - 1]}
                          </div>
                          <div className="space-y-1">
                            {eventosDelDia.map((evento, idx) => {
                              const color = obtenerColorEvento(evento);
                              return (
                                <div
                                  key={evento.id || idx}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEventoSeleccionado(evento);
                                    setMostrarModalEvento(true);
                                  }}
                                  className={`
                                  ${color.bg} ${color.border} ${color.text}
                                  text-xs px-2 py-1 rounded-r cursor-pointer
                                  hover:opacity-80 transition-opacity
                                `}
                                >
                                  <div className="flex items-center gap-1">
                                    <div className={`w-1.5 h-1.5 rounded-full ${color.dot} flex-shrink-0`} />
                                    <span className="truncate">
                                      {(() => {
                                        // Calcular horas adicionales y hora fin con extras
                                        const horasAdicionales = evento.horas_adicionales || obtenerHorasAdicionales(evento.contratos_servicios || []);
                                        const horaFinConExtras = calcularHoraFinConExtras(evento.hora_fin, horasAdicionales);
                                        const tipoEvento = evento.tipo_evento_contrato || evento.ofertas?.tipo_evento || evento.clientes?.tipo_evento;
                                        return (
                                          <>
                                            {evento.es_todo_el_dia ? '📅 Todo el día: ' : `${formatearHora(evento.hora_inicio)} `}
                                            {evento.clientes?.nombre_completo || evento.titulo || evento.summary || 'Evento'}
                                            {tipoEvento && (
                                              <span className="text-xs opacity-75 ml-1">({tipoEvento})</span>
                                            )}
                                          </>
                                        );
                                      })()}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              );
            })()}

            {vista === 'dia' && (() => {
              const diaActual = obtenerDiasSemana()[0];
              const diaNum = diaActual.getDate();
              const eventosDelDia = obtenerEventosDelDia(diaNum, false);
              const esHoy = diaNum === fechaActual.getDate() &&
                mesSeleccionado === fechaActual.getMonth() + 1 &&
                añoSeleccionado === fechaActual.getFullYear();

              return (
                <div className="p-6">
                  <div className="mb-6">
                    <h2 className="text-2xl font-medium text-gray-900 dark:text-gray-100 mb-2">
                      {diasSemanaCompletos[diaActual.getDay()]}, {diaNum} de {nombresMeses[mesSeleccionado - 1]} {añoSeleccionado}
                    </h2>
                    {esHoy && (
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-900/30 dark:text-blue-300">
                        Hoy
                      </Badge>
                    )}
                  </div>
                  <div className="space-y-3">
                    {eventosDelDia.length > 0 ? (
                      eventosDelDia.map((evento, index) => {
                        const color = obtenerColorEvento(evento);
                        // Calcular horas adicionales y hora fin con extras (igual que en contratos)
                        const horasAdicionales = evento.horas_adicionales || obtenerHorasAdicionales(evento.contratos_servicios || []);
                        const horaFinConExtras = calcularHoraFinConExtras(evento.hora_fin, horasAdicionales);
                        const duracion = calcularDuracion(evento.hora_inicio, horaFinConExtras);
                        // Usar tipo_evento de la oferta si está disponible, sino del cliente
                        const tipoEvento = evento.tipo_evento_contrato || evento.ofertas?.tipo_evento || evento.clientes?.tipo_evento;
                        return (
                          <div
                            key={evento.id || index}
                            onClick={() => {
                              setEventoSeleccionado(evento);
                              setMostrarModalEvento(true);
                            }}
                            className={`
                            ${color.bg} ${color.border} ${color.text}
                            rounded-r-lg p-4 cursor-pointer hover:shadow-md transition-all
                          `}
                          >
                            <div className="flex items-start gap-3">
                              <div className={`w-3 h-3 rounded-full ${color.dot} mt-1 flex-shrink-0`} />
                              <div className="flex-1">
                                <div className="font-semibold text-base mb-2">
                                  {evento.clientes?.nombre_completo || evento.summary || 'Evento'}
                                  {tipoEvento && (
                                    <span className="text-sm font-normal text-gray-600 dark:text-gray-400 ml-2 capitalize">({tipoEvento})</span>
                                  )}
                                </div>
                                <div className="space-y-1 text-sm">
                                  {evento.es_todo_el_dia ? (
                                    <div className="flex items-center gap-2">
                                      <Clock className="w-4 h-4" />
                                      <span className="font-medium">Todo el día</span>
                                    </div>
                                  ) : evento.hora_inicio && (
                                    <div className="flex items-center gap-2">
                                      <Clock className="w-4 h-4" />
                                      <span>
                                        {formatearHora(evento.hora_inicio)}
                                        {horaFinConExtras && ` - ${formatearHora(horaFinConExtras)}`}
                                        {duracion > 0 && ` (${Math.round(duracion * 10) / 10}h)`}
                                      </span>
                                    </div>
                                  )}
                                  {evento.salones?.nombre && (
                                    <div className="flex items-center gap-2">
                                      <MapPin className="w-4 h-4" />
                                      <span>{evento.salones.nombre}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                        <Calendar className="w-16 h-16 mx-auto mb-4 opacity-50" />
                        <p className="text-lg font-medium">No hay eventos programados</p>
                        <p className="text-sm mt-2">Este día está libre</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>

        </div>

        {/* Sidebar derecho - Oculto en móvil */}
        <div className="hidden md:flex md:w-64 lg:w-80 border-l border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 overflow-y-auto flex-col h-full">
          {/* Leyenda y Filtros */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-800">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Filtros por Salón</h3>

            {/* Filtros */}
            <div className="space-y-2 mb-4">
              <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900/50 p-2 rounded">
                <input
                  type="checkbox"
                  checked={filtrosSalones.doral}
                  onChange={(e) => setFiltrosSalones(prev => ({ ...prev, doral: e.target.checked }))}
                  className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                />
                <div className="flex items-center gap-2 flex-1">
                  <div className="w-3 h-3 rounded-full bg-green-500 flex-shrink-0" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Doral</span>
                </div>
              </label>

              <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900/50 p-2 rounded">
                <input
                  type="checkbox"
                  checked={filtrosSalones.kendall}
                  onChange={(e) => setFiltrosSalones(prev => ({ ...prev, kendall: e.target.checked }))}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <div className="flex items-center gap-2 flex-1">
                  <div className="w-3 h-3 rounded-full bg-blue-500 flex-shrink-0" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Kendall</span>
                </div>
              </label>

              <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900/50 p-2 rounded">
                <input
                  type="checkbox"
                  checked={filtrosSalones.diamond}
                  onChange={(e) => setFiltrosSalones(prev => ({ ...prev, diamond: e.target.checked }))}
                  className="w-4 h-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                />
                <div className="flex items-center gap-2 flex-1">
                  <div className="w-3 h-3 rounded-full bg-orange-500 flex-shrink-0" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Diamond</span>
                </div>
              </label>

              <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900/50 p-2 rounded">
                <input
                  type="checkbox"
                  checked={filtrosSalones.otros}
                  onChange={(e) => setFiltrosSalones(prev => ({ ...prev, otros: e.target.checked }))}
                  className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                <div className="flex items-center gap-2 flex-1">
                  <div className="w-3 h-3 rounded-full bg-purple-500 flex-shrink-0" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Otros / Google Calendar</span>
                </div>
              </label>
            </div>
          </div>

          {/* Mini Calendario */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-800">
            <div className="mb-3">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {nombresMeses[mesSeleccionado - 1]} {añoSeleccionado}
                </h3>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => cambiarMes('anterior')}
                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
                    title="Mes anterior"
                  >
                    <ChevronLeft className="h-3 w-3 text-gray-600 dark:text-gray-400" />
                  </button>
                  <button
                    onClick={() => cambiarMes('siguiente')}
                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
                    title="Mes siguiente"
                  >
                    <ChevronRight className="h-3 w-3 text-gray-600 dark:text-gray-400" />
                  </button>
                </div>
              </div>
            </div>

            {/* Días de la semana */}
            <div className="grid grid-cols-7 gap-1 mb-1">
              {diasSemana.map((dia) => (
                <div
                  key={dia}
                  className="text-xs font-medium text-center text-gray-500 dark:text-gray-400 py-1"
                >
                  {dia.charAt(0)}
                </div>
              ))}
            </div>

            {/* Grid del calendario */}
            <div className="grid grid-cols-7 gap-1">
              {(() => {
                const { diasEnMes, diaInicioSemana } = obtenerDiasDelMes();
                const dias = [];

                // Días vacíos al inicio
                for (let i = 0; i < diaInicioSemana; i++) {
                  dias.push(
                    <div key={`empty-${i}`} className="aspect-square"></div>
                  );
                }

                // Días del mes
                for (let dia = 1; dia <= diasEnMes; dia++) {
                  const esHoy = dia === fechaActual.getDate() &&
                    mesSeleccionado === fechaActual.getMonth() + 1 &&
                    añoSeleccionado === fechaActual.getFullYear();
                  const estaSeleccionado = diaSeleccionado === dia;
                  const tieneEventos = obtenerEventosDelDia(dia, false).length > 0;

                  dias.push(
                    <button
                      key={dia}
                      onClick={() => {
                        setDiaSeleccionado(dia === diaSeleccionado ? null : dia);
                        setVista('dia');
                      }}
                      className={`
                        aspect-square text-xs font-medium rounded transition-colors
                        flex items-center justify-center relative
                        ${estaSeleccionado
                          ? 'bg-blue-600 text-white'
                          : esHoy
                            ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-semibold'
                            : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                        }
                      `}
                    >
                      {dia}
                      {tieneEventos && !estaSeleccionado && (
                        <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 rounded-full bg-blue-500"></div>
                      )}
                    </button>
                  );
                }

                return dias;
              })()}
            </div>
          </div>

          {/* Panel de eventos del día */}
          <div className="flex-1 overflow-y-auto">
            {diaSeleccionado ? (
              <div className="p-4">
                <div className="mb-4">
                  <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-1">
                    {diasSemanaCompletos[new Date(añoSeleccionado, mesSeleccionado - 1, diaSeleccionado).getDay()]}
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {diaSeleccionado} de {nombresMeses[mesSeleccionado - 1]} {añoSeleccionado}
                  </p>
                </div>

                {/* Mis eventos */}
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Mis Eventos ({eventosDiaSeleccionado.length})
                  </h3>
                  <div className="space-y-2">
                    {eventosDiaSeleccionado.length > 0 ? (
                      eventosDiaSeleccionado.map((evento, index) => {
                        const color = obtenerColorEvento(evento);
                        // Calcular horas adicionales y hora fin con extras (igual que en contratos)
                        const horasAdicionales = evento.horas_adicionales || obtenerHorasAdicionales(evento.contratos_servicios || []);
                        const horaFinConExtras = calcularHoraFinConExtras(evento.hora_fin, horasAdicionales);
                        const duracion = calcularDuracion(evento.hora_inicio, horaFinConExtras);
                        // Usar tipo_evento de la oferta si está disponible, sino del cliente
                        const tipoEvento = evento.tipo_evento_contrato || evento.ofertas?.tipo_evento || evento.clientes?.tipo_evento;
                        return (
                          <div
                            key={evento.id || index}
                            onClick={() => {
                              setEventoSeleccionado(evento);
                              setMostrarModalEvento(true);
                            }}
                            className={`
                              ${color.bg} ${color.border} ${color.text}
                              rounded-r-lg p-3 cursor-pointer hover:opacity-80 transition-opacity
                            `}
                          >
                            <div className="flex items-start gap-2">
                              <div className={`w-2 h-2 rounded-full ${color.dot} mt-1.5 flex-shrink-0`} />
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-sm mb-1 truncate">
                                  {evento.clientes?.nombre_completo || evento.summary || 'Evento'}
                                  {tipoEvento && (
                                    <span className="text-xs font-normal text-gray-600 dark:text-gray-400 ml-1 capitalize">({tipoEvento})</span>
                                  )}
                                </div>
                                <div className="space-y-1 text-xs opacity-90">
                                  {evento.es_todo_el_dia ? (
                                    <div className="flex items-center gap-1">
                                      <Clock className="w-3 h-3" />
                                      <span className="font-medium">Todo el día</span>
                                    </div>
                                  ) : evento.hora_inicio && (
                                    <div className="flex items-center gap-1">
                                      <Clock className="w-3 h-3" />
                                      <span>
                                        {formatearHora(evento.hora_inicio)}
                                        {horaFinConExtras && ` - ${formatearHora(horaFinConExtras)}`}
                                        {duracion > 0 && ` (${Math.round(duracion * 10) / 10}h)`}
                                      </span>
                                    </div>
                                  )}
                                  {evento.salones?.nombre && (
                                    <div className="flex items-center gap-1">
                                      <MapPin className="w-3 h-3" />
                                      <span className="truncate">{evento.salones.nombre}</span>
                                    </div>
                                  )}
                                  {!evento.es_google_calendar && evento.estado_pago && (
                                    <div className="flex items-center gap-1">
                                      {evento.estado_pago === 'completado' && <CheckCircle2 className="w-3 h-3" />}
                                      {evento.estado_pago === 'parcial' && <AlertCircle className="w-3 h-3" />}
                                      {evento.estado_pago === 'pendiente' && <XCircle className="w-3 h-3" />}
                                      <span className="capitalize">{evento.estado_pago}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                        No hay eventos programados
                      </div>
                    )}
                  </div>
                </div>

              </div>
            ) : (
              <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">Selecciona un día para ver los eventos</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de Detalles del Evento */}
      <Dialog open={mostrarModalEvento} onOpenChange={setMostrarModalEvento}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogClose />
          {eventoSeleccionado && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl flex items-center gap-3">
                  {(() => {
                    const color = obtenerColorEvento(eventoSeleccionado);
                    return (
                      <div className={`w-4 h-4 rounded-full ${color.dot}`} />
                    );
                  })()}
                  {eventoSeleccionado.clientes?.nombre_completo || eventoSeleccionado.titulo || eventoSeleccionado.summary || 'Evento'}
                </DialogTitle>
                <DialogDescription>
                  {eventoSeleccionado.es_google_calendar ? 'Evento de Google Calendar' : 'Contrato de evento'}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6 mt-4">
                {/* Información del Vendedor (para eventos de Google Calendar) */}
                {(eventoSeleccionado.vendedor_nombre || eventoSeleccionado.vendedor_codigo) && (
                  <>
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                        <User className="w-4 h-4" />
                        Vendedor
                      </h3>
                      <div className="space-y-2 pl-6">
                        {eventoSeleccionado.vendedor_nombre && (
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Nombre:</span>
                            <span className="text-sm text-gray-900 dark:text-gray-100">{eventoSeleccionado.vendedor_nombre}</span>
                          </div>
                        )}
                        {eventoSeleccionado.vendedor_codigo && (
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Código:</span>
                            <span className="text-sm text-gray-900 dark:text-gray-100 font-mono">{eventoSeleccionado.vendedor_codigo}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <Separator />
                  </>
                )}

                {/* Información del Cliente */}
                {eventoSeleccionado.clientes && (
                  <>
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                        <User className="w-4 h-4" />
                        Información del Cliente
                      </h3>
                      <div className="space-y-2 pl-6">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Nombre:</span>
                          <span className="text-sm text-gray-900 dark:text-gray-100">{eventoSeleccionado.clientes.nombre_completo}</span>
                        </div>
                        {(eventoSeleccionado.tipo_evento_contrato || eventoSeleccionado.ofertas?.tipo_evento || eventoSeleccionado.clientes?.tipo_evento) && (
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Tipo de evento:</span>
                            <span className="text-sm text-gray-900 dark:text-gray-100 capitalize">
                              {eventoSeleccionado.tipo_evento_contrato || eventoSeleccionado.ofertas?.tipo_evento || eventoSeleccionado.clientes?.tipo_evento}
                            </span>
                          </div>
                        )}
                        {eventoSeleccionado.clientes.email && (
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-900 dark:text-gray-100">{eventoSeleccionado.clientes.email}</span>
                          </div>
                        )}
                        {eventoSeleccionado.clientes.telefono && (
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-900 dark:text-gray-100">{eventoSeleccionado.clientes.telefono}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <Separator />
                  </>
                )}

                {/* Título del Evento (para Google Calendar) */}
                {eventoSeleccionado.es_google_calendar && (eventoSeleccionado.titulo || eventoSeleccionado.summary) &&
                  (eventoSeleccionado.titulo || eventoSeleccionado.summary) !== (eventoSeleccionado.clientes?.nombre_completo || '') && (
                    <>
                      <div>
                        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Título del Evento</h3>
                        <div className="pl-6">
                          <span className="text-sm text-gray-900 dark:text-gray-100 font-medium">
                            {eventoSeleccionado.titulo || eventoSeleccionado.summary}
                          </span>
                        </div>
                      </div>
                      <Separator />
                    </>
                  )}

                {/* Fecha y Hora */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Fecha y Hora
                  </h3>
                  <div className="space-y-2 pl-6">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-900 dark:text-gray-100">
                        {(() => {
                          // Para eventos de todo el día, parsear la fecha correctamente
                          const fechaStr = eventoSeleccionado.fecha_evento || eventoSeleccionado.fecha_inicio || eventoSeleccionado.hora_inicio;
                          
                          const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
                          const dias = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
                          
                          // Extraer fecha del string ISO para evitar problemas de zona horaria
                          if (typeof fechaStr === 'string' && fechaStr.includes('T')) {
                            const [datePart] = fechaStr.split('T');
                            const [year, month, day] = datePart.split('-').map(Number);
                            const fecha = new Date(year, month - 1, day);
                            return `${dias[fecha.getDay()]}, ${day} de ${meses[month - 1]} de ${year}`;
                          }
                          
                          return new Date(fechaStr).toLocaleDateString('es-ES', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            timeZone: 'America/New_York'
                          });
                        })()}
                      </span>
                    </div>
                    {eventoSeleccionado.es_todo_el_dia ? (
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-900 dark:text-gray-100 font-medium">
                          Todo el día
                        </span>
                      </div>
                    ) : (eventoSeleccionado.hora_inicio || eventoSeleccionado.fecha_inicio) && (
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-900 dark:text-gray-100">
                          {(() => {
                            // Calcular horas adicionales y hora fin con extras (igual que en contratos)
                            const horasAdicionales = eventoSeleccionado.horas_adicionales || obtenerHorasAdicionales(eventoSeleccionado.contratos_servicios || []);
                            const horaFinConExtras = calcularHoraFinConExtras(eventoSeleccionado.hora_fin || eventoSeleccionado.fecha_fin, horasAdicionales);
                            const inicio = eventoSeleccionado.hora_inicio || eventoSeleccionado.fecha_inicio;
                            const duracion = calcularDuracion(inicio, horaFinConExtras);

                            return (
                              <>
                                {formatearHora(inicio)}
                                {horaFinConExtras && ` - ${formatearHora(horaFinConExtras)}`}
                                {duracion > 0 && ` (${Math.round(duracion * 10) / 10} horas)`}
                              </>
                            );
                          })()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Ubicación */}
                {(eventoSeleccionado.salones?.nombre || eventoSeleccionado.ubicacion || eventoSeleccionado.salon || eventoSeleccionado.location) && (
                  <>
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        Ubicación
                      </h3>
                      <div className="pl-6">
                        <span className="text-sm text-gray-900 dark:text-gray-100">
                          {eventoSeleccionado.salones?.nombre || eventoSeleccionado.ubicacion || eventoSeleccionado.salon || eventoSeleccionado.location}
                        </span>
                      </div>
                    </div>
                    <Separator />
                  </>
                )}

                {/* Estado de Pago (solo para contratos) */}
                {!eventoSeleccionado.es_google_calendar && eventoSeleccionado.estado_pago && (
                  <>
                    <Separator />
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                        <DollarSign className="w-4 h-4" />
                        Estado de Pago
                      </h3>
                      <div className="pl-6">
                        <Badge
                          variant="outline"
                          className={
                            eventoSeleccionado.estado_pago === 'completado'
                              ? 'bg-green-100 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-300'
                              : eventoSeleccionado.estado_pago === 'parcial'
                                ? 'bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-300'
                                : 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900/30 dark:text-red-300'
                          }
                        >
                          {eventoSeleccionado.estado_pago === 'completado' && <CheckCircle2 className="w-3 h-3 mr-1" />}
                          {eventoSeleccionado.estado_pago === 'parcial' && <AlertCircle className="w-3 h-3 mr-1" />}
                          {eventoSeleccionado.estado_pago === 'pendiente' && <XCircle className="w-3 h-3 mr-1" />}
                          {eventoSeleccionado.estado_pago.charAt(0).toUpperCase() + eventoSeleccionado.estado_pago.slice(1)}
                        </Badge>
                      </div>
                    </div>
                  </>
                )}

                {/* Información adicional */}
                {eventoSeleccionado.cantidad_invitados && (
                  <>
                    <Separator />
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        Invitados
                      </h3>
                      <div className="pl-6">
                        <span className="text-sm text-gray-900 dark:text-gray-100">{eventoSeleccionado.cantidad_invitados} invitados</span>
                      </div>
                    </div>
                  </>
                )}

                {/* Información del Creador/Organizador (Google Calendar) */}
                {(eventoSeleccionado.creador || eventoSeleccionado.organizador) && (
                  <>
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        Creador / Organizador
                      </h3>
                      <div className="space-y-2 pl-6">
                        {eventoSeleccionado.creador && (
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Creador:</span>
                            <span className="text-sm text-gray-900 dark:text-gray-100">{eventoSeleccionado.creador}</span>
                          </div>
                        )}
                        {eventoSeleccionado.organizador && (
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Organizador:</span>
                            <span className="text-sm text-gray-900 dark:text-gray-100">{eventoSeleccionado.organizador}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <Separator />
                  </>
                )}

                {/* Estado del Evento (Google Calendar) */}
                {eventoSeleccionado.es_google_calendar && eventoSeleccionado.estado && (
                  <>
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                        Estado
                      </h3>
                      <div className="pl-6">
                        <Badge
                          variant="outline"
                          className={
                            eventoSeleccionado.estado === 'confirmed'
                              ? 'bg-green-100 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-300'
                              : eventoSeleccionado.estado === 'tentative'
                                ? 'bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-300'
                                : 'bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-900/30 dark:text-gray-300'
                          }
                        >
                          {eventoSeleccionado.estado === 'confirmed' && <CheckCircle2 className="w-3 h-3 mr-1" />}
                          {eventoSeleccionado.estado === 'tentative' && <AlertCircle className="w-3 h-3 mr-1" />}
                          {eventoSeleccionado.estado === 'confirmed' ? 'Confirmado' :
                            eventoSeleccionado.estado === 'tentative' ? 'Tentativo' :
                              eventoSeleccionado.estado === 'cancelled' ? 'Cancelado' : eventoSeleccionado.estado}
                        </Badge>
                      </div>
                    </div>
                    <Separator />
                  </>
                )}

                {/* Descripción (Google Calendar) */}
                {eventoSeleccionado.descripcion && (
                  <>
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Descripción</h3>
                      <div className="pl-6">
                        <p className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg">
                          {eventoSeleccionado.descripcion}
                        </p>
                      </div>
                    </div>
                    <Separator />
                  </>
                )}

                {/* Código de Contrato */}
                {eventoSeleccionado.codigo_contrato && (
                  <>
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Código de Contrato</h3>
                      <div className="pl-6">
                        <span className="text-sm font-mono text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-800/50 px-3 py-1.5 rounded">{eventoSeleccionado.codigo_contrato}</span>
                      </div>
                    </div>
                    <Separator />
                  </>
                )}

                {/* Tipo de Calendario */}
                {eventoSeleccionado.calendario && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Tipo de Calendario</h3>
                    <div className="pl-6">
                      <Badge variant="outline" className="bg-blue-50 text-blue-800 border-blue-300 dark:bg-blue-900/30 dark:text-blue-300">
                        {eventoSeleccionado.calendario === 'principal' ? 'Calendario Principal' :
                          eventoSeleccionado.calendario === 'citas' ? 'Calendario CITAS' :
                            eventoSeleccionado.calendario === 'contratos' ? 'Contratos' :
                              eventoSeleccionado.calendario}
                      </Badge>
                    </div>
                  </div>
                )}
              </div>

              <DialogFooter className="mt-6">
                {eventoSeleccionado.es_google_calendar && eventoSeleccionado.htmlLink && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      window.open(eventoSeleccionado.htmlLink, '_blank');
                    }}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Abrir en Google Calendar
                  </Button>
                )}
                {/* Solo mostrar botón "Ver Contrato Completo" si es un contrato real, no un lead/cita */}
                {!eventoSeleccionado.es_google_calendar &&
                  eventoSeleccionado.calendario !== 'citas' &&
                  !eventoSeleccionado.es_citas &&
                  eventoSeleccionado.id &&
                  !String(eventoSeleccionado.id).startsWith('leak_') &&
                  !String(eventoSeleccionado.id).startsWith('google_') && (
                    <Button
                      onClick={() => {
                        navigate(`/contratos/${eventoSeleccionado.id}`);
                        setMostrarModalEvento(false);
                      }}
                    >
                      Ver Contrato Completo
                    </Button>
                  )}
                <Button variant="outline" onClick={() => setMostrarModalEvento(false)}>
                  Cerrar
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default CalendarioMensual;
