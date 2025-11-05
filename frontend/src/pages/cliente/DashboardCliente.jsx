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
import useAuthStore from '../../store/useAuthStore';
import EventCountdown from '../../components/EventCountdown';
import RecordatorioEvento from '../../components/RecordatorioEvento';
import api from '../../config/api';
import { formatearHora } from '../../utils/formatters';
import { generarNombreEventoCorto } from '../../utils/eventNames';

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

      {/* Recordatorio de pendientes */}
      <RecordatorioEvento 
        contrato={contrato}
        playlistData={playlistData}
        mesasData={mesasData}
        ajustesData={ajustesData}
      />

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

          {contrato?.homenajeado && (
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 text-purple-600 mt-0.5 flex items-center justify-center text-lg">
                🎉
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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

        {/* Versiones del Contrato */}
        <Link
          to="/cliente/contratos"
          className="bg-white rounded-xl shadow-sm border p-6 hover:shadow-md transition group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center group-hover:scale-110 transition">
              <FileText className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Mis Contratos</p>
              <p className="text-2xl font-bold text-gray-900">
                Ver PDFs
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Historial completo
              </p>
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
                  <span className="text-gray-700">
                    {formatearServicioConCantidad(cs.servicios, cs.cantidad)}
                  </span>
                </div>
                <span className="font-medium text-gray-900">
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

      {/* Historial de Pagos */}
      {pagosData && pagosData.pagos && pagosData.pagos.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border">
          <div className="p-6 border-b">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Historial de Pagos</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Todos los pagos realizados
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Total de pagos:</p>
                <p className="text-2xl font-bold text-green-600">
                  {pagosData.count || 0}
                </p>
              </div>
            </div>
          </div>
          <div className="divide-y">
            {pagosData.pagos.map((pago) => (
              <div 
                key={pago.id} 
                className={`p-6 hover:bg-gray-50 transition ${
                  pago.estado === 'anulado' ? 'bg-red-50' : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <CreditCard className={`w-5 h-5 ${
                        pago.estado === 'anulado' ? 'text-red-600' : 'text-green-600'
                      }`} />
                      <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                        pago.estado === 'anulado'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-green-100 text-green-700'
                      }`}>
                        {pago.estado === 'anulado' ? '❌ ANULADO' : '✓ Completado'}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(pago.fecha_pago).toLocaleDateString('es-ES', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-gray-700">
                        <span className="font-medium">Método:</span>{' '}
                        {pago.metodo_pago === 'efectivo' && '💵 Efectivo'}
                        {pago.metodo_pago === 'transferencia' && '🏦 Transferencia'}
                        {pago.metodo_pago === 'tarjeta' && `💳 Tarjeta ${pago.tipo_tarjeta || ''}`}
                        {pago.metodo_pago === 'cheque' && '📝 Cheque'}
                      </p>
                      {pago.numero_referencia && (
                        <p className="text-xs text-gray-600">
                          Ref: {pago.numero_referencia}
                        </p>
                      )}
                      {pago.notas && (
                        <p className="text-xs text-gray-600 italic">
                          {pago.notas}
                        </p>
                      )}
                      {pago.vendedores && (
                        <p className="text-xs text-gray-500">
                          Registrado por: {pago.vendedores.nombre_completo}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="ml-4 text-right">
                    <p className="text-xs text-gray-500 mb-1">Monto:</p>
                    <p className={`text-2xl font-bold ${
                      pago.estado === 'anulado' ? 'text-red-600 line-through' : 'text-green-600'
                    }`}>
                      ${parseFloat(pago.monto || 0).toLocaleString()}
                    </p>
                    {pago.recargo_tarjeta > 0 && (
                      <p className="text-xs text-gray-500 mt-1">
                        + ${parseFloat(pago.recargo_tarjeta).toFixed(2)} recargo
                      </p>
                    )}
                    <p className="text-sm text-gray-700 font-medium mt-1">
                      Total: ${parseFloat(pago.monto_total || 0).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default DashboardCliente;

