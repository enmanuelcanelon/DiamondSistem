import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../config/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Label } from '../components/ui/label';
import toast from 'react-hot-toast';

function CrearCliente() {
  const navigate = useNavigate();
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
    onSuccess: () => {
      queryClient.invalidateQueries(['clientes']);
      toast.success('Cliente creado exitosamente');
      navigate('/clientes');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Error al crear cliente');
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

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/clientes">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Nuevo Cliente</h2>
          <p className="text-muted-foreground">
            Completa la información del cliente
          </p>
        </div>
      </div>

      {/* Formulario */}
      <form onSubmit={handleSubmit} className="max-w-3xl">
        <Card>
          <CardContent className="pt-6 space-y-6">
          {/* Información Personal */}
          <div>
            <CardHeader className="px-0 pt-0">
              <CardTitle>Información Personal</CardTitle>
            </CardHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="nombre_completo">
                  Nombre Completo *
                </Label>
                <Input
                  type="text"
                  id="nombre_completo"
                  name="nombre_completo"
                  value={formData.nombre_completo}
                  onChange={handleChange}
                  required
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="email">
                  Email *
                </Label>
                <Input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="telefono">
                  Teléfono *
                </Label>
                <Input
                  type="tel"
                  id="telefono"
                  name="telefono"
                  value={formData.telefono}
                  onChange={handleChange}
                  required
                  className="mt-2"
                />
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="direccion">
                  Dirección
                </Label>
                <Textarea
                  id="direccion"
                  name="direccion"
                  value={formData.direccion}
                  onChange={handleChange}
                  rows="2"
                  className="mt-2"
                />
              </div>
            </div>
          </div>

          {/* Información del Evento */}
          <div className="pt-6 border-t">
            <CardHeader className="px-0 pt-0">
              <CardTitle>Información del Evento</CardTitle>
            </CardHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="tipo_evento">
                  Tipo de Evento
                </Label>
                <Select 
                  value={formData.tipo_evento} 
                  onValueChange={(value) => setFormData({ ...formData, tipo_evento: value })}
                >
                  <SelectTrigger className="mt-2">
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
                <Label htmlFor="como_nos_conocio">
                  ¿Cómo nos conoció?
                </Label>
                <Select 
                  value={formData.como_nos_conocio} 
                  onValueChange={(value) => setFormData({ ...formData, como_nos_conocio: value })}
                >
                  <SelectTrigger className="mt-2">
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

          {/* Botones */}
          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={mutation.isPending}
              className="flex-1"
            >
              {mutation.isPending ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5 mr-2" />
                  Guardar Cliente
                </>
              )}
            </Button>
            <Button variant="outline" asChild>
              <Link to="/clientes">
                Cancelar
              </Link>
            </Button>
          </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}

export default CrearCliente;





