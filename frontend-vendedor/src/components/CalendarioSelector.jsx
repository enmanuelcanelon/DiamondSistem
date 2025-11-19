import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Calendar, ChevronLeft, ChevronRight, Clock, X } from 'lucide-react';
import api from '../config/api';
import { Button } from './ui/button';
import { formatearHora } from '../utils/formatters';

function CalendarioSelector({ fechaSeleccionada, onFechaSeleccionada, fechaMinima }) {
  const [mesSeleccionado, setMesSeleccionado] = useState(new Date().getMonth() + 1);
  const [añoSeleccionado, setAñoSeleccionado] = useState(new Date().getFullYear());
  const [mostrarCalendario, setMostrarCalendario] = useState(false);

  // Obtener eventos de Google Calendar
  const { data: eventosGoogleCalendar } = useQuery({
    queryKey: ['google-calendar-eventos', mesSeleccionado, añoSeleccionado],
    queryFn: async () => {
      try {
        const response = await api.get(`/google-calendar/eventos/mes/${mesSeleccionado}/${añoSeleccionado}`);
        return response.data.eventos || [];
      } catch {
        return [];
      }
    },
    enabled: mostrarCalendario,
    staleTime: 5 * 60 * 1000,
  });

  const nombresMeses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const diasSemana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  const obtenerDiasDelMes = () => {
    const primerDia = new Date(añoSeleccionado, mesSeleccionado - 1, 1);
    const diasEnMes = new Date(añoSeleccionado, mesSeleccionado, 0).getDate();
    const diaInicioSemana = primerDia.getDay();
    return { diasEnMes, diaInicioSemana };
  };

  const obtenerEventosDelDia = (dia) => {
    if (!eventosGoogleCalendar?.length) return [];
    return eventosGoogleCalendar.filter(evento => {
      try {
        const fechaEvento = new Date(evento.fecha_inicio);
        return fechaEvento.getDate() === dia && 
               fechaEvento.getMonth() + 1 === mesSeleccionado &&
               fechaEvento.getFullYear() === añoSeleccionado;
      } catch {
        return false;
      }
    });
  };

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
  };

  const formatearFechaParaInput = (dia) => {
    // Usar directamente los valores sin crear Date para evitar problemas de zona horaria
    // Formato: YYYY-MM-DD
    return `${añoSeleccionado}-${String(mesSeleccionado).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
  };

  const esFechaValida = (dia) => {
    const fecha = new Date(añoSeleccionado, mesSeleccionado - 1, dia);
    const hoy = fechaMinima ? new Date(fechaMinima) : new Date();
    hoy.setHours(0, 0, 0, 0);
    fecha.setHours(0, 0, 0, 0);
    return fecha >= hoy;
  };

  const esFechaSeleccionada = (dia) => {
    if (!fechaSeleccionada) return false;
    // Parsear la fecha directamente del string YYYY-MM-DD para evitar problemas de zona horaria
    const fechaStr = fechaSeleccionada.split('T')[0]; // Si viene con hora, tomar solo la fecha
    const [año, mes, diaFecha] = fechaStr.split('-').map(Number);
    return diaFecha === dia && 
           mes === mesSeleccionado &&
           año === añoSeleccionado;
  };

  const esHoy = (dia) => {
    const hoy = new Date();
    return dia === hoy.getDate() && 
           mesSeleccionado === hoy.getMonth() + 1 &&
           añoSeleccionado === hoy.getFullYear();
  };

  useEffect(() => {
    if (fechaSeleccionada) {
      // Parsear la fecha directamente del string YYYY-MM-DD para evitar problemas de zona horaria
      const fechaStr = fechaSeleccionada.split('T')[0]; // Si viene con hora, tomar solo la fecha
      const [año, mes] = fechaStr.split('-').map(Number);
      setMesSeleccionado(mes);
      setAñoSeleccionado(año);
    }
  }, [fechaSeleccionada]);

  const { diasEnMes, diaInicioSemana } = obtenerDiasDelMes();

  return (
    <div className="relative w-full">
      <Button
        type="button"
        variant="outline"
        onClick={() => setMostrarCalendario(!mostrarCalendario)}
        className="w-full justify-start text-left font-normal h-11"
      >
        <Calendar className="mr-2 h-4 w-4" />
        {fechaSeleccionada 
          ? new Date(fechaSeleccionada).toLocaleDateString('es-ES', { 
              day: 'numeric', 
              month: 'long', 
              year: 'numeric' 
            })
          : 'Seleccionar fecha'}
      </Button>

      {mostrarCalendario && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
            onClick={() => setMostrarCalendario(false)}
          />
          
          <div className="absolute z-50 mt-2 w-full max-w-md bg-background border border-border rounded-lg shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b bg-muted/30">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => cambiarMes('anterior')}
                  className="p-1.5 hover:bg-background rounded-md transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <h3 className="font-semibold text-base min-w-[140px] text-center">
                  {nombresMeses[mesSeleccionado - 1]} {añoSeleccionado}
                </h3>
                <button
                  type="button"
                  onClick={() => cambiarMes('siguiente')}
                  className="p-1.5 hover:bg-background rounded-md transition-colors"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
              <button
                type="button"
                onClick={() => setMostrarCalendario(false)}
                className="p-1.5 hover:bg-background rounded-md transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Calendario */}
            <div className="p-4">
              {/* Días de la semana */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {diasSemana.map((dia) => (
                  <div key={dia} className="text-center text-xs font-medium text-muted-foreground py-2">
                    {dia}
                  </div>
                ))}
              </div>

              {/* Grid de días */}
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: diaInicioSemana }).map((_, i) => (
                  <div key={`empty-${i}`} className="aspect-square" />
                ))}

                {Array.from({ length: diasEnMes }).map((_, i) => {
                  const dia = i + 1;
                  const fechaStr = formatearFechaParaInput(dia);
                  const esValida = esFechaValida(dia);
                  const esSeleccionada = esFechaSeleccionada(dia);
                  const esHoyDia = esHoy(dia);
                  const eventosDelDia = obtenerEventosDelDia(dia);
                  const tieneEventos = eventosDelDia.length > 0;

                  return (
                    <button
                      key={dia}
                      type="button"
                      onClick={() => {
                        if (esValida) {
                          onFechaSeleccionada(fechaStr);
                          setMostrarCalendario(false);
                        }
                      }}
                      disabled={!esValida}
                      className={`
                        relative aspect-square rounded-md text-sm font-medium
                        transition-all duration-150
                        ${!esValida 
                          ? 'text-muted-foreground/30 cursor-not-allowed' 
                          : esSeleccionada
                          ? 'bg-primary text-primary-foreground font-semibold shadow-sm'
                          : esHoyDia
                          ? 'bg-accent text-accent-foreground font-semibold ring-1 ring-primary/20'
                          : 'hover:bg-accent hover:text-accent-foreground text-foreground'
                        }
                      `}
                    >
                      <span>{dia}</span>
                      {tieneEventos && esValida && (
                        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
                          {eventosDelDia.slice(0, 2).map((_, idx) => (
                            <div 
                              key={idx} 
                              className={`w-1 h-1 rounded-full ${
                                esSeleccionada ? 'bg-primary-foreground/60' : 'bg-blue-500'
                              }`} 
                            />
                          ))}
                          {eventosDelDia.length > 2 && (
                            <div 
                              className={`w-1 h-1 rounded-full ${
                                esSeleccionada ? 'bg-primary-foreground/40' : 'bg-blue-400'
                              }`} 
                            />
                          )}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Eventos del día seleccionado */}
            {fechaSeleccionada && (() => {
              // Parsear la fecha directamente del string YYYY-MM-DD para evitar problemas de zona horaria
              const fechaStr = fechaSeleccionada.split('T')[0];
              const [año, mes, dia] = fechaStr.split('-').map(Number);
              const eventos = obtenerEventosDelDia(dia);
              
              if (eventos.length === 0) return null;

              return (
                <div className="border-t bg-muted/20 px-4 py-3">
                  <div className="text-xs font-medium text-muted-foreground mb-2">
                    Eventos este día
                  </div>
                  <div className="space-y-1.5">
                    {eventos.slice(0, 3).map((evento, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 text-xs p-2 rounded-md bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800"
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-blue-900 dark:text-blue-100 truncate">
                            {evento.titulo || evento.summary || 'Evento'}
                          </div>
                          {evento.hora_inicio && (
                            <div className="flex items-center gap-1 text-blue-700 dark:text-blue-300 mt-0.5">
                              <Clock className="w-3 h-3" />
                              <span>{formatearHora(evento.hora_inicio)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    {eventos.length > 3 && (
                      <div className="text-xs text-muted-foreground text-center py-1">
                        +{eventos.length - 3} más
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        </>
      )}
    </div>
  );
}

export default CalendarioSelector;
