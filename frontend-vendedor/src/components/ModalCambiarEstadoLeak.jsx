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
  const [detallesInteresado, setDetallesInteresado] = useState('');
  const [motivoNoInteresado, setMotivoNoInteresado] = useState('');
  const [fechaLlamarLuego, setFechaLlamarLuego] = useState('');
  const [horaLlamarLuego, setHoraLlamarLuego] = useState('');
  const [detallesContactadoLlamarLuego, setDetallesContactadoLlamarLuego] = useState('');
  const [fechaNoContactado, setFechaNoContactado] = useState('');
  const [horaNoContactado, setHoraNoContactado] = useState('');
  const [detallesNoContestaLlamarLuego, setDetallesNoContestaLlamarLuego] = useState('');

  const mutation = useMutation({
    mutationFn: async (data) => {
      const response = await api.put(`/leaks/${leak.id}/estado`, data);
      return response.data;
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['leaks-mios'], refetchType: 'active' }),
        queryClient.invalidateQueries({ queryKey: ['leaks-pendientes'], refetchType: 'active' }),
        queryClient.invalidateQueries({ queryKey: ['leaks-pendientes-lista'], refetchType: 'active' }),
        queryClient.invalidateQueries({ queryKey: ['leaks-stats'], refetchType: 'active' })
      ]);
      toast.success('Estado actualizado exitosamente');
      onSuccess?.();
      onClose();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Error al actualizar el estado');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validaciones según el estado
    if (estado === 'interesado' && !fechaCitaSalon) {
      toast.error('La fecha para ver el salón es requerida');
      return;
    }

    if (estado === 'contactado_no_interesado' && !motivoNoInteresado.trim()) {
      toast.error('El motivo de no interés es requerido');
      return;
    }

    if (estado === 'contactado_llamar_luego' && !fechaLlamarLuego) {
      toast.error('La fecha para contactar nuevamente es requerida');
      return;
    }

    if (estado === 'no_contesta_llamar_luego' && !fechaNoContactado) {
      toast.error('La fecha para llamar es requerida');
      return;
    }

    // Preparar datos
    const data = {
      estado,
    };

    // Campos específicos según el estado
    if (estado === 'interesado' && fechaCitaSalon) {
      const fechaHora = horaCitaSalon 
        ? `${fechaCitaSalon}T${horaCitaSalon}:00`
        : `${fechaCitaSalon}T10:00:00`;
      data.fecha_cita_salon = fechaHora;
      data.detalles_interesado = detallesInteresado || null;
    }

    if (estado === 'contactado_no_interesado') {
      data.motivo_no_interesado = motivoNoInteresado;
    }

    if (estado === 'contactado_llamar_luego' && fechaLlamarLuego) {
      const fechaHora = horaLlamarLuego 
        ? `${fechaLlamarLuego}T${horaLlamarLuego}:00`
        : `${fechaLlamarLuego}T09:00:00`;
      data.fecha_proximo_contacto = fechaHora;
      if (detallesContactadoLlamarLuego) {
        data.notas_vendedor = detallesContactadoLlamarLuego;
      }
    }

    if (estado === 'no_contesta_llamar_luego' && fechaNoContactado) {
      const fechaHora = horaNoContactado 
        ? `${fechaNoContactado}T${horaNoContactado}:00`
        : `${fechaNoContactado}T09:00:00`;
      data.fecha_proximo_contacto = fechaHora;
      if (detallesNoContestaLlamarLuego) {
        data.notas_vendedor = detallesNoContestaLlamarLuego;
      }
    }

    mutation.mutate(data);
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Cambiar Estado del Lead</DialogTitle>
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
                <SelectItem value="nuevo">Nuevos</SelectItem>
                <SelectItem value="interesado">Interesado</SelectItem>
                <SelectItem value="contactado_llamar_luego">Contactado Llamar Luego</SelectItem>
                <SelectItem value="no_contesta_llamar_luego">No Contesta Llamar Luego</SelectItem>
                <SelectItem value="contactado_no_interesado">Contactado No Interesado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Fecha para ver salón (solo para Interesado) */}
          {estado === 'interesado' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="fecha_cita_salon">
                    Fecha para Ver el Salón <span className="text-destructive">*</span>
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
              <div>
                <Label htmlFor="detalles_interesado">Detalles (opcional)</Label>
                <Textarea
                  id="detalles_interesado"
                  value={detallesInteresado}
                  onChange={(e) => setDetallesInteresado(e.target.value)}
                  placeholder="Detalles sobre el interés del cliente..."
                  className="mt-2"
                  rows={3}
                />
              </div>
            </>
          )}

          {/* Motivo no interesado (solo para Contactado No Interesado) */}
          {estado === 'contactado_no_interesado' && (
            <div>
              <Label htmlFor="motivo_no_interesado">
                ¿Por qué no está interesado? <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="motivo_no_interesado"
                value={motivoNoInteresado}
                onChange={(e) => setMotivoNoInteresado(e.target.value)}
                required
                placeholder="Ej: Precio muy alto, no le gustó la oferta, ya contrató con otro, etc."
                className="mt-2"
                rows={3}
              />
            </div>
          )}

          {/* Fecha para contactar nuevamente (solo para Contactado Llamar Luego) */}
          {estado === 'contactado_llamar_luego' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="fecha_llamar_luego">
                    Fecha para Contactar Nuevamente <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    type="date"
                    id="fecha_llamar_luego"
                    value={fechaLlamarLuego}
                    onChange={(e) => setFechaLlamarLuego(e.target.value)}
                    required
                    className="mt-2"
                    min={format(new Date(), 'yyyy-MM-dd')}
                  />
                </div>
                <div>
                  <Label htmlFor="hora_llamar_luego">Hora (opcional)</Label>
                  <Input
                    type="time"
                    id="hora_llamar_luego"
                    value={horaLlamarLuego}
                    onChange={(e) => setHoraLlamarLuego(e.target.value)}
                    className="mt-2"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="detalles_contactado_llamar_luego">Detalles (opcional)</Label>
                <Textarea
                  id="detalles_contactado_llamar_luego"
                  value={detallesContactadoLlamarLuego}
                  onChange={(e) => setDetallesContactadoLlamarLuego(e.target.value)}
                  placeholder="Detalles sobre el contacto y lo acordado..."
                  className="mt-2"
                  rows={3}
                />
              </div>
            </>
          )}

          {/* Fecha y hora para llamar (solo para No Contesta Llamar Luego) */}
          {estado === 'no_contesta_llamar_luego' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="fecha_no_contactado">
                    Fecha para Llamar <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    type="date"
                    id="fecha_no_contactado"
                    value={fechaNoContactado}
                    onChange={(e) => setFechaNoContactado(e.target.value)}
                    required
                    className="mt-2"
                    min={format(new Date(), 'yyyy-MM-dd')}
                  />
                </div>
                <div>
                  <Label htmlFor="hora_no_contactado">
                    Hora para Llamar <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    type="time"
                    id="hora_no_contactado"
                    value={horaNoContactado}
                    onChange={(e) => setHoraNoContactado(e.target.value)}
                    required
                    className="mt-2"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="detalles_no_contesta_llamar_luego">Detalles (opcional)</Label>
                <Textarea
                  id="detalles_no_contesta_llamar_luego"
                  value={detallesNoContestaLlamarLuego}
                  onChange={(e) => setDetallesNoContestaLlamarLuego(e.target.value)}
                  placeholder="Detalles sobre los intentos de contacto..."
                  className="mt-2"
                  rows={3}
                />
              </div>
              <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                      Recordatorio: Si no contacta por teléfono, escribir al email
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}

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

