import { X, Phone, Mail, Calendar, Users, MapPin, ExternalLink, Clock, FileText, User, UserPlus, Loader2 } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
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
    onSuccess: (data) => {
      queryClient.invalidateQueries(['leaks-mios']);
      queryClient.invalidateQueries(['leaks-disponibles']);
      queryClient.invalidateQueries(['clientes']);
      toast.success('Leak convertido en cliente exitosamente');
      onClose();
      // Opcional: navegar a la página del cliente
      if (data.cliente) {
        navigate(`/clientes/editar/${data.cliente.id}`);
      }
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Error al convertir leak en cliente');
    },
  });

  const handleConvertirCliente = () => {
    if (window.confirm('¿Estás seguro de convertir este leak en cliente? Esto creará un nuevo cliente en el sistema.')) {
      convertirClienteMutation.mutate(leak.id);
    }
  };

  if (!isOpen || !leak) return null;

  const getEstadoBadge = (estado) => {
    const estados = {
      nuevo: { label: 'Nuevo', variant: 'default' },
      contactado: { label: 'Contactado', variant: 'default' },
      no_contesta: { label: 'No Contesta', variant: 'secondary' },
      rechazado: { label: 'Rechazado', variant: 'destructive' },
      contactado_llamar_otra_vez: { label: 'Llamar Otra Vez', variant: 'secondary' },
      convertido: { label: 'Convertido', variant: 'default' },
    };
    return estados[estado] || { label: estado, variant: 'outline' };
  };

  const estadoInfo = getEstadoBadge(leak.estado);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Detalle del Leak</span>
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
                  <Badge variant="outline" className="mt-1">{leak.salon_preferido}</Badge>
                </div>
              )}
              {leak.fecha_evento && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Fecha del Evento</label>
                  <p className="text-base mt-1">
                    {format(new Date(leak.fecha_evento), 'dd/MM/yyyy', { locale: es })}
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
                  {format(new Date(leak.fecha_recepcion), 'dd/MM/yyyy', { locale: es })}
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
                        {format(new Date(leak.fecha_asignacion), 'dd/MM/yyyy HH:mm', { locale: es })}
                      </p>
                    </div>
                  )}
                  {leak.fecha_ultimo_contacto && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Último Contacto</label>
                      <p className="text-base mt-1">
                        {format(new Date(leak.fecha_ultimo_contacto), 'dd/MM/yyyy HH:mm', { locale: es })}
                      </p>
                    </div>
                  )}
                  {leak.fecha_proximo_contacto && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Próximo Contacto</label>
                      <p className="text-base mt-1">
                        {format(new Date(leak.fecha_proximo_contacto), 'dd/MM/yyyy', { locale: es })}
                      </p>
                    </div>
                  )}
                  {leak.fecha_cita_salon && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Fecha de Cita al Salón</label>
                      <p className="text-base mt-1">
                        {format(new Date(leak.fecha_cita_salon), 'dd/MM/yyyy HH:mm', { locale: es })}
                      </p>
                    </div>
                  )}
                  {leak.motivo_rechazo && (
                    <div className="md:col-span-2">
                      <label className="text-sm font-medium text-muted-foreground">Motivo de Rechazo</label>
                      <p className="text-base mt-1 text-destructive">{leak.motivo_rechazo}</p>
                    </div>
                  )}
                  {leak.notas_vendedor && (
                    <div className="md:col-span-2">
                      <label className="text-sm font-medium text-muted-foreground">Notas del Vendedor</label>
                      <p className="text-base mt-1">{leak.notas_vendedor}</p>
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

