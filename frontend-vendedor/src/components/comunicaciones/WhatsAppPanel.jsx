import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Send, 
  Loader2, 
  CheckCheck, 
  Check, 
  Clock, 
  AlertCircle,
  Search,
  ArrowLeft,
  Phone,
  MoreVertical,
  Smile,
  Paperclip,
  User,
  MessageSquare,
  RefreshCw,
  X,
  Plus
} from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Skeleton } from '../ui/skeleton';
import comunicacionesService from '../../services/comunicacionesService';
import toast from 'react-hot-toast';
import { format, isToday, isYesterday, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

// Icono de WhatsApp SVG
const WhatsAppIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

const WhatsAppPanel = ({ 
  telefono: telefonoInicial = '', 
  nombre: nombreInicial = '', 
  leadId = null, 
  clienteId = null, 
  contratoId = null 
}) => {
  const queryClient = useQueryClient();
  const mensajesEndRef = useRef(null);
  
  // Estados
  const [conversacionActiva, setConversacionActiva] = useState(null);
  const [mensaje, setMensaje] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [mostrarNuevoChat, setMostrarNuevoChat] = useState(false);
  const [nuevoTelefono, setNuevoTelefono] = useState(telefonoInicial);
  const [vistaMovil, setVistaMovil] = useState('lista'); // 'lista' o 'chat'

  // Si se pasa un teléfono inicial, abrir esa conversación
  useEffect(() => {
    if (telefonoInicial) {
      setConversacionActiva({
        telefono: telefonoInicial,
        nombre: nombreInicial,
        leadId,
        clienteId
      });
      setVistaMovil('chat');
    }
  }, [telefonoInicial, nombreInicial, leadId, clienteId]);

  // Query para obtener conversaciones
  const { 
    data: conversacionesData, 
    isLoading: cargandoConversaciones,
    refetch: refrescarConversaciones 
  } = useQuery({
    queryKey: ['whatsapp-conversaciones'],
    queryFn: async () => {
      const response = await comunicacionesService.obtenerConversacionesWhatsApp();
      return response.data;
    },
    staleTime: 30 * 1000, // 30 segundos
    refetchInterval: 30 * 1000, // Polling cada 30 segundos
  });

  // Query para obtener mensajes de la conversación activa
  const { 
    data: mensajesData, 
    isLoading: cargandoMensajes,
    refetch: refrescarMensajes 
  } = useQuery({
    queryKey: ['whatsapp-mensajes', conversacionActiva?.telefono],
    queryFn: async () => {
      const response = await comunicacionesService.obtenerMensajesConversacion(conversacionActiva.telefono);
      return response.data;
    },
    enabled: !!conversacionActiva?.telefono,
    staleTime: 10 * 1000, // 10 segundos
    refetchInterval: 10 * 1000, // Polling cada 10 segundos
  });

  // Scroll al último mensaje cuando cambian
  useEffect(() => {
    if (mensajesEndRef.current) {
      mensajesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [mensajesData]);

  // Mutation para enviar mensaje
  const enviarMensajeMutation = useMutation({
    mutationFn: ({ telefono, mensaje }) => 
      comunicacionesService.enviarWhatsApp(telefono, mensaje, { 
        leadId: conversacionActiva?.leadId || leadId, 
        clienteId: conversacionActiva?.clienteId || clienteId, 
        contratoId 
      }),
    onSuccess: () => {
      setMensaje('');
      refrescarMensajes();
      refrescarConversaciones();
      toast.success('Mensaje enviado');
    },
    onError: (error) => {
      const errorMsg = error.response?.data?.mensaje || error.response?.data?.error || 'Error al enviar mensaje';
      toast.error(errorMsg);
    }
  });

  // Handlers
  const handleEnviar = (e) => {
    e.preventDefault();
    if (!mensaje.trim() || !conversacionActiva?.telefono) return;
    
    enviarMensajeMutation.mutate({ 
      telefono: conversacionActiva.telefono, 
      mensaje: mensaje.trim() 
    });
  };

  const handleNuevoChat = () => {
    if (!nuevoTelefono.trim()) {
      toast.error('Ingresa un número de teléfono');
      return;
    }
    
    setConversacionActiva({
      telefono: nuevoTelefono.trim(),
      nombre: null,
      leadId: null,
      clienteId: null
    });
    setMostrarNuevoChat(false);
    setNuevoTelefono('');
    setVistaMovil('chat');
  };

  const abrirConversacion = (conv) => {
    setConversacionActiva(conv);
    setVistaMovil('chat');
  };

  const volverALista = () => {
    setVistaMovil('lista');
    setConversacionActiva(null);
  };

  // Formatear fecha
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

  // Obtener inicial del nombre
  const obtenerInicial = (nombre, telefono) => {
    if (nombre) return nombre.charAt(0).toUpperCase();
    return telefono?.slice(-2) || '?';
  };

  // Icono de estado del mensaje
  const getEstadoIcon = (estado, direccion) => {
    if (direccion === 'entrante') return null;
    
    switch (estado) {
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

  // Datos
  const conversaciones = conversacionesData?.data || [];
  const mensajes = mensajesData?.data || [];
  const contactoInfo = mensajesData?.contacto || conversacionActiva;

  // Filtrar conversaciones por búsqueda
  const conversacionesFiltradas = conversaciones.filter(conv => {
    if (!busqueda.trim()) return true;
    const termino = busqueda.toLowerCase();
    return (
      conv.nombre?.toLowerCase().includes(termino) ||
      conv.telefono?.includes(termino) ||
      conv.ultimoMensaje?.toLowerCase().includes(termino)
    );
  });

  // Agrupar mensajes por fecha
  const mensajesAgrupados = mensajes.reduce((grupos, msg) => {
    const fecha = formatearFechaGrupo(msg.fecha);
    if (!grupos[fecha]) grupos[fecha] = [];
    grupos[fecha].push(msg);
    return grupos;
  }, {});

  // ==================== RENDERS ====================

  // Lista de conversaciones
  const renderListaConversaciones = () => (
    <div className={`flex flex-col h-full bg-background ${vistaMovil === 'chat' ? 'hidden lg:flex' : 'flex'} lg:w-80 lg:border-r`}>
      {/* Header */}
      <div className="p-3 border-b bg-[#25D366] text-white">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <WhatsAppIcon className="w-6 h-6" />
            <span className="font-semibold">WhatsApp</span>
          </div>
          <div className="flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 text-white hover:bg-white/20"
              onClick={() => refrescarConversaciones()}
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 text-white hover:bg-white/20"
              onClick={() => setMostrarNuevoChat(true)}
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Búsqueda */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Buscar conversación..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="pl-10 bg-white/90 border-0 h-9 text-gray-800 placeholder:text-gray-500"
          />
        </div>
      </div>

      {/* Modal nuevo chat */}
      {mostrarNuevoChat && (
        <div className="p-3 border-b bg-muted/50">
          <div className="flex items-center gap-2">
            <Input
              placeholder="+1234567890"
              value={nuevoTelefono}
              onChange={(e) => setNuevoTelefono(e.target.value.replace(/[^\d+]/g, ''))}
              className="flex-1"
            />
            <Button size="sm" onClick={handleNuevoChat} className="bg-[#25D366] hover:bg-[#128C7E]">
              Iniciar
            </Button>
            <Button size="icon" variant="ghost" onClick={() => setMostrarNuevoChat(false)}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Lista */}
      <div className="flex-1 overflow-y-auto">
        {cargandoConversaciones ? (
          <div className="p-3 space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="w-12 h-12 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-3 w-40" />
                </div>
              </div>
            ))}
          </div>
        ) : conversacionesFiltradas.length > 0 ? (
          <div className="divide-y">
            {conversacionesFiltradas.map((conv, index) => (
              <div
                key={conv.telefonoNormalizado || index}
                onClick={() => abrirConversacion(conv)}
                className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-muted/50 transition-colors ${
                  conversacionActiva?.telefono === conv.telefono ? 'bg-muted' : ''
                }`}
              >
                {/* Avatar */}
                <div className="w-12 h-12 rounded-full bg-[#25D366] flex items-center justify-center text-white font-semibold flex-shrink-0">
                  {obtenerInicial(conv.nombre, conv.telefono)}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium truncate">
                      {conv.nombre || conv.telefono}
                    </span>
                    <span className="text-xs text-muted-foreground flex-shrink-0">
                      {formatearFecha(conv.ultimaFecha)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm text-muted-foreground truncate">
                      {conv.direccion === 'saliente' && (
                        <CheckCheck className="w-3 h-3 inline mr-1 text-blue-500" />
                      )}
                      {conv.ultimoMensaje}
                    </p>
                    {conv.noLeidos > 0 && (
                      <Badge className="bg-[#25D366] text-white text-xs h-5 min-w-[20px] flex items-center justify-center">
                        {conv.noLeidos}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <MessageSquare className="w-12 h-12 mb-3 opacity-50" />
            <p className="text-sm">No hay conversaciones</p>
            <Button 
              variant="link" 
              size="sm" 
              onClick={() => setMostrarNuevoChat(true)}
              className="mt-2 text-[#25D366]"
            >
              Iniciar nueva conversación
            </Button>
          </div>
        )}
      </div>
    </div>
  );

  // Panel de chat
  const renderChat = () => (
    <div className={`flex-1 flex flex-col h-full ${vistaMovil === 'lista' ? 'hidden lg:flex' : 'flex'}`}>
      {conversacionActiva ? (
        <>
          {/* Header del chat */}
          <div className="flex items-center gap-3 p-3 border-b bg-[#F0F2F5] dark:bg-muted">
            <Button 
              variant="ghost" 
              size="icon" 
              className="lg:hidden h-8 w-8"
              onClick={volverALista}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            
            <div className="w-10 h-10 rounded-full bg-[#25D366] flex items-center justify-center text-white font-semibold">
              {obtenerInicial(contactoInfo?.nombre, contactoInfo?.telefono)}
            </div>
            
            <div className="flex-1 min-w-0">
              <p className="font-semibold truncate">
                {contactoInfo?.nombre || contactoInfo?.telefono}
              </p>
              {contactoInfo?.nombre && (
                <p className="text-xs text-muted-foreground">{contactoInfo?.telefono}</p>
              )}
            </div>

            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => refrescarMensajes()}>
              <RefreshCw className={`w-4 h-4 ${cargandoMensajes ? 'animate-spin' : ''}`} />
            </Button>
          </div>

          {/* Mensajes */}
          <div 
            className="flex-1 overflow-y-auto p-4 space-y-4"
            style={{ 
              backgroundImage: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%239C92AC" fill-opacity="0.05"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
              backgroundColor: '#ECE5DD'
            }}
          >
            {cargandoMensajes ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-[#25D366]" />
              </div>
            ) : mensajes.length > 0 ? (
              Object.entries(mensajesAgrupados).map(([fecha, msgs]) => (
                <div key={fecha}>
                  {/* Separador de fecha */}
                  <div className="flex justify-center mb-4">
                    <span className="px-3 py-1 rounded-lg bg-white/80 dark:bg-gray-800 text-xs text-muted-foreground shadow-sm">
                      {fecha}
                    </span>
                  </div>
                  
                  {/* Mensajes del día */}
                  <div className="space-y-1">
                    {msgs.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.direccion === 'saliente' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[75%] rounded-lg px-3 py-2 shadow-sm ${
                            msg.direccion === 'saliente'
                              ? 'bg-[#DCF8C6] dark:bg-[#025144] rounded-tr-none'
                              : 'bg-white dark:bg-gray-800 rounded-tl-none'
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap break-words">{msg.contenido}</p>
                          <div className={`flex items-center gap-1 mt-1 ${
                            msg.direccion === 'saliente' ? 'justify-end' : 'justify-start'
                          }`}>
                            <span className="text-[10px] text-muted-foreground">
                              {format(new Date(msg.fecha), 'HH:mm', { locale: es })}
                            </span>
                            {getEstadoIcon(msg.estado, msg.direccion)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <WhatsAppIcon className="w-16 h-16 mb-4 opacity-30" />
                <p className="text-sm">No hay mensajes aún</p>
                <p className="text-xs mt-1">Envía el primer mensaje</p>
              </div>
            )}
            <div ref={mensajesEndRef} />
          </div>

          {/* Input de mensaje */}
          <form onSubmit={handleEnviar} className="p-3 border-t bg-[#F0F2F5] dark:bg-muted">
            <div className="flex items-end gap-2">
              <div className="flex-1 relative">
                <Input
                  placeholder="Escribe un mensaje..."
                  value={mensaje}
                  onChange={(e) => setMensaje(e.target.value)}
                  disabled={enviarMensajeMutation.isPending}
                  className="pr-12 py-6 rounded-full bg-white dark:bg-gray-800"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleEnviar(e);
                    }
                  }}
                />
              </div>
              <Button
                type="submit"
                size="icon"
                className="h-12 w-12 rounded-full bg-[#25D366] hover:bg-[#128C7E]"
                disabled={enviarMensajeMutation.isPending || !mensaje.trim()}
              >
                {enviarMensajeMutation.isPending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </Button>
            </div>
          </form>
        </>
      ) : (
        // Estado vacío cuando no hay conversación seleccionada
        <div className="flex-1 flex flex-col items-center justify-center bg-[#F0F2F5] dark:bg-muted/30">
          <div className="text-center p-8">
            <div className="w-24 h-24 rounded-full bg-[#25D366]/10 flex items-center justify-center mx-auto mb-6">
              <WhatsAppIcon className="w-12 h-12 text-[#25D366]" />
            </div>
            <h3 className="text-xl font-semibold mb-2">WhatsApp Business</h3>
            <p className="text-muted-foreground text-sm max-w-md">
              Selecciona una conversación de la lista o inicia una nueva para comenzar a chatear
            </p>
            
            {/* Nota informativa */}
            <div className="mt-8 p-4 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-left max-w-md">
              <div className="flex gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-amber-800 dark:text-amber-200">Nota importante</p>
                  <p className="text-amber-700 dark:text-amber-300 mt-1">
                    Solo puedes enviar mensajes a números que hayan escrito primero al WhatsApp Business de la empresa.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // ==================== RENDER PRINCIPAL ====================

  return (
    <Card className="overflow-hidden">
      <div className="flex h-[600px] lg:h-[700px]">
        {renderListaConversaciones()}
        {renderChat()}
      </div>
    </Card>
  );
};

export default WhatsAppPanel;
