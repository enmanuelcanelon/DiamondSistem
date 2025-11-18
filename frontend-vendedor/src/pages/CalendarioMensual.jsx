import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Calendar, ChevronLeft, ChevronRight, Clock, DollarSign, Loader2 } from 'lucide-react';
import api from '../config/api';
import useAuthStore from '../store/useAuthStore';
import toast from 'react-hot-toast';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Separator } from '../components/ui/separator';

function CalendarioMensual() {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  // Estado para el mes y año seleccionado
  const fechaActual = new Date();
  const [mesSeleccionado, setMesSeleccionado] = useState(fechaActual.getMonth() + 1);
  const [añoSeleccionado, setAñoSeleccionado] = useState(fechaActual.getFullYear());

  // Obtener eventos del calendario
  const { data: calendarioData, isLoading, isError } = useQuery({
    queryKey: ['calendario-mensual', user?.id, mesSeleccionado, añoSeleccionado],
    queryFn: async () => {
      const response = await api.get(`/vendedores/${user.id}/calendario/mes/${mesSeleccionado}/${añoSeleccionado}`);
      return response.data;
    },
    enabled: !!user?.id,
  });

  // Nombres de los meses
  const nombresMeses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  // Nombres de los días de la semana
  const diasSemana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

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

  // Ir al mes actual
  const irAlMesActual = () => {
    const hoy = new Date();
    setMesSeleccionado(hoy.getMonth() + 1);
    setAñoSeleccionado(hoy.getFullYear());
  };

  // Generar años disponibles (10 años atrás y 10 años adelante)
  const generarAños = () => {
    const años = [];
    const añoActual = fechaActual.getFullYear();
    for (let i = añoActual - 10; i <= añoActual + 10; i++) {
      años.push(i);
    }
    return años;
  };

  // Obtener el primer día del mes y cuántos días tiene
  const obtenerDiasDelMes = () => {
    const primerDia = new Date(añoSeleccionado, mesSeleccionado - 1, 1);
    const ultimoDia = new Date(añoSeleccionado, mesSeleccionado, 0);
    const diasEnMes = ultimoDia.getDate();
    const diaInicioSemana = primerDia.getDay(); // 0 = Domingo, 1 = Lunes, etc.

    return { primerDia, ultimoDia, diasEnMes, diaInicioSemana };
  };

  // Formatear hora
  const formatearHora = (hora) => {
    if (!hora) return '';
    try {
      const [horas, minutos] = hora.split(':');
      return `${horas}:${minutos}`;
    } catch {
      return hora;
    }
  };

  // Obtener color según estado de pago
  const obtenerColorEstado = (estado) => {
    switch (estado) {
      case 'completado':
        return 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-300';
      case 'parcial':
        return 'bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-300';
      case 'pendiente':
        return 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-300';
      default:
        return 'bg-muted border-border text-foreground';
    }
  };

  // Renderizar días del calendario
  const renderizarCalendario = () => {
    const { diasEnMes, diaInicioSemana } = obtenerDiasDelMes();
    const eventosPorDia = calendarioData?.eventos_por_dia || {};
    const dias = [];

    // Días vacíos al inicio del mes
    for (let i = 0; i < diaInicioSemana; i++) {
      dias.push(
        <div key={`empty-${i}`} className="h-32 bg-muted/30 border border-border rounded-lg"></div>
      );
    }

    // Días del mes
    for (let dia = 1; dia <= diasEnMes; dia++) {
      const eventosDelDia = eventosPorDia[dia] || [];
      const esHoy = dia === fechaActual.getDate() && 
                    mesSeleccionado === fechaActual.getMonth() + 1 && 
                    añoSeleccionado === fechaActual.getFullYear();

      dias.push(
        <div
          key={dia}
          className={`h-32 border rounded-lg p-2 overflow-y-auto transition-colors ${
            esHoy 
              ? 'bg-primary/10 border-primary ring-2 ring-primary/20' 
              : 'bg-card border-border hover:border-primary/50'
          }`}
        >
          <div className={`text-sm font-semibold mb-1 ${esHoy ? 'text-primary' : 'text-foreground'}`}>
            {dia}
          </div>
          <div className="space-y-1">
            {eventosDelDia.length === 0 ? (
              <div className="text-xs text-muted-foreground text-center mt-1">Sin eventos</div>
            ) : (
              eventosDelDia.map((evento, index) => {
                const esGoogleCalendar = evento.es_google_calendar || evento.id?.toString().startsWith('google_');
                const colorClase = esGoogleCalendar 
                  ? 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300'
                  : obtenerColorEstado(evento.estado_pago);
                
                return (
                  <div
                    key={evento.id}
                    onClick={() => {
                      if (esGoogleCalendar && evento.htmlLink) {
                        window.open(evento.htmlLink, '_blank');
                      } else if (!esGoogleCalendar) {
                        navigate(`/contratos/${evento.id}`);
                      }
                    }}
                    className={`text-xs p-1.5 rounded cursor-pointer hover:opacity-80 transition border ${colorClase}`}
                    title={esGoogleCalendar 
                      ? `${evento.clientes?.nombre_completo || 'Evento'} - ${evento.salones?.nombre || 'Google Calendar'} - ${formatearHora(evento.hora_inicio)}`
                      : `${evento.clientes?.nombre_completo || 'Cliente'} - ${evento.salones?.nombre || 'Salón'} - ${formatearHora(evento.hora_inicio)}`}
                  >
                    <div className="font-medium truncate flex items-center gap-1">
                      {esGoogleCalendar && (
                        <span className="text-[8px]">📅</span>
                      )}
                      {evento.clientes?.nombre_completo || 'Sin nombre'}
                    </div>
                    <div className="flex items-center gap-1 text-[10px] mt-0.5">
                      {evento.hora_inicio && (
                        <Clock className="w-3 h-3" />
                      )}
                      {formatearHora(evento.hora_inicio)}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      );
    }

    return dias;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="ml-3 text-muted-foreground">Cargando calendario...</p>
      </div>
    );
  }

  if (isError) {
    toast.error('Error al cargar el calendario');
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-destructive">Error al cargar el calendario</p>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Calendar className="w-6 h-6 text-primary" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Calendario de Eventos</h1>
            <p className="text-sm text-muted-foreground">
              Vista mensual de todos tus eventos programados
            </p>
          </div>
        </div>
      </div>

      {/* Controles de navegación */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Navegación Mes/Año */}
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="icon"
                onClick={() => cambiarMes('anterior')}
                title="Mes anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              
              <div className="flex items-center gap-2">
                <Select value={mesSeleccionado.toString()} onValueChange={(value) => setMesSeleccionado(parseInt(value))}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue>
                      {nombresMeses[mesSeleccionado - 1]}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {nombresMeses.map((mes, index) => (
                      <SelectItem key={index} value={(index + 1).toString()}>
                        {mes}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={añoSeleccionado.toString()} onValueChange={(value) => setAñoSeleccionado(parseInt(value))}>
                  <SelectTrigger className="w-[100px]">
                    <SelectValue>
                      {añoSeleccionado}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {generarAños().map((año) => (
                      <SelectItem key={año} value={año.toString()}>
                        {año}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                variant="outline"
                size="icon"
                onClick={() => cambiarMes('siguiente')}
                title="Mes siguiente"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>

            <Button
              variant="outline"
              onClick={irAlMesActual}
              className="whitespace-nowrap"
            >
              <Calendar className="w-4 h-4 mr-2" />
              Ir a Hoy
            </Button>
          </div>

          {/* Estadísticas del mes */}
          {calendarioData && (
            <>
              <Separator className="my-4" />
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Calendar className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Total Eventos</p>
                    <p className="text-lg font-bold text-foreground">{calendarioData.total_eventos || 0}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-500/10 rounded-lg">
                    <DollarSign className="w-4 h-4 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Pagados</p>
                    <p className="text-lg font-bold text-foreground">
                      {calendarioData.eventos?.filter(e => e.estado_pago === 'completado').length || 0}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-500/10 rounded-lg">
                    <DollarSign className="w-4 h-4 text-red-600 dark:text-red-400" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Pendientes</p>
                    <p className="text-lg font-bold text-foreground">
                      {calendarioData.eventos?.filter(e => e.estado_pago === 'pendiente').length || 0}
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Calendario Grid */}
      <Card>
        <CardContent className="pt-6">
          {/* Días de la semana */}
          <div className="grid grid-cols-7 gap-2 mb-2">
            {diasSemana.map((dia) => (
              <div key={dia} className="text-center font-semibold text-muted-foreground py-2 text-sm">
                {dia}
              </div>
            ))}
          </div>

          {/* Días del mes */}
          <div className="grid grid-cols-7 gap-2">
            {renderizarCalendario()}
          </div>
        </CardContent>
      </Card>

      {/* Leyenda */}
      <Card>
        <CardContent className="pt-6">
          <h3 className="text-sm font-semibold text-foreground mb-4">Leyenda de Estados</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded"></div>
              <span className="text-sm text-foreground">Completado</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded"></div>
              <span className="text-sm text-foreground">Pago Parcial</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded"></div>
              <span className="text-sm text-foreground">Pendiente</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            Haz clic en cualquier evento para ver los detalles del contrato
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default CalendarioMensual;
