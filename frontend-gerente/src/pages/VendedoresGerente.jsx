import { useState } from 'react';
import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Key, UserCheck, UserX, Loader2, AlertCircle, X, Save, ChevronDown, ChevronUp, DollarSign, Trash2 } from 'lucide-react';
import api from '@shared/config/api';
import toast from 'react-hot-toast';

function VendedoresGerente() {
  const queryClient = useQueryClient();
  const [mostrarModal, setMostrarModal] = useState(false);
  const [vendedorEditando, setVendedorEditando] = useState(null);
  const [mostrarModalPassword, setMostrarModalPassword] = useState(false);
  const [vendedoresExpandidos, setVendedoresExpandidos] = useState({});
  const [vendedorAEliminar, setVendedorAEliminar] = useState(null);
  const [formData, setFormData] = useState({
    nombre_completo: '',
    email: '',
    telefono: '',
    password: '',
    comision_porcentaje: 3.00
  });

  const { data: vendedoresData, isLoading } = useQuery({
    queryKey: ['gerente-vendedores'],
    queryFn: async () => {
      const response = await api.get('/gerentes/vendedores');
      return response.data.vendedores;
    },
  });

  const crearVendedorMutation = useMutation({
    mutationFn: async (data) => {
      return api.post('/gerentes/vendedores', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['gerente-vendedores']);
      toast.success('Vendedor creado exitosamente');
      setMostrarModal(false);
      setFormData({
        nombre_completo: '',
        email: '',
        telefono: '',
        password: '',
        comision_porcentaje: 3.00
      });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Error al crear vendedor');
    },
  });

  const actualizarVendedorMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      return api.put(`/gerentes/vendedores/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['gerente-vendedores']);
      toast.success('Vendedor actualizado exitosamente');
      setMostrarModal(false);
      setVendedorEditando(null);
      setFormData({
        nombre_completo: '',
        email: '',
        telefono: '',
        password: '',
        comision_porcentaje: 3.00
      });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Error al actualizar vendedor');
    },
  });

  const cambiarPasswordMutation = useMutation({
    mutationFn: async ({ id, password }) => {
      return api.put(`/gerentes/vendedores/${id}/password`, { password });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['gerente-vendedores']);
      toast.success('Contraseña actualizada exitosamente');
      setMostrarModalPassword(false);
      setVendedorEditando(null);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Error al cambiar contraseña');
    },
  });

  const eliminarVendedorMutation = useMutation({
    mutationFn: async (id) => {
      return api.delete(`/gerentes/vendedores/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['gerente-vendedores']);
      queryClient.invalidateQueries(['gerente-dashboard']);
      toast.success('Vendedor eliminado exitosamente');
      setVendedorAEliminar(null);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Error al eliminar vendedor');
    },
  });

  const handleCrear = () => {
    setVendedorEditando(null);
    setFormData({
      nombre_completo: '',
      email: '',
      telefono: '',
      password: '',
      comision_porcentaje: 3.00
    });
    setMostrarModal(true);
  };

  const handleEditar = (vendedor) => {
    setVendedorEditando(vendedor);
    setFormData({
      nombre_completo: vendedor.nombre_completo,
      email: vendedor.email,
      telefono: vendedor.telefono || '',
      password: '',
      comision_porcentaje: parseFloat(vendedor.comision_porcentaje) || 3.00
    });
    setMostrarModal(true);
  };

  const handleCambiarPassword = (vendedor) => {
    setVendedorEditando(vendedor);
    setFormData({ password: '' });
    setMostrarModalPassword(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (vendedorEditando) {
      const { password, ...data } = formData;
      actualizarVendedorMutation.mutate({
        id: vendedorEditando.id,
        data
      });
    } else {
      crearVendedorMutation.mutate(formData);
    }
  };

  const handleCambiarPasswordSubmit = (e) => {
    e.preventDefault();
    if (formData.password) {
      cambiarPasswordMutation.mutate({
        id: vendedorEditando.id,
        password: formData.password
      });
    }
  };

  const toggleActivo = async (vendedor) => {
    try {
      await api.put(`/gerentes/vendedores/${vendedor.id}`, {
        activo: !vendedor.activo
      });
      queryClient.invalidateQueries(['gerente-vendedores']);
      toast.success(`Vendedor ${!vendedor.activo ? 'activado' : 'desactivado'}`);
    } catch (error) {
      toast.error('Error al cambiar estado del vendedor');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        <p className="ml-3 text-gray-600">Cargando vendedores...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestión de Vendedores</h1>
          <p className="text-gray-600">Crea y gestiona los vendedores del sistema</p>
        </div>
        <button
          onClick={handleCrear}
          className="flex items-center gap-2 px-4 py-2 bg-foreground text-background rounded-lg hover:bg-foreground/90 transition"
        >
          <Plus className="w-5 h-5" />
          Nuevo Vendedor
        </button>
      </div>

      {/* Lista de Vendedores */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vendedor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Teléfono
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Comisión (%)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Comisiones
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {vendedoresData?.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                    No hay vendedores registrados
                  </td>
                </tr>
              ) : (
                vendedoresData?.map((vendedor) => (
                  <React.Fragment key={vendedor.id}>
                    <tr className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{vendedor.nombre_completo}</div>
                        <div className="text-sm text-gray-500">{vendedor.codigo_vendedor}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {vendedor.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {vendedor.telefono || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {parseFloat(vendedor.comision_porcentaje || 0).toFixed(2)}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {vendedor.activo ? (
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-muted text-foreground flex items-center gap-1 w-fit">
                          <UserCheck className="w-3 h-3" />
                          Activo
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-muted/50 text-muted-foreground flex items-center gap-1 w-fit">
                          <UserX className="w-3 h-3" />
                          Inactivo
                        </span>
                      )}
                    </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => setVendedoresExpandidos(prev => ({
                            ...prev,
                            [vendedor.id]: !prev[vendedor.id]
                          }))}
                          className="flex items-center gap-2 text-sm text-foreground hover:text-muted-foreground"
                        >
                          <DollarSign className="w-4 h-4" />
                          {vendedoresExpandidos[vendedor.id] ? (
                            <>
                              <ChevronUp className="w-4 h-4" />
                              Ocultar
                            </>
                          ) : (
                            <>
                              <ChevronDown className="w-4 h-4" />
                              Ver
                            </>
                          )}
                        </button>
                      </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => handleEditar(vendedor)}
                        className="text-foreground hover:text-muted-foreground"
                        title="Editar"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleCambiarPassword(vendedor)}
                        className="text-foreground hover:text-muted-foreground"
                        title="Cambiar contraseña"
                      >
                        <Key className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => toggleActivo(vendedor)}
                        className="text-foreground hover:text-muted-foreground"
                        title={vendedor.activo ? "Desactivar" : "Activar"}
                      >
                        {vendedor.activo ? <UserX className="w-5 h-5" /> : <UserCheck className="w-5 h-5" />}
                      </button>
                        <button
                          onClick={() => setVendedorAEliminar(vendedor)}
                          className="text-foreground hover:text-muted-foreground"
                          title="Eliminar vendedor"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                    {vendedoresExpandidos[vendedor.id] && vendedor.comisiones && (
                      <tr>
                        <td colSpan="7" className="px-6 py-4 bg-gray-50">
                          <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div className="bg-white rounded-lg p-4 border border-gray-200">
                                <p className="text-xs text-gray-500 mb-1">Total Comisiones</p>
                                <p className="text-lg font-bold text-gray-900">
                                  ${parseFloat(vendedor.comisiones.total || 0).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">3% del total de contratos</p>
                              </div>
                              <div className="bg-muted/50 rounded-lg p-4 border">
                                <p className="text-xs text-muted-foreground mb-1">Desbloqueadas</p>
                                <p className="text-lg font-bold">
                                  ${parseFloat(vendedor.comisiones.desbloqueadas || 0).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">Listas para pagar</p>
                              </div>
                              <div className="bg-muted/50 rounded-lg p-4 border">
                                <p className="text-xs text-muted-foreground mb-1">Pendientes</p>
                                <p className="text-lg font-bold">
                                  ${parseFloat(vendedor.comisiones.pendientes || 0).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">Aún no desbloqueadas</p>
                              </div>
                            </div>

                            {/* Comisiones por Mes */}
                            {vendedor.comisiones.por_mes && vendedor.comisiones.por_mes.length > 0 && (
                              <div>
                                <p className="text-sm font-semibold text-gray-700 mb-2">Comisiones Desbloqueadas por Mes</p>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                  {vendedor.comisiones.por_mes.map((item, idx) => {
                                    const [anio, mes] = item.mes.split('-');
                                    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
                                    const nombreMes = meses[parseInt(mes) - 1];
                                    return (
                                      <div key={idx} className="flex items-center justify-between bg-white border border-gray-200 rounded-lg p-2">
                                        <span className="text-sm text-gray-700">{nombreMes} {anio}</span>
                                        <span className="text-sm font-semibold">
                                          ${item.total.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                    </td>
                  </tr>
                    )}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Crear/Editar */}
      {mostrarModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                {vendedorEditando ? 'Editar Vendedor' : 'Nuevo Vendedor'}
              </h2>
              <button
                onClick={() => {
                  setMostrarModal(false);
                  setVendedorEditando(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre Completo *
                </label>
                <input
                  type="text"
                  value={formData.nombre_completo}
                  onChange={(e) => setFormData({ ...formData, nombre_completo: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Teléfono
                </label>
                <input
                  type="tel"
                  value={formData.telefono}
                  onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                  className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent"
                />
              </div>
              {!vendedorEditando && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contraseña *
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required={!vendedorEditando}
                    className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent"
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Comisión (%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={formData.comision_porcentaje}
                  onChange={(e) => setFormData({ ...formData, comision_porcentaje: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setMostrarModal(false);
                    setVendedorEditando(null);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={crearVendedorMutation.isPending || actualizarVendedorMutation.isPending}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {(crearVendedorMutation.isPending || actualizarVendedorMutation.isPending) ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Guardar
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Cambiar Contraseña */}
      {mostrarModalPassword && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                Cambiar Contraseña - {vendedorEditando?.nombre_completo}
              </h2>
              <button
                onClick={() => {
                  setMostrarModalPassword(false);
                  setVendedorEditando(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCambiarPasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nueva Contraseña *
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Mínimo 8 caracteres, incluir mayúsculas, minúsculas y números
                </p>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setMostrarModalPassword(false);
                    setVendedorEditando(null);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={cambiarPasswordMutation.isPending}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {cambiarPasswordMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Actualizando...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Actualizar Contraseña
                    </>
                  )}
                </button>
              </div>
            </form>
        </div>
      </div>
      )}

      {/* Modal de Confirmación de Eliminación */}
      {vendedorAEliminar && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                Confirmar Eliminación
              </h2>
              <button
                onClick={() => setVendedorAEliminar(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    ¿Estás seguro de que deseas eliminar este vendedor?
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    {vendedorAEliminar.nombre_completo} ({vendedorAEliminar.codigo_vendedor})
                  </p>
                </div>
              </div>
              <div className="bg-muted/50 border rounded-lg p-3">
                <p className="text-xs text-muted-foreground">
                  <strong>Nota:</strong> Solo se pueden eliminar vendedores que no tengan contratos, ofertas o clientes asociados. Si el vendedor tiene datos asociados, deberás desactivarlo en su lugar.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setVendedorAEliminar(null)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  eliminarVendedorMutation.mutate(vendedorAEliminar.id);
                }}
                disabled={eliminarVendedorMutation.isPending}
                className="flex-1 px-4 py-2 bg-foreground text-background rounded-lg hover:bg-foreground/90 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {eliminarVendedorMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Eliminando...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Sí, Eliminar
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default VendedoresGerente;

