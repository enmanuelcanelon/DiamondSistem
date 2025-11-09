import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Package, AlertTriangle, Warehouse, Building2, Search, Edit2, Save, X, Filter, RefreshCw, ArrowRightLeft, Truck, CheckSquare } from 'lucide-react';
import api from '@shared/config/api';
import toast from 'react-hot-toast';

function DashboardInventario() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategoria, setFilterCategoria] = useState('');
  const [filterBajoStock, setFilterBajoStock] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [editCantidad, setEditCantidad] = useState('');
  const [showTransferencia, setShowTransferencia] = useState(null);
  const [transferData, setTransferData] = useState({ cantidad: '', salon_id: '', motivo: '' });
  const [showAbastecimiento, setShowAbastecimiento] = useState(null);
  const [itemsSeleccionados, setItemsSeleccionados] = useState({});

  // Query para inventario central
  const { data: inventarioCentral, isLoading: loadingCentral } = useQuery({
    queryKey: ['inventario-central'],
    queryFn: async () => {
      const response = await api.get('/inventario/central');
      return response.data;
    }
  });

  // Query para inventario por salones
  const { data: inventarioSalones, isLoading: loadingSalones } = useQuery({
    queryKey: ['inventario-salones'],
    queryFn: async () => {
      const response = await api.get('/inventario/salones');
      return response.data;
    }
  });

  // Query para salones (para transferencias)
  const { data: salonesData } = useQuery({
    queryKey: ['salones'],
    queryFn: async () => {
      const response = await api.get('/salones');
      return response.data;
    }
  });

  // Mutation para actualizar inventario central
  const updateInventarioMutation = useMutation({
    mutationFn: async ({ itemId, cantidad }) => {
      const response = await api.put(`/inventario/central/${itemId}`, {
        cantidad_actual: parseFloat(cantidad)
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['inventario-central']);
      toast.success('Inventario actualizado correctamente');
      setEditingItem(null);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Error al actualizar inventario');
    }
  });

  // Mutation para transferir inventario
  const transferirMutation = useMutation({
    mutationFn: async ({ item_id, salon_id, cantidad, motivo }) => {
      const response = await api.post('/inventario/transferencia', {
        item_id,
        salon_id,
        cantidad: parseFloat(cantidad),
        motivo
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['inventario-central']);
      queryClient.invalidateQueries(['inventario-salones']);
      toast.success('Transferencia realizada correctamente');
      setShowTransferencia(null);
      setTransferData({ cantidad: '', salon_id: '', motivo: '' });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Error al transferir inventario');
    }
  });

  // Mutation para abastecimiento masivo
  const abastecerMutation = useMutation({
    mutationFn: async ({ salon_id, items, motivo }) => {
      const response = await api.post('/inventario/abastecer-salon', {
        salon_id,
        items: items.map(item => ({
          item_id: item.item_id,
          cantidad: parseFloat(item.cantidad)
        })),
        motivo
      });
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(['inventario-central']);
      queryClient.invalidateQueries(['inventario-salones']);
      toast.success(`Abastecimiento completado: ${data.transferencias?.length || 0} items transferidos`);
      setShowAbastecimiento(null);
      setItemsSeleccionados({});
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Error al abastecer salón');
    }
  });

  if (loadingCentral || loadingSalones) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Cargando...</div>
      </div>
    );
  }

  const itemsBajoStock = inventarioCentral?.inventario?.filter(item => item.necesita_reposicion) || [];

  // Filtrar items
  let itemsFiltrados = inventarioCentral?.inventario || [];
  
  if (searchTerm) {
    itemsFiltrados = itemsFiltrados.filter(item =>
      item.inventario_items?.nombre?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }
  
  if (filterCategoria) {
    itemsFiltrados = itemsFiltrados.filter(item =>
      item.inventario_items?.categoria === filterCategoria
    );
  }
  
  if (filterBajoStock) {
    itemsFiltrados = itemsFiltrados.filter(item => item.necesita_reposicion);
  }

  // Obtener categorías únicas
  const categorias = [...new Set(inventarioCentral?.inventario?.map(item => item.inventario_items?.categoria).filter(Boolean))];

  const handleEdit = (item) => {
    setEditingItem(item.item_id);
    setEditCantidad(item.cantidad_actual.toString());
  };

  const handleSave = (itemId) => {
    if (!editCantidad || parseFloat(editCantidad) < 0) {
      toast.error('La cantidad debe ser un número válido mayor o igual a 0');
      return;
    }
    updateInventarioMutation.mutate({ itemId, cantidad: editCantidad });
  };

  const handleTransferir = (item) => {
    if (!transferData.cantidad || !transferData.salon_id) {
      toast.error('Completa todos los campos requeridos');
      return;
    }
    transferirMutation.mutate({
      item_id: item.item_id,
      salon_id: transferData.salon_id,
      cantidad: transferData.cantidad,
      motivo: transferData.motivo || 'Transferencia manual'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard de Inventario</h1>
          <p className="text-gray-600 mt-1">Gestión de inventario central y por salón</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowAbastecimiento({})}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
          >
            <Truck className="w-4 h-4" />
            Abastecer Salón
          </button>
          <button
            onClick={() => {
              queryClient.invalidateQueries(['inventario-central']);
              queryClient.invalidateQueries(['inventario-salones']);
              toast.success('Datos actualizados');
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <RefreshCw className="w-4 h-4" />
            Actualizar
          </button>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Items en Almacén Central</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {inventarioCentral?.total_items || 0}
              </p>
            </div>
            <Warehouse className="w-12 h-12 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Items Bajo Stock</p>
              <p className="text-2xl font-bold text-red-600 mt-1">
                {itemsBajoStock.length}
              </p>
            </div>
            <AlertTriangle className="w-12 h-12 text-red-600" />
          </div>
        </div>
      </div>

      {/* Inventario Central */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Inventario Central</h2>
              <p className="text-sm text-gray-600 mt-1">Almacén central con todos los items ({itemsFiltrados.length} items)</p>
            </div>
          </div>

          {/* Filtros y Búsqueda */}
          <div className="mt-4 flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar item..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <select
              value={filterCategoria}
              onChange={(e) => setFilterCategoria(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Todas las categorías</option>
              {categorias.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <label className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="checkbox"
                checked={filterBajoStock}
                onChange={(e) => setFilterBajoStock(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm">Solo bajo stock</span>
            </label>
          </div>
        </div>
        <div className="p-6">
          {itemsFiltrados.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Item
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Categoría
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cantidad Actual
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cantidad Mínima
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {itemsFiltrados.map((item) => (
                    <tr key={item.item_id} className={item.necesita_reposicion ? 'bg-red-50' : ''}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {item.inventario_items?.nombre}
                        </div>
                        <div className="text-sm text-gray-500">
                          {item.inventario_items?.unidad_medida}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.inventario_items?.categoria || 'Sin categoría'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {editingItem === item.item_id ? (
                          <input
                            type="number"
                            value={editCantidad}
                            onChange={(e) => setEditCantidad(e.target.value)}
                            min="0"
                            step="0.01"
                            className="w-24 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                            autoFocus
                          />
                        ) : (
                          <span className="text-sm text-gray-900">
                            {parseFloat(item.cantidad_actual).toFixed(2)}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {parseFloat(item.cantidad_minima || 20).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {item.necesita_reposicion ? (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                            Bajo Stock
                          </span>
                        ) : (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            OK
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {editingItem === item.item_id ? (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleSave(item.item_id)}
                              className="text-green-600 hover:text-green-700"
                              disabled={updateInventarioMutation.isPending}
                            >
                              <Save className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setEditingItem(null);
                                setEditCantidad('');
                              }}
                              className="text-red-600 hover:text-red-700"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleEdit(item)}
                              className="text-blue-600 hover:text-blue-700"
                              title="Editar cantidad"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setShowTransferencia(item)}
                              className="text-purple-600 hover:text-purple-700"
                              title="Transferir a salón"
                            >
                              <ArrowRightLeft className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No hay items que coincidan con los filtros
            </div>
          )}
        </div>
      </div>

      {/* Modal de Transferencia */}
      {showTransferencia && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Transferir: {showTransferencia.inventario_items?.nombre}
              </h3>
              <button
                onClick={() => {
                  setShowTransferencia(null);
                  setTransferData({ cantidad: '', salon_id: '', motivo: '' });
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cantidad Disponible: {parseFloat(showTransferencia.cantidad_actual).toFixed(2)} {showTransferencia.inventario_items?.unidad_medida}
                </label>
                <input
                  type="number"
                  placeholder="Cantidad a transferir"
                  value={transferData.cantidad}
                  onChange={(e) => setTransferData({ ...transferData, cantidad: e.target.value })}
                  min="0"
                  max={showTransferencia.cantidad_actual}
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Salón Destino
                </label>
                <select
                  value={transferData.salon_id}
                  onChange={(e) => setTransferData({ ...transferData, salon_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Selecciona un salón</option>
                  {salonesData?.salones?.map(salon => (
                    <option key={salon.id} value={salon.id}>{salon.nombre}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Motivo (opcional)
                </label>
                <input
                  type="text"
                  placeholder="Motivo de la transferencia"
                  value={transferData.motivo}
                  onChange={(e) => setTransferData({ ...transferData, motivo: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => handleTransferir(showTransferencia)}
                  disabled={transferirMutation.isPending || !transferData.cantidad || !transferData.salon_id}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {transferirMutation.isPending ? 'Transferiendo...' : 'Transferir'}
                </button>
                <button
                  onClick={() => {
                    setShowTransferencia(null);
                    setTransferData({ cantidad: '', salon_id: '', motivo: '' });
                  }}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Abastecimiento Masivo */}
      {showAbastecimiento && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Abastecer Salón</h3>
              <button
                onClick={() => {
                  setShowAbastecimiento(null);
                  setItemsSeleccionados({});
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Salón Destino
                </label>
                <select
                  value={showAbastecimiento.salon_id || ''}
                  onChange={(e) => setShowAbastecimiento({ ...showAbastecimiento, salon_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Selecciona un salón</option>
                  {salonesData?.salones?.map(salon => (
                    <option key={salon.id} value={salon.id}>{salon.nombre}</option>
                  ))}
                </select>
              </div>

              {showAbastecimiento.salon_id && (
                <>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Seleccionar Items del Almacén Central
                      </label>
                      <div className="flex items-center gap-3">
                        {Object.keys(itemsSeleccionados).length > 0 && (
                          <div className="flex items-center gap-2">
                            <label className="text-sm text-gray-600">Cantidad para todos:</label>
                            <input
                              type="number"
                              placeholder="50"
                              min="0"
                              step="0.01"
                              onChange={(e) => {
                                const cantidad = parseFloat(e.target.value) || 0;
                                const nuevosSeleccionados = {};
                                Object.keys(itemsSeleccionados).forEach(itemId => {
                                  const item = itemsFiltrados.find(i => i.item_id === parseInt(itemId));
                                  if (item) {
                                    const cantidadDisponible = parseFloat(item.cantidad_actual);
                                    nuevosSeleccionados[itemId] = {
                                      item_id: parseInt(itemId),
                                      cantidad: Math.min(cantidad, cantidadDisponible)
                                    };
                                  }
                                });
                                setItemsSeleccionados(nuevosSeleccionados);
                              }}
                              className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                            />
                          </div>
                        )}
                        {(() => {
                          // Verificar si todos los items disponibles están seleccionados
                          const itemsConStock = itemsFiltrados.filter(item => parseFloat(item.cantidad_actual) > 0);
                          const todosSeleccionados = itemsConStock.every(item => itemsSeleccionados[item.item_id]);
                          const haySeleccionados = Object.keys(itemsSeleccionados).length > 0;

                          if (todosSeleccionados && haySeleccionados) {
                            // Si todos están seleccionados, mostrar botón para deseleccionar
                            return (
                              <button
                                onClick={() => setItemsSeleccionados({})}
                                className="text-sm text-red-600 hover:text-red-700 font-medium"
                              >
                                Deseleccionar Todos
                              </button>
                            );
                          } else {
                            // Si no todos están seleccionados, mostrar botón para seleccionar
                            return (
                              <button
                                onClick={() => {
                                  const todosSeleccionados = {};
                                  itemsFiltrados.forEach(item => {
                                    const cantidadDisponible = parseFloat(item.cantidad_actual);
                                    if (cantidadDisponible > 0) {
                                      todosSeleccionados[item.item_id] = {
                                        item_id: item.item_id,
                                        cantidad: Math.min(50, cantidadDisponible) // Cantidad por defecto: 50 o lo disponible
                                      };
                                    }
                                  });
                                  setItemsSeleccionados(todosSeleccionados);
                                }}
                                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                              >
                                Seleccionar Todos
                              </button>
                            );
                          }
                        })()}
                      </div>
                    </div>
                    <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg">
                      <table className="min-w-full text-sm">
                        <thead className="bg-gray-50 sticky top-0">
                          <tr>
                            <th className="px-3 py-2 text-left">
                              <CheckSquare className="w-4 h-4 inline" />
                            </th>
                            <th className="px-3 py-2 text-left">Item</th>
                            <th className="px-3 py-2 text-left">Disponible</th>
                            <th className="px-3 py-2 text-left">Cantidad a Transferir</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {itemsFiltrados.map((item) => {
                            const cantidadDisponible = parseFloat(item.cantidad_actual);
                            const estaSeleccionado = itemsSeleccionados[item.item_id];
                            return (
                              <tr key={item.item_id} className={estaSeleccionado ? 'bg-blue-50' : ''}>
                                <td className="px-3 py-2">
                                  <input
                                    type="checkbox"
                                    checked={!!estaSeleccionado}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setItemsSeleccionados({
                                          ...itemsSeleccionados,
                                          [item.item_id]: { item_id: item.item_id, cantidad: 50 }
                                        });
                                      } else {
                                        const nuevos = { ...itemsSeleccionados };
                                        delete nuevos[item.item_id];
                                        setItemsSeleccionados(nuevos);
                                      }
                                    }}
                                    className="rounded"
                                  />
                                </td>
                                <td className="px-3 py-2">
                                  <div className="font-medium">{item.inventario_items?.nombre}</div>
                                  <div className="text-xs text-gray-500">{item.inventario_items?.unidad_medida}</div>
                                </td>
                                <td className="px-3 py-2">{cantidadDisponible.toFixed(2)}</td>
                                <td className="px-3 py-2">
                                  {estaSeleccionado && (
                                    <input
                                      type="number"
                                      value={itemsSeleccionados[item.item_id]?.cantidad || ''}
                                      onChange={(e) => {
                                        const cantidad = parseFloat(e.target.value) || 0;
                                        if (cantidad >= 0 && cantidad <= cantidadDisponible) {
                                          setItemsSeleccionados({
                                            ...itemsSeleccionados,
                                            [item.item_id]: { item_id: item.item_id, cantidad }
                                          });
                                        }
                                      }}
                                      min="0"
                                      max={cantidadDisponible}
                                      step="0.01"
                                      className="w-24 px-2 py-1 border border-gray-300 rounded"
                                    />
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Motivo (opcional)
                    </label>
                    <input
                      type="text"
                      placeholder="Motivo del abastecimiento"
                      value={showAbastecimiento.motivo || ''}
                      onChange={(e) => setShowAbastecimiento({ ...showAbastecimiento, motivo: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={() => {
                        const items = Object.values(itemsSeleccionados).filter(item => item.cantidad > 0);
                        if (items.length === 0) {
                          toast.error('Selecciona al menos un item con cantidad mayor a 0');
                          return;
                        }
                        abastecerMutation.mutate({
                          salon_id: showAbastecimiento.salon_id,
                          items,
                          motivo: showAbastecimiento.motivo || 'Abastecimiento masivo desde almacén central'
                        });
                      }}
                      disabled={abastecerMutation.isPending || Object.keys(itemsSeleccionados).length === 0}
                      className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {abastecerMutation.isPending ? 'Abasteciendo...' : `Abastecer (${Object.keys(itemsSeleccionados).length} items)`}
                    </button>
                    <button
                      onClick={() => {
                        setShowAbastecimiento(null);
                        setItemsSeleccionados({});
                      }}
                      className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300"
                    >
                      Cancelar
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DashboardInventario;
