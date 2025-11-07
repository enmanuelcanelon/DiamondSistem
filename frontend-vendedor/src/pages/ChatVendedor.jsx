import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Loader2, MessageCircle, ArrowLeft } from 'lucide-react';
import useAuthStore from '@shared/store/useAuthStore';
import Chat from '@shared/components/Chat';
import api from '@shared/config/api';

function ChatVendedor() {
  const { contratoId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  // Query para obtener información del contrato y cliente
  const { data: contrato, isLoading } = useQuery({
    queryKey: ['contrato-chat', contratoId],
    queryFn: async () => {
      const response = await api.get(`/contratos/${contratoId}`);
      return response.data.contrato;
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

  // Verificar que el vendedor tiene acceso a este contrato
  if (contrato && contrato.vendedor_id !== user?.id) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 font-medium">No tienes acceso a este contrato</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header con botón de regreso */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(`/contratos/${contratoId}`)}
          className="p-2 hover:bg-gray-100 rounded-lg transition"
        >
          <ArrowLeft className="w-6 h-6 text-gray-600" />
        </button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <MessageCircle className="w-8 h-8 text-purple-600" />
            Chat con Cliente
          </h1>
          <p className="text-gray-600 mt-1">
            Comunícate directamente con tu cliente
          </p>
        </div>
      </div>

      {/* Info Card del Cliente */}
      {contrato?.clientes && (
        <div className="bg-gradient-to-r from-blue-100 to-indigo-100 rounded-xl p-6 border border-blue-200">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-lg">
                {contrato.clientes.nombre_completo.charAt(0)}
              </span>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 text-lg">
                {contrato.clientes.nombre_completo}
              </h3>
              <p className="text-sm text-gray-700">
                Contrato: <span className="font-medium">{contrato.codigo_contrato}</span>
              </p>
              <div className="mt-2 space-y-1">
                <p className="text-sm text-gray-600">
                  📧 {contrato.clientes.email}
                </p>
                {contrato.clientes.telefono && (
                  <p className="text-sm text-gray-600">
                    📞 {contrato.clientes.telefono}
                  </p>
                )}
                <p className="text-sm text-gray-600">
                  📅 Evento:{' '}
                  {new Date(contrato.fecha_evento).toLocaleDateString('es-ES', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Chat Component */}
      {contrato?.cliente_id && (
        <Chat
          contratoId={parseInt(contratoId)}
          destinatarioId={contrato.cliente_id}
          destinatarioTipo="cliente"
          destinatarioNombre={contrato.clientes?.nombre_completo}
        />
      )}
    </div>
  );
}

export default ChatVendedor;



