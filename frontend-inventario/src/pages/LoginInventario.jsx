import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, Loader2, Package, Eye, EyeOff } from 'lucide-react';
import useAuthStore from '@shared/store/useAuthStore';
import toast from 'react-hot-toast';

function LoginInventario() {
  const navigate = useNavigate();
  const { loginInventario, isLoading } = useAuthStore();
  const [formData, setFormData] = useState({
    codigo_usuario: '',
    password: '',
  });
  const [mostrarPassword, setMostrarPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const result = await loginInventario(formData.codigo_usuario, formData.password);
    
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo y Título */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-blue-600 p-4 rounded-2xl shadow-lg">
              <Package className="w-12 h-12 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">DiamondSistem</h1>
          <p className="text-gray-600">Sistema de Inventario</p>
        </div>

        {/* Formulario */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Iniciar Sesión</h2>
            <p className="text-gray-600 text-sm">Ingresa tus credenciales de inventario</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="codigo_usuario" className="block text-sm font-medium text-gray-700 mb-2">
                Código de Usuario
              </label>
              <input
                type="text"
                id="codigo_usuario"
                name="codigo_usuario"
                value={formData.codigo_usuario}
                onChange={handleChange}
                placeholder="INV001"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Contraseña
              </label>
              <div className="relative">
                <input
                  type={mostrarPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  required
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                />
                <button
                  type="button"
                  onClick={() => setMostrarPassword(!mostrarPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition"
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

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Iniciando sesión...
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5 mr-2" />
                  Iniciar Sesión
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-gray-600 mt-8">
          © 2025 DiamondSistem. Todos los derechos reservados.
        </p>
      </div>
    </div>
  );
}

export default LoginInventario;

