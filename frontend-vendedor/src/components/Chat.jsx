import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Send, Loader2, MessageCircle } from 'lucide-react';
import useAuthStore from '../store/useAuthStore';
import api from '../config/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';

function Chat({ contratoId, destinatarioId, destinatarioTipo, destinatarioNombre, destinatarioEmail, destinatarioTelefono }) {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const messagesEndRef = useRef(null);
  const [nuevoMensaje, setNuevoMensaje] = useState('');

  // Query para obtener mensajes
  const { data: mensajesData, isLoading } = useQuery({
    queryKey: ['mensajes', contratoId],
    queryFn: async () => {
      const response = await api.get(`/mensajes/contrato/${contratoId}`);
      return response.data;
    },
    refetchInterval: 15 * 1000, // Refetch cada 15 segundos (balance entre actualización y rendimiento)
    refetchOnWindowFocus: false, // No refetch al cambiar de pestaña
    staleTime: 10 * 1000, // Considerar datos frescos por 10 segundos
    enabled: !!contratoId,
  });

  // Mutation para enviar mensaje
  const enviarMutation = useMutation({
    mutationFn: async (mensaje) => {
      const response = await api.post('/mensajes', {
        contrato_id: parseInt(contratoId),
        mensaje,
        destinatario_tipo: destinatarioTipo,
        destinatario_id: parseInt(destinatarioId),
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['mensajes', contratoId]);
      setNuevoMensaje('');
    },
    onError: (error) => {
      console.error('Error al enviar mensaje:', error.response?.data || error.message);
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

  return (
    <Card className="flex flex-col h-[600px]">
      {/* Header */}
      <CardHeader className="border-b">
        <CardTitle className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
            <MessageCircle className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <div className="text-base">{destinatarioNombre || 'Chat'}</div>
            <p className="text-xs text-muted-foreground font-normal">
              {user?.tipo === 'cliente' ? 'Tu asesor de eventos' : 'Cliente'}
            </p>
          </div>
        </CardTitle>
      </CardHeader>

      {/* Messages Area */}
      <CardContent className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/30">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : mensajes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <MessageCircle className="w-12 h-12 mb-3 text-muted-foreground/50" />
            <p className="text-sm">No hay mensajes aún</p>
            <p className="text-xs text-muted-foreground/70">Envía el primer mensaje</p>
          </div>
        ) : (
          <>
            {mensajes.map((mensaje) => {
              const esMio = mensaje.remitente_tipo === user?.tipo && mensaje.remitente_id === user?.id;
              
              // Determinar etiqueta y estilo según quién lo envió
              let etiqueta, colorFondo, colorTexto, colorBorde;
              
              if (esMio) {
                // Mensaje que YO envié
                etiqueta = user?.tipo === 'vendedor' ? 'Tú (Vendedor)' : 'Tú (Cliente)';
                colorFondo = 'bg-primary';
                colorTexto = 'text-primary-foreground';
                colorBorde = '';
              } else if (mensaje.remitente_tipo === 'vendedor') {
                // Mensaje del VENDEDOR (lo ve el cliente)
                // Usar datos del vendedor si están disponibles, sino datos genéricos para ADMIN001
                let nombreVendedor = destinatarioNombre;
                
                // Si no hay nombre o es "Administrador Sistema", usar datos genéricos para vendedor
                if (!nombreVendedor || nombreVendedor === 'Administrador Sistema' || nombreVendedor.includes('Administrador')) {
                  nombreVendedor = 'Vendedor ADMIN001';
                }
                
                etiqueta = nombreVendedor;
                colorFondo = 'bg-blue-50 dark:bg-blue-950/20';
                colorTexto = 'text-foreground';
                colorBorde = 'border border-blue-200 dark:border-blue-800';
              } else {
                // Mensaje del CLIENTE (lo ve el vendedor)
                etiqueta = 'Cliente';
                colorFondo = 'bg-green-50 dark:bg-green-950/20';
                colorTexto = 'text-foreground';
                colorBorde = 'border border-green-200 dark:border-green-800';
              }

              // Verificar si hay info adicional del vendedor
              // Mostrar info del vendedor cuando el cliente ve mensajes del vendedor
              const mostrarInfoVendedor = !esMio && mensaje.remitente_tipo === 'vendedor' && user?.tipo === 'cliente';
              
              // Datos del vendedor (o genéricos si no hay datos)
              // Si no hay email/telefono del vendedor real, usar datos genéricos para ADMIN001
              let emailVendedor = destinatarioEmail;
              let telefonoVendedor = destinatarioTelefono;
              
              // Si no hay datos del vendedor o es "Administrador Sistema", usar datos genéricos
              if ((!emailVendedor || !telefonoVendedor) && 
                  (!destinatarioNombre || destinatarioNombre === 'Administrador Sistema' || destinatarioNombre.includes('Administrador'))) {
                emailVendedor = emailVendedor || 'admin001@diamondsistem.com';
                telefonoVendedor = telefonoVendedor || '+1-305-555-0100';
              }
              
              return (
                <div
                  key={mensaje.id}
                  className={`flex ${esMio ? 'justify-end' : 'justify-start'} mb-3`}
                >
                  <div className={`max-w-[70%] rounded-lg px-4 py-3 shadow-sm ${colorFondo} ${colorBorde}`}>
                    {/* SIEMPRE mostrar la etiqueta de quién envió */}
                    <div className={`mb-2 ${
                      esMio 
                        ? 'text-primary-foreground/80' 
                        : mensaje.remitente_tipo === 'vendedor'
                          ? 'text-blue-700 dark:text-blue-300'
                          : 'text-green-700 dark:text-green-300'
                    }`}>
                      <p className="text-xs font-semibold">
                        {etiqueta}
                      </p>
                      {/* Mostrar email y teléfono del vendedor si está disponible */}
                      {mostrarInfoVendedor && (
                        <div className="text-xs mt-1 space-y-0.5">
                          {emailVendedor && (
                            <p className="text-blue-600 dark:text-blue-400">{emailVendedor}</p>
                          )}
                          {telefonoVendedor && (
                            <p className="text-blue-600 dark:text-blue-400">{telefonoVendedor}</p>
                          )}
                        </div>
                      )}
                    </div>
                    
                    {/* Mensaje */}
                    <p className={`text-sm whitespace-pre-wrap break-words ${colorTexto}`}>
                      {mensaje.mensaje}
                    </p>
                    
                    {/* Hora */}
                    <p className={`text-xs mt-2 ${
                      esMio 
                        ? 'text-primary-foreground/70' 
                        : mensaje.remitente_tipo === 'vendedor'
                          ? 'text-blue-600 dark:text-blue-400'
                          : 'text-green-600 dark:text-green-400'
                    }`}>
                      {new Date(mensaje.fecha_envio).toLocaleTimeString('es-ES', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                      {esMio && mensaje.leido && ' · ✓✓'}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </>
        )}
      </CardContent>

      {/* Input Area */}
      <div className="p-4 border-t bg-background">
        <form onSubmit={handleEnviar} className="flex gap-2">
          <Input
            type="text"
            value={nuevoMensaje}
            onChange={(e) => setNuevoMensaje(e.target.value)}
            placeholder="Escribe un mensaje..."
            disabled={enviarMutation.isPending}
            className="flex-1"
          />
          <Button
            type="submit"
            disabled={!nuevoMensaje.trim() || enviarMutation.isPending}
            size="icon"
          >
            {enviarMutation.isPending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </Button>
        </form>
      </div>
    </Card>
  );
}

export default Chat;

