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
  FileText,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import useAuthStore from '@shared/store/useAuthStore';
import EventCountdown from '@components/EventCountdown';
import RecordatorioEvento from '@components/RecordatorioEvento';
import api from '@shared/config/api';
import { formatearHora } from '@shared/utils/formatters';
import { generarNombreEventoCorto } from '@utils/eventNames';

function DashboardCliente() {
  const { user } = useAuthStore();
  const contratoId = user?.contrato_id;

  // Función para formatear nombre de servicio con cantidad
  const formatearServicioConCantidad = (servicio, cantidad) => {
    const nombre = servicio?.nombre || '';
    const precio = servicio?.precio_base || 0;

    // Si la cantidad es 1 o menos, solo mostrar el nombre
    if (cantidad <= 1) {
      return nombre;
    }

    // Reglas especiales según el tipo de servicio
    if (nombre.toLowerCase().includes('personal') || nombre.toLowerCase().includes('bartender') || nombre.toLowerCase().includes('mesero')) {
      // Personal de Servicio (4)
      return `${nombre} (${cantidad})`;
    } else if (nombre.toLowerCase().includes('champagne') || nombre.toLowerCase().includes('champaña') || nombre.toLowerCase().includes('sidra') || nombre.toLowerCase().includes('vino')) {
      // Champaña (10 Botellas)
      return `${nombre} (${cantidad} Botellas)`;
    } else if (nombre.toLowerCase().includes('dulce') || nombre.toLowerCase().includes('postre')) {
      // Mini Dulces (6/u)
      return `${nombre} (${cantidad}/u)`;
    } else {
      // Formato genérico (N unidades)
      return `${nombre} (${cantidad})`;
    }
  };

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

  // Obtener historial de pagos
  const { data: pagosData } = useQuery({
    queryKey: ['pagos-contrato', contratoId],
    queryFn: async () => {
      const response = await api.get(`/contratos/${contratoId}/pagos`);
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

  // Query para obtener ajustes del evento
  const { data: ajustesData } = useQuery({
    queryKey: ['ajustes-evento', contratoId],
    queryFn: async () => {
      const response = await api.get(`/ajustes-evento/contrato/${contratoId}`);
      return response.data;
    },
    enabled: !!contratoId,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-gray-900" />
      </div>
    );
  }

  const porcentajePagado = contrato?.total_contrato > 0
    ? (parseFloat(contrato.total_pagado || 0) / parseFloat(contrato.total_contrato)) * 100
    : 0;

  return (
    <div className="space-y-6">
      {/* Welcome Section Minimalista */}
      <div className="card">
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">
          Bienvenido, {user?.nombre_completo}
        </h1>
        <p className="text-gray-600">
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

      {/* Recordatorio de pendientes */}
      <RecordatorioEvento 
        contrato={contrato}
        playlistData={playlistData}
        mesasData={mesasData}
        ajustesData={ajustesData}
      />

      {/* Event Info Card Minimalista */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">
          Información del Evento
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-start gap-3">
            <Calendar className="w-5 h-5 text-gray-700 mt-0.5" />
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
            <Clock className="w-5 h-5 text-gray-700 mt-0.5" />
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
            <MapPin className="w-5 h-5 text-gray-700 mt-0.5" />
            <div>
              <p className="text-sm text-gray-600">Lugar</p>
              <p className="font-semibold text-gray-900">
                {contrato?.ofertas?.lugar_evento || 'Por definir'}
              </p>
            </div>
          </div>

          {contrato?.homenajeado && (
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 text-gray-700 mt-0.5 flex items-center justify-center text-lg">
                👑
              </div>
              <div>
                <p className="text-sm text-gray-600">Homenajeado/a</p>
                <p className="font-semibold text-gray-900">
                  {contrato.homenajeado}
                </p>
              </div>
            </div>
          )}

          <div className="flex items-start gap-3">
            <Users className="w-5 h-5 text-gray-700 mt-0.5" />
            <div>
              <p className="text-sm text-gray-600">Invitados</p>
              <p className="font-semibold text-gray-900">
                {contrato?.cantidad_invitados || 0} personas
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Status Minimalista */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Estado de Pago</h2>
          <div className={`px-3 py-1.5 rounded-full text-xs font-medium ${
            contrato?.estado_pago === 'pagado'
              ? 'bg-green-50 text-green-700 border border-green-200'
              : contrato?.estado_pago === 'parcial'
              ? 'bg-blue-50 text-blue-700 border border-blue-200'
              : 'bg-yellow-50 text-yellow-700 border border-yellow-200'
          }`}>
            {contrato?.estado_pago === 'pagado' ? 'Pagado Completo' :
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
          <div className="w-full bg-gray-100 rounded-full h-2">
            <div
              className="bg-gray-900 h-2 rounded-full transition-all"
              style={{ width: `${Math.min(porcentajePagado, 100)}%` }}
            ></div>
          </div>
          </div>
        </div>
      </div>

        {/* Quick Stats Grid Minimalista */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Playlist Stats */}
        <Link
          to={`/playlist/${contratoId}`}
          className="card card-hover group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center group-hover:scale-110 transition">
              <Music className="w-6 h-6 text-gray-700" />
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
          to={`/mesas/${contratoId}`}
          className="card card-hover group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center group-hover:scale-110 transition">
              <Table className="w-6 h-6 text-gray-700" />
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

        {/* Versiones del Contrato */}
        <Link
          to="/contratos"
          className="card card-hover group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center group-hover:scale-110 transition">
              <FileText className="w-6 h-6 text-gray-700" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Mis Contratos</p>
              <p className="text-2xl font-bold text-gray-900">
                Ver PDFs
              </p>
              {historialData?.versiones && (
                <p className="text-xs text-gray-500 mt-1">
                  {historialData.versiones.length} versión{historialData.versiones.length !== 1 ? 'es' : ''}
                </p>
              )}
            </div>
          </div>
        </Link>

        {/* Payment Quick Access */}
        <Link
          to={`/contratos`}
          className="card card-hover group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center group-hover:scale-110 transition">
              <CreditCard className="w-6 h-6 text-gray-700" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Historial de Pagos</p>
              <p className="text-2xl font-bold text-gray-900">
                {pagosData?.pagos?.length || 0}
              </p>
              {pagosData?.pagos && pagosData.pagos.length > 0 && (
                <p className="text-xs text-gray-500 mt-1">
                  Ver detalles
                </p>
              )}
            </div>
          </div>
        </Link>
      </div>

      {/* Services Included */}
      {contrato?.contratos_servicios && contrato.contratos_servicios.length > 0 && (
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Servicios Incluidos en tu Paquete
          </h2>
          <ul className="space-y-2">
            {(() => {
              // Filtrar servicios que no son adicionales (cantidad > 0 o precio_base > 0)
              const serviciosFiltrados = contrato.contratos_servicios.filter(cs => {
                // Si tiene cantidad > 0, es un servicio incluido
                if (cs.cantidad > 0) return true;
                // Si tiene precio_base > 0, es un servicio incluido
                if (cs.servicios?.precio_base > 0) return true;
                // Si no tiene cantidad ni precio, probablemente es un servicio base del paquete
                return !cs.servicios?.precio_base || cs.servicios.precio_base === 0;
              });
              
              if (serviciosFiltrados.length === 0) {
                return (
                  <li className="text-gray-600 text-sm">
                    No hay servicios adicionales registrados
                  </li>
                );
              }
              
              return serviciosFiltrados.map((cs) => (
                <li key={cs.id} className="flex items-center justify-between border-b pb-2 last:border-b-0">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-gray-700" />
                    <span className="text-gray-700">
                      {formatearServicioConCantidad(cs.servicios, cs.cantidad)}
                    </span>
                  </div>
                  <span className="font-medium text-gray-900">
                    {cs.cantidad > 1 ? `x${cs.cantidad}` : ''}
                  </span>
                </li>
              ));
            })()}
          </ul>
        </div>
      )}
    </div>
  );
}

export default DashboardCliente;
