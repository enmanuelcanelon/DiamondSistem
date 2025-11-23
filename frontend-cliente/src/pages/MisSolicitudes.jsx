import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Plus, Clock, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import useAuthStore from '@shared/store/useAuthStore';
import api from '@shared/config/api';
import ModalSolicitarCambios from '@components/ModalSolicitarCambios';

function MisSolicitudes() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const contratoId = user?.contrato_id;
  const [showModal, setShowModal] = useState(false);

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

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-white" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-2 rounded-full bg-neutral-900 border border-white/10 text-neutral-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white mb-1">Solicitudes</h1>
            <p className="text-neutral-400 text-sm">Gestiona cambios y peticiones especiales</p>
          </div>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-white text-black rounded-full text-sm font-medium hover:bg-neutral-200 transition-colors"
        >
          <Plus size={16} />
          Nueva Solicitud
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {solicitudes.length === 0 ? (
          <div className="col-span-full bg-neutral-900 border border-white/10 rounded-xl p-12 text-center">
            <p className="text-neutral-400 mb-4">No tienes solicitudes aún.</p>
            <button
              onClick={() => setShowModal(true)}
              className="px-4 py-2 bg-white text-black rounded-full text-sm font-medium hover:bg-neutral-200 transition-colors"
            >
              Crear Primera Solicitud
            </button>
          </div>
        ) : (
          solicitudes.map((solicitud) => (
            <div
              key={solicitud.id}
              className={`bg-neutral-900 border border-white/10 rounded-xl p-6 relative overflow-hidden ${
                solicitud.estado === 'rechazada' ? 'opacity-75' : ''
              }`}
            >
              <div className="flex justify-between items-start mb-4">
                <span
                  className={`px-2 py-1 rounded text-xs font-medium border flex items-center gap-1 ${
                    solicitud.estado === 'pendiente'
                      ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                      : solicitud.estado === 'aprobada'
                      ? 'bg-green-500/10 text-green-400 border-green-500/20'
                      : 'bg-red-500/10 text-red-400 border-red-500/20'
                  }`}
                >
                  {solicitud.estado === 'pendiente' && <Clock size={12} />}
                  {solicitud.estado === 'aprobada' && <CheckCircle size={12} />}
                  {solicitud.estado === 'rechazada' && <XCircle size={12} />}
                  {solicitud.estado === 'pendiente'
                    ? 'Pendiente'
                    : solicitud.estado === 'aprobada'
                    ? 'Aprobado'
                    : 'Rechazado'}
                </span>
                <span className="text-xs text-neutral-500">
                  {new Date(solicitud.fecha_solicitud).toLocaleDateString('es-ES', {
                    day: 'numeric',
                    month: 'short'
                  })}
                </span>
              </div>

              <h3 className="text-lg font-semibold text-white mb-2">
                {solicitud.tipo_solicitud === 'invitados'
                  ? 'Invitados Adicionales'
                  : 'Servicio Adicional'}
              </h3>

              <p className="text-sm text-neutral-400 mb-4">
                {solicitud.tipo_solicitud === 'invitados'
                  ? `Solicitud para agregar ${solicitud.invitados_adicionales} invitados adicionales.`
                  : solicitud.servicios
                  ? `Solicitud para agregar el servicio: ${solicitud.servicios.nombre}`
                  : solicitud.detalles_solicitud || 'Sin detalles adicionales.'}
              </p>

              {solicitud.estado === 'rechazada' && solicitud.motivo_rechazo && (
                <div className="p-3 bg-red-500/5 rounded-lg border border-red-500/10 mb-4">
                  <p className="text-xs text-red-300">
                    <span className="font-bold">Motivo:</span> {solicitud.motivo_rechazo}
                  </p>
                </div>
              )}

              {solicitud.costo_adicional && (
                <div className="pt-4 border-t border-white/5">
                  <p className="text-xs text-neutral-500 mb-1">Costo adicional</p>
                  <p className="text-sm font-semibold text-white">
                    ${parseFloat(solicitud.costo_adicional).toLocaleString('es-ES', {
                      minimumFractionDigits: 2
                    })}
                  </p>
                </div>
              )}

              <div className="pt-4 border-t border-white/5 flex items-center gap-2 mt-4">
                <div className="w-6 h-6 rounded-full bg-neutral-800 flex items-center justify-center text-xs text-white">
                  {user?.nombre_completo?.charAt(0) || 'U'}
                </div>
                <span className="text-xs text-neutral-500">
                  {user?.nombre_completo || 'Usuario'}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal Solicitar Cambios */}
      <ModalSolicitarCambios
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={() => {
          // Refrescar datos después de crear solicitud
          queryClient.invalidateQueries(['mis-solicitudes']);
        }}
      />
    </div>
  );
}

export default MisSolicitudes;
