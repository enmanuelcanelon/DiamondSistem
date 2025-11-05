import { useQuery } from '@tanstack/react-query';
import { Loader2, MessageCircle } from 'lucide-react';
import useAuthStore from '../../store/useAuthStore';
import Chat from '../../components/Chat';
import api from '../../config/api';

function ChatCliente() {
  const { user } = useAuthStore();
  const contratoId = user?.contrato_id;

  // Query para obtener información del vendedor
  const { data: contrato, isLoading } = useQuery({
    queryKey: ['contrato-vendedor', contratoId],
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <MessageCircle className="w-8 h-8 text-purple-600" />
          Comunicación
        </h1>
        <p className="text-gray-600 mt-1">
          Mantente en contacto con tu asesor de eventos
        </p>
      </div>

      {/* Info Card */}
      {contrato?.vendedores && (
        <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-xl p-6 border border-purple-200">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-lg">
                {contrato.vendedores.nombre_completo.charAt(0)}
              </span>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 text-lg">
                {contrato.vendedores.nombre_completo}
              </h3>
              <p className="text-sm text-gray-700">Tu asesor de eventos</p>
              <div className="mt-2 space-y-1">
                <p className="text-sm text-gray-600">
                  📧 {contrato.vendedores.email}
                </p>
                {contrato.vendedores.telefono && (
                  <p className="text-sm text-gray-600">
                    📞 {contrato.vendedores.telefono}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Chat Component */}
      {contrato?.vendedor_id && (
        <Chat
          contratoId={contratoId}
          destinatarioId={contrato.vendedor_id}
          destinatarioTipo="vendedor"
          destinatarioNombre={contrato.vendedores?.nombre_completo}
          destinatarioEmail={contrato.vendedores?.email}
          destinatarioTelefono={contrato.vendedores?.telefono}
        />
      )}
    </div>
  );
}

export default ChatCliente;



