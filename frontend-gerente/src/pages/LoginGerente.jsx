import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, Loader2, Eye, EyeOff, Building2 } from 'lucide-react';
import useAuthStore from '@shared/store/useAuthStore';
import toast from 'react-hot-toast';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

function LoginGerente() {
  const navigate = useNavigate();
  const { loginGerente, isLoading } = useAuthStore();
  const [formData, setFormData] = useState({
    codigo_gerente: '',
    password: '',
  });
  const [mostrarPassword, setMostrarPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const result = await loginGerente(formData.codigo_gerente, formData.password);
    
    if (result.success) {
      toast.success('Inicio de sesión exitoso');
      navigate('/');
    } else {
      toast.error(result.error || 'Error al iniciar sesión');
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        {/* Logo y Título */}
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-muted p-4 rounded-full">
              <Building2 className="w-12 h-12 text-foreground" />
            </div>
          </div>
          <h1 className="text-3xl font-bold mb-2">DiamondSistem</h1>
          <p className="text-muted-foreground">Gerente - Gestión Completa</p>
        </div>

        {/* Formulario */}
        <Card>
          <CardHeader>
            <CardTitle>Iniciar Sesión</CardTitle>
            <CardDescription>Ingresa tus credenciales de gerente</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="codigo_gerente">Código de Gerente</Label>
                <Input
                  type="text"
                  id="codigo_gerente"
                  name="codigo_gerente"
                  value={formData.codigo_gerente}
                  onChange={handleChange}
                  placeholder="GER001"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <div className="relative">
                  <Input
                    type={mostrarPassword ? "text" : "password"}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    required
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarPassword(!mostrarPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition"
                    title={mostrarPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  >
                    {mostrarPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full"
                size="lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Iniciando sesión...
                  </>
                ) : (
                  <>
                    <LogIn className="w-5 h-5" />
                    Iniciar Sesión
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-sm text-muted-foreground">
          © 2025 DiamondSistem. Todos los derechos reservados.
        </p>
      </div>
    </div>
  );
}

export default LoginGerente;

