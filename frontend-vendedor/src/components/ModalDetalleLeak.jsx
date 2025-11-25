import { X, Phone, Mail, Calendar, Users, MapPin, ExternalLink, Clock, FileText, User, UserPlus, Loader2, CalendarPlus } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// Función helper para parsear fechas sin problemas de timezone
const parsearFechaLocal = (fecha) => {
  if (!fecha) return null;
  
  // Si es un string en formato YYYY-MM-DD, parsearlo como fecha local
  if (typeof fecha === 'string') {
    // Extraer solo la parte de fecha (antes de T o espacio)
    const datePart = fecha.split('T')[0].split(' ')[0];
    if (datePart.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const [year, month, day] = datePart.split('-').map(Number);
      // Crear fecha en timezone local (medianoche local)
      return new Date(year, month - 1, day);
    }
  }
  
  // Si es un objeto Date, extraer año, mes, día y crear nueva fecha local
  if (fecha instanceof Date) {
    const year = fecha.getFullYear();
    const month = fecha.getMonth();
    const day = fecha.getDate();
    return new Date(year, month, day);
  }
  
  // Si es un string ISO con timezone, extraer solo la parte de fecha
  if (typeof fecha === 'string') {
    const datePart = fecha.split('T')[0].split(' ')[0];
    if (datePart.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const [year, month, day] = datePart.split('-').map(Number);
      return new Date(year, month - 1, day);
    }
  }
  
  // Último recurso: parsear normalmente y luego extraer año/mes/día
  const date = new Date(fecha);
  if (!isNaN(date.getTime())) {
    const year = date.getFullYear();
    const month = date.getMonth();
    const day = date.getDate();
    return new Date(year, month, day);
  }
  
  return null;
};

