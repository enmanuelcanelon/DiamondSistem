import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, MessageSquare, Send, User, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '@shared/store/useAuthStore';
import api from '@shared/config/api';

function ChatCliente() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const contratoId = user?.contrato_id;
  const messagesEndRef = useRef(null);
  const [nuevoMensaje, setNuevoMensaje] = useState('');
  const queryClient = useQueryClient();

  // Query para obtener información del contrato y vendedor
  const { data: contrato, isLoading: isLoadingContrato } = useQuery({
    queryKey: ['contrato-vendedor', contratoId],
    queryFn: async () => {
      const response = await api.get(`/contratos/${contratoId}`);
      return response.data.contrato;
    },
    enabled: !!contratoId,
  });

  // Query para obtener mensajes
  const { data: mensajesData, isLoading: isLoadingMensajes } = useQuery({
    queryKey: ['mensajes', contratoId],
    queryFn: async () => {
      const response = await api.get(`/mensajes/contrato/${contratoId}`);
      return response.data;
    },
    refetchInterval: 3000,
    refetchOnWindowFocus: true,
    enabled: !!contratoId,
  });

  // Mutation para enviar mensaje
  const enviarMutation = useMutation({
    mutationFn: async (mensaje) => {
      const response = await api.post('/mensajes', {
        contrato_id: parseInt(contratoId),
        mensaje,
        destinatario_tipo: 'vendedor',
        destinatario_id: contrato?.vendedor_id,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['mensajes', contratoId]);
      setNuevoMensaje('');
    },
    onError: (error) => {
      alert('Error al enviar el mensaje: ' + (error.response?.data?.message || error.message));
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
  const nombreVendedor = contrato?.vendedores?.nombre_completo || 'Asesor de Eventos';
  const nombreVendedorDisplay = nombreVendedor === 'Administrador Sistema' || nombreVendedor.includes('Administrador')
    ? 'Asesor de Eventos'
    : nombreVendedor;
  
  const inicialesVendedor = nombreVendedor === 'Administrador Sistema' || nombreVendedor.includes('Administrador')
    ? 'AE'
    : nombreVendedor.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

  if (isLoadingContrato) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-white" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-fade-in h-[calc(100vh-6rem)] flex flex-col">
      <div className="flex items-center gap-4 mb-6 shrink-0">
        <button
          onClick={() => navigate('/dashboard')}
          className="p-2 rounded-full bg-neutral-900 border border-white/10 text-neutral-400 hover:text-white hover:bg-white/5 transition-colors"
        >
          <ChevronLeft size={20} />
        </button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-1">Chat</h1>
          <p className="text-neutral-400 text-sm">Comunícate con tu planner</p>
        </div>
      </div>

      <div className="flex-1 bg-neutral-900 border border-white/10 rounded-xl overflow-hidden flex">
        {/* Sidebar List */}
        <div className="w-80 border-r border-white/10 bg-black/20 hidden md:flex flex-col">
          <div className="p-4 border-b border-white/10">
            <input
              type="text"
              placeholder="Buscar..."
              className="w-full bg-neutral-800 border border-white/5 rounded-lg px-3 py-2 text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:border-white/20 transition-colors"
            />
          </div>
          <div className="flex-1 overflow-y-auto">
            <div className="p-3 hover:bg-white/5 cursor-pointer transition-colors border-l-2 border-white bg-white/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 font-medium">
                  {inicialesVendedor}
                </div>
                <div>
                  <div className="text-sm font-medium text-white">{nombreVendedorDisplay}</div>
                  <div className="text-xs text-neutral-400 truncate w-40">
                    {mensajes.length > 0 
                      ? mensajes[mensajes.length - 1]?.mensaje?.substring(0, 30) + '...'
                      : 'Inicia una conversación'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col bg-[#0a0a0a]">
          {/* Chat Header */}
          <div className="p-4 border-b border-white/10 flex items-center gap-3 bg-neutral-900/50 backdrop-blur-sm">
            <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 font-medium">
              {inicialesVendedor}
            </div>
            <div>
              <div className="text-sm font-medium text-white">{nombreVendedorDisplay}</div>
              <div className="text-xs text-green-400 flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                En línea
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {isLoadingMensajes ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-6 h-6 animate-spin text-neutral-400" />
              </div>
            ) : mensajes.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-neutral-500">
                <MessageSquare className="w-12 h-12 mb-3 opacity-50" />
                <p className="text-sm">No hay mensajes aún. Inicia la conversación.</p>
              </div>
            ) : (
              mensajes.map((mensaje) => {
                const esMio = mensaje.remitente_tipo === 'cliente' && mensaje.remitente_id === user?.id;
                return (
                  <div key={mensaje.id} className={`flex ${esMio ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] rounded-2xl p-4 text-sm ${
                      esMio
                        ? 'bg-white text-black rounded-tr-none'
                        : 'bg-neutral-800 text-neutral-200 rounded-tl-none'
                    }`}>
                      <p>{mensaje.mensaje}</p>
                      <span className={`text-[10px] mt-1 block ${
                        esMio ? 'text-neutral-400 text-right' : 'text-neutral-500'
                      }`}>
                        {new Date(mensaje.fecha_envio).toLocaleTimeString('es-ES', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-white/10 bg-neutral-900/50 backdrop-blur-sm">
            <form onSubmit={handleEnviar} className="flex gap-2">
              <input
                type="text"
                placeholder="Escribe un mensaje..."
                value={nuevoMensaje}
                onChange={(e) => setNuevoMensaje(e.target.value)}
                disabled={enviarMutation.isPending}
                className="flex-1 bg-neutral-800 border border-white/5 rounded-xl px-4 py-3 text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:border-white/20 transition-colors disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={enviarMutation.isPending || !nuevoMensaje.trim()}
                className="p-3 bg-white text-black rounded-xl hover:bg-neutral-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {enviarMutation.isPending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send size={18} />
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ChatCliente;
