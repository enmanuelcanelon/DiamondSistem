import { useQuery } from '@tanstack/react-query';
import { Loader2, MessageCircle } from 'lucide-react';
import useAuthStore from '@shared/store/useAuthStore';
import Chat from '@shared/components/Chat';
import api from '@shared/config/api';

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
        <Loader2 className="w-8 h-8 animate-spin text-gray-900" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <MessageCircle className="w-8 h-8 text-gray-700" />
          Comunicación
        </h1>
        <p className="text-gray-600 mt-1">
          Mantente en contacto con tu asesor de eventos
        </p>
      </div>

      {/* Info Card */}
      {(contrato?.vendedores || contrato?.vendedor_id) && (
        <div className="card border-l-4 border-l-gray-900">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-gray-900 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-lg">
                {(() => {
                  const nombreVendedor = contrato.vendedores?.nombre_completo || 'Vendedor ADMIN001';
                  if (nombreVendedor === 'Administrador Sistema' || nombreVendedor.includes('Administrador')) {
                    return 'A';
                  }
                  return nombreVendedor.charAt(0);
                })()}
              </span>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 text-lg">
                {(() => {
                  const nombreVendedor = contrato.vendedores?.nombre_completo;
                  if (!nombreVendedor || nombreVendedor === 'Administrador Sistema' || nombreVendedor.includes('Administrador')) {
                    return 'Vendedor ADMIN001';
                  }
                  return nombreVendedor;
                })()}
              </h3>
              <p className="text-sm text-gray-700">Tu asesor de eventos</p>
              <div className="mt-2 space-y-1">
                <p className="text-sm text-gray-600">
                  📧 {contrato.vendedores?.email || 'admin001@diamondsistem.com'}
                </p>
                <p className="text-sm text-gray-600">
                  📞 {contrato.vendedores?.telefono || '+1-305-555-0100'}
                </p>
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
          destinatarioNombre={(() => {
            const nombreVendedor = contrato.vendedores?.nombre_completo;
            if (!nombreVendedor || nombreVendedor === 'Administrador Sistema' || nombreVendedor.includes('Administrador')) {
              return 'Vendedor ADMIN001';
            }
            return nombreVendedor;
          })()}
          destinatarioEmail={contrato.vendedores?.email || 'admin001@diamondsistem.com'}
          destinatarioTelefono={contrato.vendedores?.telefono || '+1-305-555-0100'}
        />
      )}
    </div>
  );
}

export default ChatCliente;



