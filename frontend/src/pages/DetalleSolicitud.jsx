import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Loader2,
  User,
  Calendar,
  DollarSign,
  FileText,
  AlertCircle,
} from 'lucide-react';
import api from '../config/api';

function DetalleSolicitud() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [motivoRechazo, setMotivoRechazo] = useState('');
  const [mostrarRechazo, setMostrarRechazo] = useState(false);

  // Obtener solicitud
  const { data, isLoading } = useQuery({
    queryKey: ['solicitud', id],
    queryFn: async () => {
      const response = await api.get(`/solicitudes/vendedor/todas`);
      const solicitud = response.data.solicitudes.find((s) => s.id === parseInt(id));
      return solicitud;
    },
  });

  // Mutation para aprobar
  const aprobarMutation = useMutation({
    mutationFn: async () => {
      const response = await api.put(`/solicitudes/${id}/aprobar`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['solicitud']);
      queryClient.invalidateQueries(['solicitudes-vendedor']);
      queryClient.invalidateQueries(['solicitudes-estadisticas']);
      alert('✅ Solicitud aprobada exitosamente');
      navigate('/eventos');
    },
    onError: (error) => {
      alert(`❌ Error al aprobar: ${error.response?.data?.message || error.message}`);
    },
  });

  // Mutation para rechazar
  const rechazarMutation = useMutation({
    mutationFn: async () => {
      const response = await api.put(`/solicitudes/${id}/rechazar`, {
        motivo_rechazo: motivoRechazo,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['solicitud']);
      queryClient.invalidateQueries(['solicitudes-vendedor']);
      queryClient.invalidateQueries(['solicitudes-estadisticas']);
      alert('❌ Solicitud rechazada');
      navigate('/eventos');
    },
    onError: (error) => {
      alert(`❌ Error al rechazar: ${error.response?.data?.message || error.message}`);
    },
  });

  const handleAprobar = () => {
    if (confirm('¿Estás seguro de aprobar esta solicitud? Esta acción actualizará el contrato.')) {
      aprobarMutation.mutate();
    }
  };

  const handleRechazar = () => {
    if (!motivoRechazo.trim()) {
      alert('Por favor, ingresa un motivo de rechazo');
      return;
    }
    if (confirm('¿Estás seguro de rechazar esta solicitud?')) {
      rechazarMutation.mutate();
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Solicitud no encontrada</h2>
        <Link
          to="/eventos"
          className="text-purple-600 hover:text-purple-700 font-medium"
        >
          ← Volver a Gestión de Eventos
        </Link>
      </div>
    );
  }

  const solicitud = data;
  const contrato = solicitud.contratos;
  const cliente = contrato?.clientes;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          to="/eventos"
          className="p-2 hover:bg-gray-100 rounded-lg transition"
        >
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900">Detalle de Solicitud</h1>
          <p className="text-gray-600 mt-1">Solicitud #{solicitud.id}</p>
        </div>
      </div>

      {/* Estado de la Solicitud */}
      {solicitud.estado !== 'pendiente' && (
        <div
          className={`p-4 rounded-xl ${
            solicitud.estado === 'aprobada'
              ? 'bg-green-100 border border-green-300'
              : 'bg-red-100 border border-red-300'
          }`}
        >
          <p
            className={`font-bold ${
              solicitud.estado === 'aprobada' ? 'text-green-700' : 'text-red-700'
            }`}
          >
            {solicitud.estado === 'aprobada'
              ? '✅ Esta solicitud ya fue aprobada'
              : '❌ Esta solicitud fue rechazada'}
          </p>
          {solicitud.fecha_respuesta && (
            <p className="text-sm text-gray-600 mt-1">
              Fecha de respuesta:{' '}
              {new Date(solicitud.fecha_respuesta).toLocaleDateString('es-ES')}
            </p>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna Izquierda - Info del Cliente y Contrato */}
        <div className="lg:col-span-2 space-y-6">
          {/* Información del Cliente */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <User className="w-6 h-6 text-purple-600" />
              Información del Cliente
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Nombre Completo</p>
                <p className="font-bold text-gray-900">{cliente?.nombre_completo}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="font-bold text-gray-900">{cliente?.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Teléfono</p>
                <p className="font-bold text-gray-900">{cliente?.telefono}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Código de Contrato</p>
                <p className="font-bold text-purple-600">{contrato?.codigo_contrato}</p>
              </div>
            </div>
          </div>

          {/* Información del Contrato */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Calendar className="w-6 h-6 text-blue-600" />
              Información del Evento
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Fecha del Evento</p>
                <p className="font-bold text-gray-900">
                  {contrato?.fecha_evento
                    ? new Date(contrato.fecha_evento).toLocaleDateString('es-ES', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })
                    : 'No definida'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Cantidad de Invitados</p>
                <p className="font-bold text-gray-900">{contrato?.cantidad_invitados}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total del Contrato</p>
                <p className="font-bold text-green-600">
                  ${parseFloat(contrato?.total_contrato || 0).toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Estado del Contrato</p>
                <span className="inline-block px-3 py-1 bg-green-100 text-green-700 text-sm rounded-full font-medium">
                  {contrato?.estado}
                </span>
              </div>
            </div>
          </div>

          {/* Detalles de la Solicitud */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <FileText className="w-6 h-6 text-orange-600" />
              Detalles de la Solicitud
            </h2>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Tipo de Solicitud</p>
                {solicitud.tipo_solicitud === 'invitados' ? (
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full font-bold">
                      👥 Invitados Adicionales
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full font-bold">
                      ➕ Servicio Adicional
                    </span>
                  </div>
                )}
              </div>

              {solicitud.tipo_solicitud === 'invitados' ? (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-gray-700">
                    El cliente solicita agregar{' '}
                    <strong className="text-blue-700 text-2xl">
                      {solicitud.invitados_adicionales}
                    </strong>{' '}
                    invitados adicionales
                  </p>
                  <p className="text-sm text-gray-600 mt-2">
                    Cantidad actual: {contrato?.cantidad_invitados} invitados
                  </p>
                  <p className="text-sm text-gray-600">
                    Nueva cantidad:{' '}
                    <strong>
                      {contrato?.cantidad_invitados + solicitud.invitados_adicionales}
                    </strong>{' '}
                    invitados
                  </p>
                </div>
              ) : (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-gray-700 mb-2">
                    <strong>Servicio solicitado:</strong>
                  </p>
                  <p className="text-xl font-bold text-gray-900">
                    {solicitud.servicios?.nombre}
                  </p>
                  {solicitud.servicios?.descripcion && (
                    <p className="text-sm text-gray-600 mt-2">
                      {solicitud.servicios.descripcion}
                    </p>
                  )}
                  {solicitud.cantidad_servicio > 1 && (
                    <p className="text-sm text-gray-700 mt-2">
                      Cantidad: <strong>{solicitud.cantidad_servicio}</strong>
                    </p>
                  )}
                  {solicitud.costo_adicional && (
                    <div className="mt-3 pt-3 border-t border-green-300">
                      <p className="text-sm text-gray-700">Costo adicional:</p>
                      <p className="text-2xl font-bold text-green-600">
                        ${parseFloat(solicitud.costo_adicional).toFixed(2)}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        Nuevo total del contrato:{' '}
                        <strong>
                          $
                          {(
                            parseFloat(contrato?.total_contrato || 0) +
                            parseFloat(solicitud.costo_adicional)
                          ).toFixed(2)}
                        </strong>
                      </p>
                    </div>
                  )}
                </div>
              )}

              {solicitud.detalles_solicitud && (
                <div>
                  <p className="text-sm text-gray-600 mb-2">Detalles adicionales del cliente:</p>
                  <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                    <p className="text-gray-700 italic">"{solicitud.detalles_solicitud}"</p>
                  </div>
                </div>
              )}

              <div>
                <p className="text-sm text-gray-600">Fecha de solicitud</p>
                <p className="font-bold text-gray-900">
                  {new Date(solicitud.fecha_solicitud).toLocaleDateString('es-ES', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>

              {solicitud.motivo_rechazo && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-700 font-bold mb-2">Motivo de rechazo:</p>
                  <p className="text-gray-700">{solicitud.motivo_rechazo}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Columna Derecha - Acciones */}
        <div className="space-y-6">
          {solicitud.estado === 'pendiente' && (
            <>
              {/* Aprobar Solicitud */}
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  Aprobar Solicitud
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Al aprobar, esta solicitud se aplicará automáticamente al contrato.
                </p>
                <button
                  onClick={handleAprobar}
                  disabled={aprobarMutation.isPending}
                  className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {aprobarMutation.isPending ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Aprobando...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      Aprobar Solicitud
                    </>
                  )}
                </button>
              </div>

              {/* Rechazar Solicitud */}
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <XCircle className="w-5 h-5 text-red-600" />
                  Rechazar Solicitud
                </h3>

                {!mostrarRechazo ? (
                  <button
                    onClick={() => setMostrarRechazo(true)}
                    className="w-full px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-bold"
                  >
                    Rechazar
                  </button>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Motivo del rechazo *
                      </label>
                      <textarea
                        value={motivoRechazo}
                        onChange={(e) => setMotivoRechazo(e.target.value)}
                        rows={4}
                        placeholder="Explica al cliente por qué se rechaza esta solicitud..."
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleRechazar}
                        disabled={rechazarMutation.isPending || !motivoRechazo.trim()}
                        className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {rechazarMutation.isPending ? (
                          <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                        ) : (
                          'Confirmar Rechazo'
                        )}
                      </button>
                      <button
                        onClick={() => {
                          setMostrarRechazo(false);
                          setMotivoRechazo('');
                        }}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-bold"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Acciones Adicionales */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Acciones</h3>
            <div className="space-y-2">
              <Link
                to={`/contratos/${contrato?.id}`}
                className="block w-full px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition text-center font-medium"
              >
                Ver Contrato Completo
              </Link>
              <Link
                to="/eventos"
                className="block w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-center font-medium"
              >
                Volver a Gestión
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DetalleSolicitud;
