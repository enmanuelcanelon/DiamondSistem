import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Calendar, ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import api from '../config/api';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { formatearHora } from '../utils/formatters';

function CalendarioSelector({ fechaSeleccionada, onFechaSeleccionada, fechaMinima }) {
  const [mesSeleccionado, setMesSeleccionado] = useState(new Date().getMonth() + 1);
  const [añoSeleccionado, setAñoSeleccionado] = useState(new Date().getFullYear());
  const [mostrarCalendario, setMostrarCalendario] = useState(false);

  // Obtener eventos de Google Calendar para el mes (del vendedor autenticado)
  const { data: eventosGoogleCalendar } = useQuery({
    queryKey: ['google-calendar-eventos', mesSeleccionado, añoSeleccionado],
    queryFn: async () => {
      try {
        const response = await api.get(`/google-calendar/eventos/mes/${mesSeleccionado}/${añoSeleccionado}`);
        return response.data.eventos || [];
      } catch (error) {
        // Si no está configurado o no hay conexión, retornar array vacío
        return [];
      }
    },
    enabled: mostrarCalendario,
    staleTime: 5 * 60 * 1000, // Cache por 5 minutos
  });

  // Nombres de los meses
  const nombresMeses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  // Nombres de los días de la semana
  const diasSemana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  // Obtener el primer día del mes y cuántos días tiene
  const obtenerDiasDelMes = () => {
    const primerDia = new Date(añoSeleccionado, mesSeleccionado - 1, 1);
    const ultimoDia = new Date(añoSeleccionado, mesSeleccionado, 0);
    const diasEnMes = ultimoDia.getDate();
    const diaInicioSemana = primerDia.getDay();
    return { diasEnMes, diaInicioSemana };
  };

  // Verificar si un día tiene eventos de Google Calendar
  const tieneEventosGoogle = (dia) => {
    if (!eventosGoogleCalendar || eventosGoogleCalendar.length === 0) return false;
    
    return eventosGoogleCalendar.some(evento => {
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

  // Obtener eventos de un día específico
  const obtenerEventosDelDia = (dia) => {
    if (!eventosGoogleCalendar || eventosGoogleCalendar.length === 0) return [];
    
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

  // Cambiar mes
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

  // Formatear fecha para input date (YYYY-MM-DD)
  const formatearFechaParaInput = (dia) => {
    const fecha = new Date(añoSeleccionado, mesSeleccionado - 1, dia);
    const year = fecha.getFullYear();
    const month = String(fecha.getMonth() + 1).padStart(2, '0');
    const day = String(dia).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Verificar si una fecha es válida (no pasada)
  const esFechaValida = (dia) => {
    const fecha = new Date(añoSeleccionado, mesSeleccionado - 1, dia);
    const hoy = fechaMinima ? new Date(fechaMinima) : new Date();
    hoy.setHours(0, 0, 0, 0);
    fecha.setHours(0, 0, 0, 0);
    return fecha >= hoy;
  };

  // Verificar si una fecha está seleccionada
  const esFechaSeleccionada = (dia) => {
    if (!fechaSeleccionada) return false;
    const fecha = new Date(fechaSeleccionada);
    return fecha.getDate() === dia && 
           fecha.getMonth() + 1 === mesSeleccionado &&
           fecha.getFullYear() === añoSeleccionado;
  };

  // Sincronizar mes/año con fecha seleccionada
  useEffect(() => {
    if (fechaSeleccionada) {
      const fecha = new Date(fechaSeleccionada);
      setMesSeleccionado(fecha.getMonth() + 1);
      setAñoSeleccionado(fecha.getFullYear());
    }
  }, [fechaSeleccionada]);

  const { diasEnMes, diaInicioSemana } = obtenerDiasDelMes();

  return (
    <div className="relative">
      <Button
        type="button"
        variant="outline"
        onClick={() => setMostrarCalendario(!mostrarCalendario)}
        className="w-full justify-start"
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
        <Card className="absolute z-50 mt-2 w-full max-w-sm shadow-lg">
          <CardContent className="p-4">
            {/* Navegación */}
            <div className="flex items-center justify-between mb-4">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => cambiarMes('anterior')}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="font-semibold">
                {nombresMeses[mesSeleccionado - 1]} {añoSeleccionado}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => cambiarMes('siguiente')}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Días de la semana */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {diasSemana.map((dia) => (
                <div key={dia} className="text-center text-xs font-medium text-muted-foreground py-1">
                  {dia}
                </div>
              ))}
            </div>

            {/* Días del mes */}
            <div className="grid grid-cols-7 gap-1">
              {/* Días vacíos al inicio */}
              {Array.from({ length: diaInicioSemana }).map((_, i) => (
                <div key={`empty-${i}`} className="aspect-square" />
              ))}

              {/* Días del mes */}
              {Array.from({ length: diasEnMes }).map((_, i) => {
                const dia = i + 1;
                const fechaStr = formatearFechaParaInput(dia);
                const esValida = esFechaValida(dia);
                const esSeleccionada = esFechaSeleccionada(dia);
                const tieneEventos = tieneEventosGoogle(dia);
                const eventosDelDia = obtenerEventosDelDia(dia);

                return (
                  <div key={dia} className="relative">
                    <button
                      type="button"
                      onClick={() => {
                        if (esValida) {
                          onFechaSeleccionada(fechaStr);
                          setMostrarCalendario(false);
                        }
                      }}
                      disabled={!esValida}
                      className={`
                        w-full aspect-square rounded-md text-sm transition-colors
                        ${!esValida 
                          ? 'text-muted-foreground/50 cursor-not-allowed' 
                          : esSeleccionada
                          ? 'bg-primary text-primary-foreground font-semibold'
                          : 'hover:bg-accent hover:text-accent-foreground'
                        }
                        ${tieneEventos && esValida ? 'ring-2 ring-blue-400' : ''}
                      `}
                      title={tieneEventos && eventosDelDia.length > 0
                        ? eventosDelDia.map(e => e.titulo).join(', ')
                        : ''}
                    >
                      {dia}
                    </button>
                    {tieneEventos && esValida && (
                      <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-blue-500 rounded-full" />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Leyenda */}
            {eventosGoogleCalendar && eventosGoogleCalendar.length > 0 && (
              <div className="mt-4 pt-4 border-t text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                  <span>Eventos de Google Calendar</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Overlay para cerrar al hacer click fuera */}
      {mostrarCalendario && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setMostrarCalendario(false)}
        />
      )}
    </div>
  );
}

export default CalendarioSelector;

