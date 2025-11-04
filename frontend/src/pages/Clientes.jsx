import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Mail, Phone, Calendar, Users, Edit2, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../config/api';

function Clientes() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  
  const { data: clientes, isLoading } = useQuery({
    queryKey: ['clientes'],
    queryFn: async () => {
      const response = await api.get('/clientes');
      return response.data.clientes;
    },
  });

  // Filtrar clientes por búsqueda
  const clientesFiltrados = clientes?.filter(cliente => {
    const searchLower = searchTerm.toLowerCase();
    return (
      cliente.nombre_completo.toLowerCase().includes(searchLower) ||
      cliente.email.toLowerCase().includes(searchLower)
    );
  });

  // Mutation para eliminar cliente
  const eliminarMutation = useMutation({
    mutationFn: async (clienteId) => {
      await api.delete(`/clientes/${clienteId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['clientes']);
      alert('Cliente eliminado exitosamente');
    },
    onError: (error) => {
      alert(error.response?.data?.message || 'Error al eliminar cliente');
    },
  });

  const handleEliminar = (clienteId, nombreCliente) => {
    if (window.confirm(`¿Estás seguro de eliminar a ${nombreCliente}?`)) {
      eliminarMutation.mutate(clienteId);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Clientes</h1>
          <p className="text-gray-600 mt-1">Gestiona tu cartera de clientes</p>
        </div>
        <Link
          to="/clientes/nuevo"
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
        >
          <Plus className="w-5 h-5" />
          Nuevo Cliente
        </Link>
      </div>

      {/* Búsqueda */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar por nombre o email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
          />
        </div>
      </div>

      {/* Lista de clientes */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl p-6 shadow-sm border animate-pulse">
              <div className="h-6 bg-gray-200 rounded mb-3"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      ) : clientesFiltrados?.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center shadow-sm border">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {searchTerm ? 'No se encontraron clientes' : 'No hay clientes'}
          </h3>
          <p className="text-gray-600 mb-6">
            {searchTerm ? 'Intenta con otro término de búsqueda' : 'Comienza agregando tu primer cliente'}
          </p>
          {!searchTerm && (
            <Link
              to="/clientes/nuevo"
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
            >
              <Plus className="w-5 h-5" />
              Crear Primer Cliente
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {clientesFiltrados?.map((cliente) => (
            <div
              key={cliente.id}
              className="bg-white rounded-xl p-6 shadow-sm border hover:shadow-md transition group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                  <span className="text-indigo-600 font-semibold text-lg">
                    {cliente.nombre_completo.charAt(0)}
                  </span>
                </div>
                <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full">
                  {cliente.tipo_evento || 'General'}
                </span>
              </div>

              <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-indigo-600 transition">
                {cliente.nombre_completo}
              </h3>

              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  <span className="truncate">{cliente.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  <span>{cliente.telefono}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>{new Date(cliente.fecha_registro).toLocaleDateString('es-ES')}</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t">
                <div className="flex items-center justify-between mb-3">
                  <Link
                    to={`/contratos?cliente_id=${cliente.id}`}
                    className="text-xs text-gray-500 hover:text-indigo-600 hover:underline transition cursor-pointer"
                    title={`Ver contratos de ${cliente.nombre_completo}`}
                  >
                    {cliente._count?.contratos || 0} contrato{(cliente._count?.contratos || 0) !== 1 ? 's' : ''}
                  </Link>
                  <Link
                    to={`/ofertas/nueva?cliente_id=${cliente.id}`}
                    className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                  >
                    Crear Oferta →
                  </Link>
                </div>
                <div className="flex gap-2">
                  <Link
                    to={`/clientes/editar/${cliente.id}`}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition text-sm"
                  >
                    <Edit2 className="w-4 h-4" />
                    Editar
                  </Link>
                  <button
                    onClick={() => handleEliminar(cliente.id, cliente.nombre_completo)}
                    disabled={eliminarMutation.isPending}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition text-sm disabled:opacity-50"
                  >
                    <Trash2 className="w-4 h-4" />
                    Eliminar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Clientes;

