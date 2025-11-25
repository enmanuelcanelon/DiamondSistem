import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../config/api';
import { useLanguage } from '../contexts/LanguageContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Label } from '../components/ui/label';
import toast from 'react-hot-toast';

function CrearCliente() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    nombre_completo: '',
    email: '',
    telefono: '',
    como_nos_conocio: '',
  });
  const [comoNosConocioOtro, setComoNosConocioOtro] = useState('');

  const mutation = useMutation({
    mutationFn: async (data) => {
      const response = await api.post('/clientes', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['clientes']);
      toast.success(t('clients.createSuccess'));
      navigate('/clientes');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || t('messages.operationError'));
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const dataToSubmit = {
      ...formData,
      como_nos_conocio: formData.como_nos_conocio === 'Otro' && comoNosConocioOtro.trim() 
        ? comoNosConocioOtro.trim() 
        : formData.como_nos_conocio
    };
    mutation.mutate(dataToSubmit);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const fuentesConocimiento = [
    { value: 'Facebook', label: t('clients.sources.facebook') },
    { value: 'Instagram', label: t('clients.sources.instagram') },
    { value: 'Google', label: t('clients.sources.google') },
    { value: 'Recomendación', label: t('clients.sources.recommendation') },
    { value: 'Otro', label: t('clients.sources.other') },
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
          <h2 className="text-3xl font-bold tracking-tight">{t('clients.newClient')}</h2>
          <p className="text-muted-foreground">
            {t('clients.addFirstClient')}
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
              <CardTitle>{t('clients.personalInfo')}</CardTitle>
            </CardHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="nombre_completo">
                  {t('clients.fullName')} *
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
                  {t('clients.email')} *
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
                  {t('clients.phone')} *
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
            </div>
          </div>

          {/* Información del Evento */}
          <div className="pt-6 border-t">
            <CardHeader className="px-0 pt-0">
              <CardTitle>{t('clients.eventInfo')}</CardTitle>
            </CardHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="como_nos_conocio">
                  {t('clients.howDidYouKnow')}
                </Label>
                <Select 
                  value={formData.como_nos_conocio} 
                  onValueChange={(value) => {
                    setFormData({ ...formData, como_nos_conocio: value });
                    if (value !== 'Otro') {
                      setComoNosConocioOtro('');
                    }
                  }}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder={t('forms.select')} />
                  </SelectTrigger>
                  <SelectContent>
                    {fuentesConocimiento.map((fuente) => (
                      <SelectItem key={fuente.value} value={fuente.value}>{fuente.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formData.como_nos_conocio === 'Otro' && (
                  <Input
                    type="text"
                    value={comoNosConocioOtro}
                    onChange={(e) => setComoNosConocioOtro(e.target.value)}
                    placeholder={t('clients.specifyOther')}
                    className="mt-2"
                  />
                )}
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
                  {t('clients.savingClient')}
                </>
              ) : (
                <>
                  <Save className="w-5 h-5 mr-2" />
                  {t('clients.saveClient')}
                </>
              )}
            </Button>
            <Button variant="outline" asChild>
                <Link to="/clientes">
                {t('forms.cancel')}
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





