import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { MessageSquare, Send, Loader2, Check, AlertCircle, Clock } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import comunicacionesService from '../../services/comunicacionesService';
import toast from 'react-hot-toast';

const MAX_SMS_LENGTH = 160;

const SMSPanel = ({ telefono: telefonoInicial = '', nombre = '', leadId = null, clienteId = null, contratoId = null }) => {
  const queryClient = useQueryClient();
  const [telefono, setTelefono] = useState(telefonoInicial);
  const [mensaje, setMensaje] = useState('');
  const [mensajesEnviados, setMensajesEnviados] = useState([]);

  // Mutation para enviar SMS
  const enviarSMSMutation = useMutation({
    mutationFn: ({ telefono, mensaje }) => 
      comunicacionesService.enviarSMS(telefono, mensaje, { leadId, clienteId, contratoId }),
    onSuccess: (response) => {
      const nuevoMensaje = {
        id: Date.now(),
        telefono,
        mensaje,
        estado: 'enviado',
        fecha: new Date().toISOString(),
        sid: response.data?.sid
      };
      setMensajesEnviados(prev => [nuevoMensaje, ...prev]);
      setMensaje('');
      toast.success('SMS enviado correctamente');
      
      // Invalidar historial si existe
      if (leadId) queryClient.invalidateQueries(['historial', 'lead', leadId]);
      if (clienteId) queryClient.invalidateQueries(['historial', 'cliente', clienteId]);
      if (contratoId) queryClient.invalidateQueries(['historial', 'contrato', contratoId]);
    },
    onError: (error) => {
      const errorMsg = error.response?.data?.mensaje || error.response?.data?.error || 'Error al enviar SMS';
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

    if (mensaje.length > MAX_SMS_LENGTH) {
      toast.error(`El mensaje no puede exceder ${MAX_SMS_LENGTH} caracteres`);
      return;
    }

    enviarSMSMutation.mutate({ telefono: telefono.trim(), mensaje: mensaje.trim() });
  };

  const formatearTelefono = (value) => {
    // Remover todo excepto números y +
    const cleaned = value.replace(/[^\d+]/g, '');
    setTelefono(cleaned);
  };

  const handleMensajeChange = (e) => {
    const value = e.target.value;
    if (value.length <= MAX_SMS_LENGTH + 20) { // Permitir un poco más para que vean el límite
      setMensaje(value);
    }
  };

  const caracteresRestantes = MAX_SMS_LENGTH - mensaje.length;
  const porcentajeUsado = (mensaje.length / MAX_SMS_LENGTH) * 100;

  const getEstadoIcon = (estado) => {
    switch (estado) {
      case 'enviado':
        return <Check className="w-4 h-4 text-[#8B5CF6]" />;
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
            <div className="p-2 rounded-full bg-[#8B5CF6]/10">
              <MessageSquare className="w-6 h-6 text-[#8B5CF6]" />
            </div>
            <div>
              <CardTitle className="text-lg">Enviar SMS</CardTitle>
              <CardDescription>
                {nombre ? `Enviar mensaje a ${nombre}` : 'Envía un mensaje de texto'}
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
                  disabled={enviarSMSMutation.isPending}
                />
                <MessageSquare className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              </div>
              <p className="text-xs text-muted-foreground">
                Incluye el código de país (ej: +1 para USA, +52 para México)
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Mensaje</label>
                <Badge 
                  variant={caracteresRestantes < 0 ? "destructive" : caracteresRestantes < 20 ? "secondary" : "outline"}
                  className="text-xs"
                >
                  {caracteresRestantes} caracteres restantes
                </Badge>
              </div>
              <Textarea
                placeholder="Escribe tu mensaje aquí..."
                value={mensaje}
                onChange={handleMensajeChange}
                rows={3}
                disabled={enviarSMSMutation.isPending}
                className={caracteresRestantes < 0 ? "border-destructive" : ""}
              />
              <Progress 
                value={Math.min(porcentajeUsado, 100)} 
                className={`h-1 ${porcentajeUsado > 100 ? '[&>div]:bg-destructive' : porcentajeUsado > 80 ? '[&>div]:bg-amber-500' : '[&>div]:bg-[#8B5CF6]'}`}
              />
              {caracteresRestantes < 0 && (
                <p className="text-xs text-destructive">
                  El mensaje excede el límite de {MAX_SMS_LENGTH} caracteres
                </p>
              )}
            </div>

            <Button 
              type="submit" 
              className="w-full bg-[#8B5CF6] hover:bg-[#7C3AED] text-white"
              disabled={enviarSMSMutation.isPending || !telefono || !mensaje || caracteresRestantes < 0}
            >
              {enviarSMSMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Enviar SMS
                </>
              )}
            </Button>
          </form>
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
                  className="p-3 bg-[#8B5CF6]/10 rounded-lg rounded-tr-none ml-auto max-w-[85%]"
                >
                  <p className="text-sm">{msg.mensaje}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-muted-foreground">{msg.telefono}</span>
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-muted-foreground">
                        {new Date(msg.fecha).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {getEstadoIcon(msg.estado)}
                    </div>
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

export default SMSPanel;

