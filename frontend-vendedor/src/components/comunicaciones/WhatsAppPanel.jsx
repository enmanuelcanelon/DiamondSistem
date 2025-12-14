import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { MessageSquare, Send, Loader2, CheckCheck, Check, Clock, AlertCircle } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Badge } from '../ui/badge';
import comunicacionesService from '../../services/comunicacionesService';
import toast from 'react-hot-toast';

// Icono de WhatsApp SVG
const WhatsAppIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

const WhatsAppPanel = ({ telefono: telefonoInicial = '', nombre = '', leadId = null, clienteId = null, contratoId = null }) => {
  const queryClient = useQueryClient();
  const [telefono, setTelefono] = useState(telefonoInicial);
  const [mensaje, setMensaje] = useState('');
  const [mensajesEnviados, setMensajesEnviados] = useState([]);

  // Mutation para enviar WhatsApp
  const enviarWhatsAppMutation = useMutation({
    mutationFn: ({ telefono, mensaje }) => 
      comunicacionesService.enviarWhatsApp(telefono, mensaje, { leadId, clienteId, contratoId }),
    onSuccess: (response) => {
      const nuevoMensaje = {
        id: Date.now(),
        telefono,
        mensaje,
        estado: 'enviado',
        fecha: new Date().toISOString(),
        messageId: response.data?.messageId
      };
      setMensajesEnviados(prev => [nuevoMensaje, ...prev]);
      setMensaje('');
      toast.success('Mensaje de WhatsApp enviado correctamente');
      
      // Invalidar historial si existe
      if (leadId) queryClient.invalidateQueries(['historial', 'lead', leadId]);
      if (clienteId) queryClient.invalidateQueries(['historial', 'cliente', clienteId]);
      if (contratoId) queryClient.invalidateQueries(['historial', 'contrato', contratoId]);
    },
    onError: (error) => {
      const errorMsg = error.response?.data?.mensaje || error.response?.data?.error || 'Error al enviar mensaje';
      toast.error(errorMsg);
    }
  });

  const handleEnviar = (e) => {
    e.preventDefault();
    
    if (!telefono.trim()) {
      toast.error('Ingresa un número de teléfono');
      return;
    }
    
    if (!mensaje.trim()) {
      toast.error('Ingresa un mensaje');
      return;
    }

    enviarWhatsAppMutation.mutate({ telefono: telefono.trim(), mensaje: mensaje.trim() });
  };

  const formatearTelefono = (value) => {
    // Remover todo excepto números y +
    const cleaned = value.replace(/[^\d+]/g, '');
    setTelefono(cleaned);
  };

  const getEstadoIcon = (estado) => {
    switch (estado) {
      case 'enviado':
        return <Check className="w-4 h-4 text-muted-foreground" />;
      case 'entregado':
        return <CheckCheck className="w-4 h-4 text-muted-foreground" />;
      case 'leido':
        return <CheckCheck className="w-4 h-4 text-[#25D366]" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-destructive" />;
      default:
        return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Formulario de envío */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-[#25D366]/10">
              <WhatsAppIcon className="w-6 h-6 text-[#25D366]" />
            </div>
            <div>
              <CardTitle className="text-lg">Enviar WhatsApp</CardTitle>
              <CardDescription>
                {nombre ? `Enviar mensaje a ${nombre}` : 'Envía un mensaje de WhatsApp'}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleEnviar} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Número de teléfono</label>
              <div className="relative">
                <Input
                  type="tel"
                  placeholder="+1234567890"
                  value={telefono}
                  onChange={(e) => formatearTelefono(e.target.value)}
                  className="pl-10"
                  disabled={enviarWhatsAppMutation.isPending}
                />
                <WhatsAppIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              </div>
              <p className="text-xs text-muted-foreground">
                Incluye el código de país (ej: +1 para USA, +52 para México)
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Mensaje</label>
              <Textarea
                placeholder="Escribe tu mensaje aquí..."
                value={mensaje}
                onChange={(e) => setMensaje(e.target.value)}
                rows={4}
                disabled={enviarWhatsAppMutation.isPending}
              />
              <p className="text-xs text-muted-foreground text-right">
                {mensaje.length} caracteres
              </p>
            </div>

            <Button 
              type="submit" 
              className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white"
              disabled={enviarWhatsAppMutation.isPending || !telefono || !mensaje}
            >
              {enviarWhatsAppMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Enviar WhatsApp
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Información importante */}
      <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-800">
        <CardContent className="pt-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-amber-800 dark:text-amber-200">¿Cómo funciona WhatsApp Business?</p>
              <p className="text-amber-700 dark:text-amber-300 mt-1">
                Por políticas de Meta (WhatsApp), solo puedes enviar mensajes a números que hayan 
                escrito primero al número de WhatsApp Business de la empresa.
              </p>
              <p className="text-amber-700 dark:text-amber-300 mt-2">
                <strong>Para probar:</strong> El cliente debe enviar un mensaje primero al número de 
                WhatsApp Business configurado en el sistema. Consulta con el administrador cuál es ese número.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mensajes enviados en esta sesión */}
      {mensajesEnviados.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Mensajes enviados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {mensajesEnviados.map((msg) => (
                <div 
                  key={msg.id} 
                  className="p-3 bg-[#DCF8C6] dark:bg-[#025144] rounded-lg rounded-tr-none ml-auto max-w-[85%]"
                >
                  <p className="text-sm">{msg.mensaje}</p>
                  <div className="flex items-center justify-end gap-1 mt-1">
                    <span className="text-xs text-muted-foreground">
                      {new Date(msg.fecha).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {getEstadoIcon(msg.estado)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default WhatsAppPanel;

