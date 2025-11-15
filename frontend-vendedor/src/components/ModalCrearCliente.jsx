import { useState } from 'react';
import { X, Save, Loader2, UserPlus } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../config/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Textarea } from '../components/ui/textarea';

function ModalCrearCliente({ isOpen, onClose, onClienteCreado }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    nombre_completo: '',
    email: '',
    telefono: '',
    direccion: '',
    tipo_evento: '',
    como_nos_conocio: '',
  });

  const mutation = useMutation({
    mutationFn: async (data) => {
      const response = await api.post('/clientes', data);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(['clientes']);
      // Cerrar modal y notificar al padre
      onClienteCreado(data.cliente);
      // Resetear formulario
      setFormData({
        nombre_completo: '',
        email: '',
        telefono: '',
        direccion: '',
        tipo_evento: '',
        como_nos_conocio: '',
      });
      onClose();
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const tiposEvento = [
    'Boda',
    'Quinceaños',
    'Cumpleaños',
    'Aniversario',
    'Corporativo',
    'Graduación',
    'Baby Shower',
    'Otro',
  ];

  const fuentesConocimiento = [
    'Facebook',
    'Instagram',
    'Google',
    'Recomendación',
    'Otro',
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] flex flex-col">
        {/* Header simple */}
        <div className="flex items-center justify-between p-6 border-b flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
              <UserPlus className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Nuevo Cliente</h2>
              <p className="text-sm text-muted-foreground">Completa la información del cliente</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulario con scroll solo si es necesario */}
        <div className="flex-1 overflow-y-auto min-h-0">
          <form id="cliente-form" onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Información Personal */}
            <div className="space-y-4">
              <h3 className="text-base font-semibold">Información Personal</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Label htmlFor="nombre_completo">
                    Nombre Completo <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    type="text"
                    id="nombre_completo"
                    name="nombre_completo"
                    value={formData.nombre_completo}
                    onChange={handleChange}
                    required
                    placeholder="Ej: Juan Pérez"
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="email">
                    Email <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    placeholder="ejemplo@correo.com"
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="telefono">
                    Teléfono <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    type="tel"
                    id="telefono"
                    name="telefono"
                    value={formData.telefono}
                    onChange={handleChange}
                    required
                    placeholder="+1-234-567-8900"
                    className="mt-2"
                  />
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="direccion">Dirección</Label>
                  <Textarea
                    id="direccion"
                    name="direccion"
                    value={formData.direccion}
                    onChange={handleChange}
                    rows="2"
                    placeholder="Calle, ciudad, código postal..."
                    className="mt-2"
                  />
                </div>
              </div>
            </div>

            {/* Información del Evento */}
            <div className="space-y-4 pt-4 border-t">
              <h3 className="text-base font-semibold">Información del Evento</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="tipo_evento">Tipo de Evento</Label>
                  <Select
                    value={formData.tipo_evento}
                    onValueChange={(value) => setFormData({ ...formData, tipo_evento: value })}
                  >
                    <SelectTrigger id="tipo_evento" className="mt-2">
                      <SelectValue placeholder="Seleccionar..." />
                    </SelectTrigger>
                    <SelectContent>
                      {tiposEvento.map((tipo) => (
                        <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="como_nos_conocio">¿Cómo nos conoció?</Label>
                  <Select
                    value={formData.como_nos_conocio}
                    onValueChange={(value) => setFormData({ ...formData, como_nos_conocio: value })}
                  >
                    <SelectTrigger id="como_nos_conocio" className="mt-2">
                      <SelectValue placeholder="Seleccionar..." />
                    </SelectTrigger>
                    <SelectContent>
                      {fuentesConocimiento.map((fuente) => (
                        <SelectItem key={fuente} value={fuente}>{fuente}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Error Message */}
            {mutation.isError && (
              <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-red-800 dark:text-red-300 text-sm">
                  {mutation.error.response?.data?.message || 'Error al crear cliente'}
                </p>
              </div>
            )}
          </form>
        </div>

        {/* Botones fijos en el footer */}
        <div className="flex gap-3 p-6 border-t bg-muted/30">
          <Button
            type="submit"
            form="cliente-form"
            disabled={mutation.isPending}
            className="flex-1"
          >
            {mutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Guardar Cliente
              </>
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={mutation.isPending}
          >
            Cancelar
          </Button>
        </div>
      </div>
    </div>
  );
}

export default ModalCrearCliente;
