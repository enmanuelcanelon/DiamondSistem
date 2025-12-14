import { useState, useEffect, useRef, useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  Phone, 
  PhoneOff, 
  PhoneCall, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX,
  Loader2,
  AlertCircle,
  Clock,
  User
} from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Badge } from '../ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription 
} from '../ui/dialog';
import comunicacionesService from '../../services/comunicacionesService';
import toast from 'react-hot-toast';

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
  const [historialLlamadas, setHistorialLlamadas] = useState([]);
  const [permisoMicrofono, setPermisoMicrofono] = useState('unknown');
  
  const deviceRef = useRef(null);
  const callRef = useRef(null);
  const timerRef = useRef(null);

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
    const mins = Math.floor(segundos / 60);
    const secs = segundos % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatearTelefono = (value) => {
    const cleaned = value.replace(/[^\d+]/g, '');
    setTelefono(cleaned);
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
      
      // El token puede venir en diferentes estructuras según el backend
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

    // Guardar en historial
    if (duracion > 0 || estadoLlamada === CALL_STATES.IN_PROGRESS) {
      setHistorialLlamadas(prev => [{
        id: Date.now(),
        telefono,
        duracion,
        fecha: new Date().toISOString(),
        estado: manual ? 'finalizada' : 'desconectada'
      }, ...prev]);
    }

    setEstadoLlamada(CALL_STATES.DISCONNECTED);
    
    if (manual) {
      toast.success(`Llamada finalizada. Duración: ${formatearDuracion(duracion)}`);
    }

    setTimeout(() => {
      setShowCallDialog(false);
      setEstadoLlamada(CALL_STATES.IDLE);
      setDuracion(0);
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

  const getIniciales = (nombre) => {
    if (!nombre) return <Phone className="w-8 h-8" />;
    return nombre.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className="space-y-6">
      {/* Formulario para llamar */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-blue-500/10">
              <Phone className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <CardTitle className="text-lg">Realizar Llamada</CardTitle>
              <CardDescription>
                {nombre ? `Llamar a ${nombre}` : 'Realiza una llamada de voz'}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
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
              className="w-full bg-blue-500 hover:bg-blue-600 text-white"
              disabled={!telefono || estadoLlamada !== CALL_STATES.IDLE || permisoMicrofono === 'denied'}
            >
              <PhoneCall className="w-4 h-4 mr-2" />
              Llamar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Modal de llamada en progreso */}
      <Dialog open={showCallDialog} onOpenChange={(open) => {
        if (!open && estadoLlamada === CALL_STATES.IN_PROGRESS) {
          // No cerrar si está en llamada
          return;
        }
        if (!open) {
          finalizarLlamada();
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center py-6 space-y-6">
            {/* Avatar */}
            <div className={`w-24 h-24 rounded-full flex items-center justify-center text-2xl font-bold ${
              estadoLlamada === CALL_STATES.IN_PROGRESS 
                ? 'bg-green-500 text-white animate-pulse' 
                : estadoLlamada === CALL_STATES.ERROR
                ? 'bg-destructive text-destructive-foreground'
                : 'bg-blue-500 text-white'
            }`}>
              {nombre ? getIniciales(nombre) : <User className="w-12 h-12" />}
            </div>

            {/* Información */}
            <div className="text-center">
              <h3 className="text-xl font-semibold">{nombre || 'Llamada'}</h3>
              <p className="text-muted-foreground">{telefono}</p>
              <p className={`text-lg font-medium mt-2 ${
                estadoLlamada === CALL_STATES.IN_PROGRESS ? 'text-green-500' :
                estadoLlamada === CALL_STATES.ERROR ? 'text-destructive' :
                'text-muted-foreground'
              }`}>
                {getEstadoTexto()}
              </p>
            </div>

            {/* Controles durante la llamada */}
            {estadoLlamada === CALL_STATES.IN_PROGRESS && (
              <div className="flex items-center gap-4">
                <Button
                  variant={muted ? "destructive" : "outline"}
                  size="icon"
                  className="rounded-full w-12 h-12"
                  onClick={toggleMute}
                >
                  {muted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </Button>
                <Button
                  variant={speakerOn ? "outline" : "secondary"}
                  size="icon"
                  className="rounded-full w-12 h-12"
                  onClick={() => setSpeakerOn(!speakerOn)}
                >
                  {speakerOn ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
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
                className="rounded-full w-16 h-16"
                onClick={() => finalizarLlamada(true)}
              >
                <PhoneOff className="w-6 h-6" />
              </Button>
            )}

            {/* Loader mientras conecta */}
            {estadoLlamada === CALL_STATES.CONNECTING && (
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Historial de llamadas de la sesión */}
      {historialLlamadas.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Llamadas de esta sesión
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {historialLlamadas.map((llamada) => (
                <div 
                  key={llamada.id} 
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-blue-500/10">
                      <PhoneCall className="w-4 h-4 text-blue-500" />
                    </div>
                    <div>
                      <p className="font-medium">{llamada.telefono}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(llamada.fecha).toLocaleTimeString('es-ES', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline">
                    {formatearDuracion(llamada.duracion)}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default LlamadasPanel;

