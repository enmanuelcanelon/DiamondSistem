import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Loader2, MessageCircle, ArrowLeft, Mail, Phone, Calendar } from 'lucide-react';
import useAuthStore from '../store/useAuthStore';
import Chat from '../components/Chat';
import api from '../config/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';

function ChatVendedor() {
  const { contratoId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  // Query para obtener información del contrato y cliente
  const { data: contrato, isLoading } = useQuery({
    queryKey: ['contrato-chat', contratoId],
    queryFn: async () => {
      const response = await api.get(`/contratos/${contratoId}`);
      return response.data.contrato;
    },
    enabled: !!contratoId,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Verificar que el vendedor tiene acceso a este contrato
  if (contrato && contrato.vendedor_id !== user?.id) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive font-medium">No tienes acceso a este contrato</p>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      {/* Header con botón de regreso */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to={`/contratos/${contratoId}`}>
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">Chat con Cliente</h1>
          <p className="text-muted-foreground mt-1">
            Comunícate directamente con tu cliente
          </p>
        </div>
      </div>

      {/* Info Card del Cliente */}
      {contrato?.clientes && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-primary-foreground font-bold text-sm">
                  {contrato.clientes.nombre_completo.charAt(0)}
                </span>
              </div>
              <div>
                <div>{contrato.clientes.nombre_completo}</div>
                <Badge variant="outline" className="mt-1 text-xs">
                  {contrato.codigo_contrato}
                </Badge>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="w-4 h-4" />
                <span>{contrato.clientes.email}</span>
              </div>
              {contrato.clientes.telefono && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="w-4 h-4" />
                  <span>{contrato.clientes.telefono}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span>
                  {new Date(contrato.fecha_evento).toLocaleDateString('es-ES', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Chat Component */}
      {contrato?.cliente_id && (
        <Chat
          contratoId={parseInt(contratoId)}
          destinatarioId={contrato.cliente_id}
          destinatarioTipo="cliente"
          destinatarioNombre={contrato.clientes?.nombre_completo}
        />
      )}
    </div>
  );
}

export default ChatVendedor;



