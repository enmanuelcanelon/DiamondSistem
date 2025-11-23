import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Lock } from 'lucide-react';
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
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-white text-black rounded-xl flex items-center justify-center font-bold text-2xl mx-auto mb-4">
            PV
          </div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Party Venue</h1>
          <p className="text-neutral-400">Accede a tu portal de eventos</p>
        </div>

        <div className="bg-neutral-900 border border-white/10 rounded-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="codigo" className="block text-sm font-medium text-white mb-2">
                Código de Acceso
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" size={18} />
                <input
                  id="codigo"
                  type="text"
                  value={codigoAcceso}
                  onChange={(e) => setCodigoAcceso(e.target.value)}
                  placeholder="Ingresa tu código de acceso"
                  className="w-full pl-10 pr-4 py-3 bg-black border border-white/10 rounded-lg text-white placeholder:text-neutral-500 focus:outline-none focus:border-white/30 transition-colors"
                  disabled={loading}
                  autoFocus
                />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !codigoAcceso.trim()}
              className="w-full py-3 bg-white text-black rounded-lg font-medium hover:bg-neutral-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Iniciando sesión...
                </>
              ) : (
                'Iniciar Sesión'
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-neutral-500 text-sm mt-6">
          ¿Necesitas ayuda? Contacta a tu asesor de eventos
        </p>
      </div>
    </div>
  );
}

export default LoginCliente;
