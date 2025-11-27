import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Building2,
  Package,
  AlertTriangle,
  Calendar,
  User,
  Calculator,
  CheckCircle,
  Edit2,
  Save,
  X,
  ArrowLeft,
  RefreshCw,
  ChevronDown,
  ArrowUp,
  Info,
  Filter,
  Trash2
} from 'lucide-react';
import api from '@shared/config/api';
import toast from 'react-hot-toast';

function SalonInventario() {
  const { salonNombre } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedContrato, setSelectedContrato] = useState(null);
  const [calculadoData, setCalculadoData] = useState(null);
  const [editingAsignacion, setEditingAsignacion] = useState(null);
  const [editData, setEditData] = useState({ cantidad_asignada: '', cantidad_utilizada: '' });
  const [categoriasExpandidas, setCategoriasExpandidas] = useState({});
  const [categoriasExpandidasCalculados, setCategoriasExpandidasCalculados] = useState({});
  const [categoriasExpandidasAsignaciones, setCategoriasExpandidasAsignaciones] = useState({});
  const [showModalAccion, setShowModalAccion] = useState(null); // 'asignacion', 'devolucion', 'retorno'
  const [contratoSeleccionadoAccion, setContratoSeleccionadoAccion] = useState(null);
  const [itemsSeleccionadosRetorno, setItemsSeleccionadosRetorno] = useState({});
  const [categoriasExpandidasRetorno, setCategoriasExpandidasRetorno] = useState({});
  const [mesSeleccionado, setMesSeleccionado] = useState(new Date().getMonth() + 1);
  const [anioSeleccionado, setAnioSeleccionado] = useState(new Date().getFullYear());

  // Normalizar nombre del salón
  const salonNombreNormalizado = salonNombre?.toLowerCase();

  // Query para obtener todos los salones y encontrar el ID correcto
  const { data: salonesData } = useQuery({
    queryKey: ['salones'],
    queryFn: async () => {
      const response = await api.get('/salones');
      return response.data;
    }
  });

  // Buscar el salón por nombre (case insensitive)
  // Primero intentar buscar en salonesData, si no existe, buscar directamente por nombre común
  let salon = salonesData?.salones?.find(s =>
    s.nombre?.toLowerCase() === salonNombreNormalizado
  );

  // Si no se encuentra, crear un objeto temporal con el ID conocido
  if (!salon && salonNombreNormalizado) {
    const salonesConocidos = {
      'diamond': { id: 1, nombre: 'Diamond' },
      'kendall': { id: 2, nombre: 'Kendall' },
      'doral': { id: 3, nombre: 'Doral' }
    };
    salon = salonesConocidos[salonNombreNormalizado];
  }

  const salonId = salon?.id;

  // Debug: verificar datos del salón
  useEffect(() => {
    if (salonesData?.salones) {
      console.log('Salones disponibles:', salonesData.salones.map(s => ({ id: s.id, nombre: s.nombre })));
      console.log('Buscando salón:', salonNombreNormalizado);
      console.log('Salón encontrado:', salon ? { id: salon.id, nombre: salon.nombre } : 'NO ENCONTRADO');
    }
  }, [salonesData, salonNombreNormalizado, salon]);


  // Query para inventario del salón
  const { data: inventarioSalon, isLoading: loadingInventario } = useQuery({
    queryKey: ['inventario-salon', salonId],
    queryFn: async () => {
      const response = await api.get(`/inventario/salones/${salonId}`);
      return response.data;
    },
    enabled: !!salonId
  });

  // Query para contratos del salón filtrados por mes y año
  const { data: contratosData, isLoading: loadingContratos } = useQuery({
    queryKey: ['contratos-salon', salonId, mesSeleccionado, anioSeleccionado],
    queryFn: async () => {
      if (!salonId) return { data: [], contratos: [] };

      // Construir URL con filtros de mes y año
      const fechaInicio = new Date(anioSeleccionado, mesSeleccionado - 1, 1);
      fechaInicio.setHours(0, 0, 0, 0);
      const fechaFin = new Date(anioSeleccionado, mesSeleccionado, 0);
      fechaFin.setHours(23, 59, 59, 999);

      // Formatear fechas para la URL - el backend espera formato YYYY-MM-DD
      // y agrega T23:59:59 automáticamente a fecha_hasta
      const fechaDesdeStr = fechaInicio.toISOString().split('T')[0];
      const fechaHastaStr = fechaFin.toISOString().split('T')[0];

      const url = `/contratos?salon_id=${salonId}&estado=activo&limit=100&fecha_desde=${fechaDesdeStr}&fecha_hasta=${fechaHastaStr}`;
      console.log('Buscando contratos con URL:', url);
      console.log('Fecha desde:', fechaDesdeStr, 'Fecha hasta:', fechaHastaStr);
      const response = await api.get(url);
      console.log('Contratos recibidos:', response.data);
      return response.data;
    },
    enabled: !!salonId
  });

  // Debug: verificar contratos
  useEffect(() => {
    if (contratosData) {
      console.log('📦 Datos completos recibidos:', contratosData);
      const contratosArray = contratosData.data || contratosData.contratos;
      console.log('Total contratos recibidos:', contratosArray?.length || 0);
      console.log('Estructura de datos:', Object.keys(contratosData));
      if (contratosArray && Array.isArray(contratosArray)) {
        console.log('✅ Contratos encontrados:', contratosArray.length);
        console.log('Contratos:', contratosArray.map(c => ({
          id: c.id,
          codigo: c.codigo_contrato,
          cliente: c.clientes?.nombre_completo,
          salon_id: c.salon_id,
          estado: c.estado,
          fecha_evento: c.fecha_evento
        })));
      } else {
        console.log('⚠️ No hay array de contratos en la respuesta');
        console.log('Estructura recibida:', Object.keys(contratosData));
        console.log('Respuesta completa:', JSON.stringify(contratosData, null, 2));
      }
    } else if (loadingContratos) {
      console.log('⏳ Cargando contratos...');
    } else {
      console.log('❌ No hay datos de contratos');
    }
  }, [contratosData, loadingContratos]);

  // Query para asignaciones del contrato seleccionado
  const { data: asignacionesData } = useQuery({
    queryKey: ['asignaciones-contrato', selectedContrato],
    queryFn: async () => {
      if (!selectedContrato) return null;
      const response = await api.get(`/inventario/asignaciones?contrato_id=${selectedContrato}`);
      return response.data;
    },
    enabled: !!selectedContrato
  });

  // Mutation para calcular inventario
  const calcularMutation = useMutation({
    mutationFn: async (contratoId) => {
      const response = await api.post(`/inventario/calcular/${contratoId}`);
      return response.data;
    },
    onSuccess: (data) => {
      setCalculadoData(data);
      toast.success(`Cálculo completado: ${data.items_calculados?.length || 0} items necesarios`);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Error al calcular inventario');
    }
  });

  // Mutation para asignar inventario
  const asignarMutation = useMutation({
    mutationFn: async ({ contratoId, forzar }) => {
      const response = await api.post(`/inventario/asignar/${contratoId}`, { forzar_asignacion: forzar });
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(['asignaciones-contrato', selectedContrato]);
      queryClient.invalidateQueries(['inventario-salon', salonId]);
      queryClient.invalidateQueries(['contratos-salon', salonId]);
      toast.success(data.message || 'Inventario asignado correctamente');
      setCalculadoData(null);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Error al asignar inventario');
    }
  });

  // Mutation para actualizar asignación
  const updateAsignacionMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const response = await api.put(`/inventario/asignaciones/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['asignaciones-contrato', selectedContrato]);
      queryClient.invalidateQueries(['inventario-salon', salonId]);
      toast.success('Asignación actualizada correctamente');
      setEditingAsignacion(null);
      setEditData({ cantidad_asignada: '', cantidad_utilizada: '', estado: '', notas: '' });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Error al actualizar asignación');
    }
  });

  // Mutation para cancelar/desasignar una asignación
  const cancelarAsignacionMutation = useMutation({
    mutationFn: async (asignacionId) => {
      const response = await api.put(`/inventario/asignaciones/${asignacionId}`, {
        estado: 'cancelado'
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['asignaciones-contrato', selectedContrato]);
      queryClient.invalidateQueries(['inventario-salon', salonId]);
      toast.success('Asignación cancelada correctamente. El inventario ha sido devuelto al salón.');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Error al cancelar asignación');
    }
  });

  // Mutation para retornar items a central
  const retornarCentralMutation = useMutation({
    mutationFn: async ({ salon_id, items, motivo }) => {
      const response = await api.post('/inventario/retorno-central', { salon_id, items, motivo });
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(['inventario-salon', salonId]);
      queryClient.invalidateQueries(['inventario-central']);
      toast.success(data.message || 'Items retornados al almacén central correctamente');
      setShowModalAccion(null);
      setItemsSeleccionadosRetorno({});
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Error al retornar items a central');
    }
  });

  // Helper para agrupar items por categoría
  const agruparPorCategoria = (items) => {
    const agrupados = {};
    items.forEach(item => {
      const categoria = item.inventario_items?.categoria || 'Sin categoría';
      if (!agrupados[categoria]) {
        agrupados[categoria] = [];
      }
      agrupados[categoria].push(item);
    });
    return agrupados;
  };

  // Helper para inicializar categorías expandidas en retorno
  const inicializarCategoriasRetorno = (items) => {
    const agrupados = agruparPorCategoria(items);
    const categoriasKeys = Object.keys(agrupados).sort();
    if (Object.keys(categoriasExpandidasRetorno).length === 0 && categoriasKeys.length > 0) {
      const todasExpandidas = {};
      categoriasKeys.forEach(cat => {
        todasExpandidas[cat] = true;
      });
      setCategoriasExpandidasRetorno(todasExpandidas);
    }
  };

  const toggleCategoriaRetorno = (categoria) => {
    setCategoriasExpandidasRetorno(prev => ({
      ...prev,
      [categoria]: !prev[categoria]
    }));
  };

  // Helper para agrupar items calculados por categoría
  const agruparItemsCalculadosPorCategoria = (items) => {
    const agrupados = {};
    items.forEach(item => {
      const categoria = item.categoria || item.item_categoria || 'Sin categoría';
      if (!agrupados[categoria]) {
        agrupados[categoria] = [];
      }
      agrupados[categoria].push(item);
    });
    return agrupados;
  };

  // Helper para agrupar asignaciones por categoría
  const agruparAsignacionesPorCategoria = (asignaciones) => {
    const agrupados = {};
    asignaciones.forEach(asignacion => {
      const categoria = asignacion.inventario_items?.categoria || 'Sin categoría';
      if (!agrupados[categoria]) {
        agrupados[categoria] = [];
      }
      agrupados[categoria].push(asignacion);
    });
    return agrupados;
  };

  const toggleCategoriaCalculados = (categoria) => {
    setCategoriasExpandidasCalculados(prev => ({
      ...prev,
      [categoria]: !prev[categoria]
    }));
  };

  const toggleCategoriaAsignaciones = (categoria) => {
    setCategoriasExpandidasAsignaciones(prev => ({
      ...prev,
      [categoria]: !prev[categoria]
    }));
  };

  // Calcular datos del inventario (antes de early returns)
  const inventario = inventarioSalon?.inventario || [];
  const itemsPorCategoria = agruparPorCategoria(inventario);
  const categoriasKeys = Object.keys(itemsPorCategoria).sort();
  const categoriasKeysString = categoriasKeys.join(',');

  // Inicializar categorías expandidas con useEffect (debe estar antes de early returns)
  useEffect(() => {
    if (categoriasKeys.length > 0) {
      const todasExpandidas = {};
      categoriasKeys.forEach(cat => {
        todasExpandidas[cat] = true;
      });
      // Solo inicializar si no hay categorías expandidas
      setCategoriasExpandidas(prev => {
        if (Object.keys(prev).length === 0) {
          return todasExpandidas;
        }
        return prev;
      });
    }
  }, [categoriasKeysString, categoriasKeys.length]); // Dependencias estables

  if (loadingInventario || loadingContratos) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Cargando información del salón...</div>
      </div>
    );
  }

  if (!salon) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-gray-500">Salón no encontrado</p>
          <button
            onClick={() => navigate('/asignaciones')}
            className="mt-4 text-blue-600 hover:text-blue-700"
          >
            Volver a Inventario por Salones
          </button>
        </div>
      </div>
    );
  }

  // La respuesta del backend viene con paginación: { success, data, total, ... }
  const contratos = contratosData?.data || contratosData?.contratos || [];
  const itemsBajoStock = inventario.filter(item => item.necesita_reposicion);
  const asignaciones = asignacionesData?.asignaciones || [];
  const contratoSeleccionado = contratos.find(c => c.id === selectedContrato);

  const toggleCategoria = (categoria) => {
    setCategoriasExpandidas(prev => ({
      ...prev,
      [categoria]: !prev[categoria]
    }));
  };

  const handleEdit = (asignacion) => {
    setEditingAsignacion(asignacion.id);
    setEditData({
      cantidad_asignada: asignacion.cantidad_asignada.toString(),
      cantidad_utilizada: asignacion.cantidad_utilizada?.toString() || ''
    });
  };

  const handleSave = (id) => {
    const data = {
      cantidad_asignada: parseFloat(editData.cantidad_asignada),
      cantidad_utilizada: editData.cantidad_utilizada ? parseFloat(editData.cantidad_utilizada) : null
    };
    updateAsignacionMutation.mutate({ id, data });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/asignaciones')}
            className="text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Salón {salon.nombre}</h1>
            <p className="text-gray-600 mt-1">Inventario y asignaciones del salón</p>
          </div>
        </div>
        <button
          onClick={() => {
            queryClient.invalidateQueries(['inventario-salon', salonId]);
            queryClient.invalidateQueries(['contratos-salon', salonId, mesSeleccionado, anioSeleccionado]);
            toast.success('Datos actualizados');
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          <RefreshCw className="w-4 h-4" />
          Actualizar
        </button>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Items en Inventario</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {inventario.length}
              </p>
            </div>
            <Package className="w-12 h-12 text-blue-600" />
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

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Eventos Programados</p>
              <p className="text-2xl font-bold text-green-600 mt-1">
                {contratos.length}
              </p>
            </div>
            <Calendar className="w-12 h-12 text-green-600" />
          </div>
        </div>
      </div>

      {/* Filtros de Mes y Año */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex items-center gap-4">
          <Filter className="w-5 h-5 text-gray-600" />
          <span className="font-medium text-gray-700">Filtrar eventos por:</span>
          <select
            value={mesSeleccionado}
            onChange={(e) => setMesSeleccionado(parseInt(e.target.value))}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value={1}>Enero</option>
            <option value={2}>Febrero</option>
            <option value={3}>Marzo</option>
            <option value={4}>Abril</option>
            <option value={5}>Mayo</option>
            <option value={6}>Junio</option>
            <option value={7}>Julio</option>
            <option value={8}>Agosto</option>
            <option value={9}>Septiembre</option>
            <option value={10}>Octubre</option>
            <option value={11}>Noviembre</option>
            <option value={12}>Diciembre</option>
          </select>
          <select
            value={anioSeleccionado}
            onChange={(e) => setAnioSeleccionado(parseInt(e.target.value))}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {(() => {
              const anios = [];
              const anioActual = new Date().getFullYear();
              for (let i = 0; i < 5; i++) {
                anios.push(anioActual - i);
              }
              return anios.map((anio) => (
                <option key={anio} value={anio}>
                  {anio}
                </option>
              ));
            })()}
          </select>
        </div>
      </div>

      {/* Botones de Acción */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Acciones de Inventario</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Botón Asignación */}
          <div className="border border-gray-200 rounded-lg p-4 hover:border-purple-500 transition">
            <div className="flex items-start gap-3 mb-3">
              <CheckCircle className="w-5 h-5 text-purple-600 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-1">Asignación</h3>
                <p className="text-sm text-gray-600">
                  Asignar items del inventario del salón a un evento específico
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowModalAccion('asignacion')}
              className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition flex items-center justify-center gap-2"
            >
              <CheckCircle className="w-4 h-4" />
              Asignar a Evento
            </button>
          </div>

          {/* Botón Devolución de Evento */}
          <div className="border border-gray-200 rounded-lg p-4 hover:border-yellow-500 transition">
            <div className="flex items-start gap-3 mb-3">
              <RefreshCw className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-1">Devolución de Evento</h3>
                <p className="text-sm text-gray-600">
                  Devolver items de un evento asignado de vuelta al inventario del salón
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowModalAccion('devolucion')}
              className="w-full px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Devolver de Evento
            </button>
          </div>

          {/* Botón Retorno a Central */}
          <div className="border border-gray-200 rounded-lg p-4 hover:border-orange-500 transition">
            <div className="flex items-start gap-3 mb-3">
              <ArrowUp className="w-5 h-5 text-orange-600 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-1">Retorno a Central</h3>
                <p className="text-sm text-gray-600">
                  Enviar items del inventario del salón de vuelta al almacén central
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowModalAccion('retorno')}
              className="w-full px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition flex items-center justify-center gap-2"
            >
              <ArrowUp className="w-4 h-4" />
              Retornar a Central
            </button>
          </div>
        </div>
      </div>

      {/* Alertas de Stock Bajo */}
      {itemsBajoStock.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <h3 className="text-lg font-semibold text-red-900">Alertas de Stock Bajo</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {itemsBajoStock.slice(0, 6).map((item) => (
              <div key={item.item_id} className="bg-white rounded p-3 border border-red-200">
                <div className="font-medium text-gray-900">{item.inventario_items?.nombre}</div>
                <div className="text-sm text-gray-600">
                  Actual: {parseFloat(item.cantidad_actual).toFixed(2)} {item.inventario_items?.unidad_medida}
                </div>
                <div className="text-sm text-red-600">
                  Mínimo: {parseFloat(item.cantidad_minima || 10).toFixed(2)} {item.inventario_items?.unidad_medida}
                </div>
              </div>
            ))}
          </div>
          {itemsBajoStock.length > 6 && (
            <p className="text-sm text-red-700 mt-3">
              +{itemsBajoStock.length - 6} items más con stock bajo
            </p>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Inventario del Salón */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Inventario del Salón</h2>
            <p className="text-sm text-gray-600 mt-1">{inventario.length} items disponibles</p>
          </div>
          <div className="p-6 max-h-[600px] overflow-y-auto">
            {inventario.length > 0 ? (
              <div className="space-y-3">
                {categoriasKeys.map((categoria) => {
                  const itemsCategoria = itemsPorCategoria[categoria];
                  const itemsBajoStockCategoria = itemsCategoria.filter(item => item.necesita_reposicion).length;
                  const estaExpandida = categoriasExpandidas[categoria] !== false;

                  return (
                    <div key={categoria} className="border border-gray-200 rounded-lg overflow-hidden">
                      <button
                        onClick={() => toggleCategoria(categoria)}
                        className="w-full bg-gray-100 px-4 py-3 border-b border-gray-200 hover:bg-gray-200 transition flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <ChevronDown
                            className={`w-5 h-5 text-gray-600 transition-transform ${estaExpandida ? '' : '-rotate-90'}`}
                          />
                          <h3 className="text-lg font-semibold text-gray-900">{categoria}</h3>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span>{itemsCategoria.length} items</span>
                          {itemsBajoStockCategoria > 0 && (
                            <span className="text-red-600 font-medium">
                              {itemsBajoStockCategoria} bajo stock
                            </span>
                          )}
                        </div>
                      </button>
                      {estaExpandida && (
                        <div className="p-3 bg-white">
                          <div className="grid grid-cols-1 gap-3">
                            {itemsCategoria.map((item) => (
                              <div
                                key={item.item_id}
                                className={`p-4 rounded-lg border ${item.necesita_reposicion
                                  ? 'border-red-200 bg-red-50'
                                  : 'border-gray-200 bg-gray-50'
                                  }`}
                              >
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <h3 className="font-semibold text-gray-900 text-sm">
                                      {item.inventario_items?.nombre}
                                    </h3>
                                    <div className="mt-2 space-y-1">
                                      <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Actual:</span>
                                        <span className={`font-medium ${item.necesita_reposicion ? 'text-red-600' : 'text-gray-900'
                                          }`}>
                                          {parseFloat(item.cantidad_actual).toFixed(2)} {item.inventario_items?.unidad_medida}
                                        </span>
                                      </div>
                                      <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Mínimo:</span>
                                        <span className="text-gray-900">
                                          {parseFloat(item.cantidad_minima || 10).toFixed(2)} {item.inventario_items?.unidad_medida}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                  {item.necesita_reposicion && (
                                    <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No hay items en el inventario de este salón
              </div>
            )}
          </div>
        </div>

        {/* Eventos/Contratos del Salón */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Eventos Programados</h2>
            <p className="text-sm text-gray-600 mt-1">
              {loadingContratos ? 'Cargando...' : `${contratos.length} eventos en ${new Date(anioSeleccionado, mesSeleccionado - 1).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}`}
            </p>
          </div>
          <div className="p-6 max-h-[600px] overflow-y-auto">
            {loadingContratos ? (
              <div className="text-center py-8 text-gray-500">Cargando contratos...</div>
            ) : contratos.length > 0 ? (
              <div className="space-y-3">
                {contratos.map((contrato) => {
                  const fechaEvento = new Date(contrato.fecha_evento);
                  const fechaHoy = new Date();
                  fechaHoy.setHours(0, 0, 0, 0);
                  const diasRestantes = Math.ceil((fechaEvento - fechaHoy) / (1000 * 60 * 60 * 24));
                  const necesitaAsignacion = !contrato.asignaciones_inventario || contrato.asignaciones_inventario.length === 0;

                  return (
                    <div
                      key={contrato.id}
                      onClick={() => {
                        setSelectedContrato(contrato.id);
                        setCalculadoData(null);
                      }}
                      className={`border rounded-lg p-4 cursor-pointer transition ${selectedContrato === contrato.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:bg-gray-50'
                        }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-semibold text-gray-900">{contrato.codigo_contrato}</div>
                        <div className="flex items-center gap-2">
                          {diasRestantes <= 30 && diasRestantes >= 0 && necesitaAsignacion && (
                            <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800 font-semibold">
                              ⚠️ {diasRestantes} días
                            </span>
                          )}
                          {diasRestantes <= 30 && diasRestantes >= 0 && !necesitaAsignacion && (
                            <span className="px-2 py-1 text-xs rounded-full bg-orange-100 text-orange-800">
                              {diasRestantes} días
                            </span>
                          )}
                          <span className={`px-2 py-1 text-xs rounded-full ${contrato.estado === 'activo' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                            }`}>
                            {contrato.estado}
                          </span>
                        </div>
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          {contrato.clientes?.nombre_completo}
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          {fechaEvento.toLocaleDateString('es-ES')} - {contrato.cantidad_invitados} invitados
                        </div>
                        {contrato.asignaciones_inventario && contrato.asignaciones_inventario.length > 0 && (
                          <div className="flex items-center gap-2 text-green-600">
                            <CheckCircle className="w-4 h-4" />
                            Inventario asignado ({contrato.asignaciones_inventario.length} items)
                          </div>
                        )}
                        {necesitaAsignacion && (
                          <div className="flex items-center gap-2 text-red-600">
                            <AlertTriangle className="w-4 h-4" />
                            Sin asignación de inventario
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No hay eventos programados para este salón
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Panel de Detalles del Contrato Seleccionado */}
      {contratoSeleccionado && (
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                Detalles del Contrato: {contratoSeleccionado.codigo_contrato}
              </h2>
              <button
                onClick={() => {
                  setSelectedContrato(null);
                  setCalculadoData(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Información del Contrato */}
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Información del Evento</h3>
                  <div className="space-y-2 text-sm">
                    <div><span className="font-medium">Cliente:</span> {contratoSeleccionado.clientes?.nombre_completo}</div>
                    <div><span className="font-medium">Fecha Evento:</span> {new Date(contratoSeleccionado.fecha_evento).toLocaleDateString('es-ES')}</div>
                    <div><span className="font-medium">Invitados:</span> {contratoSeleccionado.cantidad_invitados}</div>
                    <div><span className="font-medium">Paquete:</span> {contratoSeleccionado.paquetes?.nombre}</div>
                  </div>
                </div>

                {/* Botones de Acción */}
                <div className="flex gap-3">
                  <button
                    onClick={() => calcularMutation.mutate(selectedContrato)}
                    disabled={calcularMutation.isPending}
                    className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    <Calculator className="w-4 h-4" />
                    {calcularMutation.isPending ? 'Calculando...' : 'Calcular Inventario'}
                  </button>
                  {calculadoData && (
                    <button
                      onClick={() => asignarMutation.mutate({ contratoId: selectedContrato, forzar: false })}
                      disabled={asignarMutation.isPending}
                      className="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50"
                    >
                      <CheckCircle className="w-4 h-4" />
                      {asignarMutation.isPending ? 'Asignando...' : 'Asignar Automáticamente'}
                    </button>
                  )}
                </div>

                {/* Resultado del Cálculo */}
                {calculadoData && (() => {
                  const itemsCalculados = calculadoData.items_calculados || [];
                  const itemsPorCategoriaCalculados = agruparItemsCalculadosPorCategoria(itemsCalculados);
                  const categoriasCalculados = Object.keys(itemsPorCategoriaCalculados).sort();

                  // Inicializar categorías expandidas si es necesario
                  if (Object.keys(categoriasExpandidasCalculados).length === 0 && categoriasCalculados.length > 0) {
                    const todasExpandidas = {};
                    categoriasCalculados.forEach(cat => {
                      todasExpandidas[cat] = true;
                    });
                    setCategoriasExpandidasCalculados(todasExpandidas);
                  }

                  return (
                    <div className="border border-gray-200 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 mb-3">
                        Items Calculados ({itemsCalculados.length})
                      </h4>
                      <div className="max-h-64 overflow-y-auto space-y-2">
                        {categoriasCalculados.map((categoria) => {
                          const itemsCategoria = itemsPorCategoriaCalculados[categoria];
                          const estaExpandida = categoriasExpandidasCalculados[categoria] !== false;

                          return (
                            <div key={categoria} className="border border-gray-200 rounded overflow-hidden">
                              <button
                                onClick={() => toggleCategoriaCalculados(categoria)}
                                className="w-full bg-gray-100 px-3 py-2 hover:bg-gray-200 transition flex items-center justify-between text-sm"
                              >
                                <div className="flex items-center gap-2">
                                  <ChevronDown
                                    className={`w-4 h-4 text-gray-600 transition-transform ${estaExpandida ? '' : '-rotate-90'}`}
                                  />
                                  <span className="font-semibold text-gray-900">{categoria}</span>
                                  <span className="text-gray-600">({itemsCategoria.length} items)</span>
                                </div>
                              </button>
                              {estaExpandida && (
                                {/* Desktop Table */ }
                                < div className="hidden md:block overflow-x-auto">
                              <table className="min-w-full text-sm">
                                <thead className="bg-gray-50">
                                  <tr>
                                    <th className="px-3 py-2 text-left">Item</th>
                                    <th className="px-3 py-2 text-left">Cantidad</th>
                                    <th className="px-3 py-2 text-left">Unidad</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                  {itemsCategoria.map((item, idx) => (
                                    <tr key={idx}>
                                      <td className="px-3 py-2">{item.item_nombre}</td>
                                      <td className="px-3 py-2">{item.cantidad_necesaria.toFixed(2)}</td>
                                      <td className="px-3 py-2">{item.unidad_medida}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>

                                {/* Mobile Cards */ }
                          <div className="md:hidden space-y-2 p-2">
                            {itemsCategoria.map((item, idx) => (
                              <div key={idx} className="bg-gray-50 p-3 rounded border border-gray-100">
                                <div className="font-medium text-gray-900 text-sm">{item.item_nombre}</div>
                                <div className="flex justify-between mt-1 text-xs text-gray-600">
                                  <span>Cantidad: {item.cantidad_necesaria.toFixed(2)}</span>
                                  <span>{item.unidad_medida}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                              )}
                      </div>
                      );
                        })}
                    </div>
                    </div>
              );
                })()}
            </div>

            {/* Asignaciones Existentes */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">
                Asignaciones de Inventario ({asignaciones.length})
              </h3>
              {asignaciones.length > 0 ? (() => {
                const itemsPorCategoriaAsignaciones = agruparAsignacionesPorCategoria(asignaciones);
                const categoriasAsignaciones = Object.keys(itemsPorCategoriaAsignaciones).sort();

                // Inicializar categorías expandidas si es necesario
                if (Object.keys(categoriasExpandidasAsignaciones).length === 0 && categoriasAsignaciones.length > 0) {
                  const todasExpandidas = {};
                  categoriasAsignaciones.forEach(cat => {
                    todasExpandidas[cat] = true;
                  });
                  setCategoriasExpandidasAsignaciones(todasExpandidas);
                }

                return (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {categoriasAsignaciones.map((categoria) => {
                      const asignacionesCategoria = itemsPorCategoriaAsignaciones[categoria];
                      const estaExpandida = categoriasExpandidasAsignaciones[categoria] !== false;

                      return (
                        <div key={categoria} className="border border-gray-200 rounded overflow-hidden">
                          <button
                            onClick={() => toggleCategoriaAsignaciones(categoria)}
                            className="w-full bg-gray-100 px-3 py-2 hover:bg-gray-200 transition flex items-center justify-between text-sm"
                          >
                            <div className="flex items-center gap-2">
                              <ChevronDown
                                className={`w-4 h-4 text-gray-600 transition-transform ${estaExpandida ? '' : '-rotate-90'}`}
                              />
                              <span className="font-semibold text-gray-900">{categoria}</span>
                              <span className="text-gray-600">({asignacionesCategoria.length} items)</span>
                            </div>
                          </button>
                          {estaExpandida && (
                            <div className="space-y-3 p-3 bg-white">
                              {asignacionesCategoria.map((asignacion) => (
                                <div
                                  key={asignacion.id}
                                  className="border border-gray-200 rounded-lg p-4 bg-gray-50"
                                >
                                  <div className="flex items-start justify-between mb-2">
                                    <div className="flex-1">
                                      <h4 className="font-semibold text-gray-900 text-sm">
                                        {asignacion.inventario_items?.nombre}
                                      </h4>
                                      <span className={`px-2 py-1 text-xs rounded-full mt-1 inline-block ${asignacion.estado === 'asignado' ? 'bg-blue-100 text-blue-800' :
                                        asignacion.estado === 'utilizado' ? 'bg-green-100 text-green-800' :
                                          'bg-gray-100 text-gray-800'
                                        }`}>
                                        {asignacion.estado}
                                      </span>
                                    </div>
                                    {editingAsignacion === asignacion.id ? (
                                      <div className="flex gap-2">
                                        <button
                                          onClick={() => handleSave(asignacion.id)}
                                          className="text-green-600 hover:text-green-700"
                                          disabled={updateAsignacionMutation.isPending}
                                        >
                                          <Save className="w-4 h-4" />
                                        </button>
                                        <button
                                          onClick={() => {
                                            setEditingAsignacion(null);
                                            setEditData({ cantidad_asignada: '', cantidad_utilizada: '' });
                                          }}
                                          className="text-red-600 hover:text-red-700"
                                        >
                                          <X className="w-4 h-4" />
                                        </button>
                                      </div>
                                    ) : (
                                      <div className="flex gap-2">
                                        <button
                                          onClick={() => handleEdit(asignacion)}
                                          className="text-blue-600 hover:text-blue-700"
                                          title="Editar asignación"
                                        >
                                          <Edit2 className="w-4 h-4" />
                                        </button>
                                        {asignacion.estado !== 'cancelado' && (
                                          <button
                                            onClick={() => {
                                              if (window.confirm(`¿Estás seguro que deseas cancelar la asignación de ${asignacion.inventario_items?.nombre}? El inventario será devuelto al salón.`)) {
                                                cancelarAsignacionMutation.mutate(asignacion.id);
                                              }
                                            }}
                                            className="text-red-600 hover:text-red-700"
                                            disabled={cancelarAsignacionMutation.isPending}
                                            title="Cancelar asignación"
                                          >
                                            {cancelarAsignacionMutation.isPending ? (
                                              <RefreshCw className="w-4 h-4 animate-spin" />
                                            ) : (
                                              <Trash2 className="w-4 h-4" />
                                            )}
                                          </button>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                  <div className="mt-3 space-y-2 text-sm">
                                    <div className="flex justify-between">
                                      <span className="text-gray-600">Cantidad Asignada:</span>
                                      {editingAsignacion === asignacion.id ? (
                                        <input
                                          type="number"
                                          value={editData.cantidad_asignada}
                                          onChange={(e) => setEditData({ ...editData, cantidad_asignada: e.target.value })}
                                          min="0"
                                          step="0.01"
                                          className="w-24 px-2 py-1 border border-gray-300 rounded text-sm"
                                        />
                                      ) : (
                                        <span className="font-medium text-gray-900">
                                          {parseFloat(asignacion.cantidad_asignada).toFixed(2)} {asignacion.inventario_items?.unidad_medida}
                                        </span>
                                      )}
                                    </div>
                                    {asignacion.cantidad_utilizada && (
                                      <div className="flex justify-between">
                                        <span className="text-gray-600">Cantidad Utilizada:</span>
                                        {editingAsignacion === asignacion.id ? (
                                          <input
                                            type="number"
                                            value={editData.cantidad_utilizada}
                                            onChange={(e) => setEditData({ ...editData, cantidad_utilizada: e.target.value })}
                                            min="0"
                                            step="0.01"
                                            className="w-24 px-2 py-1 border border-gray-300 rounded text-sm"
                                          />
                                        ) : (
                                          <span className="font-medium text-gray-900">
                                            {parseFloat(asignacion.cantidad_utilizada).toFixed(2)} {asignacion.inventario_items?.unidad_medida}
                                          </span>
                                        )}
                                      </div>
                                    )}
                                    <div className="text-xs text-gray-500">
                                      Fuente: {asignacion.fuente}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })() : (
                <div className="text-center py-8 text-gray-500 border border-gray-200 rounded-lg">
                  <Package className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p>No hay asignaciones de inventario para este contrato</p>
                  <p className="text-sm mt-1">Calcula y asigna el inventario necesario</p>
                </div>
              )}
            </div>
          </div>
        </div>
        </div>
  )
}

{/* Modales de Acción */ }
{
  showModalAccion && (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            {showModalAccion === 'asignacion' && 'Asignar Inventario a Evento'}
            {showModalAccion === 'devolucion' && 'Devolver Inventario de Evento'}
            {showModalAccion === 'retorno' && 'Retornar Inventario a Central'}
          </h3>
          <button
            onClick={() => {
              setShowModalAccion(null);
              setContratoSeleccionadoAccion(null);
            }}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {showModalAccion === 'asignacion' && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Selecciona un evento para asignar inventario del salón. El inventario se tomará del almacén del salón.
            </p>
            <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg">
              {contratos.length > 0 ? (
                <div className="divide-y divide-gray-200">
                  {contratos.map((contrato) => (
                    <button
                      key={contrato.id}
                      onClick={() => {
                        setContratoSeleccionadoAccion(contrato.id);
                        calcularMutation.mutate(contrato.id);
                      }}
                      className="w-full text-left p-4 hover:bg-blue-50 transition"
                    >
                      <div className="font-semibold text-gray-900">{contrato.codigo_contrato}</div>
                      <div className="text-sm text-gray-600">
                        {contrato.clientes?.nombre_completo} - {new Date(contrato.fecha_evento).toLocaleDateString('es-ES')}
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-gray-500">
                  No hay eventos programados para este salón
                </div>
              )}
            </div>
            {contratoSeleccionadoAccion && calculadoData && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-700 mb-2">
                  Items calculados: {calculadoData.items_calculados?.length || 0}
                </p>
                <button
                  onClick={() => {
                    asignarMutation.mutate({ contratoId: contratoSeleccionadoAccion, forzar: false });
                    setShowModalAccion(null);
                    setContratoSeleccionadoAccion(null);
                  }}
                  className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
                >
                  Confirmar Asignación
                </button>
              </div>
            )}
          </div>
        )}

        {showModalAccion === 'devolucion' && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Selecciona un evento para devolver el inventario asignado de vuelta al salón.
            </p>
            <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg">
              {contratos.filter(c => c.asignaciones_inventario && c.asignaciones_inventario.length > 0).length > 0 ? (
                <div className="divide-y divide-gray-200">
                  {contratos
                    .filter(c => c.asignaciones_inventario && c.asignaciones_inventario.length > 0)
                    .map((contrato) => (
                      <button
                        key={contrato.id}
                        onClick={async () => {
                          try {
                            // Obtener todas las asignaciones del contrato
                            const asignacionesResponse = await api.get(`/inventario/asignaciones?contrato_id=${contrato.id}`);
                            const asignaciones = asignacionesResponse.data?.asignaciones || [];

                            // Cancelar todas las asignaciones activas
                            const asignacionesActivas = asignaciones.filter(a => a.estado !== 'cancelado');

                            if (asignacionesActivas.length === 0) {
                              toast.error('Este evento no tiene asignaciones activas para devolver');
                              return;
                            }

                            // Confirmar acción
                            if (window.confirm(`¿Estás seguro que deseas devolver ${asignacionesActivas.length} items asignados del evento ${contrato.codigo_contrato} al inventario del salón?`)) {
                              // Cancelar todas las asignaciones
                              const promesas = asignacionesActivas.map(asignacion =>
                                api.put(`/inventario/asignaciones/${asignacion.id}`, {
                                  estado: 'cancelado'
                                })
                              );

                              await Promise.all(promesas);

                              toast.success(`Se devolvieron ${asignacionesActivas.length} items al inventario del salón`);
                              queryClient.invalidateQueries(['asignaciones-contrato']);
                              queryClient.invalidateQueries(['inventario-salon', salonId]);
                              queryClient.invalidateQueries(['contratos-salon', salonId, mesSeleccionado, anioSeleccionado]);
                              setShowModalAccion(null);
                            }
                          } catch (error) {
                            toast.error(error.response?.data?.message || 'Error al devolver inventario del evento');
                          }
                        }}
                        className="w-full text-left p-4 hover:bg-yellow-50 transition"
                      >
                        <div className="font-semibold text-gray-900">{contrato.codigo_contrato}</div>
                        <div className="text-sm text-gray-600">
                          {contrato.clientes?.nombre_completo} - {contrato.asignaciones_inventario.length} items asignados
                        </div>
                      </button>
                    ))}
                </div>
              ) : (
                <div className="p-8 text-center text-gray-500">
                  No hay eventos con inventario asignado
                </div>
              )}
            </div>
          </div>
        )}

        {showModalAccion === 'retorno' && (() => {
          // Items con stock disponible
          const itemsConStock = inventario.filter(item => parseFloat(item.cantidad_actual) > 0);
          const itemsPorCategoriaRetorno = agruparPorCategoria(itemsConStock);
          const categoriasRetorno = Object.keys(itemsPorCategoriaRetorno).sort();

          // Inicializar categorías expandidas si es necesario
          if (Object.keys(categoriasExpandidasRetorno).length === 0 && categoriasRetorno.length > 0) {
            inicializarCategoriasRetorno(itemsConStock);
          }

          return (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Selecciona los items del inventario del salón que deseas retornar al almacén central.
              </p>

              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Items Disponibles ({itemsConStock.length} items con stock)
                </label>
                <div className="flex items-center gap-3">
                  {Object.keys(itemsSeleccionadosRetorno).length > 0 && (
                    <div className="flex items-center gap-2">
                      <label className="text-sm text-gray-600">Cantidad para todos:</label>
                      <input
                        type="number"
                        placeholder="50"
                        min="0"
                        step="0.01"
                        onChange={(e) => {
                          const cantidad = parseFloat(e.target.value) || 0;
                          if (cantidad >= 0) {
                            const nuevosSeleccionados = {};
                            Object.keys(itemsSeleccionadosRetorno).forEach(itemId => {
                              const item = itemsConStock.find(i => i.item_id === parseInt(itemId));
                              if (item) {
                                const cantidadDisponible = parseFloat(item.cantidad_actual);
                                nuevosSeleccionados[itemId] = {
                                  item_id: parseInt(itemId),
                                  cantidad: Math.min(cantidad, cantidadDisponible)
                                };
                              }
                            });
                            setItemsSeleccionadosRetorno(nuevosSeleccionados);
                          }
                        }}
                        className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                    </div>
                  )}
                  {(() => {
                    const todosSeleccionados = itemsConStock.every(item => itemsSeleccionadosRetorno[item.item_id]);
                    const haySeleccionados = Object.keys(itemsSeleccionadosRetorno).length > 0;

                    if (todosSeleccionados && haySeleccionados) {
                      return (
                        <button
                          onClick={() => setItemsSeleccionadosRetorno({})}
                          className="text-sm text-red-600 hover:text-red-700 font-medium"
                        >
                          Deseleccionar Todos
                        </button>
                      );
                    } else {
                      return (
                        <button
                          onClick={() => {
                            const todosSeleccionados = {};
                            itemsConStock.forEach(item => {
                              const cantidadDisponible = parseFloat(item.cantidad_actual);
                              if (cantidadDisponible > 0) {
                                todosSeleccionados[item.item_id] = {
                                  item_id: item.item_id,
                                  cantidad: cantidadDisponible // Por defecto, toda la cantidad disponible
                                };
                              }
                            });
                            setItemsSeleccionadosRetorno(todosSeleccionados);
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
                <div className="space-y-2 p-2">
                  {categoriasRetorno.map((categoria) => {
                    const itemsCategoria = itemsPorCategoriaRetorno[categoria];
                    const estaExpandida = categoriasExpandidasRetorno[categoria] !== false;

                    return (
                      <div key={categoria} className="border border-gray-200 rounded overflow-hidden">
                        <button
                          onClick={() => toggleCategoriaRetorno(categoria)}
                          className="w-full bg-gray-100 px-3 py-2 hover:bg-gray-200 transition flex items-center justify-between text-sm"
                        >
                          <div className="flex items-center gap-2">
                            <ChevronDown
                              className={`w-4 h-4 text-gray-600 transition-transform ${estaExpandida ? '' : '-rotate-90'}`}
                            />
                            <span className="font-semibold text-gray-900">{categoria}</span>
                            <span className="text-gray-600">({itemsCategoria.length} items)</span>
                          </div>
                        </button>
                        {estaExpandida && (
                              {/* Desktop Table */}
                              <div className="hidden md:block overflow-x-auto">
                                <table className="min-w-full text-sm">
                                  <thead className="bg-gray-50">
                                    <tr>
                                      <th className="px-3 py-2 text-left">
                                        <CheckCircle className="w-3 h-3 inline" />
                                      </th>
                                      <th className="px-3 py-2 text-left">Item</th>
                                      <th className="px-3 py-2 text-left">Disponible</th>
                                      <th className="px-3 py-2 text-left">Cantidad a Retornar</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-gray-200">
                                    {itemsCategoria.map((item) => {
                                      const cantidadDisponible = parseFloat(item.cantidad_actual);
                                      const estaSeleccionado = itemsSeleccionadosRetorno[item.item_id];
                                      
                                      return (
                                        <tr key={item.item_id} className={estaSeleccionado ? 'bg-orange-50' : ''}>
                                          <td className="px-3 py-2">
                                            <input
                                              type="checkbox"
                                              checked={!!estaSeleccionado}
                                              onChange={(e) => {
                                                if (e.target.checked) {
                                                  setItemsSeleccionadosRetorno({
                                                    ...itemsSeleccionadosRetorno,
                                                    [item.item_id]: { 
                                                      item_id: item.item_id, 
                                                      cantidad: cantidadDisponible 
                                                    }
                                                  });
                                                } else {
                                                  const nuevos = { ...itemsSeleccionadosRetorno };
                                                  delete nuevos[item.item_id];
                                                  setItemsSeleccionadosRetorno(nuevos);
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
                                                value={itemsSeleccionadosRetorno[item.item_id]?.cantidad || ''}
                                                onChange={(e) => {
                                                  const cantidad = parseFloat(e.target.value) || 0;
                                                  if (cantidad >= 0 && cantidad <= cantidadDisponible) {
                                                    setItemsSeleccionadosRetorno({
                                                      ...itemsSeleccionadosRetorno,
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

                              {/* Mobile Cards */}
                              <div className="md:hidden space-y-2 p-2">
                                {itemsCategoria.map((item) => {
                                  const cantidadDisponible = parseFloat(item.cantidad_actual);
                                  const estaSeleccionado = itemsSeleccionadosRetorno[item.item_id];
                                  
                                  return (
                                    <div 
                                      key={item.item_id} 
                                      className={`p-3 rounded border ${estaSeleccionado ? 'bg-orange-50 border-orange-200' : 'bg-white border-gray-200'}`}
                                    >
                                      <div className="flex items-start gap-3">
                                        <input
                                          type="checkbox"
                                          checked={!!estaSeleccionado}
                                          onChange={(e) => {
                                            if (e.target.checked) {
                                              setItemsSeleccionadosRetorno({
                                                ...itemsSeleccionadosRetorno,
                                                [item.item_id]: { 
                                                  item_id: item.item_id, 
                                                  cantidad: cantidadDisponible 
                                                }
                                              });
                                            } else {
                                              const nuevos = { ...itemsSeleccionadosRetorno };
                                              delete nuevos[item.item_id];
                                              setItemsSeleccionadosRetorno(nuevos);
                                            }
                                          }}
                                          className="mt-1 rounded"
                                        />
                                        <div className="flex-1">
                                          <div className="font-medium text-sm text-gray-900">{item.inventario_items?.nombre}</div>
                                          <div className="text-xs text-gray-500 mb-2">
                                            Disponible: {cantidadDisponible.toFixed(2)} {item.inventario_items?.unidad_medida}
                                          </div>
                                          
                                          {estaSeleccionado && (
                                            <div className="flex items-center gap-2">
                                              <label className="text-xs text-gray-600">Retornar:</label>
                                              <input
                                                type="number"
                                                value={itemsSeleccionadosRetorno[item.item_id]?.cantidad || ''}
                                                onChange={(e) => {
                                                  const cantidad = parseFloat(e.target.value) || 0;
                                                  if (cantidad >= 0 && cantidad <= cantidadDisponible) {
                                                    setItemsSeleccionadosRetorno({
                                                      ...itemsSeleccionadosRetorno,
                                                      [item.item_id]: { item_id: item.item_id, cantidad }
                                                    });
                                                  }
                                                }}
                                                min="0"
                                                max={cantidadDisponible}
                                                step="0.01"
                                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                              />
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Motivo (opcional)
                </label>
                <input
                  type="text"
                  placeholder="Motivo del retorno"
                  id="motivo-retorno"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    const items = Object.values(itemsSeleccionadosRetorno).filter(item => item.cantidad > 0);
                    if (items.length === 0) {
                      toast.error('Selecciona al menos un item con cantidad mayor a 0');
                      return;
                    }
                    const motivo = document.getElementById('motivo-retorno')?.value || '';
                    retornarCentralMutation.mutate({
                      salon_id: salonId,
                      items,
                      motivo: motivo || `Retorno a almacén central desde ${salon.nombre}`
                    });
                  }}
                  disabled={retornarCentralMutation.isPending || Object.keys(itemsSeleccionadosRetorno).length === 0}
                  className="flex-1 bg-orange-600 text-white py-2 px-4 rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {retornarCentralMutation.isPending ? 'Retornando...' : `Retornar (${Object.keys(itemsSeleccionadosRetorno).length} items)`}
                </button>
                <button
                  onClick={() => {
                    setShowModalAccion(null);
                    setItemsSeleccionadosRetorno({});
                    setCategoriasExpandidasRetorno({});
                  }}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300"
                >
                  Cancelar
                </button>
              </div>
            </div>
      );
        })()}
    </div>
    </div >
  )
}
    </div >
  );
}

export default SalonInventario;
