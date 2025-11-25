import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, Loader2, Diamond, Eye, EyeOff, AlertCircle } from 'lucide-react';
import useAuthStore from '../store/useAuthStore';
import { useLanguage } from '../contexts/LanguageContext';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';

function Login() {
  const navigate = useNavigate();
  const { login, isLoading, error } = useAuthStore();
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    codigo_vendedor: '',
    password: '',
  });
  const [mostrarPassword, setMostrarPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await login(formData.codigo_vendedor, formData.password);
    if (result.success) {
      navigate('/');
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md space-y-8">
        {/* Logo y Título */}
        <div className="flex flex-col items-center space-y-4">
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary text-primary-foreground shadow-lg">
            <Diamond className="w-8 h-8" />
          </div>
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">Party Venue</h1>
            <p className="text-muted-foreground">Generador de Contratos</p>
          </div>
        </div>

        {/* Formulario */}
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-semibold tracking-tight">{t('login.title')}</CardTitle>
            <CardDescription>
              {t('login.title')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-4 p-3 rounded-md bg-destructive/10 border border-destructive/20 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="codigo_vendedor">{t('login.email')}</Label>
                <Input
                  id="codigo_vendedor"
                  name="codigo_vendedor"
                  type="text"
                  placeholder={t('login.email')}
                  value={formData.codigo_vendedor}
                  onChange={handleChange}
                  required
                  autoComplete="username"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">{t('login.password')}</Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={mostrarPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    autoComplete="current-password"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarPassword(!mostrarPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    title={mostrarPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  >
                    {mostrarPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
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
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Iniciando sesión...
                  </>
                ) : (
                  <>
                    <LogIn className="mr-2 h-4 w-4" />
                    {t('login.login')}
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-sm text-muted-foreground">
          © 2025 Party Venue. Todos los derechos reservados.
        </p>
      </div>
    </div>
  );
}

export default Login;



