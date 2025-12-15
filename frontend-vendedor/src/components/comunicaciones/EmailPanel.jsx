import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Mail, 
  Send, 
  Loader2, 
  Inbox, 
  RefreshCw, 
  ArrowLeft,
  Reply,
  Trash2,
  AlertCircle,
  Search,
  PenSquare,
  Star,
  Paperclip,
  ChevronDown,
  MoreHorizontal,
  Clock,
  CheckCheck,
  User,
  X
} from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Badge } from '../ui/badge';
import { Skeleton } from '../ui/skeleton';
import { Separator } from '../ui/separator';
import comunicacionesService from '../../services/comunicacionesService';
import toast from 'react-hot-toast';
import { format, formatDistanceToNow, isToday, isYesterday, isThisWeek } from 'date-fns';
import { es } from 'date-fns/locale';

// Vistas del panel
const VIEWS = {
  LIST: 'list',
  COMPOSE: 'compose',
  READ: 'read',
  REPLY: 'reply'
};

// Carpetas disponibles
const CARPETAS = [
  { id: 'inbox', label: 'Recibidos', icon: Inbox, color: 'text-blue-500' },
  { id: 'sent', label: 'Enviados', icon: Send, color: 'text-green-500' },
  { id: 'starred', label: 'Destacados', icon: Star, color: 'text-yellow-500' },
];

