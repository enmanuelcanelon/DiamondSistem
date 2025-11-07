import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, Calendar, Clock, Users, MapPin, DollarSign, Loader2, X, User, FileText, Phone, Mail } from 'lucide-react';
import api from '@shared/config/api';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

function CalendarioGerente() {
  const fechaActual = new Date();
  const [mesSeleccionado, setMesSeleccionado] = useState(fechaActual.getMonth() + 1);
  const [añoSeleccionado, setAñoSeleccionado] = useState(fechaActual.getFullYear());
  const [eventoSeleccionado, setEventoSeleccionado] = useState(null);
  const [mostrarModal, setMostrarModal] = useState(false);

  const { data: dashboardData } = useQuery({
    queryKey: ['gerente-dashboard'],
    queryFn: async () => {
      const response = await api.get('/gerentes/dashboard');
      return response.data.estadisticas;
    },
  });

  const fechasDisponibles = dashboardData?.fechas_disponibles?.eventos || [];

  const nombresMeses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const diasSemana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

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

  const obtenerDiasDelMes = () => {
    const primerDia = new Date(añoSeleccionado, mesSeleccionado - 1, 1);
    const ultimoDia = new Date(añoSeleccionado, mesSeleccionado, 0);
    const diasEnMes = ultimoDia.getDate();
    const diaInicioSemana = primerDia.getDay();

    return { diasEnMes, diaInicioSemana };
  };

  const { diasEnMes, diaInicioSemana } = obtenerDiasDelMes();

  // Filtrar eventos del mes actual
  const eventosDelMes = fechasDisponibles.filter(evento => {
    const fechaEvento = new Date(evento.fecha);
    return fechaEvento.getMonth() + 1 === mesSeleccionado && 
           fechaEvento.getFullYear() === añoSeleccionado;
  });

  const eventosPorDia = {};
  eventosDelMes.forEach(evento => {
    const dia = new Date(evento.fecha).getDate();
    if (!eventosPorDia[dia]) {
      eventosPorDia[dia] = [];
    }
    eventosPorDia[dia].push(evento);
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Calendario de Eventos</h1>
        <p className="text-gray-600">Visualiza las fechas disponibles y eventos programados</p>
      </div>

      {/* Controles */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => cambiarMes('anterior')}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
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
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Eventos este mes</p>
            <p className="text-2xl font-bold text-purple-600">{eventosDelMes.length}</p>
          </div>
        </div>
      </div>

      {/* Calendario */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="grid grid-cols-7 gap-2 mb-2">
          {diasSemana.map((dia) => (
            <div key={dia} className="text-center font-semibold text-gray-700 py-2">
              {dia}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-2">
          {/* Días vacíos al inicio */}
          {Array.from({ length: diaInicioSemana }).map((_, i) => (
            <div key={`empty-${i}`} className="h-32 bg-gray-50 border border-gray-200 rounded-lg"></div>
          ))}
          
          {/* Días del mes */}
          {Array.from({ length: diasEnMes }).map((_, i) => {
            const dia = i + 1;
            const eventosDelDia = eventosPorDia[dia] || [];
            const esHoy = dia === fechaActual.getDate() && 
                         mesSeleccionado === fechaActual.getMonth() + 1 && 
                         añoSeleccionado === fechaActual.getFullYear();

            return (
              <div
                key={dia}
                className={`h-32 border rounded-lg p-2 overflow-y-auto ${
                  esHoy 
                    ? 'bg-purple-50 border-purple-400 ring-2 ring-purple-300' 
                    : 'bg-white border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className={`text-sm font-semibold mb-1 ${esHoy ? 'text-purple-700' : 'text-gray-700'}`}>
                  {dia}
                </div>
                <div className="space-y-1">
                  {eventosDelDia.length === 0 ? (
                    <div className="text-xs text-gray-400 text-center mt-1">Sin eventos</div>
                  ) : (
                    eventosDelDia.map((evento, idx) => (
                      <div
                        key={idx}
                        onClick={() => {
                          setEventoSeleccionado(evento);
                          setMostrarModal(true);
                        }}
                        className="text-xs p-1 rounded bg-purple-100 text-purple-800 border border-purple-200 hover:bg-purple-200 cursor-pointer transition"
                        title={`${evento.salon} - ${format(new Date(evento.fecha), 'dd/MM/yyyy')}`}
                      >
                        <div className="font-medium truncate">{evento.salon}</div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {format(new Date(evento.fecha), 'dd/MM', { locale: es })}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Próximos 90 días */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Próximos 90 Días</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {fechasDisponibles.slice(0, 12).map((evento, idx) => (
            <div 
              key={idx} 
              onClick={() => {
                setEventoSeleccionado(evento);
                setMostrarModal(true);
              }}
              className="border rounded-lg p-4 hover:shadow-md transition cursor-pointer"
            >
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-5 h-5 text-purple-600" />
                <span className="font-semibold text-gray-900">
                  {format(new Date(evento.fecha), 'dd/MM/yyyy', { locale: es })}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <MapPin className="w-4 h-4" />
                <span>{evento.salon}</span>
              </div>
            </div>
          ))}
        </div>
        {fechasDisponibles.length > 12 && (
          <p className="text-sm text-gray-500 mt-4 text-center">
            Y {fechasDisponibles.length - 12} eventos más...
          </p>
        )}
      </div>

      {/* Modal de Detalles del Evento */}
      {mostrarModal && eventoSeleccionado && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-900">Detalles del Evento</h2>
              <button
                onClick={() => {
                  setMostrarModal(false);
                  setEventoSeleccionado(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Información del Contrato */}
              <div className="bg-purple-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="w-5 h-5 text-purple-600" />
                  <h3 className="text-lg font-semibold text-gray-900">
                    {eventoSeleccionado.codigo_contrato}
                  </h3>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-3">
                  <div>
                    <p className="text-sm text-gray-600">Fecha del Evento</p>
                    <p className="font-semibold text-gray-900">
                      {format(new Date(eventoSeleccionado.fecha), 'dd/MM/yyyy', { locale: es })}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Horario</p>
                    <p className="font-semibold text-gray-900">
                      {eventoSeleccionado.hora_inicio 
                        ? (() => {
                            const hora = typeof eventoSeleccionado.hora_inicio === 'string' 
                              ? eventoSeleccionado.hora_inicio 
                              : new Date(eventoSeleccionado.hora_inicio).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
                            return hora;
                          })()
                        : '-'} - {eventoSeleccionado.hora_fin 
                        ? (() => {
                            const hora = typeof eventoSeleccionado.hora_fin === 'string' 
                              ? eventoSeleccionado.hora_fin 
                              : new Date(eventoSeleccionado.hora_fin).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
                            return hora;
                          })()
                        : '-'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Ubicación */}
              <div className="border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="w-5 h-5 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Ubicación</h3>
                </div>
                <p className="text-gray-700">{eventoSeleccionado.salon}</p>
              </div>

              {/* Información del Cliente */}
              {eventoSeleccionado.cliente && (
                <div className="border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <User className="w-5 h-5 text-green-600" />
                    <h3 className="text-lg font-semibold text-gray-900">Cliente</h3>
                  </div>
                  <div className="space-y-2">
                    <p className="font-semibold text-gray-900">{eventoSeleccionado.cliente.nombre_completo}</p>
                    {eventoSeleccionado.cliente.email && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Mail className="w-4 h-4" />
                        <span>{eventoSeleccionado.cliente.email}</span>
                      </div>
                    )}
                    {eventoSeleccionado.cliente.telefono && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Phone className="w-4 h-4" />
                        <span>{eventoSeleccionado.cliente.telefono}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Información del Vendedor */}
              {eventoSeleccionado.vendedor && (
                <div className="border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-5 h-5 text-orange-600" />
                    <h3 className="text-lg font-semibold text-gray-900">Vendedor</h3>
                  </div>
                  <p className="font-semibold text-gray-900">{eventoSeleccionado.vendedor.nombre_completo}</p>
                  <p className="text-sm text-gray-600">{eventoSeleccionado.vendedor.codigo_vendedor}</p>
                </div>
              )}

              {/* Información Adicional */}
              <div className="grid grid-cols-2 gap-4">
                <div className="border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-4 h-4 text-gray-600" />
                    <p className="text-sm text-gray-600">Invitados</p>
                  </div>
                  <p className="text-lg font-semibold text-gray-900">
                    {eventoSeleccionado.cantidad_invitados || 0}
                  </p>
                </div>
                <div className="border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="w-4 h-4 text-gray-600" />
                    <p className="text-sm text-gray-600">Total</p>
                  </div>
                  <p className="text-lg font-semibold text-green-600">
                    ${parseFloat(eventoSeleccionado.total_contrato || 0).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Estado de Pago */}
              <div className="border rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">Estado de Pago</p>
                <span className={`px-3 py-1 text-sm font-semibold rounded-full ${
                  eventoSeleccionado.estado_pago === 'completado' ? 'bg-green-100 text-green-800' :
                  eventoSeleccionado.estado_pago === 'parcial' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-orange-100 text-orange-800'
                }`}>
                  {eventoSeleccionado.estado_pago || 'Pendiente'}
                </span>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => {
                  setMostrarModal(false);
                  setEventoSeleccionado(null);
                }}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CalendarioGerente;

