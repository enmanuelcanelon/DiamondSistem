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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';

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
      const response = await api.get('/contratos', {
        params: {
          page: 1,
          limit: 1000, // Obtener todos los contratos
        }
      });
      return response.data;
    },
  });

  const solicitudes = solicitudesData?.solicitudes || [];
  const contratos = contratosData?.data || [];

  // Obtener conteo de mensajes no leídos para todos los contratos (batch endpoint optimizado)
  const { data: mensajesNoLeidosData, isLoading: loadingMensajes } = useQuery({
    queryKey: ['mensajes-no-leidos-vendedor-batch', user?.id],
    queryFn: async () => {
      if (!contratos || contratos.length === 0) {
        return {};
      }
      
      // Usar endpoint batch optimizado en lugar de múltiples queries
      const response = await api.get('/mensajes/vendedor/no-leidos/batch');
      return response.data.mensajes_no_leidos || {};
    },
    enabled: !!user?.id && user?.tipo === 'vendedor' && contratos && contratos.length > 0,
    staleTime: 5 * 60 * 1000, // Los datos se consideran frescos por 5 minutos
    refetchInterval: 3 * 60 * 1000, // Refrescar cada 3 minutos
    refetchOnWindowFocus: false, // No refetch al enfocar la ventana (reduce carga)
  });

  const mensajesNoLeidos = mensajesNoLeidosData || {};

  // Obtener buzón de mensajes (todos los contratos con mensajes)
  const { data: buzonData, isLoading: loadingBuzon } = useQuery({
    queryKey: ['buzon-mensajes-vendedor', user?.id],
    queryFn: async () => {
      const response = await api.get('/mensajes/vendedor/buzon');
      return response.data;
    },
    enabled: !!user?.id && user?.tipo === 'vendedor',
    staleTime: 5 * 60 * 1000, // Los datos se consideran frescos por 5 minutos
    refetchInterval: 3 * 60 * 1000, // Refrescar cada 3 minutos
    refetchOnWindowFocus: false, // No refetch al enfocar la ventana (reduce carga)
  });

  const buzonMensajes = buzonData?.buzón || [];

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

  // Calcular eventos activos (estado activo y fecha_evento en el futuro o hoy)
  const eventosActivos = contratos.filter((c) => {
    if (!c.fecha_evento) return false;
    const fechaEvento = new Date(c.fecha_evento);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    fechaEvento.setHours(0, 0, 0, 0);
    // Evento activo: estado activo y fecha del evento no ha pasado
    return c.estado === 'activo' && fechaEvento >= hoy;
  });

  // Calcular eventos próximos (menos de 30 días)
  const eventosProximos = contratos.filter((c) => {
    if (!c.fecha_evento) return false;
    const fechaEvento = new Date(c.fecha_evento);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    fechaEvento.setHours(0, 0, 0, 0);
    const dias = Math.floor((fechaEvento - hoy) / (1000 * 60 * 60 * 24));
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
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Gestión de Eventos</h2>
          <p className="text-muted-foreground">
            Administra tus eventos activos y solicitudes de clientes
          </p>
        </div>
      </div>

      {/* Estadísticas - Estilo Dashboard */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Activo
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{eventosActivos.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Activo
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pendiente de Contacto
            </CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{estadisticas?.pendientes || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Pendiente de Contacto
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Activo
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{eventosProximos.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Próximos 30 días
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Solicitudes Aprobadas
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{estadisticas?.aprobadas || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Aprobadas este mes
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros y Búsqueda - Estilo Dashboard */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex gap-2 flex-wrap">
              <Button
                variant={filtroEstado === 'pendiente' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFiltroEstado('pendiente')}
              >
                <Clock className="w-4 h-4 mr-2" />
                Pendientes ({estadisticas?.pendientes || 0})
              </Button>
              <Button
                variant={filtroEstado === 'aprobada' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFiltroEstado('aprobada')}
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Aprobadas ({estadisticas?.aprobadas || 0})
              </Button>
              <Button
                variant={filtroEstado === 'rechazada' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFiltroEstado('rechazada')}
              >
                <XCircle className="w-4 h-4 mr-2" />
                Rechazadas ({estadisticas?.rechazadas || 0})
              </Button>
            </div>

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

      {/* Lista de Solicitudes - Estilo Dashboard */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle>
              Solicitudes {filtroEstado === 'pendiente' ? 'Pendientes' : filtroEstado === 'aprobada' ? 'Aprobadas' : 'Rechazadas'}
            </CardTitle>
            <CardDescription>
              {solicitudesFiltradas.length} solicitud(es) encontrada(s)
            </CardDescription>
          </div>
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
                <SolicitudCard 
                  key={solicitud.id} 
                  solicitud={solicitud} 
                  mensajesNoLeidos={mensajesNoLeidos}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Buzón de Mensajes - Estilo Dashboard */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              Buzón de Mensajes
            </CardTitle>
            <CardDescription>
              Todos los contratos con mensajes de clientes
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {loadingBuzon ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : buzonMensajes.length === 0 ? (
            <div className="text-center py-12">
              <MessageCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No hay mensajes en tu buzón</p>
            </div>
          ) : (
            <div className="space-y-4">
              {buzonMensajes.map((item) => (
                <Card
                  key={item.contrato_id}
                  className="hover:border-primary/50 transition-colors cursor-pointer"
                  onClick={() => window.location.href = `/chat/${item.contrato_id}`}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-foreground truncate">
                            {item.cliente?.nombre_completo || 'Sin nombre'}
                          </h3>
                          {item.mensajes_no_leidos > 0 && (
                            <Badge variant="destructive" className="animate-pulse">
                              {item.mensajes_no_leidos > 9 ? '9+' : item.mensajes_no_leidos}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground font-mono mb-2">
                          {item.codigo_contrato}
                        </p>
                        {item.ultimo_mensaje && (
                          <div className="space-y-1">
                            <p className="text-sm text-foreground line-clamp-2">
                              <span className={`font-medium ${
                                item.ultimo_mensaje.remitente_tipo === 'cliente'
                                  ? 'text-blue-600 dark:text-blue-400'
                                  : 'text-muted-foreground'
                              }`}>
                                {item.ultimo_mensaje.remitente_tipo === 'cliente' ? 'Cliente:' : 'Tú:'}
                              </span>{' '}
                              {item.ultimo_mensaje.mensaje}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(item.ultimo_mensaje.fecha).toLocaleString('es-ES', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                        )}
                      </div>
                      <Button variant="outline" size="sm" asChild onClick={(e) => e.stopPropagation()}>
                        <Link to={`/chat/${item.contrato_id}`}>
                          <MessageCircle className="w-4 h-4 mr-2" />
                          Abrir Chat
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lista de Eventos Próximos - Estilo Dashboard */}
      {eventosProximos.length > 0 && (
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Activo</CardTitle>
              <CardDescription>
                Activo
              </CardDescription>
            </div>
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
                              {(() => {
                                // Extraer fecha del string ISO para evitar problemas de zona horaria
                                const fechaStr = contrato.fecha_evento;
                                const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
                                const dias = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
                                if (typeof fechaStr === 'string' && fechaStr.includes('T')) {
                                  const [datePart] = fechaStr.split('T');
                                  const [year, month, day] = datePart.split('-').map(Number);
                                  const fecha = new Date(year, month - 1, day);
                                  return `${dias[fecha.getDay()]}, ${day} de ${meses[month - 1]} de ${year}`;
                                }
                                return new Date(fechaStr).toLocaleDateString('es-ES', {
                                  weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'America/New_York'
                                });
                              })()}
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Users className="w-4 h-4" />
                              {contrato.cantidad_invitados} invitados
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" asChild className="relative">
                            <Link to={`/chat/${contrato.id}`}>
                              <MessageCircle className="w-4 h-4 mr-2" />
                              Chat
                              {mensajesNoLeidos[contrato.id] && mensajesNoLeidos[contrato.id] > 0 && (
                                <Badge
                                  variant="destructive"
                                  className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs animate-pulse"
                                >
                                  {mensajesNoLeidos[contrato.id] > 9 ? '9+' : mensajesNoLeidos[contrato.id]}
                                </Badge>
                              )}
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

// Componente para cada solicitud - Estilo Dashboard
function SolicitudCard({ solicitud, mensajesNoLeidos = {} }) {
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

