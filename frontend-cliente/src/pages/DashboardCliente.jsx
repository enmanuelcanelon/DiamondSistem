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
  Download,
  TrendingUp,
  TrendingDown,
  ArrowRight,
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

  // Query para obtener versiones del contrato
  const { data: versionesData } = useQuery({
    queryKey: ['versiones-contrato', contratoId],
    queryFn: async () => {
      const response = await api.get(`/contratos/${contratoId}/versiones`);
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
            {(() => {
        // Función helper para obtener el nombre del servicio ajustado según el salón
        const obtenerNombreServicio = (nombreServicio) => {
          if (!nombreServicio) return nombreServicio;
          
          const salonNombre = contrato?.salones?.nombre || contrato?.lugar_salon || '';
          
          // Reemplazar Pantalla LED por Pantalla TV en Doral
          if (salonNombre === 'Doral' && nombreServicio === 'Pantalla LED') {
            return 'Pantalla TV';
          }
          
          // Agregar información de millas a Limosina
          if (nombreServicio === 'Limosina') {
            return 'Limosina (15 Millas)';
          }
          
          return nombreServicio;
        };

        // Separar servicios incluidos en el paquete de servicios adicionales
        const serviciosIncluidos = [];
        const serviciosAdicionales = [];
        const salonNombre = contrato?.salones?.nombre || contrato?.lugar_salon || '';

        // Obtener servicios del paquete
        if (contrato?.paquetes?.paquetes_servicios) {
          contrato.paquetes.paquetes_servicios.forEach((ps) => {
            const nombreServicio = ps.servicios?.nombre || '';
            
            // Filtrar Máquina de Chispas si el salón es Kendall
            if (salonNombre === 'Kendall' && nombreServicio?.toLowerCase().includes('chispas')) {
              return; // No mostrar este servicio
            }
            
            serviciosIncluidos.push({
              id: `paquete-${ps.servicio_id}`,
              nombre: obtenerNombreServicio(nombreServicio),
              cantidad: ps.cantidad || 1
            });
          });
        }

        // Obtener servicios adicionales del contrato
        if (contrato?.contratos_servicios) {
          // Obtener IDs de servicios incluidos en el paquete para comparar
          const serviciosPaqueteIds = new Set();
          if (contrato?.paquetes?.paquetes_servicios) {
            contrato.paquetes.paquetes_servicios.forEach((ps) => {
              serviciosPaqueteIds.add(ps.servicio_id);
            });
          }
          
          // Filtrar servicios mutuamente excluyentes (solo mostrar un Photobooth)
          const serviciosFiltrados = [];
          let photoboothConPrecio = null;
          let photoboothSinPrecio = null;
          
          for (const cs of contrato.contratos_servicios) {
            // Solo procesar servicios adicionales (no incluidos en paquete)
            if (cs.incluido_en_paquete) {
              continue;
            }
            
            // Verificar que el servicio no esté en el paquete por ID
            const servicioId = cs.servicio_id;
            if (serviciosPaqueteIds.has(servicioId)) {
              continue;
            }
            
            const nombreServicio = cs.servicios?.nombre || '';
            const subtotal = parseFloat(cs.subtotal || 0);
            const precioUnitario = parseFloat(cs.precio_unitario || 0);
            
            // Filtrar servicios con costo $0
            if (subtotal === 0 && precioUnitario === 0) {
              continue;
            }
            
            // Filtrar Máquina de Chispas si el salón es Kendall
            if (salonNombre === 'Kendall' && nombreServicio?.toLowerCase().includes('chispas')) {
              continue; // No mostrar este servicio
            }
            
            if (nombreServicio.includes('Photobooth')) {
              // Priorizar el que tiene precio/subtotal > 0 (el realmente seleccionado)
              if (subtotal > 0 || precioUnitario > 0) {
                photoboothConPrecio = cs;
              } else {
                // Guardar como respaldo si no hay uno con precio
                if (!photoboothSinPrecio) {
                  photoboothSinPrecio = cs;
                }
              }
              continue;
            }
            
            // Para otros servicios, agregar normalmente
            serviciosFiltrados.push(cs);
          }
          
          // Agregar el Photobooth seleccionado (solo si tiene precio > 0)
          if (photoboothConPrecio) {
            serviciosFiltrados.push(photoboothConPrecio);
          }
          
          serviciosFiltrados.forEach((cs) => {
            serviciosAdicionales.push({
              id: cs.id,
              nombre: obtenerNombreServicio(cs.servicios?.nombre || ''),
              cantidad: cs.cantidad || 1
            });
              });
        }

        // Si no hay paquete ni servicios adicionales, no mostrar la sección
        const nombrePaquete = contrato?.paquetes?.nombre || 'Sin paquete';
        if (!contrato?.paquetes && serviciosAdicionales.length === 0) {
          return null;
        }

                return (
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Mi Paquete y Servicios
            </h2>
            
            {/* Información del Paquete */}
            {contrato?.paquetes && (
              <div className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-100">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
                    {nombrePaquete.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">
                      Paquete {nombrePaquete}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {serviciosIncluidos.length} servicio{serviciosIncluidos.length !== 1 ? 's' : ''} incluido{serviciosIncluidos.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                
                {/* Lista de servicios incluidos en el paquete */}
                {serviciosIncluidos.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-purple-200">
                    <p className="text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                      Incluye:
                    </p>
                    <ul className="space-y-1.5">
                      {serviciosIncluidos.map((servicio) => (
                        <li key={servicio.id} className="flex items-center gap-2 text-sm text-gray-700">
                          <CheckCircle className="w-3.5 h-3.5 text-purple-600 flex-shrink-0" />
                          <span>
                            {formatearServicioConCantidad({ nombre: servicio.nombre }, servicio.cantidad)}
                          </span>
                  </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Servicios Adicionales */}
            {serviciosAdicionales.length > 0 ? (
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wide">
                  Servicios Adicionales
                </h3>
                <ul className="space-y-2">
                  {serviciosAdicionales.map((servicio) => (
                    <li key={servicio.id} className="flex items-center justify-between border-b pb-2 last:border-b-0">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-gray-700" />
                    <span className="text-gray-700">
                          {formatearServicioConCantidad({ nombre: servicio.nombre }, servicio.cantidad)}
                    </span>
                  </div>
                  <span className="font-medium text-gray-900">
                        {servicio.cantidad > 1 ? `x${servicio.cantidad}` : ''}
                  </span>
                </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500 text-sm">
                No tienes servicios adicionales contratados
              </div>
            )}
          </div>
        );
            })()}

      {/* Historial de Pagos */}
      {pagosData?.pagos && pagosData.pagos.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Historial de Pagos
            </h2>
            <Link
              to="/contratos"
              className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
            >
              Ver todos
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="space-y-3">
            {pagosData.pagos.slice(0, 5).map((pago) => (
              <div
                key={pago.id}
                className={`flex items-center justify-between p-3 rounded-lg border ${
                  pago.estado === 'anulado'
                    ? 'bg-red-50 border-red-200'
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    pago.estado === 'anulado'
                      ? 'bg-red-100'
                      : 'bg-green-100'
                  }`}>
                    <CreditCard className={`w-5 h-5 ${
                      pago.estado === 'anulado'
                        ? 'text-red-600'
                        : 'text-green-600'
                    }`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className={`font-medium ${
                        pago.estado === 'anulado'
                          ? 'text-red-900 line-through'
                          : 'text-gray-900'
                      }`}>
                        ${parseFloat(pago.monto_total || pago.monto).toLocaleString()}
                      </p>
                      {pago.estado === 'anulado' && (
                        <span className="px-2 py-0.5 bg-red-600 text-white text-xs font-bold rounded">
                          ANULADO
                        </span>
                      )}
                    </div>
                    <p className={`text-sm ${
                      pago.estado === 'anulado'
                        ? 'text-red-700'
                        : 'text-gray-600'
                    }`}>
                      {pago.metodo_pago} • {new Date(pago.fecha_pago).toLocaleDateString('es-ES', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </p>
                    {pago.numero_referencia && (
                      <p className="text-xs text-gray-500">Ref: {pago.numero_referencia}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {pagosData.pagos.length > 5 && (
              <p className="text-sm text-gray-500 text-center pt-2">
                Y {pagosData.pagos.length - 5} pago{pagosData.pagos.length - 5 !== 1 ? 's' : ''} más
              </p>
            )}
          </div>
        </div>
      )}

      {/* Historial de Versiones del Contrato */}
      {versionesData?.versiones && versionesData.versiones.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Versiones del Contrato
            </h2>
            <Link
              to="/contratos"
              className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
            >
              Ver todas
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="space-y-3">
            {versionesData.versiones.slice(0, 3).map((version, index) => {
              const esUltimaVersion = index === 0;
              const versionAnterior = versionesData.versiones[index + 1];
              const diferenciaTotal = versionAnterior
                ? parseFloat(version.total_contrato) - parseFloat(versionAnterior.total_contrato)
                : 0;

              return (
                <div
                  key={version.id}
                  className={`p-4 rounded-lg border ${
                    esUltimaVersion
                      ? 'bg-indigo-50 border-indigo-200 ring-2 ring-indigo-300'
                      : 'bg-white border-gray-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold ${
                          esUltimaVersion
                            ? 'bg-indigo-600'
                            : 'bg-gray-600'
                        }`}>
                          v{version.version_numero}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-gray-900">
                              Versión {version.version_numero}
                            </h3>
                            {esUltimaVersion && (
                              <span className="px-2 py-0.5 bg-indigo-600 text-white text-xs font-bold rounded">
                                Actual
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(version.fecha_generacion).toLocaleDateString('es-ES', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>

                      {version.motivo_cambio && (
                        <p className="text-sm text-gray-700 mb-2 bg-white/50 rounded p-2">
                          <strong>Motivo:</strong> {version.motivo_cambio}
                        </p>
                      )}

                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <DollarSign className="w-4 h-4 text-gray-500" />
                          <span className="text-gray-600">Total:</span>
                          <span className="font-semibold text-gray-900">
                            ${parseFloat(version.total_contrato).toLocaleString()}
                          </span>
                        </div>
                        {version.cantidad_invitados && (
                          <div className="flex items-center gap-1">
                            <Users className="w-4 h-4 text-gray-500" />
                            <span className="text-gray-600">Invitados:</span>
                            <span className="font-semibold text-gray-900">
                              {version.cantidad_invitados}
                            </span>
                          </div>
                        )}
                      </div>

                      {versionAnterior && diferenciaTotal !== 0 && (
                        <div className={`flex items-center gap-1 text-xs mt-2 ${
                          diferenciaTotal > 0 ? 'text-red-600' : 'text-green-600'
                        }`}>
                          {diferenciaTotal > 0 ? (
                            <TrendingUp className="w-3 h-3" />
                          ) : (
                            <TrendingDown className="w-3 h-3" />
                          )}
                          <span>
                            {diferenciaTotal > 0 ? '+' : ''}
                            ${Math.abs(diferenciaTotal).toLocaleString()} vs v{version.version_numero - 1}
                          </span>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={async () => {
                        try {
                          const response = await api.get(
                            `/contratos/${contratoId}/versiones/${version.version_numero}/pdf`,
                            { responseType: 'blob' }
                          );
                          const blob = new Blob([response.data], { type: 'application/pdf' });
                          const url = window.URL.createObjectURL(blob);
                          const link = document.createElement('a');
                          link.href = url;
                          link.download = `Contrato-v${version.version_numero}.pdf`;
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                          window.URL.revokeObjectURL(url);
                        } catch (error) {
                          console.error('Error al descargar PDF:', error);
                          alert('Error al descargar el PDF');
                        }
                      }}
                      className="px-3 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-lg transition text-sm font-medium flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      PDF
                    </button>
                  </div>
                </div>
              );
            })}
            {versionesData.versiones.length > 3 && (
              <p className="text-sm text-gray-500 text-center pt-2">
                Y {versionesData.versiones.length - 3} versión{versionesData.versiones.length - 3 !== 1 ? 'es' : ''} más
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default DashboardCliente;
