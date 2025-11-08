import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Calendar,
  Users,
  Bell,
  CheckCircle,
  XCircle,
  Clock,
  Filter,
  Search,
  Loader2,
  AlertCircle,
  TrendingUp,
  MessageCircle,
} from 'lucide-react';
import useAuthStore from '../store/useAuthStore';
import api from '../config/api';
import { generarNombreEvento, getEventoEmoji } from '../utils/eventNames';

function GestionEventos() {
  const { user } = useAuthStore();
  const [filtroEstado, setFiltroEstado] = useState('pendiente');
  const [busqueda, setBusqueda] = useState('');

  // Obtener solicitudes pendientes
  const { data: solicitudesData, isLoading: loadingSolicitudes } = useQuery({
    queryKey: ['solicitudes-vendedor', filtroEstado],
    queryFn: async () => {
      const endpoint =
        filtroEstado === 'pendiente'
          ? '/solicitudes/vendedor/pendientes'
          : `/solicitudes/vendedor/todas?estado=${filtroEstado}`;
      const response = await api.get(endpoint);
      return response.data;
    },
  });

  // Obtener estadísticas
  const { data: estadisticas } = useQuery({
    queryKey: ['solicitudes-estadisticas'],
    queryFn: async () => {
      const response = await api.get('/solicitudes/vendedor/estadisticas');
      return response.data.estadisticas;
    },
  });

  // Obtener contratos activos del vendedor
  const { data: contratosData, isLoading: loadingContratos } = useQuery({
    queryKey: ['contratos-vendedor'],
    queryFn: async () => {
      const response = await api.get('/contratos');
      return response.data;
    },
  });

  const solicitudes = solicitudesData?.solicitudes || [];
  const contratos = contratosData?.contratos || [];

  // Filtrar solicitudes por búsqueda
  const solicitudesFiltradas = solicitudes.filter((sol) => {
    const cliente = sol.contratos?.clientes?.nombre_completo || '';
    const codigo = sol.contratos?.codigo_contrato || '';
    const busquedaLower = busqueda.toLowerCase();
    return (
      cliente.toLowerCase().includes(busquedaLower) ||
      codigo.toLowerCase().includes(busquedaLower)
    );
  });

  // Calcular eventos próximos (menos de 30 días)
  const eventosProximos = contratos.filter((c) => {
    if (!c.fecha_evento) return false;
    const dias = Math.floor(
      (new Date(c.fecha_evento) - new Date()) / (1000 * 60 * 60 * 24)
    );
    return dias >= 0 && dias <= 30;
  });

  if (loadingContratos) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Gestión de Eventos</h1>
        <p className="text-gray-600 mt-1">
          Administra tus eventos activos y solicitudes de clientes
        </p>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Eventos Activos</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {contratos.length}
              </p>
            </div>
            <Calendar className="w-12 h-12 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Solicitudes Pendientes</p>
              <p className="text-3xl font-bold text-orange-500 mt-2">
                {estadisticas?.pendientes || 0}
              </p>
            </div>
            <Bell className="w-12 h-12 text-orange-500" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Eventos Próximos</p>
              <p className="text-3xl font-bold text-purple-600 mt-2">
                {eventosProximos.length}
              </p>
              <p className="text-xs text-gray-500 mt-1">Próximos 30 días</p>
            </div>
            <TrendingUp className="w-12 h-12 text-purple-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Solicitudes Aprobadas</p>
              <p className="text-3xl font-bold text-green-600 mt-2">
                {estadisticas?.aprobadas || 0}
              </p>
            </div>
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
        </div>
      </div>

      {/* Tabs de Filtro */}
      <div className="bg-white rounded-xl shadow-sm border p-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex gap-2">
            <button
              onClick={() => setFiltroEstado('pendiente')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filtroEstado === 'pendiente'
                  ? 'bg-orange-100 text-orange-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Clock className="w-4 h-4 inline mr-2" />
              Pendientes ({estadisticas?.pendientes || 0})
            </button>
            <button
              onClick={() => setFiltroEstado('aprobada')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filtroEstado === 'aprobada'
                  ? 'bg-green-100 text-green-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <CheckCircle className="w-4 h-4 inline mr-2" />
              Aprobadas ({estadisticas?.aprobadas || 0})
            </button>
            <button
              onClick={() => setFiltroEstado('rechazada')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filtroEstado === 'rechazada'
                  ? 'bg-red-100 text-red-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <XCircle className="w-4 h-4 inline mr-2" />
              Rechazadas ({estadisticas?.rechazadas || 0})
            </button>
          </div>

          {/* Búsqueda */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar por cliente o código..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
            />
          </div>
        </div>
      </div>

      {/* Lista de Solicitudes */}
      <div className="bg-white rounded-xl shadow-sm border">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">
            Solicitudes {filtroEstado === 'pendiente' ? 'Pendientes' : filtroEstado === 'aprobada' ? 'Aprobadas' : 'Rechazadas'}
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            {solicitudesFiltradas.length} solicitud(es) encontrada(s)
          </p>
        </div>

        {loadingSolicitudes ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
          </div>
        ) : solicitudesFiltradas.length === 0 ? (
          <div className="text-center py-12">
            <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No hay solicitudes {filtroEstado}s</p>
          </div>
        ) : (
          <div className="divide-y">
            {solicitudesFiltradas.map((solicitud) => (
              <SolicitudCard key={solicitud.id} solicitud={solicitud} />
            ))}
          </div>
        )}
      </div>

      {/* Lista de Eventos Próximos */}
      {eventosProximos.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border">
          <div className="p-6 border-b">
            <h2 className="text-xl font-bold text-gray-900">Eventos Próximos</h2>
            <p className="text-sm text-gray-600 mt-1">
              Eventos en los próximos 30 días
            </p>
          </div>
          <div className="divide-y">
            {eventosProximos.map((contrato) => {
              const dias = Math.floor(
                (new Date(contrato.fecha_evento) - new Date()) / (1000 * 60 * 60 * 24)
              );
              return (
                <div key={contrato.id} className="p-6 hover:bg-gray-50 transition">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{getEventoEmoji(contrato)}</span>
                        <div className="flex-1">
                          <h3 className="font-bold text-gray-900">
                            {generarNombreEvento(contrato)}
                          </h3>
                          <p className="text-xs text-gray-500 font-mono">
                            {contrato.codigo_contrato}
                          </p>
                        </div>
                        {dias <= 7 && (
                          <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full font-bold animate-pulse">
                            ¡{dias} días!
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        📅 {new Date(contrato.fecha_evento).toLocaleDateString('es-ES', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>
                      <p className="text-sm text-gray-600">
                        👥 {contrato.cantidad_invitados} invitados
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Link
                        to={`/chat/${contrato.id}`}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                      >
                        <MessageCircle className="w-4 h-4" />
                        Chat
                      </Link>
                      <Link
                        to={`/contratos/${contrato.id}`}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
                      >
                        Ver Detalles
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// Componente para cada solicitud
function SolicitudCard({ solicitud }) {
  return (
    <div className="p-6 hover:bg-gray-50 transition">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-lg">{getEventoEmoji(solicitud.contratos)}</span>
            <div className="flex-1">
              <h3 className="font-bold text-gray-900">
                {generarNombreEvento(solicitud.contratos)}
              </h3>
              <p className="text-xs text-gray-500 font-mono">
                {solicitud.contratos?.codigo_contrato}
              </p>
            </div>
            {solicitud.tipo_solicitud === 'invitados' ? (
              <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                👥 Invitados
              </span>
            ) : (
              <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                ➕ Servicio
              </span>
            )}
          </div>

          {solicitud.tipo_solicitud === 'invitados' ? (
            <p className="text-sm text-gray-700 mb-2">
              Solicita agregar <strong>{solicitud.invitados_adicionales}</strong> invitados adicionales
            </p>
          ) : (
            <div className="text-sm text-gray-700 mb-2">
              <p>
                Solicita agregar: <strong>{solicitud.servicios?.nombre}</strong>
              </p>
              {solicitud.cantidad_servicio > 1 && (
                <p>Cantidad: {solicitud.cantidad_servicio}</p>
              )}
              {solicitud.costo_adicional && (
                <p className="text-green-600 font-bold mt-1">
                  Costo adicional: ${parseFloat(solicitud.costo_adicional).toFixed(2)}
                </p>
              )}
            </div>
          )}

          {solicitud.detalles_solicitud && (
            <p className="text-sm text-gray-600 italic mb-2">
              "{solicitud.detalles_solicitud}"
            </p>
          )}

          <p className="text-xs text-gray-500">
            Solicitado el {new Date(solicitud.fecha_solicitud).toLocaleDateString('es-ES')}
          </p>

          {solicitud.motivo_rechazo && (
            <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">
                <strong>Motivo de rechazo:</strong> {solicitud.motivo_rechazo}
              </p>
            </div>
          )}
        </div>

        {solicitud.estado === 'pendiente' && (
          <div className="flex gap-2 ml-4">
            <Link
              to={`/solicitudes/${solicitud.id}`}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium"
            >
              Gestionar
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default GestionEventos;

