import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Loader2, 
  CheckCircle2, 
  Clock, 
  Calendar,
  User,
  Building2,
  AlertCircle,
  Edit,
  Save,
  X,
  ChevronDown,
  Download
} from 'lucide-react';
import api from '@shared/config/api';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

const SERVICIOS_LABELS = {
  foto_video: 'Foto y Video',
  dj: 'DJ',
  comida: 'Comida',
  cake: 'Cake',
  mini_postres: 'Mini Postres',
  limosina: 'Limosina',
  hora_loca: 'Hora Loca',
  animador: 'Animador',
  maestro_ceremonia: 'Maestro de Ceremonia'
};

const ESTADOS_VARIANTS = {
  pendiente: 'warning',
  completado: 'success'
};

const ESTADOS_ICONS = {
  pendiente: Clock,
  completado: CheckCircle2
};

function ChecklistManager() {
  const queryClient = useQueryClient();
  const [editingItem, setEditingItem] = useState(null);
  const [contratosExpandidos, setContratosExpandidos] = useState({});
  const [salonSeleccionado, setSalonSeleccionado] = useState(null); // null, 'Diamond', 'Kendall', 'Doral'
  const [mesSeleccionado, setMesSeleccionado] = useState(new Date().getMonth() + 1); // Mes actual (1-12)
  const [anioSeleccionado, setAnioSeleccionado] = useState(new Date().getFullYear()); // Año actual
  const [editForm, setEditForm] = useState({
    fecha_contacto: '',
    hora_contacto: '',
    fecha_pago: '',
    fecha_recogida: '',
    hora_recogida: '',
    notas: '',
    estado: 'pendiente'
  });

  // Obtener contratos con checklist
  const { data: contratosData, isLoading, isError } = useQuery({
    queryKey: ['manager-contratos'],
    queryFn: async () => {
      const response = await api.get('/managers/contratos');
      return response.data;
    },
  });

  // Mutación para actualizar checklist
  const updateChecklistMutation = useMutation({
    mutationFn: async ({ contratoId, servicioTipo, data }) => {
      const response = await api.post('/managers/checklist', {
        contrato_id: contratoId,
        servicio_tipo: servicioTipo,
        ...data
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['manager-contratos']);
      toast.success('Checklist actualizado exitosamente');
      setEditingItem(null);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Error al actualizar checklist');
    }
  });

  const handleEdit = (item, contratoId) => {
    setEditingItem(`${contratoId}-${item.servicio_tipo}`);
    const fechaContacto = item.fecha_contacto ? new Date(item.fecha_contacto) : null;
    const fechaPago = item.fecha_pago ? new Date(item.fecha_pago) : null;
    const horaRecogida = item.hora_recogida ? new Date(item.hora_recogida) : null;
    
    setEditForm({
      fecha_contacto: fechaContacto ? fechaContacto.toISOString().split('T')[0] : '',
      hora_contacto: fechaContacto ? fechaContacto.toTimeString().slice(0, 5) : '',
      fecha_pago: fechaPago ? fechaPago.toISOString().split('T')[0] : '',
      fecha_recogida: horaRecogida ? horaRecogida.toISOString().split('T')[0] : '',
      hora_recogida: horaRecogida ? horaRecogida.toTimeString().slice(0, 5) : '',
      notas: item.notas || '',
      estado: item.estado || 'pendiente'
    });
  };

  const handleSave = (contratoId, servicioTipo) => {
    // Combinar fecha y hora para fecha_contacto
    let fechaContactoFinal = null;
    if (editForm.fecha_contacto) {
      if (editForm.hora_contacto) {
        fechaContactoFinal = `${editForm.fecha_contacto}T${editForm.hora_contacto}:00`;
      } else {
        fechaContactoFinal = `${editForm.fecha_contacto}T00:00:00`;
      }
    }

    // Solo fecha para fecha_pago (sin hora)
    let fechaPagoFinal = null;
    if (editForm.fecha_pago) {
      fechaPagoFinal = `${editForm.fecha_pago}T00:00:00`;
    }

    // Combinar fecha y hora para hora_recogida (solo limosina)
    let horaRecogidaFinal = null;
    if (editForm.fecha_recogida) {
      if (editForm.hora_recogida) {
        horaRecogidaFinal = `${editForm.fecha_recogida}T${editForm.hora_recogida}:00`;
      } else {
        horaRecogidaFinal = `${editForm.fecha_recogida}T00:00:00`;
      }
    }

    updateChecklistMutation.mutate({
      contratoId,
      servicioTipo,
      data: {
        fecha_contacto: fechaContactoFinal,
        fecha_pago: fechaPagoFinal,
        hora_recogida: horaRecogidaFinal,
        notas: editForm.notas,
        estado: editForm.estado
      }
    });
  };

  const handleCancel = () => {
    setEditingItem(null);
    setEditForm({
      fecha_contacto: '',
      hora_contacto: '',
      fecha_pago: '',
      fecha_recogida: '',
      hora_recogida: '',
      notas: '',
      estado: 'pendiente'
    });
  };


  const toggleContratoExpandido = (contratoId) => {
    setContratosExpandidos(prev => ({
      ...prev,
      [contratoId]: !prev[contratoId]
    }));
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96" />
          </CardHeader>
        </Card>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-3/4" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <Card className="border-destructive">
        <CardContent className="pt-6">
          <div className="text-center py-12">
            <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <p className="text-destructive font-medium">Error al cargar los contratos</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Filtrar contratos por salón y mes
  const contratosFiltrados = (contratosData?.contratos || []).filter(contrato => {
    // Filtro por salón
    if (salonSeleccionado) {
      const salonNombre = contrato.salones?.nombre || contrato.lugar_salon || '';
      if (salonNombre.toLowerCase() !== salonSeleccionado.toLowerCase()) {
        return false;
      }
    }

    // Filtro por mes y año
    const fechaEvento = contrato.fecha_evento || contrato.eventos?.fecha_evento;
    if (fechaEvento) {
      const fecha = new Date(fechaEvento);
      const mesEvento = fecha.getMonth() + 1; // getMonth() devuelve 0-11
      const anioEvento = fecha.getFullYear();
      
      if (mesEvento !== mesSeleccionado || anioEvento !== anioSeleccionado) {
        return false;
      }
    } else {
      // Si no hay fecha, no mostrar el contrato
      return false;
    }

    return true;
  });

  // Obtener meses disponibles para el año seleccionado
  const meses = [
    { valor: 1, nombre: 'Enero' },
    { valor: 2, nombre: 'Febrero' },
    { valor: 3, nombre: 'Marzo' },
    { valor: 4, nombre: 'Abril' },
    { valor: 5, nombre: 'Mayo' },
    { valor: 6, nombre: 'Junio' },
    { valor: 7, nombre: 'Julio' },
    { valor: 8, nombre: 'Agosto' },
    { valor: 9, nombre: 'Septiembre' },
    { valor: 10, nombre: 'Octubre' },
    { valor: 11, nombre: 'Noviembre' },
    { valor: 12, nombre: 'Diciembre' }
  ];

  // Obtener años disponibles (año actual y siguientes 2 años)
  const aniosDisponibles = [];
  const anioActual = new Date().getFullYear();
  for (let i = 0; i < 3; i++) {
    aniosDisponibles.push(anioActual + i);
  }

  const contratos = contratosFiltrados;

  if (!salonSeleccionado) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">Checklist de Servicios Externos</CardTitle>
            <CardDescription>Selecciona un salón para ver los eventos</CardDescription>
          </CardHeader>
        </Card>

        {/* Botones de Salones */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {['Diamond', 'Kendall', 'Doral'].map((salon) => (
            <Card
              key={salon}
              className="cursor-pointer hover:shadow-md transition-all hover:border-primary/50"
              onClick={() => setSalonSeleccionado(salon)}
            >
              <CardContent className="pt-6">
                <div className="text-center space-y-4">
                  <div className="flex justify-center">
                    <div className="p-4 rounded-full bg-primary/10">
                      <Building2 className="w-12 h-12 text-primary" />
                    </div>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold mb-2">{salon}</h2>
                    <p className="text-muted-foreground text-sm">Ver eventos de {salon}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (contratos.length === 0) {
    return (
      <div className="space-y-6">
        {/* Header con controles */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-3xl">Checklist de Servicios Externos</CardTitle>
                <CardDescription className="mt-2">
                  Salón: <span className="font-semibold text-foreground">{salonSeleccionado}</span>
                </CardDescription>
              </div>
              <Button
                variant="outline"
                onClick={() => setSalonSeleccionado(null)}
              >
                <X className="w-4 h-4 mr-2" />
                Cambiar Salón
              </Button>
            </div>

            {/* Filtros de Mes y Año */}
            <div className="flex items-end gap-4 mt-4">
              <div className="space-y-2">
                <Label>Mes</Label>
                <Select
                  value={mesSeleccionado}
                  onChange={(e) => setMesSeleccionado(parseInt(e.target.value))}
                >
                  {meses.map((mes) => (
                    <option key={mes.valor} value={mes.valor}>
                      {mes.nombre}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Año</Label>
                <Select
                  value={anioSeleccionado}
                  onChange={(e) => setAnioSeleccionado(parseInt(e.target.value))}
                >
                  {aniosDisponibles.map((anio) => (
                    <option key={anio} value={anio}>
                      {anio}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
          </CardHeader>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No hay eventos</h3>
              <p className="text-muted-foreground">
                No se encontraron eventos para {salonSeleccionado} en {meses.find(m => m.valor === mesSeleccionado)?.nombre} {anioSeleccionado}.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header con controles */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-3xl">Checklist de Servicios Externos</CardTitle>
              <CardDescription className="mt-2">
                Salón: <span className="font-semibold text-foreground">{salonSeleccionado}</span>
              </CardDescription>
            </div>
            <Button
              variant="outline"
              onClick={() => setSalonSeleccionado(null)}
            >
              <X className="w-4 h-4 mr-2" />
              Cambiar Salón
            </Button>
          </div>

          {/* Filtros de Mes y Año */}
          <div className="flex items-end gap-4 mt-4">
            <div className="space-y-2">
              <Label>Mes</Label>
              <Select
                value={mesSeleccionado}
                onChange={(e) => setMesSeleccionado(parseInt(e.target.value))}
              >
                {meses.map((mes) => (
                  <option key={mes.valor} value={mes.valor}>
                    {mes.nombre}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Año</Label>
              <Select
                value={anioSeleccionado}
                onChange={(e) => setAnioSeleccionado(parseInt(e.target.value))}
              >
                {aniosDisponibles.map((anio) => (
                  <option key={anio} value={anio}>
                    {anio}
                  </option>
                ))}
              </Select>
            </div>
            <div className="ml-auto flex items-end">
              <Badge variant="secondary" className="text-sm">
                {contratos.length} evento{contratos.length !== 1 ? 's' : ''} encontrado{contratos.length !== 1 ? 's' : ''}
              </Badge>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Lista de Contratos */}
      <div className="space-y-4">
        {contratos.map((contrato) => (
          <Card key={contrato.id} className="overflow-hidden">
            {/* Header del Contrato */}
            <CardHeader className="border-b">
              <div className="flex flex-col gap-4">
                <button
                  onClick={() => toggleContratoExpandido(contrato.id)}
                  className="w-full flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-left hover:opacity-80 transition"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <CardTitle className="text-lg mb-0">
                        {contrato.codigo_contrato}
                      </CardTitle>
                      <ChevronDown 
                        className={cn(
                          "w-5 h-5 text-muted-foreground transition-transform",
                          contratosExpandidos[contrato.id] && "transform rotate-180"
                        )}
                      />
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        <span>{contrato.clientes?.nombre_completo}</span>
                      </div>
                      {contrato.eventos?.fecha_evento && (
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <span>
                            {new Date(contrato.eventos.fecha_evento).toLocaleDateString('es-ES', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </span>
                        </div>
                      )}
                      {contrato.salones?.nombre && (
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4" />
                          <span>{contrato.salones.nombre}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </button>

                {/* Botón Descargar PDF de Ajustes - Solo visible cuando está expandido */}
                {contratosExpandidos[contrato.id] && (
                  <div className="flex justify-end pt-2 border-t">
                    <Button
                      size="sm"
                      onClick={async () => {
                        try {
                          const response = await api.get(`/ajustes/contrato/${contrato.id}/pdf`, {
                            responseType: 'blob'
                          });
                          const url = window.URL.createObjectURL(new Blob([response.data]));
                          const link = document.createElement('a');
                          link.href = url;
                          link.setAttribute('download', `Ajustes-Evento-${contrato.codigo_contrato || 'evento'}.pdf`);
                          document.body.appendChild(link);
                          link.click();
                          link.remove();
                          toast.success('PDF descargado exitosamente');
                        } catch (error) {
                          toast.error('Error al descargar el PDF');
                        }
                      }}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Descargar PDF
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>

            {/* Checklist Items - Solo visible cuando está expandido */}
            {contratosExpandidos[contrato.id] && (
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {contrato.checklist?.map((item) => {
                  const itemKey = `${contrato.id}-${item.servicio_tipo}`;
                  const isEditing = editingItem === itemKey;
                  const EstadoIcon = ESTADOS_ICONS[item.estado] || Clock;

                  return (
                    <Card
                      key={item.servicio_tipo}
                      className="transition-all hover:shadow-md"
                    >
                      <CardHeader className="pb-4">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base font-semibold mb-0">
                            {SERVICIOS_LABELS[item.servicio_tipo] || item.servicio_tipo}
                          </CardTitle>
                          <Badge variant={ESTADOS_VARIANTS[item.estado] || 'warning'} className="gap-1.5">
                            <EstadoIcon className="w-3.5 h-3.5" />
                            <span className="capitalize">{item.estado?.replace('_', ' ')}</span>
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">

                      {isEditing ? (
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                              <Label htmlFor={`fecha_contacto_${itemKey}`}>Fecha de Contacto</Label>
                              <Input
                                id={`fecha_contacto_${itemKey}`}
                                type="date"
                                value={editForm.fecha_contacto}
                                onChange={(e) => setEditForm({ ...editForm, fecha_contacto: e.target.value })}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor={`hora_contacto_${itemKey}`}>Hora de Contacto</Label>
                              <Input
                                id={`hora_contacto_${itemKey}`}
                                type="time"
                                value={editForm.hora_contacto}
                                onChange={(e) => setEditForm({ ...editForm, hora_contacto: e.target.value })}
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor={`estado_${itemKey}`}>Estado</Label>
                            <Select
                              id={`estado_${itemKey}`}
                              value={editForm.estado}
                              onChange={(e) => setEditForm({ ...editForm, estado: e.target.value })}
                            >
                              <option value="pendiente">Pendiente</option>
                              <option value="completado">Completado</option>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor={`fecha_pago_${itemKey}`}>Fecha de Pago</Label>
                            <Input
                              id={`fecha_pago_${itemKey}`}
                              type="date"
                              value={editForm.fecha_pago}
                              onChange={(e) => setEditForm({ ...editForm, fecha_pago: e.target.value })}
                            />
                          </div>

                          {item.servicio_tipo === 'limosina' && (
                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-2">
                                <Label htmlFor={`fecha_recogida_${itemKey}`}>Fecha de Recogida</Label>
                                <Input
                                  id={`fecha_recogida_${itemKey}`}
                                  type="date"
                                  value={editForm.fecha_recogida}
                                  onChange={(e) => setEditForm({ ...editForm, fecha_recogida: e.target.value })}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor={`hora_recogida_${itemKey}`}>Hora de Recogida</Label>
                                <Input
                                  id={`hora_recogida_${itemKey}`}
                                  type="time"
                                  value={editForm.hora_recogida}
                                  onChange={(e) => setEditForm({ ...editForm, hora_recogida: e.target.value })}
                                />
                              </div>
                            </div>
                          )}

                          <div className="space-y-2">
                            <Label htmlFor={`notas_${itemKey}`}>Notas</Label>
                            <Textarea
                              id={`notas_${itemKey}`}
                              value={editForm.notas}
                              onChange={(e) => setEditForm({ ...editForm, notas: e.target.value })}
                              rows={3}
                              placeholder="Agregar notas sobre el contacto..."
                            />
                          </div>

                          <div className="flex gap-2 pt-2">
                            <Button
                              onClick={() => handleSave(contrato.id, item.servicio_tipo)}
                              disabled={updateChecklistMutation.isLoading}
                              className="flex-1"
                              size="sm"
                            >
                              <Save className="w-4 h-4 mr-2" />
                              Guardar
                            </Button>
                            <Button
                              onClick={handleCancel}
                              variant="outline"
                              className="flex-1"
                              size="sm"
                            >
                              <X className="w-4 h-4 mr-2" />
                              Cancelar
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {item.fecha_contacto && (
                            <div className="text-sm">
                              <span className="font-medium text-foreground">Fecha de Contacto:</span>{' '}
                              <span className="text-muted-foreground">
                                {new Date(item.fecha_contacto).toLocaleString('es-ES')}
                              </span>
                            </div>
                          )}

                          {item.fecha_pago && (
                            <div className="text-sm">
                              <span className="font-medium text-foreground">Fecha de Pago:</span>{' '}
                              <span className="text-muted-foreground">
                                {new Date(item.fecha_pago).toLocaleString('es-ES')}
                              </span>
                            </div>
                          )}

                          {item.servicio_tipo === 'limosina' && item.hora_recogida && (
                            <div className="text-sm">
                              <span className="font-medium text-foreground">Hora de Recogida:</span>{' '}
                              <span className="text-muted-foreground">
                                {new Date(item.hora_recogida).toLocaleString('es-ES')}
                              </span>
                            </div>
                          )}

                          {item.notas && (
                            <div className="text-sm">
                              <span className="font-medium text-foreground block mb-1">Notas:</span>
                              <span className="text-muted-foreground">{item.notas}</span>
                            </div>
                          )}

                          {item.usuarios && (
                            <div className="text-xs text-muted-foreground">
                              Gestionado por: <span className="font-medium">{item.usuarios.nombre_completo}</span>
                            </div>
                          )}

                          <Button
                            onClick={() => handleEdit(item, contrato.id)}
                            variant="outline"
                            className="w-full mt-4"
                            size="sm"
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            Editar
                          </Button>
                        </div>
                      )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}

export default ChecklistManager;
