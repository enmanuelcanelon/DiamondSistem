import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Clock,
  CheckCircle,
  XCircle,
  Users,
  Plus,
  Loader2,
  AlertCircle,
  DollarSign,
} from 'lucide-react';
import useAuthStore from '../../store/useAuthStore';
import api from '../../config/api';

function MisSolicitudes() {
  const { user } = useAuthStore();
  const contratoId = user?.contrato_id;

  // Obtener solicitudes del contrato
  const { data, isLoading } = useQuery({
    queryKey: ['mis-solicitudes', contratoId],
    queryFn: async () => {
      const response = await api.get(`/solicitudes/contrato/${contratoId}`);
      return response.data;
    },
    enabled: !!contratoId,
  });

  const solicitudes = data?.solicitudes || [];

  const pendientes = solicitudes.filter((s) => s.estado === 'pendiente');
  const aprobadas = solicitudes.filter((s) => s.estado === 'aprobada');
  const rechazadas = solicitudes.filter((s) => s.estado === 'rechazada');

  if (isLoading) {
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
        <h1 className="text-3xl font-bold text-gray-900">Mis Solicitudes</h1>
        <p className="text-gray-600 mt-1">
          Revisa el estado de tus solicitudes de cambios
        </p>
      </div>

      {/* Botón para nueva solicitud */}
      <Link
        to="/cliente/solicitar-cambios"
        className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition font-medium shadow-lg"
      >
        <Plus className="w-5 h-5" />
        Nueva Solicitud
      </Link>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pendientes</p>
              <p className="text-3xl font-bold text-orange-500 mt-2">
                {pendientes.length}
              </p>
            </div>
            <Clock className="w-12 h-12 text-orange-500" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Aprobadas</p>
              <p className="text-3xl font-bold text-green-600 mt-2">
                {aprobadas.length}
              </p>
            </div>
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Rechazadas</p>
              <p className="text-3xl font-bold text-red-600 mt-2">
                {rechazadas.length}
              </p>
            </div>
            <XCircle className="w-12 h-12 text-red-600" />
          </div>
        </div>
      </div>

      {/* Lista de Solicitudes */}
      {solicitudes.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
          <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            No tienes solicitudes
          </h3>
          <p className="text-gray-600 mb-6">
            Aún no has solicitado cambios a tu evento
          </p>
          <Link
            to="/cliente/solicitar-cambios"
            className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium"
          >
            <Plus className="w-5 h-5" />
            Solicitar Cambios
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {solicitudes.map((solicitud) => (
            <SolicitudCard key={solicitud.id} solicitud={solicitud} />
          ))}
        </div>
      )}
    </div>
  );
}

// Componente para cada solicitud
function SolicitudCard({ solicitud }) {
  const getEstadoBadge = () => {
    if (solicitud.estado === 'pendiente') {
      return (
        <span className="px-3 py-1 bg-orange-100 text-orange-700 text-sm rounded-full font-medium inline-flex items-center gap-1">
          <Clock className="w-4 h-4" />
          Pendiente
        </span>
      );
    }
    if (solicitud.estado === 'aprobada') {
      return (
        <span className="px-3 py-1 bg-green-100 text-green-700 text-sm rounded-full font-medium inline-flex items-center gap-1">
          <CheckCircle className="w-4 h-4" />
          Aprobada
        </span>
      );
    }
    return (
      <span className="px-3 py-1 bg-red-100 text-red-700 text-sm rounded-full font-medium inline-flex items-center gap-1">
        <XCircle className="w-4 h-4" />
        Rechazada
      </span>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border p-6 hover:shadow-md transition">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          {solicitud.tipo_solicitud === 'invitados' ? (
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          ) : (
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <Plus className="w-6 h-6 text-green-600" />
            </div>
          )}
          <div>
            <h3 className="font-bold text-gray-900">
              {solicitud.tipo_solicitud === 'invitados'
                ? 'Invitados Adicionales'
                : 'Servicio Adicional'}
            </h3>
            <p className="text-sm text-gray-600">
              Solicitado el{' '}
              {new Date(solicitud.fecha_solicitud).toLocaleDateString('es-ES')}
            </p>
          </div>
        </div>
        {getEstadoBadge()}
      </div>

      {/* Detalles de la solicitud */}
      <div className="space-y-3">
        {solicitud.tipo_solicitud === 'invitados' ? (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-gray-700">
              Solicitaste agregar{' '}
              <strong className="text-blue-700 text-lg">
                {solicitud.invitados_adicionales}
              </strong>{' '}
              invitados adicionales
            </p>
          </div>
        ) : (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-gray-700 mb-1">
              <strong>Servicio:</strong> {solicitud.servicios?.nombre}
            </p>
            {solicitud.cantidad_servicio > 1 && (
              <p className="text-sm text-gray-700">
                <strong>Cantidad:</strong> {solicitud.cantidad_servicio}
              </p>
            )}
            {solicitud.costo_adicional && (
              <div className="flex items-center gap-2 mt-2">
                <DollarSign className="w-4 h-4 text-green-600" />
                <p className="text-green-600 font-bold">
                  ${parseFloat(solicitud.costo_adicional).toFixed(2)}
                </p>
              </div>
            )}
          </div>
        )}

        {solicitud.detalles_solicitud && (
          <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
            <p className="text-sm text-gray-700 italic">
              "{solicitud.detalles_solicitud}"
            </p>
          </div>
        )}

        {/* Respuesta del vendedor */}
        {solicitud.estado === 'aprobada' && (
          <div className="p-4 bg-green-50 border border-green-300 rounded-lg">
            <p className="text-sm text-green-700 font-bold">
              ✅ ¡Tu solicitud fue aprobada!
            </p>
            {solicitud.fecha_respuesta && (
              <p className="text-xs text-green-600 mt-1">
                Aprobada el{' '}
                {new Date(solicitud.fecha_respuesta).toLocaleDateString('es-ES')}
              </p>
            )}
          </div>
        )}

        {solicitud.estado === 'rechazada' && solicitud.motivo_rechazo && (
          <div className="p-4 bg-red-50 border border-red-300 rounded-lg">
            <p className="text-sm text-red-700 font-bold mb-2">
              ❌ Solicitud Rechazada
            </p>
            <p className="text-sm text-gray-700">
              <strong>Motivo:</strong> {solicitud.motivo_rechazo}
            </p>
            {solicitud.fecha_respuesta && (
              <p className="text-xs text-red-600 mt-2">
                Rechazada el{' '}
                {new Date(solicitud.fecha_respuesta).toLocaleDateString('es-ES')}
              </p>
            )}
          </div>
        )}

        {solicitud.estado === 'pendiente' && (
          <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
            <p className="text-sm text-orange-700">
              ⏳ Tu vendedor está revisando esta solicitud. Te notificaremos
              cuando responda.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default MisSolicitudes;



