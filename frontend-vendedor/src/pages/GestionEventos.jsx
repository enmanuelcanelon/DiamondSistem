import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Calendar,
  Users,
  Bell,
  CheckCircle,
  XCircle,
  Clock,
  Filter,
  Search,
  Loader2,
  AlertCircle,
  TrendingUp,
  MessageCircle,
  Eye,
} from 'lucide-react';
import useAuthStore from '../store/useAuthStore';
import api from '../config/api';
import { generarNombreEvento, getEventoEmoji } from '../utils/eventNames';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Separator } from '../components/ui/separator';

function GestionEventos() {
  const { user } = useAuthStore();
  const [filtroEstado, setFiltroEstado] = useState('pendiente');
  const [busqueda, setBusqueda] = useState('');

  // Obtener solicitudes pendientes
  const { data: solicitudesData, isLoading: loadingSolicitudes } = useQuery({
    queryKey: ['solicitudes-vendedor', filtroEstado],
    queryFn: async () => {
      const endpoint =
        filtroEstado === 'pendiente'
          ? '/solicitudes/vendedor/pendientes'
          : `/solicitudes/vendedor/todas?estado=${filtroEstado}`;
      const response = await api.get(endpoint);
      return response.data;
    },
  });

  // Obtener estadísticas
  const { data: estadisticas } = useQuery({
    queryKey: ['solicitudes-estadisticas'],
    queryFn: async () => {
      const response = await api.get('/solicitudes/vendedor/estadisticas');
      return response.data.estadisticas;
    },
  });

  // Obtener contratos activos del vendedor
  const { data: contratosData, isLoading: loadingContratos } = useQuery({
    queryKey: ['contratos-vendedor'],
    queryFn: async () => {
      const response = await api.get('/contratos');
      return response.data;
    },
  });

  const solicitudes = solicitudesData?.solicitudes || [];
  const contratos = contratosData?.contratos || [];

  // Filtrar solicitudes por búsqueda
  const solicitudesFiltradas = solicitudes.filter((sol) => {
    const cliente = sol.contratos?.clientes?.nombre_completo || '';
    const codigo = sol.contratos?.codigo_contrato || '';
    const busquedaLower = busqueda.toLowerCase();
    return (
      cliente.toLowerCase().includes(busquedaLower) ||
      codigo.toLowerCase().includes(busquedaLower)
    );
  });

  // Calcular eventos próximos (menos de 30 días)
  const eventosProximos = contratos.filter((c) => {
    if (!c.fecha_evento) return false;
    const dias = Math.floor(
      (new Date(c.fecha_evento) - new Date()) / (1000 * 60 * 60 * 24)
    );
    return dias >= 0 && dias <= 30;
  });

  if (loadingContratos) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Gestión de Eventos</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Administra tus eventos activos y solicitudes de clientes
        </p>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Eventos Activos</p>
                <p className="text-2xl font-bold text-foreground mt-1">
                  {contratos.length}
                </p>
              </div>
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Solicitudes Pendientes</p>
                <p className="text-2xl font-bold text-foreground mt-1">
                  {estadisticas?.pendientes || 0}
                </p>
              </div>
              <div className="p-2 bg-orange-500/10 rounded-lg">
                <Bell className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Eventos Próximos</p>
                <p className="text-2xl font-bold text-foreground mt-1">
                  {eventosProximos.length}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Próximos 30 días</p>
              </div>
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <TrendingUp className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Solicitudes Aprobadas</p>
                <p className="text-2xl font-bold text-foreground mt-1">
                  {estadisticas?.aprobadas || 0}
                </p>
              </div>
              <div className="p-2 bg-green-500/10 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs de Filtro */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex gap-2 flex-wrap">
              <Button
                variant={filtroEstado === 'pendiente' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFiltroEstado('pendiente')}
                className={filtroEstado === 'pendiente' ? 'bg-orange-500 hover:bg-orange-600' : ''}
              >
                <Clock className="w-4 h-4 mr-2" />
                Pendientes ({estadisticas?.pendientes || 0})
              </Button>
              <Button
                variant={filtroEstado === 'aprobada' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFiltroEstado('aprobada')}
                className={filtroEstado === 'aprobada' ? 'bg-green-500 hover:bg-green-600' : ''}
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Aprobadas ({estadisticas?.aprobadas || 0})
              </Button>
              <Button
                variant={filtroEstado === 'rechazada' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFiltroEstado('rechazada')}
                className={filtroEstado === 'rechazada' ? 'bg-red-500 hover:bg-red-600' : ''}
              >
                <XCircle className="w-4 h-4 mr-2" />
                Rechazadas ({estadisticas?.rechazadas || 0})
              </Button>
            </div>

            {/* Búsqueda */}
            <div className="relative w-full md:w-auto md:min-w-[300px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                type="text"
                placeholder="Buscar por cliente o código..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Solicitudes */}
      <Card>
        <CardHeader>
          <CardTitle>
            Solicitudes {filtroEstado === 'pendiente' ? 'Pendientes' : filtroEstado === 'aprobada' ? 'Aprobadas' : 'Rechazadas'}
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            {solicitudesFiltradas.length} solicitud(es) encontrada(s)
          </p>
        </CardHeader>
        <CardContent>
          {loadingSolicitudes ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : solicitudesFiltradas.length === 0 ? (
            <div className="text-center py-12">
              <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No hay solicitudes {filtroEstado}s</p>
            </div>
          ) : (
            <div className="space-y-4">
              {solicitudesFiltradas.map((solicitud) => (
                <SolicitudCard key={solicitud.id} solicitud={solicitud} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lista de Eventos Próximos */}
      {eventosProximos.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Eventos Próximos</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Eventos en los próximos 30 días
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {eventosProximos.map((contrato) => {
                const dias = Math.floor(
                  (new Date(contrato.fecha_evento) - new Date()) / (1000 * 60 * 60 * 24)
                );
                return (
                  <Card key={contrato.id} className="hover:border-primary/50 transition-colors">
                    <CardContent className="pt-6">
                      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="text-xl">{getEventoEmoji(contrato)}</span>
                            <div className="flex-1">
                              <h3 className="font-semibold text-foreground">
                                {generarNombreEvento(contrato)}
                              </h3>
                              <p className="text-xs text-muted-foreground font-mono mt-0.5">
                                {contrato.codigo_contrato}
                              </p>
                            </div>
                            {dias <= 7 && (
                              <Badge variant="destructive" className="animate-pulse">
                                ¡{dias} días!
                              </Badge>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1.5">
                              <Calendar className="w-4 h-4" />
                              {new Date(contrato.fecha_evento).toLocaleDateString('es-ES', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                              })}
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Users className="w-4 h-4" />
                              {contrato.cantidad_invitados} invitados
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" asChild>
                            <Link to={`/chat/${contrato.id}`}>
                              <MessageCircle className="w-4 h-4 mr-2" />
                              Chat
                            </Link>
                          </Button>
                          <Button variant="default" size="sm" asChild>
                            <Link to={`/contratos/${contrato.id}`}>
                              <Eye className="w-4 h-4 mr-2" />
                              Ver Detalles
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Componente para cada solicitud
function SolicitudCard({ solicitud }) {
  return (
    <Card className="hover:border-primary/50 transition-colors">
      <CardContent className="pt-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-lg">{getEventoEmoji(solicitud.contratos)}</span>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground">
                  {generarNombreEvento(solicitud.contratos)}
                </h3>
                <p className="text-xs text-muted-foreground font-mono mt-0.5">
                  {solicitud.contratos?.codigo_contrato}
                </p>
              </div>
              {solicitud.tipo_solicitud === 'invitados' ? (
                <Badge variant="outline" className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300">
                  <Users className="w-3 h-3 mr-1" />
                  Invitados
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300">
                  Servicio
                </Badge>
              )}
            </div>

            {solicitud.tipo_solicitud === 'invitados' ? (
              <p className="text-sm text-foreground mb-2">
                Solicita agregar <strong>{solicitud.invitados_adicionales}</strong> invitados adicionales
              </p>
            ) : (
              <div className="text-sm text-foreground mb-2 space-y-1">
                <p>
                  Solicita agregar: <strong>{solicitud.servicios?.nombre}</strong>
                </p>
                {solicitud.cantidad_servicio > 1 && (
                  <p className="text-xs text-muted-foreground">Cantidad: {solicitud.cantidad_servicio}</p>
                )}
                {solicitud.costo_adicional && (
                  <p className="text-green-600 dark:text-green-400 font-semibold mt-1">
                    Costo adicional: ${parseFloat(solicitud.costo_adicional).toFixed(2)}
                  </p>
                )}
              </div>
            )}

            {solicitud.detalles_solicitud && (
              <div className="bg-muted/50 rounded-lg p-3 mb-2 border border-border">
                <p className="text-sm text-foreground italic">
                  "{solicitud.detalles_solicitud}"
                </p>
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              Solicitado el {new Date(solicitud.fecha_solicitud).toLocaleDateString('es-ES')}
            </p>

            {solicitud.motivo_rechazo && (
              <div className="mt-3 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-700 dark:text-red-300">
                  <strong>Motivo de rechazo:</strong> {solicitud.motivo_rechazo}
                </p>
              </div>
            )}
          </div>

          {solicitud.estado === 'pendiente' && (
            <Button asChild>
              <Link to={`/solicitudes/${solicitud.id}`}>
                Gestionar
              </Link>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default GestionEventos;