const EmailPanel = ({ email: emailInicial = '', nombre = '', leadId = null, clienteId = null, contratoId = null }) => {
  const queryClient = useQueryClient();
  const [vista, setVista] = useState(VIEWS.LIST);
  const [carpetaActiva, setCarpetaActiva] = useState('inbox');
  const [busqueda, setBusqueda] = useState('');
  const [emailSeleccionado, setEmailSeleccionado] = useState(null);
  const [mostrarBusqueda, setMostrarBusqueda] = useState(false);
  
  // Estado para nuevo email
  const [nuevoEmail, setNuevoEmail] = useState({
    destinatario: emailInicial,
    asunto: '',
    cuerpo: '',
    cc: '',
    bcc: ''
  });

  // Estado para respuesta
  const [respuesta, setRespuesta] = useState('');
  const [mostrarCcBcc, setMostrarCcBcc] = useState(false);

  // Query para obtener emails
  const { 
    data: emailsData, 
    isLoading: cargandoEmails, 
    refetch: refrescarEmails, 
    isError: errorEmails 
  } = useQuery({
    queryKey: ['emails', carpetaActiva, busqueda],
    queryFn: async () => {
      const response = await comunicacionesService.obtenerBandeja(30, busqueda, carpetaActiva);
      return response.data;
    },
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1
  });

  // Query para obtener email completo
  const { data: emailCompletoData, isLoading: cargandoEmailCompleto } = useQuery({
    queryKey: ['email-detalle', emailSeleccionado?.id],
    queryFn: async () => {
      const response = await comunicacionesService.obtenerEmail(emailSeleccionado.id);
      return response.data;
    },
    enabled: !!emailSeleccionado?.id && (vista === VIEWS.READ || vista === VIEWS.REPLY),
    staleTime: 5 * 60 * 1000,
  });

  // Mutation para enviar email
  const enviarEmailMutation = useMutation({
    mutationFn: ({ destinatario, asunto, cuerpo, cc, bcc }) => 
      comunicacionesService.enviarEmail(destinatario, asunto, cuerpo, { cc, bcc, leadId, clienteId, contratoId }),
    onSuccess: () => {
      toast.success('✉️ Email enviado correctamente');
      setNuevoEmail({ destinatario: '', asunto: '', cuerpo: '', cc: '', bcc: '' });
      setVista(VIEWS.LIST);
      setCarpetaActiva('sent');
      refrescarEmails();
    },
    onError: (error) => {
      const errorMsg = error.response?.data?.mensaje || error.response?.data?.error || 'Error al enviar email';
      toast.error(errorMsg);
    }
  });

  // Mutation para marcar como leído
  const marcarLeidoMutation = useMutation({
    mutationFn: (emailId) => comunicacionesService.marcarEmailLeido(emailId),
    onSuccess: () => {
      queryClient.invalidateQueries(['emails']);
    }
  });

  // Mutation para responder email
  const responderEmailMutation = useMutation({
    mutationFn: ({ emailId, cuerpo }) => 
      comunicacionesService.responderEmail(emailId, cuerpo, { leadId, clienteId, contratoId }),
    onSuccess: () => {
      toast.success('✉️ Respuesta enviada');
      setRespuesta('');
      setVista(VIEWS.LIST);
      refrescarEmails();
    },
    onError: (error) => {
      const errorMsg = error.response?.data?.mensaje || 'Error al responder email';
      toast.error(errorMsg);
    }
  });

  // Formatear fecha de forma inteligente
  const formatearFecha = (fecha) => {
    if (!fecha) return '';
    const date = new Date(fecha);
    
    if (isToday(date)) {
      return format(date, 'HH:mm', { locale: es });
    }
    if (isYesterday(date)) {
      return 'Ayer';
    }
    if (isThisWeek(date)) {
      return format(date, 'EEEE', { locale: es });
    }
    return format(date, 'd MMM', { locale: es });
  };

  // Formatear fecha completa
  const formatearFechaCompleta = (fecha) => {
    if (!fecha) return '';
    const date = new Date(fecha);
    return format(date, "EEEE d 'de' MMMM 'de' yyyy 'a las' HH:mm", { locale: es });
  };

  // Extraer nombre del email
  const extraerNombre = (emailString) => {
    if (!emailString) return 'Desconocido';
    const match = emailString.match(/^(.+?)\s*<.+>$/);
    if (match) return match[1].trim();
    return emailString.split('@')[0];
  };

  // Extraer solo el email
  const extraerEmail = (emailString) => {
    if (!emailString) return '';
    const match = emailString.match(/<(.+)>/);
    if (match) return match[1];
    return emailString;
  };

  // Obtener inicial para avatar
  const obtenerInicial = (emailString) => {
    const nombre = extraerNombre(emailString);
    return nombre.charAt(0).toUpperCase();
  };

  // Abrir email
  const abrirEmail = (email) => {
    setEmailSeleccionado(email);
    setVista(VIEWS.READ);
    if (email.isUnread) {
      marcarLeidoMutation.mutate(email.id);
    }
  };

  // Cambiar carpeta
  const cambiarCarpeta = (carpeta) => {
    setCarpetaActiva(carpeta);
    setEmailSeleccionado(null);
    setVista(VIEWS.LIST);
  };

  // Handlers
  const handleEnviarEmail = (e) => {
    e.preventDefault();
    
    if (!nuevoEmail.destinatario.trim()) {
      toast.error('Ingresa un destinatario');
      return;
    }
    if (!nuevoEmail.asunto.trim()) {
      toast.error('Ingresa un asunto');
      return;
    }
    if (!nuevoEmail.cuerpo.trim()) {
      toast.error('Ingresa el contenido del email');
      return;
    }

    enviarEmailMutation.mutate(nuevoEmail);
  };

  const handleResponder = (e) => {
    e.preventDefault();
    
    if (!respuesta.trim()) {
      toast.error('Ingresa tu respuesta');
      return;
    }

    responderEmailMutation.mutate({ 
      emailId: emailSeleccionado.id, 
      cuerpo: respuesta 
    });
  };

  // Carpeta activa info
  const carpetaInfo = CARPETAS.find(c => c.id === carpetaActiva) || CARPETAS[0];
  const emails = emailsData?.data || [];
  const emailCompleto = emailCompletoData?.data || emailSeleccionado;

  // ==================== RENDERS ====================

  // Sidebar con carpetas
  const renderSidebar = () => (
    <div className="w-full lg:w-56 flex-shrink-0 border-b lg:border-b-0 lg:border-r bg-muted/30">
      {/* Botón Nuevo Email */}
      <div className="p-3">
        <Button 
          onClick={() => {
            setNuevoEmail({ destinatario: emailInicial, asunto: '', cuerpo: '', cc: '', bcc: '' });
            setVista(VIEWS.COMPOSE);
          }}
          className="w-full bg-gradient-to-r from-[#EF4444] to-[#DC2626] hover:from-[#DC2626] hover:to-[#B91C1C] text-white shadow-lg"
        >
          <PenSquare className="w-4 h-4 mr-2" />
          Redactar
        </Button>
      </div>

      {/* Lista de carpetas */}
      <nav className="p-2 flex lg:flex-col gap-1 overflow-x-auto lg:overflow-x-visible">
        {CARPETAS.map((carpeta) => {
          const Icon = carpeta.icon;
          const isActive = carpetaActiva === carpeta.id;
          return (
            <button
              key={carpeta.id}
              onClick={() => cambiarCarpeta(carpeta.id)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                isActive 
                  ? 'bg-[#EF4444]/10 text-[#EF4444]' 
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? carpeta.color : ''}`} />
              <span>{carpeta.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );

  // Lista de emails
  const renderListaEmails = () => (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b bg-background/95 backdrop-blur sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <carpetaInfo.icon className={`w-5 h-5 ${carpetaInfo.color}`} />
          <h3 className="font-semibold text-lg">{carpetaInfo.label}</h3>
          <Badge variant="secondary" className="text-xs">
            {emails.length}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          {mostrarBusqueda ? (
            <div className="flex items-center gap-2">
              <Input
                placeholder="Buscar..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-48 h-8 text-sm"
                autoFocus
              />
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8"
                onClick={() => {
                  setMostrarBusqueda(false);
                  setBusqueda('');
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8"
              onClick={() => setMostrarBusqueda(true)}
            >
              <Search className="w-4 h-4" />
            </Button>
          )}
          <Button 
            variant="ghost" 
            size="icon"
            className="h-8 w-8"
            onClick={() => refrescarEmails()}
            disabled={cargandoEmails}
          >
            <RefreshCw className={`w-4 h-4 ${cargandoEmails ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Lista */}
      <div className="flex-1 overflow-y-auto">
        {cargandoEmails ? (
          <div className="p-4 space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg border">
                <Skeleton className="w-10 h-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-12" />
                  </div>
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : emails.length > 0 ? (
          <div className="divide-y">
            {emails.map((email) => (
              <div 
                key={email.id}
                onClick={() => abrirEmail(email)}
                className={`flex items-start gap-3 p-4 cursor-pointer transition-all hover:bg-muted/50 ${
                  email.isUnread 
                    ? 'bg-blue-50/50 dark:bg-blue-950/20' 
                    : ''
                } ${
                  emailSeleccionado?.id === email.id 
                    ? 'bg-[#EF4444]/5 border-l-2 border-l-[#EF4444]' 
                    : ''
                }`}
              >
                {/* Avatar */}
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0 ${
                  email.isUnread ? 'bg-[#EF4444]' : 'bg-gray-400'
                }`}>
                  {obtenerInicial(carpetaActiva === 'sent' ? email.to : email.from)}
                </div>

                {/* Contenido */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`truncate ${email.isUnread ? 'font-semibold' : 'font-medium'}`}>
                        {carpetaActiva === 'sent' 
                          ? `Para: ${extraerNombre(email.to)}`
                          : extraerNombre(email.from)
                        }
                      </span>
                      {email.isStarred && (
                        <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500 flex-shrink-0" />
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap flex-shrink-0">
                      {formatearFecha(email.date)}
                    </span>
                  </div>
                  
                  <p className={`text-sm truncate mb-0.5 ${
                    email.isUnread ? 'font-medium text-foreground' : 'text-muted-foreground'
                  }`}>
                    {email.subject || '(Sin asunto)'}
                  </p>
                  
                  <p className="text-xs text-muted-foreground truncate">
                    {email.snippet}
                  </p>
                </div>

                {/* Indicadores */}
                {email.isUnread && (
                  <div className="w-2 h-2 rounded-full bg-[#EF4444] flex-shrink-0 mt-2" />
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Mail className="w-8 h-8" />
            </div>
            <p className="font-medium">No hay emails en {carpetaInfo.label.toLowerCase()}</p>
            <p className="text-sm mt-1">Los emails aparecerán aquí</p>
          </div>
        )}
      </div>

      {/* Alerta de error */}
      {errorEmails && (
        <div className="p-4 border-t">
          <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-medium text-amber-800 dark:text-amber-200">Gmail no conectado</p>
              <p className="text-amber-700 dark:text-amber-300 mt-0.5">
                Ve a Configuración → Conectar cuenta de Google
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // Vista de lectura de email
  const renderLectura = () => {
    if (!emailCompleto) return null;

    return (
      <div className="flex-1 flex flex-col min-h-0 bg-background">
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b sticky top-0 bg-background z-10">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => {
              setVista(VIEWS.LIST);
              setEmailSeleccionado(null);
            }}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                setRespuesta('');
                setVista(VIEWS.REPLY);
              }}
              disabled={cargandoEmailCompleto}
            >
              <Reply className="w-4 h-4 mr-2" />
              Responder
            </Button>
          </div>
        </div>

        {/* Contenido */}
        <div className="flex-1 overflow-y-auto">
          {cargandoEmailCompleto ? (
            <div className="p-6 space-y-4">
              <Skeleton className="h-8 w-2/3" />
              <div className="flex items-center gap-3">
                <Skeleton className="w-12 h-12 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </div>
              <Separator />
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </div>
          ) : (
            <div className="p-6">
              {/* Asunto */}
              <h1 className="text-2xl font-semibold mb-4">
                {emailCompleto.subject || '(Sin asunto)'}
              </h1>

              {/* Remitente */}
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 rounded-full bg-[#EF4444] flex items-center justify-center text-white font-semibold text-lg">
                  {obtenerInicial(emailCompleto.from)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold">{extraerNombre(emailCompleto.from)}</span>
                    <span className="text-sm text-muted-foreground">&lt;{extraerEmail(emailCompleto.from)}&gt;</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                    <span>Para: {extraerEmail(emailCompleto.to)}</span>
                    {emailCompleto.cc && (
                      <span>• CC: {emailCompleto.cc}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                    <Clock className="w-3 h-3" />
                    {formatearFechaCompleta(emailCompleto.date)}
                  </div>
                </div>
              </div>

              <Separator className="my-6" />

              {/* Cuerpo del email */}
              {emailCompleto.bodyHtml || emailCompleto.body ? (
                <div 
                  className="prose prose-sm dark:prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ 
                    __html: emailCompleto.bodyHtml || emailCompleto.body 
                  }}
                />
              ) : (
                <div className="whitespace-pre-wrap text-sm leading-relaxed">
                  {emailCompleto.snippet || 'Sin contenido'}
                </div>
              )}

              {/* Adjuntos */}
              {emailCompleto.attachments && emailCompleto.attachments.length > 0 && (
                <div className="mt-8 pt-6 border-t">
                  <div className="flex items-center gap-2 mb-3">
                    <Paperclip className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">
                      {emailCompleto.attachments.length} adjunto{emailCompleto.attachments.length > 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {emailCompleto.attachments.map((adj, index) => (
                      <div 
                        key={index} 
                        className="flex items-center gap-2 px-3 py-2 rounded-lg border bg-muted/50 text-sm"
                      >
                        <Paperclip className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">{adj.filename}</span>
                        <span className="text-muted-foreground">
                          ({Math.round(adj.size / 1024)} KB)
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  // Vista de composición
  const renderCompose = () => (
    <div className="flex-1 flex flex-col min-h-0 bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b">
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => setVista(VIEWS.LIST)}
          >
            <X className="w-5 h-5" />
          </Button>
          <h3 className="font-semibold text-lg">Nuevo mensaje</h3>
        </div>
      </div>

      {/* Formulario */}
      <form onSubmit={handleEnviarEmail} className="flex-1 flex flex-col p-4 overflow-y-auto">
        <div className="space-y-1">
          {/* Para */}
          <div className="flex items-center border-b py-2">
            <label className="text-sm text-muted-foreground w-16">Para:</label>
            <Input
              type="email"
              placeholder="destinatario@ejemplo.com"
              value={nuevoEmail.destinatario}
              onChange={(e) => setNuevoEmail(prev => ({ ...prev, destinatario: e.target.value }))}
              disabled={enviarEmailMutation.isPending}
              className="border-0 shadow-none focus-visible:ring-0 px-0"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground"
              onClick={() => setMostrarCcBcc(!mostrarCcBcc)}
            >
              Cc/Cco
            </Button>
          </div>

          {/* CC y BCC */}
          {mostrarCcBcc && (
            <>
              <div className="flex items-center border-b py-2">
                <label className="text-sm text-muted-foreground w-16">Cc:</label>
                <Input
                  type="email"
                  placeholder="cc@ejemplo.com"
                  value={nuevoEmail.cc}
                  onChange={(e) => setNuevoEmail(prev => ({ ...prev, cc: e.target.value }))}
                  disabled={enviarEmailMutation.isPending}
                  className="border-0 shadow-none focus-visible:ring-0 px-0"
                />
              </div>
              <div className="flex items-center border-b py-2">
                <label className="text-sm text-muted-foreground w-16">Cco:</label>
                <Input
                  type="email"
                  placeholder="bcc@ejemplo.com"
                  value={nuevoEmail.bcc}
                  onChange={(e) => setNuevoEmail(prev => ({ ...prev, bcc: e.target.value }))}
                  disabled={enviarEmailMutation.isPending}
                  className="border-0 shadow-none focus-visible:ring-0 px-0"
                />
              </div>
            </>
          )}

          {/* Asunto */}
          <div className="flex items-center border-b py-2">
            <label className="text-sm text-muted-foreground w-16">Asunto:</label>
            <Input
              placeholder="Asunto del mensaje"
              value={nuevoEmail.asunto}
              onChange={(e) => setNuevoEmail(prev => ({ ...prev, asunto: e.target.value }))}
              disabled={enviarEmailMutation.isPending}
              className="border-0 shadow-none focus-visible:ring-0 px-0"
            />
          </div>
        </div>

        {/* Cuerpo */}
        <Textarea
          placeholder="Escribe tu mensaje aquí..."
          value={nuevoEmail.cuerpo}
          onChange={(e) => setNuevoEmail(prev => ({ ...prev, cuerpo: e.target.value }))}
          disabled={enviarEmailMutation.isPending}
          className="flex-1 mt-4 min-h-[200px] resize-none border-0 shadow-none focus-visible:ring-0"
        />

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t mt-4">
          <Button 
            type="submit"
            className="bg-[#EF4444] hover:bg-[#DC2626] text-white px-6"
            disabled={enviarEmailMutation.isPending}
          >
            {enviarEmailMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Enviar
              </>
            )}
          </Button>
          <Button 
            type="button" 
            variant="ghost" 
            onClick={() => setVista(VIEWS.LIST)}
            disabled={enviarEmailMutation.isPending}
          >
            Descartar
          </Button>
        </div>
      </form>
    </div>
  );

  // Vista de respuesta
  const renderReply = () => {
    if (!emailCompleto) return null;

    return (
      <div className="flex-1 flex flex-col min-h-0 bg-background">
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setVista(VIEWS.READ)}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h3 className="font-semibold">Responder a {extraerNombre(emailCompleto.from)}</h3>
          </div>
        </div>

        {/* Email original resumido */}
        <div className="p-4 bg-muted/30 border-b">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <Reply className="w-4 h-4" />
            <span>Re: {emailCompleto.subject}</span>
          </div>
          <p className="text-sm text-muted-foreground truncate">
            {emailCompleto.snippet}
          </p>
        </div>

        {/* Formulario de respuesta */}
        <form onSubmit={handleResponder} className="flex-1 flex flex-col p-4">
          <Textarea
            placeholder="Escribe tu respuesta..."
            value={respuesta}
            onChange={(e) => setRespuesta(e.target.value)}
            disabled={responderEmailMutation.isPending}
            className="flex-1 min-h-[200px] resize-none"
            autoFocus
          />

          <div className="flex items-center justify-between pt-4">
            <Button 
              type="submit"
              className="bg-[#EF4444] hover:bg-[#DC2626] text-white px-6"
              disabled={responderEmailMutation.isPending || !respuesta.trim()}
            >
              {responderEmailMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Enviar respuesta
                </>
              )}
            </Button>
            <Button 
              type="button" 
              variant="ghost" 
              onClick={() => setVista(VIEWS.READ)}
              disabled={responderEmailMutation.isPending}
            >
              Cancelar
            </Button>
          </div>
        </form>
      </div>
    );
  };

  // ==================== RENDER PRINCIPAL ====================

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-col lg:flex-row min-h-[600px] max-h-[800px]">
        {/* Sidebar - siempre visible */}
        {renderSidebar()}

        {/* Contenido principal */}
        {vista === VIEWS.LIST && renderListaEmails()}
        {vista === VIEWS.READ && renderLectura()}
        {vista === VIEWS.COMPOSE && renderCompose()}
        {vista === VIEWS.REPLY && renderReply()}
      </div>
    </Card>
  );
};

export default EmailPanel;
