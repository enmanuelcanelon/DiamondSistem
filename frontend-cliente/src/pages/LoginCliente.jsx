import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Lock, Calendar } from 'lucide-react';
import useAuthStore from '@shared/store/useAuthStore';
import api from '@shared/config/api';

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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Header Minimalista */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-900 rounded-xl mb-4">
            <Calendar className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">
            Portal del Cliente
          </h1>
          <p className="text-sm text-gray-600">
            Accede a los detalles de tu evento especial
          </p>
        </div>

        {/* Login Form Minimalista */}
        <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="codigo_acceso"
                className="block text-sm font-medium text-gray-900 mb-2"
              >
                Código de Acceso
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="codigo_acceso"
                  type="text"
                  value={codigoAcceso}
                  onChange={(e) => setCodigoAcceso(e.target.value)}
                  placeholder="Ingresa tu código único"
                  required
                  className="input pl-10"
                  disabled={loading}
                />
              </div>
              <p className="mt-2 text-xs text-gray-500">
                Este código fue enviado por tu asesor de eventos
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Verificando...
                </>
              ) : (
                'Acceder a mi Evento'
              )}
            </button>
          </form>

          {/* Help Text */}
          <div className="mt-6 pt-6 border-t border-gray-100">
            <p className="text-xs text-gray-600 text-center">
              ¿No tienes tu código de acceso?
              <br />
              <span className="text-gray-900 font-medium">
                Contacta a tu asesor de eventos
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginCliente;

