import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { User, Mail, Phone, MapPin, Save, Edit2 } from 'lucide-react';
import useAuthStore from '../../store/useAuthStore';
import api from '../../config/api';

function MiPerfil() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [editando, setEditando] = useState(false);
  const [formData, setFormData] = useState({
    nombre_completo: '',
    email: '',
    telefono: '',
    direccion: ''
  });

  // Obtener información del cliente
  const { data: cliente, isLoading } = useQuery({
    queryKey: ['cliente-perfil', user?.contrato_id],
    queryFn: async () => {
      const response = await api.get(`/contratos/${user?.contrato_id}`);
      const contrato = response.data.contrato;
      // Actualizar formData con los datos del cliente
      if (contrato.clientes) {
        setFormData({
          nombre_completo: contrato.clientes.nombre_completo || '',
          email: contrato.clientes.email || '',
          telefono: contrato.clientes.telefono || '',
          direccion: contrato.clientes.direccion || ''
        });
      }
      return contrato.clientes;
    },
    enabled: !!user?.contrato_id,
  });

  // Mutation para actualizar información
  const actualizarMutation = useMutation({
    mutationFn: async (datos) => {
      const response = await api.put(`/clientes/${cliente.id}`, datos);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['cliente-perfil']);
      setEditando(false);
      alert('✅ Información actualizada correctamente');
    },
    onError: (error) => {
      alert('❌ Error al actualizar: ' + (error.response?.data?.message || 'Error desconocido'));
    },
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (window.confirm('¿Confirmas que deseas actualizar tu información de contacto?')) {
      actualizarMutation.mutate(formData);
    }
  };

  const handleCancelar = () => {
    // Restaurar datos originales
    if (cliente) {
      setFormData({
        nombre_completo: cliente.nombre_completo || '',
        email: cliente.email || '',
        telefono: cliente.telefono || '',
        direccion: cliente.direccion || ''
      });
    }
    setEditando(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          <p className="mt-4 text-gray-600">Cargando perfil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Mi Perfil</h1>
              <p className="text-sm text-gray-600">Gestiona tu información de contacto</p>
            </div>
          </div>
          {!editando && (
            <button
              onClick={() => setEditando(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium"
            >
              <Edit2 className="w-4 h-4" />
              Editar
            </button>
          )}
        </div>
      </div>

      {/* Formulario */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Nombre Completo */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <User className="w-4 h-4" />
              Nombre Completo
            </label>
            <input
              type="text"
              name="nombre_completo"
              value={formData.nombre_completo}
              onChange={handleChange}
              disabled={!editando}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition ${
                editando ? 'bg-white border-gray-300' : 'bg-gray-50 border-gray-200 text-gray-600'
              }`}
              placeholder="Tu nombre completo"
              required
            />
          </div>

          {/* Email */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <Mail className="w-4 h-4" />
              Correo Electrónico
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              disabled={!editando}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition ${
                editando ? 'bg-white border-gray-300' : 'bg-gray-50 border-gray-200 text-gray-600'
              }`}
              placeholder="tu@email.com"
              required
            />
          </div>

          {/* Teléfono */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <Phone className="w-4 h-4" />
              Teléfono
            </label>
            <input
              type="tel"
              name="telefono"
              value={formData.telefono}
              onChange={handleChange}
              disabled={!editando}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition ${
                editando ? 'bg-white border-gray-300' : 'bg-gray-50 border-gray-200 text-gray-600'
              }`}
              placeholder="+1 (555) 000-0000"
              required
            />
          </div>

          {/* Dirección */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <MapPin className="w-4 h-4" />
              Dirección
            </label>
            <textarea
              name="direccion"
              value={formData.direccion}
              onChange={handleChange}
              disabled={!editando}
              rows="3"
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition resize-none ${
                editando ? 'bg-white border-gray-300' : 'bg-gray-50 border-gray-200 text-gray-600'
              }`}
              placeholder="Calle, Ciudad, Estado, Código Postal"
            />
          </div>

          {/* Botones */}
          {editando && (
            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={actualizarMutation.isPending}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-5 h-5" />
                {actualizarMutation.isPending ? 'Guardando...' : 'Guardar Cambios'}
              </button>
              <button
                type="button"
                onClick={handleCancelar}
                disabled={actualizarMutation.isPending}
                className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancelar
              </button>
            </div>
          )}
        </form>

        {/* Información adicional */}
        {!editando && (
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              💡 <strong>Tip:</strong> Mantén tu información actualizada para que podamos contactarte fácilmente sobre tu evento.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default MiPerfil;

