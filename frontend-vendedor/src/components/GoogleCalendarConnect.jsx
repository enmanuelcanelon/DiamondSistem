import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Calendar, CheckCircle2, XCircle, Loader2, ExternalLink } from 'lucide-react';
import api from '../config/api';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import toast from 'react-hot-toast';

function GoogleCalendarConnect() {
  const queryClient = useQueryClient();
  const [authUrl, setAuthUrl] = useState(null);

  // Obtener estado de conexión
  const { data: status, isLoading: isLoadingStatus } = useQuery({
    queryKey: ['google-calendar-status'],
    queryFn: async () => {
      const response = await api.get('/google-calendar/status');
      return response.data;
    },
    refetchInterval: 30000, // Refrescar cada 30 segundos
  });

  // Obtener URL de autorización
  const { data: authData, isLoading: isLoadingAuth, error: authError } = useQuery({
    queryKey: ['google-calendar-auth-url'],
    queryFn: async () => {
      const response = await api.get('/google-calendar/auth/url');
      return response.data;
    },
    enabled: !status?.connected, // Solo obtener si no está conectado
    retry: false, // No reintentar si falla
  });

  useEffect(() => {
    if (authData?.authUrl) {
      setAuthUrl(authData.authUrl);
    }
  }, [authData]);

  // Mutación para desconectar
  const disconnectMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post('/google-calendar/disconnect');
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['google-calendar-status']);
      toast.success('Google Calendar desconectado exitosamente');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Error al desconectar Google Calendar');
    },
  });

  const handleConnect = () => {
    if (authUrl) {
      window.location.href = authUrl;
    }
  };

  const handleDisconnect = () => {
    if (window.confirm('¿Estás seguro de que quieres desconectar tu cuenta de Google Calendar?')) {
      disconnectMutation.mutate();
    }
  };

  // Verificar si hay mensaje de éxito/error en la URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get('google_calendar_success');
    const error = urlParams.get('google_calendar_error');

    if (success === 'true') {
      toast.success('Google Calendar conectado exitosamente');
      queryClient.invalidateQueries(['google-calendar-status']);
      // Limpiar URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (error) {
      const errorMessages = {
        'missing_params': 'Faltan parámetros en la respuesta de Google',
        'invalid_state': 'Solicitud inválida',
        'vendedor_not_found': 'Vendedor no encontrado',
        'access_denied': 'Acceso denegado por el usuario'
      };
      toast.error(errorMessages[error] || `Error: ${error}`);
      // Limpiar URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [queryClient]);

  if (isLoadingStatus) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Google Calendar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-4">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const isConnected = status?.connected || false;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Google Calendar
        </CardTitle>
        <CardDescription>
          Conecta tu cuenta de Google Calendar para sincronizar tus eventos y citas
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isConnected ? (
          <>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              <span className="font-medium">Conectado</span>
              <Badge variant="outline" className="ml-auto">
                Activo
              </Badge>
            </div>
            
            {status?.calendarId && (
              <div className="text-sm text-muted-foreground">
                <p>Calendario: <span className="font-mono text-xs">{status.calendarId}</span></p>
                {status?.tokenExpiresAt && (
                  <p className="mt-1">
                    Token expira: {new Date(status.tokenExpiresAt).toLocaleDateString('es-ES', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                )}
              </div>
            )}

            <div className="pt-2">
              <Button
                variant="destructive"
                onClick={handleDisconnect}
                disabled={disconnectMutation.isPending}
                className="w-full"
              >
                {disconnectMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Desconectando...
                  </>
                ) : (
                  <>
                    <XCircle className="mr-2 h-4 w-4" />
                    Desconectar
                  </>
                )}
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <XCircle className="w-5 h-5 text-muted-foreground" />
              <span className="text-muted-foreground">No conectado</span>
            </div>

            <p className="text-sm text-muted-foreground">
              Conecta tu cuenta de Google Calendar para ver tus eventos y citas en el sistema.
              Solo podrás ver tus propios eventos.
            </p>

            {authError && (
              <div className="mt-2 p-3 rounded-md bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
                <p className="text-sm text-yellow-800 dark:text-yellow-300">
                  {authError.response?.data?.message || 'Error al obtener URL de autorización. Por favor, contacta al administrador.'}
                </p>
              </div>
            )}

            <div className="pt-2">
              {isLoadingAuth ? (
                <Button disabled className="w-full">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Cargando...
                </Button>
              ) : (
                <Button
                  onClick={handleConnect}
                  className="w-full"
                  disabled={!authUrl || !!authError}
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Conectar con Google Calendar
                </Button>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default GoogleCalendarConnect;

