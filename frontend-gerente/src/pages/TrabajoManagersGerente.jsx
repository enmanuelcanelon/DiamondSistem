import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Loader2, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Calendar,
  User,
  Building2,
  ChevronDown,
  Filter,
  X
} from 'lucide-react';
import api from '@shared/config/api';
import toast from 'react-hot-toast';

const SERVICIOS_LABELS = {
  foto_video: 'Foto y Video',
  dj: 'DJ',
  comida: 'Comida',
  cake: 'Cake',
  mini_postres: 'Mini Postres',
  limosina: 'Limosina',
  hora_loca: 'Hora Loca',
  animador: 'Animador',
  maestro_ceremonia: 'Maestro de Ceremonia'
};

const ESTADOS_COLORS = {
  pendiente: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  completado: 'bg-green-100 text-green-800 border-green-300'
};

const ESTADOS_ICONS = {
  pendiente: Clock,
  completado: CheckCircle2
};

function TrabajoManagersGerente() {
  const [salonSeleccionado, setSalonSeleccionado] = useState(null);
  const [mesSeleccionado, setMesSeleccionado] = useState(new Date().getMonth() + 1);
  const [anioSeleccionado, setAnioSeleccionado] = useState(new Date().getFullYear());
  const [filtroEstado, setFiltroEstado] = useState('');
  const [eventosExpandidos, setEventosExpandidos] = useState({});

  const { data: trabajoData, isLoading, isError } = useQuery({
    queryKey: ['gerente-managers-trabajo', salonSeleccionado, mesSeleccionado, anioSeleccionado, filtroEstado],
    queryFn: async () => {
      const params = {};
      if (salonSeleccionado) params.salon_nombre = salonSeleccionado;
      if (mesSeleccionado) params.mes = mesSeleccionado;
      if (anioSeleccionado) params.anio = anioSeleccionado;
      if (filtroEstado) params.estado = filtroEstado;
      
      const response = await api.get('/gerentes/managers/trabajo', { params });
      return response.data;
    },
    enabled: !!salonSeleccionado && !!mesSeleccionado && !!anioSeleccionado
  });

  const toggleEventoExpandido = (contratoId) => {
    setEventosExpandidos(prev => ({
      ...prev,
      [contratoId]: !prev[contratoId]
    }));
  };

  // Obtener meses disponibles
  const meses = [
    { valor: 1, nombre: 'Enero' },
    { valor: 2, nombre: 'Febrero' },
    { valor: 3, nombre: 'Marzo' },
    { valor: 4, nombre: 'Abril' },
    { valor: 5, nombre: 'Mayo' },
    { valor: 6, nombre: 'Junio' },
    { valor: 7, nombre: 'Julio' },
    { valor: 8, nombre: 'Agosto' },
    { valor: 9, nombre: 'Septiembre' },
    { valor: 10, nombre: 'Octubre' },
    { valor: 11, nombre: 'Noviembre' },
    { valor: 12, nombre: 'Diciembre' }
  ];

  // Obtener años disponibles
  const aniosDisponibles = [];
  const anioActual = new Date().getFullYear();
  for (let i = -1; i < 3; i++) {
    aniosDisponibles.push(anioActual + i);
  }

  // Función para determinar si todos los servicios están completados
  const todosServiciosCompletados = (servicios) => {
    if (!servicios || servicios.length === 0) return false;
    return servicios.every(s => s.estado === 'completado');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        <p className="ml-3 text-gray-600">Cargando trabajo de managers...</p>
      </div>
    );
  }

  if (isError) {
    toast.error('Error al cargar el trabajo de managers');
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">Error al cargar el trabajo de managers</p>
      </div>
    );
  }

  const estadisticas = trabajoData?.estadisticas || {};
  const eventos = trabajoData?.eventos || [];

  if (!salonSeleccionado) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Trabajo de Managers</h1>
          <p className="text-gray-600">Selecciona un salón para ver los eventos y servicios gestionados por managers</p>
        </div>

        {/* Botones de Salones */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {['Diamond', 'Kendall', 'Doral'].map((salon) => (
            <button
              key={salon}
              onClick={() => setSalonSeleccionado(salon)}
              className="bg-white hover:bg-gray-50 border-2 border-gray-200 hover:border-gray-300 text-gray-900 rounded-lg shadow-md p-8 transition-all transform hover:scale-105"
            >
              <Building2 className="w-12 h-12 mx-auto mb-4 text-gray-700" />
              <h2 className="text-2xl font-bold mb-2 text-gray-900">{salon}</h2>
              <p className="text-gray-600 text-sm">Ver eventos de {salon}</p>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Trabajo de Managers</h1>
            <p className="text-gray-600">Salón: <span className="font-semibold">{salonSeleccionado}</span></p>
          </div>
          <button
            onClick={() => setSalonSeleccionado(null)}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
          >
            <X className="w-5 h-5" />
            Cambiar Salón
          </button>
        </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-l">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Servicios</p>
              <p className="text-2xl font-bold text-gray-900">{estadisticas.total || 0}</p>
            </div>
            <Calendar className="w-8 h-8 text-muted-foreground" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-l">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pendientes</p>
              <p className="text-2xl font-bold text-gray-900">{estadisticas.pendientes || 0}</p>
            </div>
            <Clock className="w-8 h-8 text-muted-foreground" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-l">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Completados</p>
              <p className="text-2xl font-bold text-gray-900">{estadisticas.completados || 0}</p>
            </div>
            <CheckCircle2 className="w-8 h-8 text-muted-foreground" />
          </div>
        </div>
      </div>

        {/* Filtros de Mes, Año y Estado */}
        <div className="flex items-center gap-4 flex-wrap">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Mes</label>
            <select
              value={mesSeleccionado}
              onChange={(e) => setMesSeleccionado(parseInt(e.target.value))}
              className="px-3 py-2 border border-input rounded-lg text-sm focus:ring-2 focus:ring-ring focus:border-transparent"
            >
              {meses.map((mes) => (
                <option key={mes.valor} value={mes.valor}>
                  {mes.nombre}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Año</label>
            <select
              value={anioSeleccionado}
              onChange={(e) => setAnioSeleccionado(parseInt(e.target.value))}
              className="px-3 py-2 border border-input rounded-lg text-sm focus:ring-2 focus:ring-ring focus:border-transparent"
            >
              {aniosDisponibles.map((anio) => (
                <option key={anio} value={anio}>
                  {anio}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Estado del Servicio</label>
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="px-3 py-2 border border-input rounded-lg text-sm focus:ring-2 focus:ring-ring focus:border-transparent"
            >
              <option value="">Todos</option>
              <option value="pendiente">Pendientes</option>
              <option value="completado">Completados</option>
            </select>
          </div>
          <div className="ml-auto">
            <p className="text-sm text-gray-600">
              <span className="font-semibold">{eventos.length}</span> evento{eventos.length !== 1 ? 's' : ''} encontrado{eventos.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </div>

      {/* Lista de Eventos */}
      <div className="space-y-4">
        {eventos.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay trabajo registrado</h3>
            <p className="text-gray-600">
              No se encontraron servicios externos para {salonSeleccionado} en {meses.find(m => m.valor === mesSeleccionado)?.nombre} {anioSeleccionado}.
            </p>
          </div>
        ) : (
          eventos.map((evento) => {
            const todosCompletados = todosServiciosCompletados(evento.servicios);
            const tienePendientes = evento.servicios.some(s => s.estado === 'pendiente');
            
            return (
              <div key={evento.contrato.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                {/* Header del Evento */}
                <div className="px-6 py-4 border-b border-gray-200 bg-muted/30">
                  <button
                    onClick={() => toggleEventoExpandido(evento.contrato.id)}
                    className="w-full flex items-center justify-between text-left hover:opacity-80 transition"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {evento.contrato.codigo_contrato}
                        </h3>
                        {todosCompletados && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-foreground border">
                            <CheckCircle2 className="w-3 h-3" />
                            OK
                          </span>
                        )}
                        {tienePendientes && !todosCompletados && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-muted/50 text-muted-foreground border">
                            <Clock className="w-3 h-3" />
                            Pendiente
                          </span>
                        )}
                        <ChevronDown 
                          className={`w-5 h-5 text-gray-600 transition-transform ${
                            eventosExpandidos[evento.contrato.id] ? 'transform rotate-180' : ''
                          }`}
                        />
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                        {evento.contrato.clientes?.nombre_completo && (
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4" />
                            <span>{evento.contrato.clientes.nombre_completo}</span>
                          </div>
                        )}
                        {evento.contrato.fecha_evento && (
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            <span>
                              {new Date(evento.contrato.fecha_evento).toLocaleDateString('es-ES', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </span>
                          </div>
                        )}
                        {evento.contrato.salones?.nombre && (
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4" />
                            <span>{evento.contrato.salones.nombre}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">Servicios</p>
                      <p className="text-lg font-bold">{evento.servicios.length}</p>
                      <div className="flex gap-2 mt-1 justify-end">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-muted/50 text-muted-foreground">
                          {evento.servicios.filter(s => s.estado === 'pendiente').length} Pendientes
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-foreground">
                          {evento.servicios.filter(s => s.estado === 'completado').length} Completados
                        </span>
                      </div>
                    </div>
                  </button>
                </div>

              {/* Servicios - Solo visible cuando está expandido */}
              {eventosExpandidos[evento.contrato.id] && (
                <div className="p-6">
                  <div className="space-y-4">
                    {evento.servicios.map((servicio) => {
                      const EstadoIcon = ESTADOS_ICONS[servicio.estado] || Clock;
                      
                      return (
                        <div
                          key={servicio.id}
                          className="border-2 rounded-lg p-4 bg-muted/30 border"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-900 mb-1">
                                {SERVICIOS_LABELS[servicio.servicio_tipo] || servicio.servicio_tipo}
                              </h4>
                              {servicio.manager && (
                                <p className="text-xs text-gray-500">
                                  Gestionado por: {servicio.manager.nombre_completo} ({servicio.manager.codigo_manager})
                                </p>
                              )}
                            </div>
                            <div className={`flex items-center gap-2 px-2 py-1 rounded-full text-xs font-medium border ${
                              ESTADOS_COLORS[servicio.estado] || ESTADOS_COLORS.pendiente
                            }`}>
                              <EstadoIcon className="w-3 h-3" />
                              <span className="capitalize">{servicio.estado}</span>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                            <div>
                              <span className="font-medium text-gray-700">Contacto realizado:</span>
                              <span className={`ml-2 ${servicio.contacto_realizado ? 'text-foreground' : 'text-muted-foreground'}`}>
                                {servicio.contacto_realizado ? 'Sí' : 'No'}
                              </span>
                            </div>

                            {servicio.fecha_contacto && (
                              <div>
                                <span className="font-medium text-gray-700">Fecha de Contacto:</span>
                                <span className="ml-2 text-gray-600">
                                  {new Date(servicio.fecha_contacto).toLocaleString('es-ES')}
                                </span>
                              </div>
                            )}

                            {servicio.fecha_pago && (
                              <div>
                                <span className="font-medium text-gray-700">Fecha de Pago:</span>
                                <span className="ml-2 text-gray-600">
                                  {new Date(servicio.fecha_pago).toLocaleString('es-ES')}
                                </span>
                              </div>
                            )}

                            {servicio.servicio_tipo === 'limosina' && servicio.hora_recogida && (
                              <div>
                                <span className="font-medium text-gray-700">Hora de Recogida:</span>
                                <span className="ml-2 text-gray-600">
                                  {new Date(servicio.hora_recogida).toLocaleString('es-ES')}
                                </span>
                              </div>
                            )}

                            {servicio.notas && (
                              <div className="md:col-span-2">
                                <span className="font-medium text-gray-700">Notas:</span>
                                <p className="mt-1 text-gray-600 whitespace-pre-wrap">{servicio.notas}</p>
                              </div>
                            )}

                            {servicio.fecha_actualizacion && (
                              <div className="md:col-span-2 text-xs text-gray-400">
                                Última actualización: {new Date(servicio.fecha_actualizacion).toLocaleString('es-ES')}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default TrabajoManagersGerente;

