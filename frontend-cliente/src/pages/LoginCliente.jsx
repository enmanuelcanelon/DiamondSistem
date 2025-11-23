import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Lock, Calendar } from 'lucide-react';
import useAuthStore from '@shared/store/useAuthStore';
import api from '@shared/config/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

function LoginCliente() {
  const navigate = useNavigate();
  const { loginWithToken } = useAuthStore();
  const [codigoAcceso, setCodigoAcceso] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.post('/auth/login/cliente', {
        codigo_acceso: codigoAcceso.trim(),
      });

      const { token, user, contrato } = response.data;

      // Guardar en el store
      loginWithToken(token, {
        ...user,
        tipo: 'cliente',
        contrato_id: contrato.id,
        codigo_contrato: contrato.codigo_contrato,
      });

      // Redirigir al portal del cliente
      navigate('/dashboard');
    } catch (err) {
      console.error('Error al iniciar sesión:', err);
      setError(
        err.response?.data?.message ||
        'Código de acceso inválido. Por favor, verifica e intenta nuevamente.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo/Header */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="bg-primary p-5 rounded-2xl shadow-md">
              <Calendar className="w-12 h-12 text-primary-foreground" />
            </div>
          </div>
          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tight">
              Portal del Cliente
            </h1>
            <p className="text-muted-foreground text-lg">
              Accede a los detalles de tu evento especial
            </p>
          </div>
        </div>

        {/* Login Form */}
        <Card className="shadow-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold">Iniciar Sesión</CardTitle>
            <CardDescription>
              Ingresa tu código de acceso para continuar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="codigo_acceso">Código de Acceso</Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <Input
                    id="codigo_acceso"
                    type="text"
                    value={codigoAcceso}
                    onChange={(e) => setCodigoAcceso(e.target.value)}
                    placeholder="Ingresa tu código único"
                    required
                    className="pl-10 h-11"
                    disabled={loading}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Este código fue enviado por tu asesor de eventos
                </p>
              </div>

              {error && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 text-base"
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Verificando...
                  </>
                ) : (
                  'Acceder a mi Evento'
                )}
              </Button>
            </form>

            {/* Help Text */}
            <div className="mt-6 pt-6 border-t">
              <p className="text-sm text-muted-foreground text-center">
                ¿No tienes tu código de acceso?
                <br />
                <span className="text-primary font-medium">
                  Contacta a tu asesor de eventos
                </span>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default LoginCliente;
