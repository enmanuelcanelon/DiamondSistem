import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  MessageSquare, 
  Send, 
  Loader2, 
  Check, 
  CheckCheck,
  AlertCircle, 
  Clock,
  ArrowDownLeft,
  ArrowUpRight,
  RefreshCw,
  Phone,
  User
} from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Skeleton } from '../ui/skeleton';
import comunicacionesService from '../../services/comunicacionesService';
import toast from 'react-hot-toast';
import { format, isToday, isYesterday, isThisWeek } from 'date-fns';
import { es } from 'date-fns/locale';

const MAX_SMS_LENGTH = 160;

const SMSPanel = ({ telefono: telefonoInicial = '', nombre = '', leadId = null, clienteId = null, contratoId = null }) => {
  const queryClient = useQueryClient();
  const mensajesEndRef = useRef(null);
  
  const [telefono, setTelefono] = useState(telefonoInicial);
  const [mensaje, setMensaje] = useState('');
  const [vista, setVista] = useState('chat'); // 'chat' o 'enviar'

  // Query para obtener SMS del historial (entrantes y enviados)
  const { 
    data: smsData, 
    isLoading: cargandoSMS,
    refetch: refrescarSMS 
  } = useQuery({
    queryKey: ['sms-historial', telefono],
    queryFn: async () => {
      const response = await comunicacionesService.obtenerMisComunicaciones({
        canal: 'sms',
        limit: 100
      });
      return response.data;
    },
    enabled: !!telefono || vista === 'chat',
    staleTime: 10 * 1000, // 10 segundos
    refetchInterval: 15 * 1000, // Polling cada 15 segundos
  });

  // Filtrar SMS del número actual si hay uno seleccionado
  const smsFiltrados = telefono 
    ? (smsData?.data || []).filter(sms => 
        sms.destinatario?.includes(telefono.replace(/\D/g, '').slice(-10)) ||
        sms.destinatario === telefono
      )
    : (smsData?.data || []);

  // Agrupar por fecha
  const smsAgrupados = smsFiltrados.reduce((grupos, sms) => {
    const fecha = new Date(sms.fecha_creacion);
    let grupo;
    
    if (isToday(fecha)) {
      grupo = 'Hoy';
    } else if (isYesterday(fecha)) {
      grupo = 'Ayer';
    } else if (isThisWeek(fecha)) {
      grupo = 'Esta semana';
    } else {
      grupo = format(fecha, "MMMM yyyy", { locale: es });
    }
    
    if (!grupos[grupo]) grupos[grupo] = [];
    grupos[grupo].push(sms);
    return grupos;
  }, {});

  // Scroll al último mensaje
  useEffect(() => {
    if (mensajesEndRef.current && vista === 'chat') {
      mensajesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [smsFiltrados, vista]);

  // Mutation para enviar SMS
  const enviarSMSMutation = useMutation({
    mutationFn: ({ telefono, mensaje }) => 
      comunicacionesService.enviarSMS(telefono, mensaje, { leadId, clienteId, contratoId }),
    onSuccess: () => {
      setMensaje('');
      toast.success('SMS enviado correctamente');
      refrescarSMS();
      queryClient.invalidateQueries(['historial']);
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
    const cleaned = value.replace(/[^\d+]/g, '');
    setTelefono(cleaned);
  };

  const handleMensajeChange = (e) => {
    const value = e.target.value;
    if (value.length <= MAX_SMS_LENGTH + 20) {
      setMensaje(value);
    }
  };

  const caracteresRestantes = MAX_SMS_LENGTH - mensaje.length;
  const porcentajeUsado = (mensaje.length / MAX_SMS_LENGTH) * 100;

  const formatearFecha = (fecha) => {
    if (!fecha) return '';
    const date = new Date(fecha);
    
    if (isToday(date)) {
      return format(date, 'HH:mm', { locale: es });
    }
    if (isYesterday(date)) {
      return 'Ayer';
    }
    return format(date, 'dd/MM/yy', { locale: es });
  };

  const formatearFechaGrupo = (fecha) => {
    if (!fecha) return '';
    const date = new Date(fecha);
    
    if (isToday(date)) return 'Hoy';
    if (isYesterday(date)) return 'Ayer';
    return format(date, "d 'de' MMMM", { locale: es });
  };

  const getEstadoIcon = (estado, direccion) => {
    if (direccion === 'entrante') return null;
    
    switch (estado) {
      case 'sent':
      case 'enviado':
        return <Check className="w-3.5 h-3.5 text-gray-400" />;
      case 'delivered':
      case 'entregado':
        return <CheckCheck className="w-3.5 h-3.5 text-gray-400" />;
      case 'read':
      case 'leido':
        return <CheckCheck className="w-3.5 h-3.5 text-blue-500" />;
      case 'failed':
      case 'error':
        return <AlertCircle className="w-3.5 h-3.5 text-red-500" />;
      default:
        return <Clock className="w-3.5 h-3.5 text-gray-400" />;
    }
  };

  // Obtener inicial del número
  const obtenerInicial = (telefono) => {
    if (!telefono) return '?';
    const numeros = telefono.replace(/\D/g, '');
    return numeros.slice(-2) || '?';
  };

  return (
    <div className="space-y-4">
      {/* Header con tabs */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-[#8B5CF6]/10">
                <MessageSquare className="w-6 h-6 text-[#8B5CF6]" />
              </div>
              <div>
                <CardTitle className="text-lg">SMS</CardTitle>
                <CardDescription>
                  {nombre ? `Conversación con ${nombre}` : 'Mensajes de texto'}
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => refrescarSMS()}
                disabled={cargandoSMS}
              >
                <RefreshCw className={`w-4 h-4 ${cargandoSMS ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Tabs */}
          <div className="flex border-b mb-4">
            <button
              onClick={() => setVista('chat')}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                vista === 'chat' 
                  ? 'border-[#8B5CF6] text-[#8B5CF6]' 
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              Conversación
            </button>
            <button
              onClick={() => setVista('enviar')}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                vista === 'enviar' 
                  ? 'border-[#8B5CF6] text-[#8B5CF6]' 
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Send className="w-4 h-4" />
              Enviar nuevo
            </button>
          </div>

          {/* Vista de chat */}
          {vista === 'chat' && (
            <div className="space-y-4">
              {/* Input de número si no hay uno */}
              {!telefono && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Número de teléfono</label>
                  <div className="relative">
                    <Input
                      type="tel"
                      placeholder="+1234567890"
                      value={telefono}
                      onChange={(e) => formatearTelefono(e.target.value)}
                      className="pl-10"
                    />
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  </div>
                </div>
              )}

              {/* Mensajes */}
              <div 
                className="border rounded-lg p-4 space-y-4 max-h-[400px] overflow-y-auto"
                style={{ 
                  backgroundImage: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%239C92AC" fill-opacity="0.05"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
                  backgroundColor: '#F9FAFB'
                }}
              >
                {cargandoSMS ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex gap-3">
                        <Skeleton className="w-8 h-8 rounded-full" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-12 w-3/4 rounded-lg" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : smsFiltrados.length > 0 ? (
                  Object.entries(smsAgrupados).map(([fecha, mensajes]) => (
                    <div key={fecha}>
                      {/* Separador de fecha */}
                      <div className="flex justify-center my-4">
                        <span className="px-3 py-1 rounded-lg bg-white/80 dark:bg-gray-800 text-xs text-muted-foreground shadow-sm">
                          {fecha}
                        </span>
                      </div>
                      
                      {/* Mensajes del día */}
                      <div className="space-y-1">
                        {mensajes.map((sms) => (
                          <div
                            key={sms.id}
                            className={`flex ${sms.direccion === 'saliente' ? 'justify-end' : 'justify-start'}`}
                          >
                            <div
                              className={`max-w-[75%] rounded-lg px-3 py-2 shadow-sm ${
                                sms.direccion === 'saliente'
                                  ? 'bg-[#8B5CF6] text-white rounded-tr-none'
                                  : 'bg-white dark:bg-gray-800 rounded-tl-none'
                              }`}
                            >
                              <p className="text-sm whitespace-pre-wrap break-words">{sms.contenido}</p>
                              <div className={`flex items-center gap-1 mt-1 ${
                                sms.direccion === 'saliente' ? 'justify-end' : 'justify-start'
                              }`}>
                                <span className={`text-[10px] ${
                                  sms.direccion === 'saliente' ? 'text-white/70' : 'text-muted-foreground'
                                }`}>
                                  {format(new Date(sms.fecha_creacion), 'HH:mm', { locale: es })}
                                </span>
                                {getEstadoIcon(sms.estado, sms.direccion)}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <MessageSquare className="w-12 h-12 mb-3 opacity-50" />
                    <p className="text-sm">No hay mensajes</p>
                    {telefono && (
                      <p className="text-xs mt-1">Envía el primer mensaje</p>
                    )}
                  </div>
                )}
                <div ref={mensajesEndRef} />
              </div>

              {/* Input para enviar mensaje */}
              {telefono && (
                <form onSubmit={handleEnviar} className="space-y-2">
                  <div className="flex gap-2">
                    <Textarea
                      placeholder="Escribe un mensaje..."
                      value={mensaje}
                      onChange={handleMensajeChange}
                      disabled={enviarSMSMutation.isPending}
                      className="flex-1 min-h-[60px] resize-none"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleEnviar(e);
                        }
                      }}
                    />
                    <Button
                      type="submit"
                      size="icon"
                      className="h-[60px] w-[60px] rounded-full bg-[#8B5CF6] hover:bg-[#7C3AED]"
                      disabled={enviarSMSMutation.isPending || !mensaje.trim() || caracteresRestantes < 0}
                    >
                      {enviarSMSMutation.isPending ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Send className="w-5 h-5" />
                      )}
                    </Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <Progress 
                      value={Math.min(porcentajeUsado, 100)} 
                      className={`h-1 flex-1 mr-2 ${porcentajeUsado > 100 ? '[&>div]:bg-destructive' : porcentajeUsado > 80 ? '[&>div]:bg-amber-500' : '[&>div]:bg-[#8B5CF6]'}`}
                    />
                    <Badge 
                      variant={caracteresRestantes < 0 ? "destructive" : caracteresRestantes < 20 ? "secondary" : "outline"}
                      className="text-xs"
                    >
                      {caracteresRestantes} / {MAX_SMS_LENGTH}
                    </Badge>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* Vista de enviar nuevo */}
          {vista === 'enviar' && (
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
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
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
                  rows={4}
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
          )}
        </CardContent>
      </Card>

      {/* Alerta sobre verificación A2P */}
      <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-800">
        <CardContent className="pt-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-amber-800 dark:text-amber-200">SMS requiere verificación</p>
              <p className="text-amber-700 dark:text-amber-300 mt-1">
                Para enviar SMS a números de USA, necesitas verificar A2P 10DLC o usar un número Toll-Free en Twilio.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SMSPanel;