// Función helper para parsear fechas con hora preservada
const parsearFechaConHora = (fecha) => {
  if (!fecha) return null;
  
  // Si es un string ISO con hora (formato: YYYY-MM-DDTHH:mm:ss o YYYY-MM-DD HH:mm:ss)
  if (typeof fecha === 'string') {
    // Intentar parsear como ISO completo
    const isoMatch = fecha.match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?/);
    if (isoMatch) {
      const [, year, month, day, hour, minute, second] = isoMatch;
      return new Date(
        parseInt(year),
        parseInt(month) - 1,
        parseInt(day),
        parseInt(hour),
        parseInt(minute),
        second ? parseInt(second) : 0
      );
    }
    
    // Si solo tiene fecha, usar parsearFechaLocal
    const datePart = fecha.split('T')[0].split(' ')[0];
    if (datePart.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return parsearFechaLocal(fecha);
    }
  }
  
  // Si es un objeto Date, devolverlo directamente
  if (fecha instanceof Date) {
    return fecha;
  }
  
  // Último recurso: parsear normalmente
  const date = new Date(fecha);
  if (!isNaN(date.getTime())) {
    return date;
  }
  
  return null;
};
import api from '../config/api';
import toast from 'react-hot-toast';
function ModalDetalleLeak({ isOpen, onClose, leak }) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const convertirClienteMutation = useMutation({
    mutationFn: async (leakId) => {
      const response = await api.post(`/leaks/${leakId}/convertir-cliente`);
      return response.data;
    },
    onSuccess: async (data) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['leaks-mios'], refetchType: 'active' }),
        queryClient.invalidateQueries({ queryKey: ['leaks-disponibles'], refetchType: 'active' }),
        queryClient.invalidateQueries({ queryKey: ['clientes'], refetchType: 'active' })
      ]);
      toast.success('Lead convertido a cliente exitosamente');
      onClose();
      // Opcional: navegar a la página del cliente
      if (data.cliente) {
        navigate(`/clientes/editar/${data.cliente.id}`);
      }
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Error al crear cliente');
    },
  });

  const agregarACalendarioMutation = useMutation({
    mutationFn: async (leakId) => {
      const response = await api.post(`/google-calendar/leaks/${leakId}/agregar`);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(['leaks-mios']);
      queryClient.invalidateQueries(['calendario-citas']);
      toast.success(data.message || 'Evento agregado a Google Calendar exitosamente');
      if (data.evento?.htmlLink) {
        // Opcional: abrir el evento en Google Calendar
        window.open(data.evento.htmlLink, '_blank');
      }
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Error al agregar el evento a Google Calendar');
    },
  });

  const handleConvertirCliente = () => {
    if (window.confirm('¿Estás seguro de convertir este lead en cliente? Esto creará un nuevo cliente en el sistema.')) {
      convertirClienteMutation.mutate(leak.id);
    }
  };

  if (!isOpen || !leak) return null;

  const getEstadoBadge = (estado) => {
    const estados = {
      nuevo: { label: 'Nuevos', variant: 'default' },
      interesado: { label: 'Interesado', variant: 'default' },
      contactado_llamar_luego: { label: 'Contactado Llamar Luego', variant: 'secondary' },
      no_contesta_llamar_luego: { label: 'No Contesta Llamar Luego', variant: 'secondary' },
      contactado_no_interesado: { label: 'Contactado No Interesado', variant: 'destructive' },
    };
    return estados[estado] || { label: estado || 'Sin estado', variant: 'outline' };
  };

  const estadoInfo = getEstadoBadge(leak.estado);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Detalle del Lead</span>
            <Badge variant={estadoInfo.variant}>{estadoInfo.label}</Badge>
          </DialogTitle>
          <DialogDescription>
            Información completa del cliente potencial
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Información Personal */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <User className="w-5 h-5" />
              Información Personal
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Nombre Completo</label>
                <p className="text-base font-medium mt-1">{leak.nombre_completo}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                  <Phone className="w-4 h-4" />
                  Teléfono
                </label>
                <p className="text-base mt-1">{leak.telefono}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                  <Mail className="w-4 h-4" />
                  Email
                </label>
                <p className="text-base mt-1">{leak.email}</p>
              </div>
              {leak.horario_contactar && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    Horario para Contactar
                  </label>
                  <p className="text-base mt-1">{leak.horario_contactar}</p>
                </div>
              )}
              {leak.opt_in_sms && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Opt In SMS</label>
                  <Badge variant="outline" className="mt-1">Sí</Badge>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Información del Evento */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Información del Evento
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {leak.tipo_evento && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Tipo de Evento</label>
                  <p className="text-base mt-1">{leak.tipo_evento}</p>
                </div>
              )}
              {leak.cantidad_invitados && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    Cantidad de Invitados
                  </label>
                  <p className="text-base mt-1">{leak.cantidad_invitados}</p>
                </div>
              )}
              {leak.salon_preferido && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    Salón Preferido
                  </label>
                  <Badge variant="outline" className="mt-1">
                    {leak.salon_preferido === '?' ? 'Desconocido' : leak.salon_preferido}
                  </Badge>
                </div>
              )}
              {leak.fecha_evento && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Fecha del Evento</label>
                  <p className="text-base mt-1">
                    {format(parsearFechaLocal(leak.fecha_evento), 'yyyy-MM-dd')}
                  </p>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Información de Origen */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <ExternalLink className="w-5 h-5" />
              Información de Origen
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Fuente</label>
                <p className="text-base mt-1">{leak.fuente || '-'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Fecha de Recepción</label>
                <p className="text-base mt-1">
                  {format(parsearFechaLocal(leak.fecha_recepcion), 'yyyy-MM-dd')}
                </p>
              </div>
            </div>
          </div>

          {leak.observaciones && (
            <>
              <Separator />
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Observaciones
                </h3>
                <p className="text-base text-muted-foreground">{leak.observaciones}</p>
              </div>
            </>
          )}

          {/* Información de Gestión */}
          {(leak.vendedor_id || leak.fecha_asignacion || leak.fecha_ultimo_contacto || leak.fecha_proximo_contacto || leak.fecha_cita_salon || leak.motivo_rechazo || leak.notas_vendedor) && (
            <>
              <Separator />
              <div>
                <h3 className="text-lg font-semibold mb-4">Gestión</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {leak.fecha_asignacion && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Fecha de Asignación</label>
                      <p className="text-base mt-1">
                        {(() => {
                          const fecha = parsearFechaConHora(leak.fecha_asignacion);
                          if (!fecha) return '-';
                          const tieneHora = leak.fecha_asignacion.includes('T') && leak.fecha_asignacion.includes(':');
                          return tieneHora 
                            ? format(fecha, 'yyyy-MM-dd hh:mm a', { locale: es })
                            : format(fecha, 'yyyy-MM-dd');
                        })()}
                      </p>
                    </div>
                  )}
                  {leak.fecha_ultimo_contacto && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Último Contacto</label>
                      <p className="text-base mt-1">
                        {(() => {
                          const fecha = parsearFechaConHora(leak.fecha_ultimo_contacto);
                          if (!fecha) return '-';
                          const tieneHora = leak.fecha_ultimo_contacto.includes('T') && leak.fecha_ultimo_contacto.includes(':');
                          return tieneHora 
                            ? format(fecha, 'yyyy-MM-dd hh:mm a', { locale: es })
                            : format(fecha, 'yyyy-MM-dd');
                        })()}
                      </p>
                    </div>
                  )}
                  {leak.fecha_proximo_contacto && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Próximo Contacto</label>
                      <p className="text-base mt-1">
                        {(() => {
                          const fecha = parsearFechaConHora(leak.fecha_proximo_contacto);
                          if (!fecha) return '-';
                          const tieneHora = leak.fecha_proximo_contacto.includes('T') && leak.fecha_proximo_contacto.includes(':');
                          return tieneHora 
                            ? format(fecha, 'yyyy-MM-dd hh:mm a', { locale: es })
                            : format(fecha, 'yyyy-MM-dd');
                        })()}
                      </p>
                    </div>
                  )}
                  {leak.fecha_cita_salon && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Fecha de Cita al Salón</label>
                      <p className="text-base mt-1">
                        {(() => {
                          const fecha = parsearFechaConHora(leak.fecha_cita_salon);
                          if (!fecha) return '-';
                          const tieneHora = leak.fecha_cita_salon.includes('T') && leak.fecha_cita_salon.includes(':');
                          return tieneHora 
                            ? format(fecha, 'yyyy-MM-dd hh:mm a', { locale: es })
                            : format(fecha, 'yyyy-MM-dd');
                        })()}
                      </p>
                    </div>
                  )}
                  {leak.motivo_no_interesado && (
                    <div className="md:col-span-2">
                      <label className="text-sm font-medium text-muted-foreground">Motivo de No Interés</label>
                      <p className="text-base mt-1 text-destructive">{leak.motivo_no_interesado}</p>
                    </div>
                  )}
                  {leak.motivo_rechazo && (
                    <div className="md:col-span-2">
                      <label className="text-sm font-medium text-muted-foreground">Motivo de Rechazo</label>
                      <p className="text-base mt-1 text-destructive">{leak.motivo_rechazo}</p>
                    </div>
                  )}
                  {leak.detalles_interesado && (
                    <div className="md:col-span-2">
                      <label className="text-sm font-medium text-muted-foreground">Detalles del Interés</label>
                      <p className="text-base mt-1 whitespace-pre-wrap">{leak.detalles_interesado}</p>
                    </div>
                  )}
                  {leak.notas_vendedor && (
                    <div className="md:col-span-2">
                      <label className="text-sm font-medium text-muted-foreground">
                        {leak.estado === 'contactado_llamar_luego' || leak.estado === 'no_contesta_llamar_luego' 
                          ? 'Detalles del Contacto' 
                          : 'Notas del Vendedor'}
                      </label>
                      <p className="text-base mt-1 whitespace-pre-wrap">{leak.notas_vendedor}</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Cliente relacionado */}
          {leak.cliente_id && leak.clientes && (
            <>
              <Separator />
              <div>
                <h3 className="text-lg font-semibold mb-4">Cliente Relacionado</h3>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="font-medium">{leak.clientes.nombre_completo}</p>
                  <p className="text-sm text-muted-foreground">{leak.clientes.email}</p>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="flex justify-between items-center mt-6">
          <div className="flex gap-2">
            {leak.estado !== 'convertido' && !leak.cliente_id && (
              <Button
                onClick={handleConvertirCliente}
                disabled={convertirClienteMutation.isPending}
              >
                {convertirClienteMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Convirtiendo...
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Convertir a Cliente
                  </>
                )}
              </Button>
            )}
            {leak.estado === 'interesado' && leak.fecha_cita_salon && (
              <Button
                variant="outline"
                onClick={() => agregarACalendarioMutation.mutate(leak.id)}
                disabled={agregarACalendarioMutation.isPending}
              >
                {agregarACalendarioMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Agregando...
                  </>
                ) : (
                  <>
                    <CalendarPlus className="w-4 h-4 mr-2" />
                    Agregar a Google Calendar
                  </>
                )}
              </Button>
            )}
          </div>
          <div className="ml-auto">
            <Button variant="outline" onClick={onClose}>
              Cerrar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default ModalDetalleLeak;

