import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Loader2,
  User,
  Calendar,
  DollarSign,
  FileText,
  AlertCircle,
} from 'lucide-react';
import api from '../config/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { Separator } from '../components/ui/separator';

function DetalleSolicitud() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [motivoRechazo, setMotivoRechazo] = useState('');
  const [mostrarRechazo, setMostrarRechazo] = useState(false);

  // Obtener solicitud
  const { data, isLoading } = useQuery({
    queryKey: ['solicitud', id],
    queryFn: async () => {
      const response = await api.get(`/solicitudes/vendedor/todas`);
      const solicitud = response.data.solicitudes.find((s) => s.id === parseInt(id));
      return solicitud;
    },
  });

  // Mutation para aprobar
  const aprobarMutation = useMutation({
    mutationFn: async () => {
      const response = await api.put(`/solicitudes/${id}/aprobar`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['solicitud']);
      queryClient.invalidateQueries(['solicitudes-vendedor']);
      queryClient.invalidateQueries(['solicitudes-estadisticas']);
      alert('✅ Solicitud aprobada exitosamente');
      navigate('/eventos');
    },
    onError: (error) => {
      alert(`❌ Error al aprobar: ${error.response?.data?.message || error.message}`);
    },
  });

  // Mutation para rechazar
  const rechazarMutation = useMutation({
    mutationFn: async () => {
      const response = await api.put(`/solicitudes/${id}/rechazar`, {
        motivo_rechazo: motivoRechazo,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['solicitud']);
      queryClient.invalidateQueries(['solicitudes-vendedor']);
      queryClient.invalidateQueries(['solicitudes-estadisticas']);
      alert('❌ Solicitud rechazada');
      navigate('/eventos');
    },
    onError: (error) => {
      alert(`❌ Error al rechazar: ${error.response?.data?.message || error.message}`);
    },
  });

  const handleAprobar = () => {
    if (confirm('¿Estás seguro de aprobar esta solicitud? Esta acción actualizará el contrato.')) {
      aprobarMutation.mutate();
    }
  };

  const handleRechazar = () => {
    if (!motivoRechazo.trim()) {
      alert('Por favor, ingresa un motivo de rechazo');
      return;
    }
    if (confirm('¿Estás seguro de rechazar esta solicitud?')) {
      rechazarMutation.mutate();
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">Solicitud no encontrada</h2>
              <Button variant="outline" asChild className="mt-4">
                <Link to="/eventos">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Volver a Gestión de Eventos
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const solicitud = data;
  const contrato = solicitud.contratos;
  const cliente = contrato?.clientes;

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between space-y-2">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/eventos">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Detalle de Solicitud</h2>
            <p className="text-muted-foreground">Solicitud #{solicitud.id}</p>
          </div>
        </div>
      </div>

      {/* Estado de la Solicitud */}
      {solicitud.estado !== 'pendiente' && (
        <Card className={solicitud.estado === 'aprobada' ? 'border-green-200 bg-green-50 dark:bg-green-950/20' : 'border-red-200 bg-red-50 dark:bg-red-950/20'}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              {solicitud.estado === 'aprobada' ? (
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
              ) : (
                <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
              )}
              <p className={`font-semibold ${
                solicitud.estado === 'aprobada' ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'
              }`}>
                {solicitud.estado === 'aprobada'
                  ? 'Esta solicitud ya fue aprobada'
                  : 'Esta solicitud fue rechazada'}
              </p>
            </div>
            {solicitud.fecha_respuesta && (
              <p className="text-sm text-muted-foreground mt-2">
                Fecha de respuesta:{' '}
                {new Date(solicitud.fecha_respuesta).toLocaleDateString('es-ES')}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Columna Izquierda - Info del Cliente y Contrato */}
        <div className="lg:col-span-4 space-y-4">
          {/* Información del Cliente */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Información del Cliente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Nombre Completo</p>
                  <p className="font-semibold mt-1">{cliente?.nombre_completo}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-semibold mt-1">{cliente?.email}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Teléfono</p>
                  <p className="font-semibold mt-1">{cliente?.telefono}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Código de Contrato</p>
                  <p className="font-semibold mt-1 font-mono text-primary">{contrato?.codigo_contrato}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Información del Contrato */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Información del Evento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Fecha del Evento</p>
                  <p className="font-semibold mt-1">
                    {contrato?.fecha_evento
                      ? (() => {
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
                        })()
                      : 'No definida'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Cantidad de Invitados</p>
                  <p className="font-semibold mt-1">{contrato?.cantidad_invitados}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total del Contrato</p>
                  <p className="font-semibold mt-1 text-green-600 dark:text-green-400">
                    ${parseFloat(contrato?.total_contrato || 0).toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Estado del Contrato</p>
                  <Badge variant="outline" className="mt-1 bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300">
                    {contrato?.estado}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Detalles de la Solicitud */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Detalles de la Solicitud
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Tipo de Solicitud</p>
                  {solicitud.tipo_solicitud === 'invitados' ? (
                    <Badge variant="outline" className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300">
                      👥 Invitados Adicionales
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300">
                      ➕ Servicio Adicional
                    </Badge>
                  )}
                </div>

                {solicitud.tipo_solicitud === 'invitados' ? (
                  <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
                    <CardContent className="pt-6">
                      <p className="text-sm text-foreground">
                        El cliente solicita agregar{' '}
                        <strong className="text-blue-700 dark:text-blue-300 text-2xl">
                          {solicitud.invitados_adicionales}
                        </strong>{' '}
                        invitados adicionales
                      </p>
                      <div className="mt-3 space-y-1">
                        <p className="text-sm text-muted-foreground">
                          Cantidad actual: <strong>{contrato?.cantidad_invitados}</strong> invitados
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Nueva cantidad:{' '}
                          <strong>
                            {contrato?.cantidad_invitados + solicitud.invitados_adicionales}
                          </strong>{' '}
                          invitados
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
                    <CardContent className="pt-6">
                      <p className="text-sm text-muted-foreground mb-2">
                        <strong>Servicio solicitado:</strong>
                      </p>
                      <p className="text-xl font-bold text-foreground">
                        {solicitud.servicios?.nombre}
                      </p>
                      {solicitud.servicios?.descripcion && (
                        <p className="text-sm text-muted-foreground mt-2">
                          {solicitud.servicios.descripcion}
                        </p>
                      )}
                      {solicitud.cantidad_servicio > 1 && (
                        <p className="text-sm text-foreground mt-2">
                          Cantidad: <strong>{solicitud.cantidad_servicio}</strong>
                        </p>
                      )}
                      {solicitud.costo_adicional && (
                        <>
                          <Separator className="my-4" />
                          <div>
                            <p className="text-sm text-muted-foreground">Costo adicional:</p>
                            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                              ${parseFloat(solicitud.costo_adicional).toFixed(2)}
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">
                              Nuevo total del contrato:{' '}
                              <strong>
                                $
                                {(
                                  parseFloat(contrato?.total_contrato || 0) +
                                  parseFloat(solicitud.costo_adicional)
                                ).toFixed(2)}
                              </strong>
                            </p>
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>
                )}

                {solicitud.detalles_solicitud && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Detalles adicionales del cliente:</p>
                    <Card className="bg-muted/50">
                      <CardContent className="pt-6">
                        <p className="text-foreground italic">"{solicitud.detalles_solicitud}"</p>
                      </CardContent>
                    </Card>
                  </div>
                )}

                <div>
                  <p className="text-sm text-muted-foreground">Fecha de solicitud</p>
                  <p className="font-semibold mt-1">
                    {new Date(solicitud.fecha_solicitud).toLocaleDateString('es-ES', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>

                {solicitud.motivo_rechazo && (
                  <Card className="bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800">
                    <CardContent className="pt-6">
                      <p className="text-sm text-red-700 dark:text-red-300 font-semibold mb-2">Motivo de rechazo:</p>
                      <p className="text-foreground">{solicitud.motivo_rechazo}</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Columna Derecha - Acciones */}
        <div className="lg:col-span-3 space-y-4">
          {solicitud.estado === 'pendiente' && (
            <>
              {/* Aprobar Solicitud */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                    Aprobar Solicitud
                  </CardTitle>
                  <CardDescription>
                    Al aprobar, esta solicitud se aplicará automáticamente al contrato.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={handleAprobar}
                    disabled={aprobarMutation.isPending}
                    className="w-full"
                    size="lg"
                  >
                    {aprobarMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Aprobando...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Aprobar Solicitud
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Rechazar Solicitud */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                    Rechazar Solicitud
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {!mostrarRechazo ? (
                    <Button
                      onClick={() => setMostrarRechazo(true)}
                      variant="outline"
                      className="w-full"
                      size="lg"
                    >
                      Rechazar
                    </Button>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="motivo-rechazo">Motivo del rechazo *</Label>
                        <Textarea
                          id="motivo-rechazo"
                          value={motivoRechazo}
                          onChange={(e) => setMotivoRechazo(e.target.value)}
                          rows={4}
                          placeholder="Explica al cliente por qué se rechaza esta solicitud..."
                          className="mt-2"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={handleRechazar}
                          disabled={rechazarMutation.isPending || !motivoRechazo.trim()}
                          variant="destructive"
                          className="flex-1"
                        >
                          {rechazarMutation.isPending ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : null}
                          Confirmar Rechazo
                        </Button>
                        <Button
                          onClick={() => {
                            setMostrarRechazo(false);
                            setMotivoRechazo('');
                          }}
                          variant="outline"
                        >
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}

          {/* Acciones Adicionales */}
          <Card>
            <CardHeader>
              <CardTitle>Acciones</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Button variant="outline" className="w-full" asChild>
                  <Link to={`/contratos/${contrato?.id}`}>
                    Ver Contrato Completo
                  </Link>
                </Button>
                <Button variant="ghost" className="w-full" asChild>
                  <Link to="/eventos">
                    Volver a Gestión
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default DetalleSolicitud;
