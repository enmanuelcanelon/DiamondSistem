import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, Calendar, Clock, Users, MapPin, DollarSign, Loader2, X, User, FileText, Phone, Mail, Package, Building2, CreditCard, Wallet, CheckCircle2, AlertCircle, Download, RefreshCw } from 'lucide-react';
import api from '@shared/config/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Button } from '@/components/ui/button';

function CalendarioGerente() {
  const fechaActual = new Date();
  const [mesSeleccionado, setMesSeleccionado] = useState(fechaActual.getMonth() + 1);
  const [añoSeleccionado, setAñoSeleccionado] = useState(fechaActual.getFullYear());
  const [eventoSeleccionado, setEventoSeleccionado] = useState(null);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [contratoId, setContratoId] = useState(null);
  const [tipoCalendario, setTipoCalendario] = useState('general'); // 'general' o 'contratos'

  const { data: dashboardData } = useQuery({
    queryKey: ['gerente-dashboard'],
    queryFn: async () => {
      const response = await api.get('/gerentes/dashboard');
      return response.data.estadisticas;
    },
    enabled: tipoCalendario === 'contratos', // Solo cargar cuando se selecciona contratos
  });

  // Obtener todos los eventos (calendario general) - Funcionalidad movida desde frontend-vendedor
  const { data: calendarioTodos, isLoading: cargandoTodos, refetch: refetchCalendarioGeneral } = useQuery({
    queryKey: ['calendario-todos-gerente', mesSeleccionado, añoSeleccionado],
    queryFn: async () => {
      const response = await api.get(`/google-calendar/eventos/todos-vendedores/${mesSeleccionado}/${añoSeleccionado}`);
      return response.data;
    },
    enabled: tipoCalendario === 'general',
    staleTime: 5 * 60 * 1000, // 5 minutos - los eventos pueden cambiar pero no tan frecuentemente
    refetchOnWindowFocus: false, // No refetch al cambiar de pestaña (reduce carga)
    refetchInterval: false, // Sin refresco automático - solo manual con botón
    gcTime: 10 * 60 * 1000, // Mantener en caché por 10 minutos
  });

  // Obtener detalles completos del contrato cuando se selecciona un evento
  const { data: contratosData, isLoading: cargandoContrato } = useQuery({
    queryKey: ['gerente-contrato-detalle', contratoId],
    queryFn: async () => {
      if (!contratoId) return null;
      // Buscar el contrato en la lista de contratos del mes
      const fechaEvento = eventoSeleccionado?.fecha || new Date();
      const mes = new Date(fechaEvento).getMonth() + 1;
      const año = new Date(fechaEvento).getFullYear();
      const salon = eventoSeleccionado?.salon;
      
      const response = await api.get(`/gerentes/contratos`, {
        params: { 
          salon_nombre: salon,
          mes: mes,
          anio: año
        }
      });
      
      // Buscar el contrato específico por ID
      const contratos = response.data.contratos || [];
      const contrato = contratos.find(c => c.id === contratoId);
      
      // Si no se encuentra, intentar buscar por código
      if (!contrato && eventoSeleccionado?.codigo_contrato) {
        return contratos.find(c => c.codigo_contrato === eventoSeleccionado.codigo_contrato) || null;
      }
      
      return contrato || null;
    },
    enabled: !!contratoId && !!mostrarModal && !!eventoSeleccionado
  });

  const fechasDisponibles = dashboardData?.fechas_disponibles?.eventos || [];

  // Obtener eventos según el tipo de calendario seleccionado
  const obtenerEventosDelMes = () => {
    if (tipoCalendario === 'general') {
      // Usar eventos del calendario general (todos los vendedores)
      const eventosPorDia = calendarioTodos?.eventos_por_dia || {};
      const eventos = [];
      Object.keys(eventosPorDia).forEach(dia => {
        eventosPorDia[dia].forEach(evento => {
          eventos.push({
            ...evento,
            fecha: evento.fecha_evento || evento.fecha_inicio || evento.hora_inicio,
            salon: evento.salones?.nombre || evento.salon || evento.ubicacion || 'Sin salón',
            id: evento.id || evento.contrato_id,
            codigo_contrato: evento.codigo_contrato
          });
        });
      });
      return eventos;
    } else {
      // Usar eventos del dashboard (contratos)
      return fechasDisponibles;
    }
  };

  const eventosDelMesCompletos = obtenerEventosDelMes();

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

  // Filtrar eventos del mes actual según el tipo de calendario
  const eventosDelMes = eventosDelMesCompletos.filter(evento => {
    const fechaEvento = new Date(evento.fecha || evento.fecha_evento || evento.fecha_inicio || evento.hora_inicio);
    return fechaEvento.getMonth() + 1 === mesSeleccionado && 
           fechaEvento.getFullYear() === añoSeleccionado;
  });

  const eventosPorDia = {};
  eventosDelMes.forEach(evento => {
    const fechaEvento = new Date(evento.fecha || evento.fecha_evento || evento.fecha_inicio || evento.hora_inicio);
    const dia = fechaEvento.getDate();
    if (!eventosPorDia[dia]) {
      eventosPorDia[dia] = [];
    }
    eventosPorDia[dia].push(evento);
  });

  const isLoading = tipoCalendario === 'general' ? cargandoTodos : false;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
          <p className="text-gray-600">Cargando calendario...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Calendario de Eventos</h1>
        <p className="text-gray-600">Visualiza las fechas disponibles y eventos programados</p>
      </div>

      {/* Controles */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
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
        
        {/* Selector de tipo de calendario */}
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700">Tipo de Calendario:</label>
          <select
            value={tipoCalendario}
            onChange={(e) => setTipoCalendario(e.target.value)}
            className="w-[200px] px-3 py-2 border border-input rounded-lg text-sm focus:ring-2 focus:ring-ring focus:border-transparent"
          >
            <option value="general">📅 Calendario General</option>
            <option value="contratos">📋 Calendario Contratos</option>
          </select>
          {tipoCalendario === 'general' && (
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                // Refrescar el calendario general
                await refetchCalendarioGeneral();
                toast.success('Calendario actualizado');
              }}
              disabled={cargandoTodos}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${cargandoTodos ? 'animate-spin' : ''}`} />
              Refrescar
            </Button>
          )}
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
                    eventosDelDia.map((evento, idx) => {
                      const fechaEvento = evento.fecha || evento.fecha_evento || evento.fecha_inicio || evento.hora_inicio;
                      const nombreEvento = evento.clientes?.nombre_completo || evento.titulo || evento.summary || evento.salon || 'Evento';
                      const salonEvento = evento.salones?.nombre || evento.salon || evento.ubicacion || 'Sin salón';
                      
                      return (
                        <div
                          key={idx}
                          onClick={() => {
                            setEventoSeleccionado(evento);
                            // Solo establecer contratoId si es un contrato (no evento de Google Calendar)
                            if (evento.id && !evento.es_google_calendar) {
                              setContratoId(evento.id);
                            } else {
                              setContratoId(null);
                            }
                            setMostrarModal(true);
                          }}
                          className="text-xs p-1 rounded bg-purple-100 text-purple-800 border border-purple-200 hover:bg-purple-200 cursor-pointer transition"
                          title={`${nombreEvento} - ${salonEvento} - ${format(new Date(fechaEvento), 'dd/MM/yyyy')}`}
                        >
                          <div className="font-medium truncate">{nombreEvento}</div>
                          <div className="flex items-center gap-1 text-[10px]">
                            <MapPin className="w-2.5 h-2.5" />
                            <span className="truncate">{salonEvento}</span>
                          </div>
                        </div>
                      );
                    })
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
          {eventosDelMesCompletos.slice(0, 12).map((evento, idx) => {
            const fechaEvento = evento.fecha || evento.fecha_evento || evento.fecha_inicio || evento.hora_inicio;
            const nombreEvento = evento.clientes?.nombre_completo || evento.titulo || evento.summary || evento.salon || 'Evento';
            const salonEvento = evento.salones?.nombre || evento.salon || evento.ubicacion || 'Sin salón';
            
            return (
              <div 
                key={idx} 
                onClick={() => {
                  setEventoSeleccionado(evento);
                  // Solo establecer contratoId si es un contrato (no evento de Google Calendar)
                  if (evento.id && !evento.es_google_calendar) {
                    setContratoId(evento.id);
                  } else {
                    setContratoId(null);
                  }
                  setMostrarModal(true);
                }}
                className="border rounded-lg p-4 hover:shadow-md transition cursor-pointer"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-5 h-5 text-purple-600" />
                  <span className="font-semibold text-gray-900">
                    {format(new Date(fechaEvento), 'dd/MM/yyyy', { locale: es })}
                  </span>
                </div>
                <div className="text-sm font-medium text-gray-900 mb-1 truncate">
                  {nombreEvento}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin className="w-4 h-4" />
                  <span className="truncate">{salonEvento}</span>
                </div>
              </div>
            );
          })}
        </div>
        {eventosDelMesCompletos.length > 12 && (
          <p className="text-sm text-gray-500 mt-4 text-center">
            Y {eventosDelMesCompletos.length - 12} eventos más...
          </p>
        )}
      </div>

      {/* Modal de Detalles del Contrato */}
      {mostrarModal && eventoSeleccionado && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
              <h2 className="text-2xl font-bold text-gray-900">Detalles del Contrato</h2>
              <button
                onClick={() => {
                  setMostrarModal(false);
                  setEventoSeleccionado(null);
                  setContratoId(null);
                }}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6">
              {cargandoContrato && contratoId ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
                  <p className="ml-3 text-gray-600">Cargando detalles del contrato...</p>
                </div>
              ) : (contratosData && contratoId) ? (() => {
                // Calcular total pagado y saldo pendiente desde los pagos
                const totalContrato = parseFloat(contratosData.total_contrato || 0);
                const pagosActivos = (contratosData.pagos || []).filter(p => p.estado === 'completado');
                const totalPagado = pagosActivos.reduce((sum, p) => sum + parseFloat(p.monto_total || p.monto || 0), 0);
                const saldoPendiente = totalContrato - totalPagado;
                const porcentajePagado = totalContrato > 0 ? (totalPagado / totalContrato) * 100 : 0;
                
                return (
                <div className="space-y-6">
                  {/* Header del Contrato */}
                  <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg p-6 border border-purple-200">
                    <div className="flex items-center gap-3 mb-4">
                      <FileText className="w-6 h-6 text-purple-600" />
                      <h3 className="text-2xl font-bold text-gray-900">{contratosData.codigo_contrato}</h3>
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                        contratosData.estado === 'activo' ? 'bg-green-100 text-green-800 border border-green-300' :
                        contratosData.estado === 'cancelado' ? 'bg-red-100 text-red-800 border border-red-300' :
                        'bg-gray-100 text-gray-800 border border-gray-300'
                      }`}>
                        {contratosData.estado}
                      </span>
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                        porcentajePagado >= 100 ? 'bg-blue-100 text-blue-800 border border-blue-300' :
                        porcentajePagado > 0 ? 'bg-yellow-100 text-yellow-800 border border-yellow-300' :
                        'bg-orange-100 text-orange-800 border border-orange-300'
                      }`}>
                        {porcentajePagado >= 100 ? 'Completado' : porcentajePagado > 0 ? 'Parcial' : 'Pendiente'}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                        <p className="text-xs text-gray-600 mb-1">Fecha del Evento</p>
                    <p className="font-semibold text-gray-900">
                          {contratosData.fecha_evento || contratosData.eventos?.fecha_evento
                            ? format(new Date(contratosData.fecha_evento || contratosData.eventos.fecha_evento), "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })
                            : '-'}
                    </p>
                  </div>
                  <div>
                        <p className="text-xs text-gray-600 mb-1">Horario</p>
                    <p className="font-semibold text-gray-900">
                          {contratosData.eventos?.hora_inicio && contratosData.eventos?.hora_fin
                            ? `${contratosData.eventos.hora_inicio} - ${contratosData.eventos.hora_fin}`
                        : '-'}
                    </p>
                  </div>
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Invitados</p>
                        <p className="font-semibold text-gray-900">
                          {contratosData.eventos?.cantidad_invitados_confirmados || 0}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Salón</p>
                        <p className="font-semibold text-gray-900">
                          {contratosData.salones?.nombre || eventoSeleccionado.salon}
                        </p>
                </div>
              </div>
                  </div>

                  {/* Información Principal */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Cliente */}
                    {contratosData.clientes && (
                      <div className="bg-white border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <User className="w-5 h-5 text-purple-600" />
                          <h4 className="font-semibold text-gray-900">Cliente</h4>
                        </div>
                        <p className="font-semibold text-gray-900 mb-1">{contratosData.clientes.nombre_completo}</p>
                        {contratosData.clientes.email && (
                          <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                            <Mail className="w-4 h-4" />
                            <span>{contratosData.clientes.email}</span>
                          </div>
                        )}
                        {contratosData.clientes.telefono && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Phone className="w-4 h-4" />
                            <span>{contratosData.clientes.telefono}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Vendedor */}
                    {contratosData.vendedores && (
                      <div className="bg-white border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <Users className="w-5 h-5 text-orange-600" />
                          <h4 className="font-semibold text-gray-900">Vendedor</h4>
                        </div>
                        <p className="font-semibold text-gray-900 mb-1">{contratosData.vendedores.nombre_completo}</p>
                        <p className="text-sm text-gray-600">{contratosData.vendedores.codigo_vendedor}</p>
                      </div>
                    )}
                  </div>

                  {/* Paquete */}
                  {contratosData.paquetes && (
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Package className="w-5 h-5 text-blue-600" />
                        <h4 className="font-semibold text-gray-900">Paquete</h4>
                      </div>
                      <p className="font-semibold text-gray-900 mb-1">{contratosData.paquetes.nombre}</p>
                      <p className="text-sm text-gray-600">
                        Precio Base: ${parseFloat(contratosData.paquetes.precio_base || 0).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                </div>
              )}

                  {/* Información Financiera */}
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-4">
                      <DollarSign className="w-5 h-5 text-green-600" />
                      <h4 className="font-semibold text-gray-900">Información Financiera</h4>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Total Contrato</p>
                        <p className="text-lg font-bold text-gray-900">
                          ${parseFloat(contratosData.total_contrato || 0).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Total Pagado</p>
                        <p className="text-lg font-bold text-green-600">
                          ${totalPagado.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Saldo Pendiente</p>
                        <p className="text-lg font-bold text-orange-600">
                          ${saldoPendiente.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Progreso</p>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-green-600 h-2 rounded-full" 
                            style={{ 
                              width: `${Math.min(100, porcentajePagado)}%` 
                            }}
                          ></div>
                        </div>
                        <p className="text-xs text-gray-600 mt-1">
                          {Math.round(porcentajePagado)}%
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Servicios Incluidos */}
                  {contratosData.contratos_servicios && contratosData.contratos_servicios.length > 0 && (
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Package className="w-5 h-5 text-indigo-600" />
                        <h4 className="font-semibold text-gray-900">Servicios Incluidos</h4>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {contratosData.contratos_servicios.map((cs, idx) => (
                          <span key={idx} className="px-3 py-1 bg-indigo-50 text-indigo-800 rounded-full text-sm font-medium">
                            {cs.servicios?.nombre || 'Servicio'}
                          </span>
                        ))}
                      </div>
                </div>
              )}

                  {/* Historial de Pagos */}
                  {contratosData.pagos && contratosData.pagos.length > 0 && (
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <CreditCard className="w-5 h-5 text-blue-600" />
                        <h4 className="font-semibold text-gray-900">Historial de Pagos</h4>
                      </div>
                      <div className="space-y-2">
                        {contratosData.pagos.map((pago, idx) => (
                          <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <Calendar className="w-4 h-4 text-gray-500" />
                                <span className="text-sm font-medium text-gray-900">
                                  {format(new Date(pago.fecha_pago), 'dd/MM/yyyy', { locale: es })}
                                </span>
                                <span className={`px-2 py-0.5 text-xs rounded-full ${
                                  pago.estado === 'completado' ? 'bg-green-100 text-green-800' :
                                  pago.estado === 'anulado' ? 'bg-red-100 text-red-800' :
                                  'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {pago.estado}
                                </span>
                              </div>
                              <div className="text-xs text-gray-600">
                                {pago.metodo_pago} {pago.tipo_tarjeta && `- ${pago.tipo_tarjeta}`}
                                {pago.numero_referencia && ` | Ref: ${pago.numero_referencia}`}
                              </div>
                  </div>
                            <div className="text-right">
                              <p className="text-lg font-bold text-green-600">
                                ${parseFloat(pago.monto_total || pago.monto || 0).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                );
              })() : (
                <div className="text-center py-12">
                  {eventoSeleccionado && (
                    <div className="space-y-4">
                      <h3 className="text-xl font-bold text-gray-900">
                        {eventoSeleccionado.clientes?.nombre_completo || eventoSeleccionado.titulo || eventoSeleccionado.summary || 'Evento'}
                      </h3>
                      <div className="space-y-2 text-left max-w-md mx-auto">
                        {eventoSeleccionado.salones?.nombre && (
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-gray-500" />
                            <span className="text-gray-700">{eventoSeleccionado.salones.nombre}</span>
                          </div>
                        )}
                        {eventoSeleccionado.fecha_evento && (
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-500" />
                            <span className="text-gray-700">
                              {format(new Date(eventoSeleccionado.fecha_evento), "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
                            </span>
                          </div>
                        )}
                        {eventoSeleccionado.vendedor_nombre && (
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-gray-500" />
                            <span className="text-gray-700">Vendedor: {eventoSeleccionado.vendedor_nombre}</span>
                          </div>
                        )}
                      </div>
                      {eventoSeleccionado.es_google_calendar && eventoSeleccionado.htmlLink && (
                        <a
                          href={eventoSeleccionado.htmlLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                        >
                          <Calendar className="w-4 h-4" />
                          Abrir en Google Calendar
                        </a>
                      )}
                    </div>
                  )}
                  {!eventoSeleccionado && (
                    <>
                      <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">No se pudieron cargar los detalles del evento</p>
                    </>
                  )}
                </div>
              )}
            </div>

            <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex justify-between items-center">
              <button
                onClick={async () => {
                  if (!contratosData?.id) {
                    toast.error('No se puede descargar el contrato');
                    return;
                  }
                  try {
                    const response = await api.get(`/contratos/${contratosData.id}/pdf-contrato`, {
                      responseType: 'blob'
                    });
                    const url = window.URL.createObjectURL(new Blob([response.data]));
                    const link = document.createElement('a');
                    link.href = url;
                    link.setAttribute('download', `Contrato-${contratosData.codigo_contrato}.pdf`);
                    document.body.appendChild(link);
                    link.click();
                    link.remove();
                    window.URL.revokeObjectURL(url);
                    toast.success('PDF descargado exitosamente');
                  } catch (error) {
                    toast.error('Error al descargar el PDF');
                    console.error(error);
                  }
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Descargar Contrato PDF
              </button>
              <button
                onClick={() => {
                  setMostrarModal(false);
                  setEventoSeleccionado(null);
                  setContratoId(null);
                }}
                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
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

