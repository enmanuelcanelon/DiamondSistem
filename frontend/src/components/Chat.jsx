import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Send, Loader2, MessageCircle } from 'lucide-react';
import useAuthStore from '../store/useAuthStore';
import api from '../config/api';

function Chat({ contratoId, destinatarioId, destinatarioTipo, destinatarioNombre }) {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const messagesEndRef = useRef(null);
  const [nuevoMensaje, setNuevoMensaje] = useState('');

  // Query para obtener mensajes
  const { data: mensajesData, isLoading } = useQuery({
    queryKey: ['mensajes', contratoId],
    queryFn: async () => {
      console.log('🔄 Obteniendo mensajes del contrato:', contratoId);
      const response = await api.get(`/mensajes/contrato/${contratoId}`);
      console.log('📨 Mensajes recibidos:', response.data.count, 'mensajes');
      return response.data;
    },
    refetchInterval: 5000, // Refetch cada 5 segundos
    enabled: !!contratoId,
  });

  // Mutation para enviar mensaje
  const enviarMutation = useMutation({
    mutationFn: async (mensaje) => {
      console.log('📤 Enviando mensaje desde frontend:', {
        contrato_id: contratoId,
        mensaje,
        destinatario_tipo: destinatarioTipo,
        destinatario_id: destinatarioId,
        user_tipo: user?.tipo,
        user_id: user?.id
      });
      
      const response = await api.post('/mensajes', {
        contrato_id: contratoId,
        mensaje,
        destinatario_tipo: destinatarioTipo,
        destinatario_id: destinatarioId,
      });
      
      console.log('✅ Respuesta del servidor:', response.data);
      return response.data;
    },
    onSuccess: () => {
      console.log('✅ Mensaje enviado, invalidando queries...');
      queryClient.invalidateQueries(['mensajes', contratoId]);
      setNuevoMensaje('');
    },
    onError: (error) => {
      console.error('❌ Error al enviar mensaje:', error.response?.data || error.message);
    },
  });

  const handleEnviar = (e) => {
    e.preventDefault();
    if (nuevoMensaje.trim()) {
      enviarMutation.mutate(nuevoMensaje.trim());
    }
  };

  // Scroll automático al último mensaje
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensajesData?.mensajes]);

  const mensajes = mensajesData?.mensajes || [];

  return (
    <div className="bg-white rounded-xl shadow-sm border flex flex-col h-[600px]">
      {/* Header */}
      <div className="p-4 border-b bg-gradient-to-r from-purple-600 to-pink-600 rounded-t-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            <MessageCircle className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-white">
              {destinatarioNombre || 'Chat'}
            </h3>
            <p className="text-xs text-purple-100">
              {user?.tipo === 'cliente' ? 'Tu asesor de eventos' : 'Cliente'}
            </p>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
          </div>
        ) : mensajes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <MessageCircle className="w-12 h-12 mb-3 text-gray-300" />
            <p className="text-sm">No hay mensajes aún</p>
            <p className="text-xs text-gray-400">Envía el primer mensaje</p>
          </div>
        ) : (
          <>
            {mensajes.map((mensaje) => {
              const esMio = mensaje.remitente_tipo === user?.tipo && mensaje.remitente_id === user?.id;
              
              return (
                <div
                  key={mensaje.id}
                  className={`flex ${esMio ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[70%] rounded-lg px-4 py-2 ${
                      esMio
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                        : 'bg-white border border-gray-200 text-gray-900'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap break-words">
                      {mensaje.mensaje}
                    </p>
                    <p
                      className={`text-xs mt-1 ${
                        esMio ? 'text-purple-100' : 'text-gray-500'
                      }`}
                    >
                      {new Date(mensaje.fecha_envio).toLocaleTimeString('es-ES', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                      {esMio && mensaje.leido && ' · Leído'}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input Area */}
      <form onSubmit={handleEnviar} className="p-4 border-t bg-white rounded-b-xl">
        <div className="flex gap-2">
          <input
            type="text"
            value={nuevoMensaje}
            onChange={(e) => setNuevoMensaje(e.target.value)}
            placeholder="Escribe un mensaje..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
            disabled={enviarMutation.isPending}
          />
          <button
            type="submit"
            disabled={!nuevoMensaje.trim() || enviarMutation.isPending}
            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {enviarMutation.isPending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

export default Chat;

