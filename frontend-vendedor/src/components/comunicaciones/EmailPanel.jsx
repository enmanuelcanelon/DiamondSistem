import { useState } from 'react';
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
  Check
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
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// Vistas del panel
const VIEWS = {
  INBOX: 'inbox',
  COMPOSE: 'compose',
  READ: 'read',
  REPLY: 'reply'
};

const EmailPanel = ({ email: emailInicial = '', nombre = '', leadId = null, clienteId = null, contratoId = null }) => {
  const queryClient = useQueryClient();
  const [vista, setVista] = useState(VIEWS.INBOX);
  const [busqueda, setBusqueda] = useState('');
  const [emailSeleccionado, setEmailSeleccionado] = useState(null);
  
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

  // Query para obtener bandeja de entrada
  const { data: bandejaData, isLoading: cargandoBandeja, refetch: refrescarBandeja, isError: errorBandeja, error: errorData } = useQuery({
    queryKey: ['email-bandeja', busqueda],
    queryFn: async () => {
      const response = await comunicacionesService.obtenerBandeja(20, busqueda);
      return response.data;
    },
    staleTime: 60 * 1000, // 1 minuto
    refetchOnWindowFocus: false,
    retry: 1
  });

  // Mutation para enviar email
  const enviarEmailMutation = useMutation({
    mutationFn: ({ destinatario, asunto, cuerpo, cc, bcc }) => 
      comunicacionesService.enviarEmail(destinatario, asunto, cuerpo, { cc, bcc, leadId, clienteId, contratoId }),
    onSuccess: () => {
      toast.success('Email enviado correctamente');
      setNuevoEmail({ destinatario: '', asunto: '', cuerpo: '', cc: '', bcc: '' });
      setVista(VIEWS.INBOX);
      refrescarBandeja();
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
      refrescarBandeja();
    }
  });

  // Mutation para responder email
  const responderEmailMutation = useMutation({
    mutationFn: ({ emailId, cuerpo }) => 
      comunicacionesService.responderEmail(emailId, cuerpo, { leadId, clienteId, contratoId }),
    onSuccess: () => {
      toast.success('Respuesta enviada correctamente');
      setRespuesta('');
      setVista(VIEWS.INBOX);
      refrescarBandeja();
    },
    onError: (error) => {
      const errorMsg = error.response?.data?.mensaje || 'Error al responder email';
      toast.error(errorMsg);
    }
  });

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

  const abrirEmail = (email) => {
    setEmailSeleccionado(email);
    setVista(VIEWS.READ);
    if (email.isUnread) {
      marcarLeidoMutation.mutate(email.id);
    }
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return '';
    const date = new Date(fecha);
    const hoy = new Date();
    
    if (date.toDateString() === hoy.toDateString()) {
      return format(date, 'HH:mm', { locale: es });
    }
    return format(date, 'dd MMM', { locale: es });
  };

  // Renderizar vista de bandeja
  const renderBandeja = () => (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Inbox className="w-5 h-5 text-[#EF4444]" />
          <h3 className="font-semibold">Bandeja de entrada</h3>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="icon"
            onClick={() => refrescarBandeja()}
            disabled={cargandoBandeja}
          >
            <RefreshCw className={`w-4 h-4 ${cargandoBandeja ? 'animate-spin' : ''}`} />
          </Button>
          <Button 
            onClick={() => setVista(VIEWS.COMPOSE)}
            className="bg-[#EF4444] hover:bg-[#DC2626] text-white"
          >
            <PenSquare className="w-4 h-4 mr-2" />
            Nuevo
          </Button>
        </div>
      </div>

      {/* Buscador */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar emails..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Lista de emails */}
      {cargandoBandeja ? (
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="p-4 border rounded-lg">
              <Skeleton className="h-4 w-1/3 mb-2" />
              <Skeleton className="h-4 w-2/3 mb-2" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </div>
      ) : bandejaData?.data?.length > 0 ? (
        <div className="space-y-2">
          {bandejaData.data.map((email) => (
            <div 
              key={email.id}
              onClick={() => abrirEmail(email)}
              className={`p-4 border rounded-lg cursor-pointer transition-colors hover:bg-muted/50 ${
                email.isUnread ? 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800' : ''
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={`truncate ${email.isUnread ? 'font-semibold' : ''}`}>
                      {email.de || email.from}
                    </p>
                    {email.isUnread && (
                      <Badge variant="default" className="bg-blue-500 text-xs">Nuevo</Badge>
                    )}
                  </div>
                  <p className={`text-sm truncate ${email.isUnread ? 'font-medium' : 'text-muted-foreground'}`}>
                    {email.asunto || email.subject}
                  </p>
                  <p className="text-xs text-muted-foreground truncate mt-1">
                    {email.preview || email.snippet}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {formatearFecha(email.fecha || email.date)}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          <Mail className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No hay emails</p>
        </div>
      )}

      {/* Alerta si no hay Gmail conectado o hay error */}
      {(bandejaData?.error || errorBandeja) && (
        <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-800">
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-amber-800 dark:text-amber-200">Gmail no conectado</p>
                <p className="text-amber-700 dark:text-amber-300 mt-1">
                  Conecta tu cuenta de Google en <strong>Configuración</strong> para poder enviar y recibir emails.
                </p>
                <p className="text-amber-700 dark:text-amber-300 mt-2 text-xs">
                  Ve a Configuración → Google Calendar/Gmail → Conectar cuenta de Google
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );

  // Renderizar vista de composición
  const renderCompose = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => setVista(VIEWS.INBOX)}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <h3 className="font-semibold">Nuevo email</h3>
      </div>

      <form onSubmit={handleEnviarEmail} className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Para</label>
          <Input
            type="email"
            placeholder="destinatario@ejemplo.com"
            value={nuevoEmail.destinatario}
            onChange={(e) => setNuevoEmail(prev => ({ ...prev, destinatario: e.target.value }))}
            disabled={enviarEmailMutation.isPending}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">CC (opcional)</label>
            <Input
              type="email"
              placeholder="cc@ejemplo.com"
              value={nuevoEmail.cc}
              onChange={(e) => setNuevoEmail(prev => ({ ...prev, cc: e.target.value }))}
              disabled={enviarEmailMutation.isPending}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">BCC (opcional)</label>
            <Input
              type="email"
              placeholder="bcc@ejemplo.com"
              value={nuevoEmail.bcc}
              onChange={(e) => setNuevoEmail(prev => ({ ...prev, bcc: e.target.value }))}
              disabled={enviarEmailMutation.isPending}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Asunto</label>
          <Input
            placeholder="Asunto del email"
            value={nuevoEmail.asunto}
            onChange={(e) => setNuevoEmail(prev => ({ ...prev, asunto: e.target.value }))}
            disabled={enviarEmailMutation.isPending}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Mensaje</label>
          <Textarea
            placeholder="Escribe tu mensaje aquí..."
            value={nuevoEmail.cuerpo}
            onChange={(e) => setNuevoEmail(prev => ({ ...prev, cuerpo: e.target.value }))}
            rows={10}
            disabled={enviarEmailMutation.isPending}
          />
        </div>

        <div className="flex justify-end gap-2">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => setVista(VIEWS.INBOX)}
            disabled={enviarEmailMutation.isPending}
          >
            Cancelar
          </Button>
          <Button 
            type="submit"
            className="bg-[#EF4444] hover:bg-[#DC2626] text-white"
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
        </div>
      </form>
    </div>
  );

  // Renderizar vista de lectura
  const renderRead = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={() => setVista(VIEWS.INBOX)}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              setRespuesta('');
              setVista(VIEWS.REPLY);
            }}
          >
            <Reply className="w-4 h-4 mr-2" />
            Responder
          </Button>
        </div>
      </div>

      {emailSeleccionado && (
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold">{emailSeleccionado.asunto || emailSeleccionado.subject}</h2>
            <div className="flex items-center justify-between mt-2">
              <p className="text-sm">
                <span className="font-medium">{emailSeleccionado.de || emailSeleccionado.from}</span>
              </p>
              <p className="text-sm text-muted-foreground">
                {emailSeleccionado.fecha && format(new Date(emailSeleccionado.fecha), "d 'de' MMMM 'a las' HH:mm", { locale: es })}
              </p>
            </div>
          </div>
          
          <Separator />
          
          <div 
            className="prose prose-sm dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: emailSeleccionado.cuerpo || emailSeleccionado.body || emailSeleccionado.snippet }}
          />
        </div>
      )}
    </div>
  );

  // Renderizar vista de respuesta
  const renderReply = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => setVista(VIEWS.READ)}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <h3 className="font-semibold">
          Responder a: {emailSeleccionado?.de || emailSeleccionado?.from}
        </h3>
      </div>

      <Card className="bg-muted/50">
        <CardContent className="pt-4">
          <p className="text-sm font-medium">{emailSeleccionado?.asunto || emailSeleccionado?.subject}</p>
          <p className="text-xs text-muted-foreground mt-1 line-clamp-3">
            {emailSeleccionado?.preview || emailSeleccionado?.snippet}
          </p>
        </CardContent>
      </Card>

      <form onSubmit={handleResponder} className="space-y-4">
        <Textarea
          placeholder="Escribe tu respuesta..."
          value={respuesta}
          onChange={(e) => setRespuesta(e.target.value)}
          rows={8}
          disabled={responderEmailMutation.isPending}
        />

        <div className="flex justify-end gap-2">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => setVista(VIEWS.READ)}
            disabled={responderEmailMutation.isPending}
          >
            Cancelar
          </Button>
          <Button 
            type="submit"
            className="bg-[#EF4444] hover:bg-[#DC2626] text-white"
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
        </div>
      </form>
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-full bg-[#EF4444]/10">
            <Mail className="w-6 h-6 text-[#EF4444]" />
          </div>
          <div>
            <CardTitle className="text-lg">Email</CardTitle>
            <CardDescription>
              Gestiona tu correo electrónico
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {vista === VIEWS.INBOX && renderBandeja()}
        {vista === VIEWS.COMPOSE && renderCompose()}
        {vista === VIEWS.READ && renderRead()}
        {vista === VIEWS.REPLY && renderReply()}
      </CardContent>
    </Card>
  );
};

export default EmailPanel;

