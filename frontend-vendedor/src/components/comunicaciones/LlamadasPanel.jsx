import { useState, useEffect, useRef, useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  Phone, 
  PhoneOff, 
  PhoneCall, 
  PhoneIncoming,
  PhoneOutgoing,
  PhoneMissed,
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX,
  Loader2,
  AlertCircle,
  Clock,
  User,
  RefreshCw,
  History,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Badge } from '../ui/badge';
import { Skeleton } from '../ui/skeleton';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription 
} from '../ui/dialog';
import comunicacionesService from '../../services/comunicacionesService';
import toast from 'react-hot-toast';
import { format, isToday, isYesterday } from 'date-fns';
import { es } from 'date-fns/locale';

// Estados de la llamada
const CALL_STATES = {
  IDLE: 'idle',
  CONNECTING: 'connecting',
  RINGING: 'ringing',
  IN_PROGRESS: 'in_progress',
  DISCONNECTED: 'disconnected',
  ERROR: 'error'
};

const LlamadasPanel = ({ telefono: telefonoInicial = '', nombre = '', leadId = null, clienteId = null, contratoId = null }) => {
  const queryClient = useQueryClient();
  const [telefono, setTelefono] = useState(telefonoInicial);
  const [estadoLlamada, setEstadoLlamada] = useState(CALL_STATES.IDLE);
  const [duracion, setDuracion] = useState(0);
  const [muted, setMuted] = useState(false);
  const [speakerOn, setSpeakerOn] = useState(true);
  const [showCallDialog, setShowCallDialog] = useState(false);
  const [permisoMicrofono, setPermisoMicrofono] = useState('unknown');
  const [vista, setVista] = useState('llamar'); // 'llamar' o 'historial'
  
  const deviceRef = useRef(null);
  const callRef = useRef(null);
  const timerRef = useRef(null);

  // Query para obtener historial de llamadas
  const { 
    data: llamadasData, 
    isLoading: cargandoLlamadas,
    refetch: refrescarLlamadas 
  } = useQuery({
    queryKey: ['llamadas-historial'],
    queryFn: async () => {
      const response = await comunicacionesService.obtenerMisComunicaciones({
        canal: 'voz',
        limit: 50
      });
      return response.data;
    },
    staleTime: 30 * 1000,
    refetchInterval: 30 * 1000,
  });

  const llamadas = llamadasData?.data || [];

  // Verificar permisos de micrófono
  useEffect(() => {
    const checkMicPermission = async () => {
      try {
        const result = await navigator.permissions.query({ name: 'microphone' });
        setPermisoMicrofono(result.state);
        result.onchange = () => setPermisoMicrofono(result.state);
      } catch (error) {
        console.log('No se pudo verificar permiso de micrófono');
      }
    };
    checkMicPermission();
  }, []);

  // Timer para duración de llamada
  useEffect(() => {
    if (estadoLlamada === CALL_STATES.IN_PROGRESS) {
      timerRef.current = setInterval(() => {
        setDuracion(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [estadoLlamada]);

  // Mutation para obtener token de voz
  const tokenMutation = useMutation({
    mutationFn: () => comunicacionesService.obtenerTokenVoz(),
    onError: (error) => {
      const errorMsg = error.response?.data?.mensaje || 'Error al obtener token de voz';
      toast.error(errorMsg);
      setEstadoLlamada(CALL_STATES.ERROR);
    }
  });

  const formatearDuracion = (segundos) => {
    if (!segundos) return '0:00';
    const mins = Math.floor(segundos / 60);
    const secs = segundos % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatearTelefono = (value) => {
    const cleaned = value.replace(/[^\d+]/g, '');
    setTelefono(cleaned);
  };

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

  const solicitarPermisoMicrofono = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      setPermisoMicrofono('granted');
      return true;
    } catch (error) {
      setPermisoMicrofono('denied');
      toast.error('Se requiere acceso al micrófono para realizar llamadas');
      return false;
    }
  };

  const iniciarLlamada = async () => {
    if (!telefono.trim()) {
      toast.error('Ingresa un número de teléfono');
      return;
    }

    // Verificar permiso de micrófono
    if (permisoMicrofono !== 'granted') {
      const permiso = await solicitarPermisoMicrofono();
      if (!permiso) return;
    }

    setEstadoLlamada(CALL_STATES.CONNECTING);
    setDuracion(0);
    setShowCallDialog(true);

    try {
      // Obtener token de Twilio
      const response = await tokenMutation.mutateAsync();
      
      const token = response.data?.token || response.data?.data?.token || response.token;
      
      if (!token || typeof token !== 'string') {
        console.error('Token inválido recibido:', response.data);
        toast.error('No se pudo obtener el token de voz. Verifica la configuración de Twilio.');
        setEstadoLlamada(CALL_STATES.ERROR);
        return;
      }

      // Importar dinámicamente el SDK de Twilio
      const { Device } = await import('@twilio/voice-sdk');
      
      // Inicializar device
      const device = new Device(token, {
        logLevel: 1,
        codecPreferences: ['opus', 'pcmu']
      });
      
      deviceRef.current = device;

      await device.register();

      // Configurar eventos del device
      device.on('error', (error) => {
        console.error('Twilio Device Error:', error);
        toast.error('Error en la conexión de voz');
        setEstadoLlamada(CALL_STATES.ERROR);
      });

      // Hacer la llamada
      setEstadoLlamada(CALL_STATES.RINGING);
      
      const call = await device.connect({
        params: { To: telefono.trim() }
      });
      
      callRef.current = call;

      // Eventos de la llamada
      call.on('accept', () => {
        setEstadoLlamada(CALL_STATES.IN_PROGRESS);
        toast.success('Llamada conectada');
      });

      call.on('disconnect', () => {
        finalizarLlamada(false);
      });

      call.on('cancel', () => {
        setEstadoLlamada(CALL_STATES.DISCONNECTED);
        setTimeout(() => setShowCallDialog(false), 2000);
      });

      call.on('reject', () => {
        setEstadoLlamada(CALL_STATES.DISCONNECTED);
        toast.error('La llamada fue rechazada');
        setTimeout(() => setShowCallDialog(false), 2000);
      });

    } catch (error) {
      console.error('Error al iniciar llamada:', error);
      toast.error('Error al conectar la llamada');
      setEstadoLlamada(CALL_STATES.ERROR);
    }
  };

  const finalizarLlamada = (manual = true) => {
    if (callRef.current) {
      callRef.current.disconnect();
      callRef.current = null;
    }

    if (deviceRef.current) {
      deviceRef.current.destroy();
      deviceRef.current = null;
    }

    setEstadoLlamada(CALL_STATES.DISCONNECTED);
    
    if (manual) {
      toast.success(`Llamada finalizada. Duración: ${formatearDuracion(duracion)}`);
    }

    setTimeout(() => {
      setShowCallDialog(false);
      setEstadoLlamada(CALL_STATES.IDLE);
      setDuracion(0);
      refrescarLlamadas();
    }, 2000);
  };

  const toggleMute = () => {
    if (callRef.current) {
      callRef.current.mute(!muted);
      setMuted(!muted);
    }
  };

  const getEstadoTexto = () => {
    switch (estadoLlamada) {
      case CALL_STATES.CONNECTING:
        return 'Conectando...';
      case CALL_STATES.RINGING:
        return 'Llamando...';
      case CALL_STATES.IN_PROGRESS:
        return formatearDuracion(duracion);
      case CALL_STATES.DISCONNECTED:
        return 'Llamada finalizada';
      case CALL_STATES.ERROR:
        return 'Error en la llamada';
      default:
        return '';
    }
  };

  const getEstadoInfo = (estado) => {
    switch (estado) {
      case 'completed':
        return { label: 'Completada', color: 'text-green-500', bgColor: 'bg-green-100 dark:bg-green-900/30', icon: CheckCircle2 };
      case 'busy':
        return { label: 'Ocupado', color: 'text-yellow-500', bgColor: 'bg-yellow-100 dark:bg-yellow-900/30', icon: Clock };
      case 'no-answer':
        return { label: 'Sin respuesta', color: 'text-orange-500', bgColor: 'bg-orange-100 dark:bg-orange-900/30', icon: PhoneMissed };
      case 'failed':
        return { label: 'Fallida', color: 'text-red-500', bgColor: 'bg-red-100 dark:bg-red-900/30', icon: XCircle };
      case 'in-progress':
        return { label: 'En curso', color: 'text-blue-500', bgColor: 'bg-blue-100 dark:bg-blue-900/30', icon: PhoneCall };
      default:
        return { label: estado, color: 'text-gray-500', bgColor: 'bg-gray-100 dark:bg-gray-900/30', icon: Phone };
    }
  };

  const getIniciales = (nombre, telefono) => {
    if (nombre) {
      return nombre.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    if (telefono) {
      const numeros = telefono.replace(/\D/g, '');
      return numeros.slice(-2) || '?';
    }
    return '?';
  };

  return (
    <div className="space-y-4">
      {/* Header con tabs */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-blue-500/10">
                <Phone className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <CardTitle className="text-lg">Llamadas</CardTitle>
                <CardDescription>
                  Realiza llamadas de voz desde tu navegador
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => refrescarLlamadas()}
                disabled={cargandoLlamadas}
              >
                <RefreshCw className={`w-4 h-4 ${cargandoLlamadas ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Tabs */}
          <div className="flex border-b mb-4">
            <button
              onClick={() => setVista('llamar')}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                vista === 'llamar' 
                  ? 'border-blue-500 text-blue-500' 
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <PhoneCall className="w-4 h-4" />
              Realizar llamada
            </button>
            <button
              onClick={() => setVista('historial')}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                vista === 'historial' 
                  ? 'border-blue-500 text-blue-500' 
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <History className="w-4 h-4" />
              Historial
              {llamadas.length > 0 && (
                <Badge variant="secondary" className="ml-1 text-xs">
                  {llamadas.length}
                </Badge>
              )}
            </button>
          </div>

          {/* Vista de realizar llamada */}
          {vista === 'llamar' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Número de teléfono</label>
                <div className="relative">
                  <Input
                    type="tel"
                    placeholder="+1234567890"
                    value={telefono}
                    onChange={(e) => formatearTelefono(e.target.value)}
                    className="pl-10"
                    disabled={estadoLlamada !== CALL_STATES.IDLE}
                  />
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                </div>
                <p className="text-xs text-muted-foreground">
                  Incluye el código de país (ej: +1 para USA, +52 para México)
                </p>
              </div>

              {/* Alerta de permiso de micrófono */}
              {permisoMicrofono === 'denied' && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-destructive">Permiso de micrófono denegado</p>
                    <p className="text-muted-foreground">
                      Por favor, habilita el acceso al micrófono en la configuración de tu navegador.
                    </p>
                  </div>
                </div>
              )}

              <Button 
                onClick={iniciarLlamada}
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white h-12 text-base font-semibold shadow-lg"
                disabled={!telefono || estadoLlamada !== CALL_STATES.IDLE || permisoMicrofono === 'denied'}
              >
                <PhoneCall className="w-5 h-5 mr-2" />
                Iniciar llamada
              </Button>
            </div>
          )}

          {/* Vista de historial */}
          {vista === 'historial' && (
            <div className="space-y-3">
              {cargandoLlamadas ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-3 p-3">
                      <Skeleton className="w-12 h-12 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                      <Skeleton className="h-6 w-16" />
                    </div>
                  ))}
                </div>
              ) : llamadas.length > 0 ? (
                <div className="space-y-2">
                  {llamadas.map((llamada) => {
                    const estadoInfo = getEstadoInfo(llamada.estado);
                    const EstadoIcon = estadoInfo.icon;
                    
                    return (
                      <div 
                        key={llamada.id} 
                        className="flex items-center gap-3 p-4 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
                        onClick={() => {
                          setTelefono(llamada.destinatario);
                          setVista('llamar');
                        }}
                      >
                        {/* Avatar */}
                        <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold flex-shrink-0">
                          {getIniciales(nombre, llamada.destinatario)}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium truncate">
                              {llamada.destinatario}
                            </p>
                            {llamada.direccion === 'entrante' ? (
                              <PhoneIncoming className="w-4 h-4 text-green-500" />
                            ) : (
                              <PhoneOutgoing className="w-4 h-4 text-blue-500" />
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`text-xs px-2 py-0.5 rounded-full ${estadoInfo.bgColor} ${estadoInfo.color}`}>
                              {estadoInfo.label}
                            </span>
                            {llamada.duracion_seg > 0 && (
                              <span className="text-xs text-muted-foreground">
                                {formatearDuracion(llamada.duracion_seg)}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Fecha */}
                        <div className="text-right flex-shrink-0">
                          <p className="text-xs text-muted-foreground">
                            {formatearFecha(llamada.fecha_creacion)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <Phone className="w-12 h-12 mb-3 opacity-50" />
                  <p className="text-sm">No hay llamadas registradas</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de llamada en progreso - Mejorado */}
      <Dialog open={showCallDialog} onOpenChange={(open) => {
        if (!open && estadoLlamada === CALL_STATES.IN_PROGRESS) {
          return;
        }
        if (!open) {
          finalizarLlamada();
        }
      }}>
        <DialogContent className="sm:max-w-md p-0 overflow-hidden">
          <div className="bg-gradient-to-b from-blue-500 to-blue-600 text-white p-8">
            <div className="flex flex-col items-center space-y-6">
              {/* Avatar animado */}
              <div className={`w-32 h-32 rounded-full flex items-center justify-center text-4xl font-bold transition-all ${
                estadoLlamada === CALL_STATES.IN_PROGRESS 
                  ? 'bg-white text-blue-500 shadow-2xl scale-110' 
                  : estadoLlamada === CALL_STATES.ERROR
                  ? 'bg-red-500 text-white'
                  : estadoLlamada === CALL_STATES.RINGING
                  ? 'bg-white/20 text-white animate-pulse'
                  : 'bg-white/20 text-white'
              }`}>
                {nombre ? getIniciales(nombre, telefono) : <User className="w-16 h-16" />}
              </div>

              {/* Información */}
              <div className="text-center">
                <h3 className="text-2xl font-bold mb-1">{nombre || 'Llamada'}</h3>
                <p className="text-blue-100 text-lg">{telefono}</p>
                <p className={`text-xl font-semibold mt-3 ${
                  estadoLlamada === CALL_STATES.IN_PROGRESS ? 'text-white' :
                  estadoLlamada === CALL_STATES.ERROR ? 'text-red-200' :
                  'text-blue-100'
                }`}>
                  {getEstadoTexto()}
                </p>
              </div>

              {/* Controles durante la llamada */}
              {estadoLlamada === CALL_STATES.IN_PROGRESS && (
                <div className="flex items-center gap-4 pt-4">
                  <Button
                    variant={muted ? "destructive" : "secondary"}
                    size="icon"
                    className="rounded-full w-14 h-14 bg-white/20 hover:bg-white/30 border-2 border-white/50"
                    onClick={toggleMute}
                  >
                    {muted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                  </Button>
                  <Button
                    variant={speakerOn ? "secondary" : "outline"}
                    size="icon"
                    className="rounded-full w-14 h-14 bg-white/20 hover:bg-white/30 border-2 border-white/50"
                    onClick={() => setSpeakerOn(!speakerOn)}
                  >
                    {speakerOn ? <Volume2 className="w-6 h-6" /> : <VolumeX className="w-6 h-6" />}
                  </Button>
                </div>
              )}

              {/* Botón colgar */}
              {(estadoLlamada === CALL_STATES.CONNECTING || 
                estadoLlamada === CALL_STATES.RINGING || 
                estadoLlamada === CALL_STATES.IN_PROGRESS) && (
                <Button
                  variant="destructive"
                  size="lg"
                  className="rounded-full w-20 h-20 shadow-2xl mt-4"
                  onClick={() => finalizarLlamada(true)}
                >
                  <PhoneOff className="w-8 h-8" />
                </Button>
              )}

              {/* Loader mientras conecta */}
              {estadoLlamada === CALL_STATES.CONNECTING && (
                <Loader2 className="w-8 h-8 animate-spin text-white" />
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LlamadasPanel;
