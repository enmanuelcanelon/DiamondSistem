import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Calendar, ChevronLeft, ChevronRight, Clock, Users, MapPin, DollarSign, Loader2 } from 'lucide-react';
import api from '@shared/config/api';
import useAuthStore from '@shared/store/useAuthStore';
import toast from 'react-hot-toast';

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
        return 'bg-green-100 border-green-300 text-green-800';
      case 'parcial':
        return 'bg-yellow-100 border-yellow-300 text-yellow-800';
      case 'pendiente':
        return 'bg-red-100 border-red-300 text-red-800';
      default:
        return 'bg-gray-100 border-gray-300 text-gray-800';
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
        <div key={`empty-${i}`} className="h-32 bg-gray-50 border border-gray-200 rounded-lg"></div>
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
          className={`h-32 border rounded-lg p-2 overflow-y-auto ${
            esHoy 
              ? 'bg-blue-50 border-blue-400 ring-2 ring-blue-300' 
              : 'bg-white border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className={`text-sm font-semibold mb-1 ${esHoy ? 'text-blue-700' : 'text-gray-700'}`}>
            {dia}
          </div>
          <div className="space-y-1">
            {eventosDelDia.length === 0 ? (
              <div className="text-xs text-gray-400 text-center mt-1">Sin eventos</div>
            ) : (
              eventosDelDia.map((evento, index) => (
                <div
                  key={evento.id}
                  onClick={() => navigate(`/contratos/${evento.id}`)}
                  className={`text-xs p-1 rounded cursor-pointer hover:opacity-80 transition ${obtenerColorEstado(evento.estado_pago)}`}
                  title={`${evento.clientes?.nombre_completo || 'Cliente'} - ${evento.salones?.nombre || 'Salón'} - ${formatearHora(evento.hora_inicio)}`}
                >
                  <div className="font-medium truncate">
                    {evento.clientes?.nombre_completo || 'Sin nombre'}
                  </div>
                  <div className="flex items-center gap-1 text-xs">
                    {evento.hora_inicio && (
                      <Clock className="w-3 h-3" />
                    )}
                    {formatearHora(evento.hora_inicio)}
                  </div>
                </div>
              ))
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
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
        <p className="ml-3 text-gray-600">Cargando calendario...</p>
      </div>
    );
  }

  if (isError) {
    toast.error('Error al cargar el calendario');
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-red-600">Error al cargar el calendario</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Calendar className="w-8 h-8 text-purple-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Calendario de Eventos</h1>
            <p className="text-sm text-gray-600">
              Vista mensual de todos tus eventos programados
            </p>
          </div>
        </div>
      </div>

      {/* Controles de navegación */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => cambiarMes('anterior')}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
              title="Mes anterior"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            
            <div className="text-center min-w-[200px]">
              <h2 className="text-2xl font-bold text-gray-900">
                {nombresMeses[mesSeleccionado - 1]} {añoSeleccionado}
              </h2>
            </div>

            <button
              onClick={() => cambiarMes('siguiente')}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
              title="Mes siguiente"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <button
            onClick={irAlMesActual}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition text-sm font-medium"
          >
            Hoy
          </button>
        </div>

        {/* Estadísticas del mes */}
        {calendarioData && (
          <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">Total Eventos</p>
                <p className="text-lg font-bold text-gray-900">{calendarioData.total_eventos || 0}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Pagados</p>
                <p className="text-lg font-bold text-gray-900">
                  {calendarioData.eventos?.filter(e => e.estado_pago === 'completado').length || 0}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Total Invitados</p>
                <p className="text-lg font-bold text-gray-900">
                  {calendarioData.eventos?.reduce((sum, e) => sum + (e.cantidad_invitados || 0), 0) || 0}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-orange-600" />
              <div>
                <p className="text-sm text-gray-600">Salones Únicos</p>
                <p className="text-lg font-bold text-gray-900">
                  {new Set(calendarioData.eventos?.map(e => e.salones?.nombre).filter(Boolean)).size || 0}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Calendario Grid */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        {/* Días de la semana */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {diasSemana.map((dia) => (
            <div key={dia} className="text-center font-semibold text-gray-700 py-2">
              {dia}
            </div>
          ))}
        </div>

        {/* Días del mes */}
        <div className="grid grid-cols-7 gap-2">
          {renderizarCalendario()}
        </div>
      </div>

      {/* Leyenda */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Leyenda de Estados</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-100 border border-green-300 rounded"></div>
            <span className="text-sm text-gray-700">Completado</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-100 border border-yellow-300 rounded"></div>
            <span className="text-sm text-gray-700">Pago Parcial</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-100 border border-red-300 rounded"></div>
            <span className="text-sm text-gray-700">Pendiente</span>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-3">
          💡 Haz clic en cualquier evento para ver los detalles del contrato
        </p>
      </div>
    </div>
  );
}

export default CalendarioMensual;
