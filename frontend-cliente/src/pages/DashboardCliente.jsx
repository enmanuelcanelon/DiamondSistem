import { useQuery } from '@tanstack/react-query';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  DollarSign,
  Music,
  Table,
  Loader2,
  CreditCard,
  CheckCircle,
  AlertCircle,
  FileText,
  Download,
  TrendingUp,
  TrendingDown,
  ArrowRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import useAuthStore from '@shared/store/useAuthStore';
import EventCountdown from '@components/EventCountdown';
import RecordatorioEvento from '@components/RecordatorioEvento';
import api from '@shared/config/api';
import { formatearHora } from '@shared/utils/formatters';
import { generarNombreEventoCorto } from '@utils/eventNames';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

function DashboardCliente() {
  const { user } = useAuthStore();
  const contratoId = user?.contrato_id;

  // Función para formatear nombre de servicio con cantidad
  const formatearServicioConCantidad = (servicio, cantidad) => {
    const nombre = servicio?.nombre || '';
    const precio = servicio?.precio_base || 0;

    // Si la cantidad es 1 o menos, solo mostrar el nombre
    if (cantidad <= 1) {
      return nombre;
    }

    // Reglas especiales según el tipo de servicio
    if (nombre.toLowerCase().includes('personal') || nombre.toLowerCase().includes('bartender') || nombre.toLowerCase().includes('mesero')) {
      // Personal de Servicio (4)
      return `${nombre} (${cantidad})`;
    } else if (nombre.toLowerCase().includes('champagne') || nombre.toLowerCase().includes('champaña') || nombre.toLowerCase().includes('sidra') || nombre.toLowerCase().includes('vino')) {
      // Champaña (10 Botellas)
      return `${nombre} (${cantidad} Botellas)`;
    } else if (nombre.toLowerCase().includes('dulce') || nombre.toLowerCase().includes('postre')) {
      // Mini Dulces (6/u)
      return `${nombre} (${cantidad}/u)`;
    } else {
      // Formato genérico (N unidades)
      return `${nombre} (${cantidad})`;
    }
  };

  // Query para obtener el contrato completo
  const { data: contrato, isLoading } = useQuery({
    queryKey: ['contrato-cliente', contratoId],
    queryFn: async () => {
      const response = await api.get(`/contratos/${contratoId}`);
      return response.data.contrato;
    },
    enabled: !!contratoId,
  });

  // Obtener historial de cambios
  const { data: historialData } = useQuery({
    queryKey: ['historial-contrato', contratoId],
    queryFn: async () => {
      const response = await api.get(`/contratos/${contratoId}/historial`);
      return response.data;
    },
    enabled: !!contratoId,
  });

  // Obtener historial de pagos
  const { data: pagosData } = useQuery({
    queryKey: ['pagos-contrato', contratoId],
    queryFn: async () => {
      const response = await api.get(`/contratos/${contratoId}/pagos`);
      return response.data;
    },
    enabled: !!contratoId,
  });

  // Query para obtener estadísticas de playlist
  const { data: playlistData } = useQuery({
    queryKey: ['playlist-stats', contratoId],
    queryFn: async () => {
      const response = await api.get(`/playlist/contrato/${contratoId}`);
      return response.data;
    },
    enabled: !!contratoId,
  });

  // Query para obtener estadísticas de mesas
  const { data: mesasData } = useQuery({
    queryKey: ['mesas-stats', contratoId],
    queryFn: async () => {
      const response = await api.get(`/mesas/contrato/${contratoId}`);
      return response.data;
    },
    enabled: !!contratoId,
  });

  // Query para obtener invitados
  const { data: invitadosData } = useQuery({
    queryKey: ['invitados-stats', contratoId],
    queryFn: async () => {
      const response = await api.get(`/invitados/contrato/${contratoId}`);
      return response.data;
    },
    enabled: !!contratoId,
  });

  // Query para obtener ajustes del evento
  const { data: ajustesData } = useQuery({
    queryKey: ['ajustes-evento', contratoId],
    queryFn: async () => {
      const response = await api.get(`/ajustes-evento/contrato/${contratoId}`);
      return response.data;
    },
    enabled: !!contratoId,
  });

  // Query para obtener versiones del contrato
  const { data: versionesData } = useQuery({
    queryKey: ['versiones-contrato', contratoId],
    queryFn: async () => {
      const response = await api.get(`/contratos/${contratoId}/versiones`);
      return response.data;
    },
    enabled: !!contratoId,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96 mt-2" />
          </CardHeader>
        </Card>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const porcentajePagado = contrato?.total_contrato > 0
    ? (parseFloat(contrato.total_pagado || 0) / parseFloat(contrato.total_contrato)) * 100
    : 0;

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">
            Bienvenido, {user?.nombre_completo}
          </CardTitle>
          <CardDescription>
            Aquí puedes gestionar todos los detalles de tu evento especial
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Event Countdown */}
      {contrato?.fecha_evento && (
        <EventCountdown 
          fechaEvento={contrato.fecha_evento} 
          nombreEvento={generarNombreEventoCorto(contrato)}
        />
      )}

      {/* Recordatorio de pendientes */}
      <RecordatorioEvento 
        contrato={contrato}
        playlistData={playlistData}
        mesasData={mesasData}
        ajustesData={ajustesData}
      />

      {/* Event Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Información del Evento</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Fecha del Evento</p>
                <p className="font-semibold">
                  {contrato?.fecha_evento ? new Date(contrato.fecha_evento).toLocaleDateString('es-ES', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  }) : 'No especificada'}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Horario</p>
                <p className="font-semibold">
                  {contrato?.hora_inicio && contrato?.hora_fin
                    ? `${formatearHora(contrato.hora_inicio)} - ${formatearHora(contrato.hora_fin)}`
                    : 'No especificado'}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Lugar</p>
                <p className="font-semibold">
                  {contrato?.ofertas?.lugar_evento || 'Por definir'}
                </p>
              </div>
            </div>

            {contrato?.homenajeado && (
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 text-muted-foreground mt-0.5 flex items-center justify-center text-lg">
                  👑
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Homenajeado/a</p>
                  <p className="font-semibold">
                    {contrato.homenajeado}
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-start gap-3">
              <Users className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Invitados</p>
                <p className="font-semibold">
                  {contrato?.cantidad_invitados || 0} personas
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Estado de Pago</CardTitle>
            <Badge 
              variant={
                contrato?.estado_pago === 'pagado' ? 'success' :
                contrato?.estado_pago === 'parcial' ? 'secondary' :
                'warning'
              }
            >
              {contrato?.estado_pago === 'pagado' ? 'Pagado Completo' :
               contrato?.estado_pago === 'parcial' ? 'Pago Parcial' :
               'Pendiente'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Total del Contrato:</span>
              <span className="text-2xl font-bold">
                ${parseFloat(contrato?.total_contrato || 0).toLocaleString()}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Pagado:</span>
              <span className="text-xl font-semibold text-green-600">
                ${parseFloat(contrato?.total_pagado || 0).toLocaleString()}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Saldo Pendiente:</span>
              <span className="text-xl font-semibold text-destructive">
                ${parseFloat(contrato?.saldo_pendiente || 0).toLocaleString()}
              </span>
            </div>

            {/* Progress bar */}
            <div className="pt-2">
              <div className="flex justify-between text-sm text-muted-foreground mb-2">
                <span>Progreso de pago</span>
                <span>{porcentajePagado.toFixed(0)}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all"
                  style={{ width: `${Math.min(porcentajePagado, 100)}%` }}
                ></div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

        {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Playlist Stats */}
        <Link to={`/playlist/${contratoId}`}>
          <Card className="hover:shadow-md transition-all cursor-pointer h-full">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                  <Music className="w-6 h-6 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Canciones en Playlist</p>
                  <p className="text-2xl font-bold">
                    {playlistData?.total || 0}
                  </p>
                  {playlistData?.stats && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {playlistData.stats.favoritas} favoritas • {playlistData.stats.prohibidas} prohibidas
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Mesas Stats */}
        <Link to={`/mesas/${contratoId}`}>
          <Card className="hover:shadow-md transition-all cursor-pointer h-full">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                  <Table className="w-6 h-6 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Mesas Configuradas</p>
                  <p className="text-2xl font-bold">
                    {mesasData?.total || 0}
                  </p>
                  {invitadosData && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {invitadosData.con_mesa || 0}/{invitadosData.total || 0} invitados asignados
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Versiones del Contrato */}
        <Link to="/contratos">
          <Card className="hover:shadow-md transition-all cursor-pointer h-full">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                  <FileText className="w-6 h-6 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Mis Contratos</p>
                  <p className="text-2xl font-bold">
                    Ver PDFs
                  </p>
                  {historialData?.versiones && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {historialData.versiones.length} versión{historialData.versiones.length !== 1 ? 'es' : ''}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Payment Quick Access */}
        <Link to={`/contratos`}>
          <Card className="hover:shadow-md transition-all cursor-pointer h-full">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Historial de Pagos</p>
                  <p className="text-2xl font-bold">
                    {pagosData?.pagos?.length || 0}
                  </p>
                  {pagosData?.pagos && pagosData.pagos.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Ver detalles
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Services Included */}
            {(() => {
        // Función helper para obtener el nombre del servicio ajustado según el salón
        const obtenerNombreServicio = (nombreServicio) => {
          if (!nombreServicio) return nombreServicio;
          
          const salonNombre = contrato?.salones?.nombre || contrato?.lugar_salon || '';
          
          // Reemplazar Pantalla LED por Pantalla TV en Doral
          if (salonNombre === 'Doral' && nombreServicio === 'Pantalla LED') {
            return 'Pantalla TV';
          }
          
          // Agregar información de millas a Limosina
          if (nombreServicio === 'Limosina') {
            return 'Limosina (15 Millas)';
          }
          
          return nombreServicio;
        };

        // Separar servicios incluidos en el paquete de servicios adicionales
        const serviciosIncluidos = [];
        const serviciosAdicionales = [];
        const salonNombre = contrato?.salones?.nombre || contrato?.lugar_salon || '';

        // Obtener servicios del paquete
        if (contrato?.paquetes?.paquetes_servicios) {
          contrato.paquetes.paquetes_servicios.forEach((ps) => {
            const nombreServicio = ps.servicios?.nombre || '';
            
            // Filtrar Máquina de Chispas si el salón es Kendall
            if (salonNombre === 'Kendall' && nombreServicio?.toLowerCase().includes('chispas')) {
              return; // No mostrar este servicio
            }
            
            serviciosIncluidos.push({
              id: `paquete-${ps.servicio_id}`,
              nombre: obtenerNombreServicio(nombreServicio),
              cantidad: ps.cantidad || 1
            });
          });
        }

        // Obtener servicios adicionales del contrato
        if (contrato?.contratos_servicios) {
          // Obtener IDs de servicios incluidos en el paquete para comparar
          const serviciosPaqueteIds = new Set();
          if (contrato?.paquetes?.paquetes_servicios) {
            contrato.paquetes.paquetes_servicios.forEach((ps) => {
              serviciosPaqueteIds.add(ps.servicio_id);
            });
          }
          
          // Filtrar servicios mutuamente excluyentes (solo mostrar un Photobooth)
          const serviciosFiltrados = [];
          let photoboothConPrecio = null;
          let photoboothSinPrecio = null;
          
          for (const cs of contrato.contratos_servicios) {
            // Solo procesar servicios adicionales (no incluidos en paquete)
            if (cs.incluido_en_paquete) {
              continue;
            }
            
            // Verificar que el servicio no esté en el paquete por ID
            const servicioId = cs.servicio_id;
            if (serviciosPaqueteIds.has(servicioId)) {
              continue;
            }
            
            const nombreServicio = cs.servicios?.nombre || '';
            const subtotal = parseFloat(cs.subtotal || 0);
            const precioUnitario = parseFloat(cs.precio_unitario || 0);
            
            // Filtrar servicios con costo $0
            if (subtotal === 0 && precioUnitario === 0) {
              continue;
            }
            
            // Filtrar Máquina de Chispas si el salón es Kendall
            if (salonNombre === 'Kendall' && nombreServicio?.toLowerCase().includes('chispas')) {
              continue; // No mostrar este servicio
            }
            
            if (nombreServicio.includes('Photobooth')) {
              // Priorizar el que tiene precio/subtotal > 0 (el realmente seleccionado)
              if (subtotal > 0 || precioUnitario > 0) {
                photoboothConPrecio = cs;
              } else {
                // Guardar como respaldo si no hay uno con precio
                if (!photoboothSinPrecio) {
                  photoboothSinPrecio = cs;
                }
              }
              continue;
            }
            
            // Para otros servicios, agregar normalmente
            serviciosFiltrados.push(cs);
          }
          
          // Agregar el Photobooth seleccionado (solo si tiene precio > 0)
          if (photoboothConPrecio) {
            serviciosFiltrados.push(photoboothConPrecio);
          }
          
          serviciosFiltrados.forEach((cs) => {
            serviciosAdicionales.push({
              id: cs.id,
              nombre: obtenerNombreServicio(cs.servicios?.nombre || ''),
              cantidad: cs.cantidad || 1
            });
              });
        }

        // Si no hay paquete ni servicios adicionales, no mostrar la sección
        const nombrePaquete = contrato?.paquetes?.nombre || 'Sin paquete';
        if (!contrato?.paquetes && serviciosAdicionales.length === 0) {
          return null;
        }

                return (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Mi Paquete y Servicios</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Información del Paquete */}
              {contrato?.paquetes && (
                <div className="mb-6 p-4 bg-muted/50 rounded-lg border">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center text-primary-foreground font-bold text-lg">
                      {nombrePaquete.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold">
                        Paquete {nombrePaquete}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {serviciosIncluidos.length} servicio{serviciosIncluidos.length !== 1 ? 's' : ''} incluido{serviciosIncluidos.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  
                  {/* Lista de servicios incluidos en el paquete */}
                  {serviciosIncluidos.length > 0 && (
                    <div className="mt-3 pt-3 border-t">
                      <p className="text-xs font-semibold mb-2 uppercase tracking-wide">
                        Incluye:
                      </p>
                      <ul className="space-y-1.5">
                        {serviciosIncluidos.map((servicio) => (
                          <li key={servicio.id} className="flex items-center gap-2 text-sm">
                            <CheckCircle className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                            <span>
                              {formatearServicioConCantidad({ nombre: servicio.nombre }, servicio.cantidad)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Servicios Adicionales */}
              {serviciosAdicionales.length > 0 ? (
                <div>
                  <h3 className="text-sm font-semibold mb-3 uppercase tracking-wide">
                    Servicios Adicionales
                  </h3>
                  <ul className="space-y-2">
                    {serviciosAdicionales.map((servicio) => (
                      <li key={servicio.id} className="flex items-center justify-between border-b pb-2 last:border-b-0">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-muted-foreground" />
                          <span>
                            {formatearServicioConCantidad({ nombre: servicio.nombre }, servicio.cantidad)}
                          </span>
                        </div>
                        <span className="font-medium">
                          {servicio.cantidad > 1 ? `x${servicio.cantidad}` : ''}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="text-center py-4 text-muted-foreground text-sm">
                  No tienes servicios adicionales contratados
                </div>
              )}
            </CardContent>
          </Card>
        );
            })()}

      {/* Historial de Pagos */}
      {pagosData?.pagos && pagosData.pagos.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Historial de Pagos</CardTitle>
              <Link
                to="/contratos"
                className="text-sm text-primary hover:text-primary/80 font-medium flex items-center gap-1"
              >
                Ver todos
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pagosData.pagos.slice(0, 5).map((pago) => (
                <div
                  key={pago.id}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-lg border",
                    pago.estado === 'anulado'
                      ? 'bg-destructive/10 border-destructive/20'
                      : 'bg-muted/50 border'
                  )}
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center",
                      pago.estado === 'anulado'
                        ? 'bg-destructive/20'
                        : 'bg-green-100'
                    )}>
                      <CreditCard className={cn(
                        "w-5 h-5",
                        pago.estado === 'anulado'
                          ? 'text-destructive'
                          : 'text-green-600'
                      )} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className={cn(
                          "font-medium",
                          pago.estado === 'anulado'
                            ? 'text-destructive line-through'
                            : ''
                        )}>
                          ${parseFloat(pago.monto_total || pago.monto).toLocaleString()}
                        </p>
                        {pago.estado === 'anulado' && (
                          <Badge variant="destructive" className="text-xs">
                            ANULADO
                          </Badge>
                        )}
                      </div>
                      <p className={cn(
                        "text-sm",
                        pago.estado === 'anulado'
                          ? 'text-destructive/80'
                          : 'text-muted-foreground'
                      )}>
                        {pago.metodo_pago} • {new Date(pago.fecha_pago).toLocaleDateString('es-ES', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </p>
                      {pago.numero_referencia && (
                        <p className="text-xs text-muted-foreground">Ref: {pago.numero_referencia}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {pagosData.pagos.length > 5 && (
                <p className="text-sm text-muted-foreground text-center pt-2">
                  Y {pagosData.pagos.length - 5} pago{pagosData.pagos.length - 5 !== 1 ? 's' : ''} más
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Historial de Versiones del Contrato */}
      {versionesData?.versiones && versionesData.versiones.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Versiones del Contrato</CardTitle>
              <Link
                to="/contratos"
                className="text-sm text-primary hover:text-primary/80 font-medium flex items-center gap-1"
              >
                Ver todas
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {versionesData.versiones.slice(0, 3).map((version, index) => {
                const esUltimaVersion = index === 0;
                const versionAnterior = versionesData.versiones[index + 1];
                const diferenciaTotal = versionAnterior
                  ? parseFloat(version.total_contrato) - parseFloat(versionAnterior.total_contrato)
                  : 0;

                return (
                  <div
                    key={version.id}
                    className={cn(
                      "p-4 rounded-lg border",
                      esUltimaVersion
                        ? 'bg-primary/5 border-primary/20 ring-2 ring-primary/10'
                        : 'bg-card border'
                    )}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className={cn(
                            "w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold",
                            esUltimaVersion ? 'bg-primary' : 'bg-muted-foreground'
                          )}>
                            v{version.version_numero}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold">
                                Versión {version.version_numero}
                              </h3>
                              {esUltimaVersion && (
                                <Badge variant="default" className="text-xs">
                                  Actual
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(version.fecha_generacion).toLocaleDateString('es-ES', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                        </div>

                        {version.motivo_cambio && (
                          <p className="text-sm mb-2 bg-muted/50 rounded p-2">
                            <strong>Motivo:</strong> {version.motivo_cambio}
                          </p>
                        )}

                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-1">
                            <DollarSign className="w-4 h-4 text-muted-foreground" />
                            <span className="text-muted-foreground">Total:</span>
                            <span className="font-semibold">
                              ${parseFloat(version.total_contrato).toLocaleString()}
                            </span>
                          </div>
                          {version.cantidad_invitados && (
                            <div className="flex items-center gap-1">
                              <Users className="w-4 h-4 text-muted-foreground" />
                              <span className="text-muted-foreground">Invitados:</span>
                              <span className="font-semibold">
                                {version.cantidad_invitados}
                              </span>
                            </div>
                          )}
                        </div>

                        {versionAnterior && diferenciaTotal !== 0 && (
                          <div className={cn(
                            "flex items-center gap-1 text-xs mt-2",
                            diferenciaTotal > 0 ? 'text-destructive' : 'text-green-600'
                          )}>
                            {diferenciaTotal > 0 ? (
                              <TrendingUp className="w-3 h-3" />
                            ) : (
                              <TrendingDown className="w-3 h-3" />
                            )}
                            <span>
                              {diferenciaTotal > 0 ? '+' : ''}
                              ${Math.abs(diferenciaTotal).toLocaleString()} vs v{version.version_numero - 1}
                            </span>
                          </div>
                        )}
                      </div>

                      <Button
                        onClick={async () => {
                          try {
                            const response = await api.get(
                              `/contratos/${contratoId}/versiones/${version.version_numero}/pdf`,
                              { responseType: 'blob' }
                            );
                            const blob = new Blob([response.data], { type: 'application/pdf' });
                            const url = window.URL.createObjectURL(blob);
                            const link = document.createElement('a');
                            link.href = url;
                            link.download = `Contrato-v${version.version_numero}.pdf`;
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                            window.URL.revokeObjectURL(url);
                          } catch (error) {
                            console.error('Error al descargar PDF:', error);
                            alert('Error al descargar el PDF');
                          }
                        }}
                        size="sm"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        PDF
                      </Button>
                    </div>
                  </div>
                );
              })}
              {versionesData.versiones.length > 3 && (
                <p className="text-sm text-muted-foreground text-center pt-2">
                  Y {versionesData.versiones.length - 3} versión{versionesData.versiones.length - 3 !== 1 ? 'es' : ''} más
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default DashboardCliente;
