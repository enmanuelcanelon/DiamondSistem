import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Save, Loader2, Calendar, FileText, AlertCircle } from 'lucide-react';
import api from '../config/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

function ModalCambiarEstadoLeak({ isOpen, onClose, leak, onSuccess }) {
  const queryClient = useQueryClient();
  const [estado, setEstado] = useState(leak?.estado || 'nuevo');
  const [fechaCitaSalon, setFechaCitaSalon] = useState('');
  const [horaCitaSalon, setHoraCitaSalon] = useState('');
  const [motivoRechazo, setMotivoRechazo] = useState('');
  const [notasVendedor, setNotasVendedor] = useState('');

  const mutation = useMutation({
    mutationFn: async (data) => {
      const response = await api.put(`/leaks/${leak.id}/estado`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['leaks-mios']);
      queryClient.invalidateQueries(['leaks-pendientes']);
      queryClient.invalidateQueries(['leaks-pendientes-lista']);
      toast.success('Estado actualizado exitosamente');
      onSuccess?.();
      onClose();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Error al actualizar estado');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validaciones
    if (estado === 'contactado' && !fechaCitaSalon) {
      toast.error('La fecha de cita al salón es requerida');
      return;
    }

    if (estado === 'rechazado' && !motivoRechazo.trim()) {
      toast.error('El motivo de rechazo es requerido');
      return;
    }

    // Preparar datos
    const data = {
      estado,
      notas_vendedor: notasVendedor || null,
    };

    if (estado === 'contactado' && fechaCitaSalon) {
      // Combinar fecha y hora
      const fechaHora = horaCitaSalon 
        ? `${fechaCitaSalon}T${horaCitaSalon}:00`
        : `${fechaCitaSalon}T10:00:00`;
      data.fecha_cita_salon = fechaHora;
    }

    if (estado === 'rechazado') {
      data.motivo_rechazo = motivoRechazo;
    }

    mutation.mutate(data);
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Cambiar Estado del Leak</DialogTitle>
          <DialogDescription>
            Actualiza el estado de contacto para {leak?.nombre_completo}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Estado */}
          <div>
            <Label htmlFor="estado">
              Estado <span className="text-destructive">*</span>
            </Label>
            <Select value={estado} onValueChange={setEstado}>
              <SelectTrigger id="estado" className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="nuevo">Nuevo</SelectItem>
                <SelectItem value="contactado">Contactado (Asignar fecha para ver salón)</SelectItem>
                <SelectItem value="no_contesta">No Contesta (Llamar mañana)</SelectItem>
                <SelectItem value="rechazado">Rechazado</SelectItem>
                <SelectItem value="contactado_llamar_otra_vez">Contactado - Llamar Otra Vez</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Fecha de cita al salón (solo para contactado) */}
          {estado === 'contactado' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="fecha_cita_salon">
                  Fecha de Cita al Salón <span className="text-destructive">*</span>
                </Label>
                <Input
                  type="date"
                  id="fecha_cita_salon"
                  value={fechaCitaSalon}
                  onChange={(e) => setFechaCitaSalon(e.target.value)}
                  required
                  className="mt-2"
                  min={format(new Date(), 'yyyy-MM-dd')}
                />
              </div>
              <div>
                <Label htmlFor="hora_cita_salon">Hora (opcional)</Label>
                <Input
                  type="time"
                  id="hora_cita_salon"
                  value={horaCitaSalon}
                  onChange={(e) => setHoraCitaSalon(e.target.value)}
                  className="mt-2"
                />
              </div>
            </div>
          )}

          {/* Motivo de rechazo (solo para rechazado) */}
          {estado === 'rechazado' && (
            <div>
              <Label htmlFor="motivo_rechazo">
                Motivo de Rechazo <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="motivo_rechazo"
                value={motivoRechazo}
                onChange={(e) => setMotivoRechazo(e.target.value)}
                required
                placeholder="Ej: Precio muy alto, no le gustó la oferta, etc."
                className="mt-2"
                rows={3}
              />
            </div>
          )}

          {/* Información para no_contesta y contactado_llamar_otra_vez */}
          {(estado === 'no_contesta' || estado === 'contactado_llamar_otra_vez') && (
            <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                    {estado === 'no_contesta' 
                      ? 'Se programará automáticamente para llamar mañana'
                      : 'Se programará automáticamente para llamar mañana'}
                  </p>
                  <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                    El sistema establecerá la fecha de próximo contacto al día siguiente.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Notas del vendedor (opcional para todos) */}
          <div>
            <Label htmlFor="notas_vendedor">Notas del Vendedor (opcional)</Label>
            <Textarea
              id="notas_vendedor"
              value={notasVendedor}
              onChange={(e) => setNotasVendedor(e.target.value)}
              placeholder="Agregar notas adicionales sobre el contacto..."
              className="mt-2"
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Guardar Cambios
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default ModalCambiarEstadoLeak;

