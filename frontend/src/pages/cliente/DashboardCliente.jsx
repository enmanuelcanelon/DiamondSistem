import { useQuery } from '@tanstack/react-query';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  DollarSign,
  Music,
  Table,
  Loader2,
  CreditCard,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import useAuthStore from '../../store/useAuthStore';
import EventCountdown from '../../components/EventCountdown';
import api from '../../config/api';
import { formatearHora } from '../../utils/formatters';
import { generarNombreEventoCorto } from '../../utils/eventNames';

function DashboardCliente() {
  const { user } = useAuthStore();
  const contratoId = user?.contrato_id;

  // Query para obtener el contrato completo
  const { data: contrato, isLoading } = useQuery({
    queryKey: ['contrato-cliente', contratoId],
    queryFn: async () => {
      const response = await api.get(`/contratos/${contratoId}`);
      return response.data.contrato;
    },
    enabled: !!contratoId,
  });

  // Obtener historial de cambios
  const { data: historialData } = useQuery({
    queryKey: ['historial-contrato', contratoId],
    queryFn: async () => {
      const response = await api.get(`/contratos/${contratoId}/historial`);
      return response.data;
    },
    enabled: !!contratoId,
  });

  // Query para obtener estadísticas de playlist
  const { data: playlistData } = useQuery({
    queryKey: ['playlist-stats', contratoId],
    queryFn: async () => {
      const response = await api.get(`/playlist/contrato/${contratoId}`);
      return response.data;
    },
    enabled: !!contratoId,
  });

  // Query para obtener estadísticas de mesas
  const { data: mesasData } = useQuery({
    queryKey: ['mesas-stats', contratoId],
    queryFn: async () => {
      const response = await api.get(`/mesas/contrato/${contratoId}`);
      return response.data;
    },
    enabled: !!contratoId,
  });

  // Query para obtener invitados
  const { data: invitadosData } = useQuery({
    queryKey: ['invitados-stats', contratoId],
    queryFn: async () => {
      const response = await api.get(`/invitados/contrato/${contratoId}`);
      return response.data;
    },
    enabled: !!contratoId,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  const porcentajePagado = contrato?.total_contrato > 0
    ? (parseFloat(contrato.total_pagado || 0) / parseFloat(contrato.total_contrato)) * 100
    : 0;

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl p-6 text-white shadow-lg">
        <h1 className="text-2xl font-bold mb-2">
          ¡Bienvenido, {user?.nombre_completo}! 🎉
        </h1>
        <p className="text-purple-100">
          Aquí puedes gestionar todos los detalles de tu evento especial
        </p>
      </div>

      {/* Event Countdown */}
      {contrato?.fecha_evento && (
        <EventCountdown 
          fechaEvento={contrato.fecha_evento} 
          nombreEvento={generarNombreEventoCorto(contrato)}
        />
      )}

      {/* Event Info Card */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          Información del Evento
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-start gap-3">
            <Calendar className="w-5 h-5 text-purple-600 mt-0.5" />
            <div>
              <p className="text-sm text-gray-600">Fecha del Evento</p>
              <p className="font-semibold text-gray-900">
                {contrato?.fecha_evento ? new Date(contrato.fecha_evento).toLocaleDateString('es-ES', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                }) : 'No especificada'}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-purple-600 mt-0.5" />
            <div>
              <p className="text-sm text-gray-600">Horario</p>
              <p className="font-semibold text-gray-900">
                {contrato?.hora_inicio && contrato?.hora_fin
                  ? `${formatearHora(contrato.hora_inicio)} - ${formatearHora(contrato.hora_fin)}`
                  : 'No especificado'}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-purple-600 mt-0.5" />
            <div>
              <p className="text-sm text-gray-600">Lugar</p>
              <p className="font-semibold text-gray-900">
                {contrato?.ofertas?.lugar_evento || 'Por definir'}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Users className="w-5 h-5 text-purple-600 mt-0.5" />
            <div>
              <p className="text-sm text-gray-600">Invitados</p>
              <p className="font-semibold text-gray-900">
                {contrato?.cantidad_invitados || 0} personas
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Status */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Estado de Pago</h2>
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${
            contrato?.estado_pago === 'pagado'
              ? 'bg-green-100 text-green-800'
              : contrato?.estado_pago === 'parcial'
              ? 'bg-blue-100 text-blue-800'
              : 'bg-yellow-100 text-yellow-800'
          }`}>
            {contrato?.estado_pago === 'pagado' ? '✓ Pagado Completo' :
             contrato?.estado_pago === 'parcial' ? 'Pago Parcial' :
             'Pendiente'}
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Total del Contrato:</span>
            <span className="text-2xl font-bold text-gray-900">
              ${parseFloat(contrato?.total_contrato || 0).toLocaleString()}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-gray-600">Pagado:</span>
            <span className="text-xl font-semibold text-green-600">
              ${parseFloat(contrato?.total_pagado || 0).toLocaleString()}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-gray-600">Saldo Pendiente:</span>
            <span className="text-xl font-semibold text-red-600">
              ${parseFloat(contrato?.saldo_pendiente || 0).toLocaleString()}
            </span>
          </div>

          {/* Progress bar */}
          <div className="pt-2">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Progreso de pago</span>
              <span>{porcentajePagado.toFixed(0)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-gradient-to-r from-purple-600 to-pink-600 h-3 rounded-full transition-all"
                style={{ width: `${Math.min(porcentajePagado, 100)}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Playlist Stats */}
        <Link
          to={`/cliente/playlist/${contratoId}`}
          className="bg-white rounded-xl shadow-sm border p-6 hover:shadow-md transition group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center group-hover:scale-110 transition">
              <Music className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Canciones en Playlist</p>
              <p className="text-2xl font-bold text-gray-900">
                {playlistData?.total || 0}
              </p>
              {playlistData?.stats && (
                <p className="text-xs text-gray-500 mt-1">
                  {playlistData.stats.favoritas} favoritas • {playlistData.stats.prohibidas} prohibidas
                </p>
              )}
            </div>
          </div>
        </Link>

        {/* Mesas Stats */}
        <Link
          to={`/cliente/mesas/${contratoId}`}
          className="bg-white rounded-xl shadow-sm border p-6 hover:shadow-md transition group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center group-hover:scale-110 transition">
              <Table className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Mesas Configuradas</p>
              <p className="text-2xl font-bold text-gray-900">
                {mesasData?.total || 0}
              </p>
              {invitadosData && (
                <p className="text-xs text-gray-500 mt-1">
                  {invitadosData.con_mesa || 0}/{invitadosData.total || 0} invitados asignados
                </p>
              )}
            </div>
          </div>
        </Link>

        {/* Paquete Contratado */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Paquete</p>
              <p className="text-lg font-bold text-gray-900 truncate">
                {contrato?.paquetes?.nombre || 'N/A'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Package Details */}
      {contrato?.paquetes && (
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Paquete Contratado
          </h2>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">{contrato.paquetes.nombre}</p>
              <p className="text-sm text-gray-600">
                ${parseFloat(contrato.paquetes.precio_base).toLocaleString()}
                {contrato.paquetes.nombre.includes('persona') ? '/persona' : ''}
              </p>
            </div>
          </div>
          {contrato.paquetes.paquetes_servicios && contrato.paquetes.paquetes_servicios.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Servicios Incluidos:</h3>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {contrato.paquetes.paquetes_servicios.map((ps) => (
                  <li key={ps.id} className="flex items-center gap-2 text-sm text-gray-700">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    {ps.servicios?.nombre}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Additional Services */}
      {contrato?.contratos_servicios && contrato.contratos_servicios.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Servicios Adicionales
          </h2>
          <ul className="space-y-3">
            {contrato.contratos_servicios.map((cs) => (
              <li key={cs.id} className="flex items-center justify-between border-b pb-2 last:border-b-0">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-purple-600" />
                  <span className="text-gray-700">{cs.servicios?.nombre}</span>
                </div>
                <span className="font-medium text-gray-900">
                  {cs.cantidad > 1 && `${cs.cantidad} x `}
                  ${parseFloat(cs.precio_unitario).toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Historial de Cambios */}
      {historialData && historialData.historial && historialData.historial.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border">
          <div className="p-6 border-b">
            <h2 className="text-xl font-bold text-gray-900">Historial de Cambios</h2>
            <p className="text-sm text-gray-600 mt-1">
              Cambios recientes en tu contrato
            </p>
          </div>
          <div className="divide-y">
            {historialData.historial.slice(0, 5).map((cambio) => (
              <div key={cambio.id} className="p-6 hover:bg-gray-50 transition">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">
                        📋 Modificación
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(cambio.fecha_cambio).toLocaleDateString('es-ES', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                    <p className="text-sm text-gray-900 mb-2">
                      {cambio.motivo}
                    </p>
                    {cambio.vendedores && (
                      <p className="text-xs text-gray-600">
                        Por: {cambio.vendedores.nombre_completo}
                      </p>
                    )}
                  </div>
                  <div className="ml-4 text-right">
                    <p className="text-xs text-gray-500">Total anterior:</p>
                    <p className="text-sm text-gray-700 mb-1">
                      ${parseFloat(cambio.precio_original || 0).toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-500">Nuevo total:</p>
                    <p className="text-lg font-bold text-green-600">
                      ${parseFloat(cambio.precio_nuevo || 0).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {historialData.historial.length > 5 && (
            <div className="p-4 bg-gray-50 text-center">
              <p className="text-sm text-gray-600">
                Mostrando los 5 cambios más recientes de {historialData.total} totales
              </p>
            </div>
          )}
        </div>
      )}

      {/* Contact Card */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-6 text-white">
        <div className="flex items-start gap-4">
          <AlertCircle className="w-6 h-6 flex-shrink-0 mt-1" />
          <div>
            <h3 className="font-semibold mb-1">¿Necesitas ayuda?</h3>
            <p className="text-sm text-indigo-100 mb-3">
              Si tienes alguna pregunta o necesitas hacer cambios, contacta a tu asesor de eventos.
            </p>
            {contrato?.vendedores && (
              <div className="bg-white/20 rounded-lg p-3 backdrop-blur-sm">
                <p className="text-sm font-medium">{contrato.vendedores.nombre_completo}</p>
                <p className="text-sm text-indigo-100">{contrato.vendedores.email}</p>
                {contrato.vendedores.telefono && (
                  <p className="text-sm text-indigo-100">{contrato.vendedores.telefono}</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardCliente;

