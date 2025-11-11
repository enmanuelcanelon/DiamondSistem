import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { History, Calendar, User, ArrowRightLeft, Building2, ArrowLeft, Filter, ArrowDown, ArrowUp, Package, ChevronDown, Warehouse, ShoppingCart } from 'lucide-react';
import api from '@shared/config/api';

function MovimientosInventario() {
  const [selectedSalon, setSelectedSalon] = useState(null); // Puede ser un salón o 'central'
  const [mesSeleccionado, setMesSeleccionado] = useState(new Date().getMonth() + 1);
  const [anioSeleccionado, setAnioSeleccionado] = useState(new Date().getFullYear());
  const [tiposExpandidos, setTiposExpandidos] = useState({});

  // Query para movimientos filtrados por salón o central, mes y año
  const { data: movimientosData, isLoading } = useQuery({
    queryKey: ['movimientos-inventario', selectedSalon, mesSeleccionado, anioSeleccionado],
    queryFn: async () => {
      if (!selectedSalon) return { movimientos: [] };
      const response = await api.get('/inventario/movimientos', {
        params: {
          salon_nombre: selectedSalon === 'central' ? 'central' : selectedSalon,
          mes: mesSeleccionado,
          anio: anioSeleccionado
        }
      });
      return response.data;
    },
    enabled: !!selectedSalon
  });


  // Obtener nombre legible del tipo de movimiento
  const getTipoNombre = (tipo, origen, destino) => {
    // Tipo 1: Movimiento de central a salón
    if (tipo === 'transferencia' && origen?.toLowerCase() === 'central' && destino) {
      return 'Central → Salón';
    }
    // Tipo 2: Retorno de salón a central
    if ((tipo === 'salida' || tipo === 'retorno') && origen && destino?.toLowerCase() === 'central') {
      return 'Salón → Central';
    }
    // Tipo 3: Edición de cantidad central
    if (tipo === 'entrada' && origen?.toLowerCase() === 'central' && !destino) {
      return 'Edición Central';
    }
    // Tipo 4: Asignación de salón a evento (incluye ajustes y devoluciones de asignación)
    if (tipo === 'asignacion' && origen) {
      return 'Asignación a Evento';
    }
    // Tipo 5: Devolución de evento a salón (ajuste de asignación - disminución)
    if (tipo === 'devolucion' && origen?.toLowerCase().startsWith('evento-')) {
      return 'Asignación a Evento';
    }
    // Tipo 6: Compras entrantes
    if (tipo === 'entrada' && origen?.toLowerCase() === 'compra') {
      return 'Compra Entrante';
    }
    return tipo;
  };

  // Obtener clave única del tipo de movimiento para agrupar
  const getTipoClave = (tipo, origen, destino) => {
    if (tipo === 'transferencia' && origen?.toLowerCase() === 'central' && destino) {
      return 'central-salon';
    }
    if ((tipo === 'salida' || tipo === 'retorno') && origen && destino?.toLowerCase() === 'central') {
      return 'salon-central';
    }
    if (tipo === 'entrada' && origen?.toLowerCase() === 'central' && !destino) {
      return 'edicion-central';
    }
    if (tipo === 'asignacion' && origen) {
      return 'asignacion-evento';
    }
    // Devoluciones de asignación (ajustes) se agrupan con asignaciones
    if (tipo === 'devolucion' && origen?.toLowerCase().startsWith('evento-')) {
      return 'asignacion-evento';
    }
    // Compras entrantes
    if (tipo === 'entrada' && origen?.toLowerCase() === 'compra') {
      return 'compra-entrante';
    }
    return 'otros';
  };

  const getTipoColor = (tipo, origen, destino) => {
    // Tipo 1: Central → Salón (azul)
    if (tipo === 'transferencia' && origen?.toLowerCase() === 'central' && destino) {
      return 'bg-blue-100 text-blue-800';
    }
    // Tipo 2: Salón → Central (naranja)
    if ((tipo === 'salida' || tipo === 'retorno') && origen && destino?.toLowerCase() === 'central') {
      return 'bg-orange-100 text-orange-800';
    }
    // Tipo 3: Edición Central (verde)
    if (tipo === 'entrada' && origen?.toLowerCase() === 'central' && !destino) {
      return 'bg-green-100 text-green-800';
    }
    // Tipo 4: Asignación (morado) - incluye ajustes y devoluciones de asignación
    if (tipo === 'asignacion' && origen) {
      return 'bg-purple-100 text-purple-800';
    }
    // Tipo 5: Devolución de asignación (ajuste) - mismo color que asignación
    if (tipo === 'devolucion' && origen?.toLowerCase().startsWith('evento-')) {
      return 'bg-purple-100 text-purple-800';
    }
    // Tipo 6: Compra Entrante (verde claro)
    if (tipo === 'entrada' && origen?.toLowerCase() === 'compra') {
      return 'bg-emerald-100 text-emerald-800';
    }
    return 'bg-gray-100 text-gray-800';
  };

  const getTipoIcono = (tipo, origen, destino) => {
    if (tipo === 'transferencia' && origen?.toLowerCase() === 'central' && destino) {
      return <ArrowDown className="w-4 h-4" />;
    }
    if ((tipo === 'salida' || tipo === 'retorno') && origen && destino?.toLowerCase() === 'central') {
      return <ArrowUp className="w-4 h-4" />;
    }
    if (tipo === 'entrada' && origen?.toLowerCase() === 'central' && !destino) {
      return <Package className="w-4 h-4" />;
    }
    if (tipo === 'asignacion' && origen) {
      return <ArrowRightLeft className="w-4 h-4" />;
    }
    // Devolución de asignación usa el mismo icono que asignación
    if (tipo === 'devolucion' && origen?.toLowerCase().startsWith('evento-')) {
      return <ArrowRightLeft className="w-4 h-4" />;
    }
    // Compra Entrante
    if (tipo === 'entrada' && origen?.toLowerCase() === 'compra') {
      return <ShoppingCart className="w-4 h-4" />;
    }
    return <ArrowRightLeft className="w-4 h-4" />;
  };

  // Capitalizar primera letra
  const capitalizar = (str) => {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  // Obtener meses
  const meses = [
    { valor: 1, nombre: 'Enero' },
    { valor: 2, nombre: 'Febrero' },
    { valor: 3, nombre: 'Marzo' },
    { valor: 4, nombre: 'Abril' },
    { valor: 5, nombre: 'Mayo' },
    { valor: 6, nombre: 'Junio' },
    { valor: 7, nombre: 'Julio' },
    { valor: 8, nombre: 'Agosto' },
    { valor: 9, nombre: 'Septiembre' },
    { valor: 10, nombre: 'Octubre' },
    { valor: 11, nombre: 'Noviembre' },
    { valor: 12, nombre: 'Diciembre' }
  ];

  // Obtener años (últimos 5 años)
  const anios = [];
  const anioActual = new Date().getFullYear();
  for (let i = 0; i < 5; i++) {
    anios.push(anioActual - i);
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Cargando movimientos...</div>
      </div>
    );
  }

  const movimientos = movimientosData?.movimientos || [];
  const salones = ['Diamond', 'Kendall', 'Doral'];

  // Vista 1: Seleccionar Salón o Inventario Central
  if (!selectedSalon) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Historial</h1>
          <p className="text-gray-600 mt-1">Selecciona un salón o el inventario central para ver sus movimientos</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {salones.map((salon) => (
            <button
              key={salon}
              onClick={() => setSelectedSalon(salon)}
              className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition text-left border-2 border-transparent hover:border-blue-500"
            >
              <div className="flex items-center gap-4 mb-4">
                <Building2 className="w-12 h-12 text-blue-600" />
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">{salon}</h3>
                  <p className="text-sm text-gray-600">Salón</p>
                </div>
              </div>
            </button>
          ))}
          <button
            onClick={() => setSelectedSalon('central')}
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition text-left border-2 border-transparent hover:border-green-500"
          >
            <div className="flex items-center gap-4 mb-4">
              <Warehouse className="w-12 h-12 text-green-600" />
              <div>
                <h3 className="text-2xl font-bold text-gray-900">Inventario Central</h3>
                <p className="text-sm text-gray-600">Almacén Central</p>
              </div>
            </div>
          </button>
        </div>
      </div>
    );
  }

  // Vista 2: Ver Movimientos del Salón filtrados por mes y año
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => {
            setSelectedSalon(null);
            setMesSeleccionado(new Date().getMonth() + 1);
            setAnioSeleccionado(new Date().getFullYear());
          }}
          className="text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Historial - {selectedSalon === 'central' ? 'Inventario Central' : selectedSalon}
          </h1>
          <p className="text-gray-600 mt-1">
            {selectedSalon === 'central' ? 'Movimientos del inventario central' : 'Movimientos del salón'}
          </p>
        </div>
      </div>

      {/* Filtros de Mes y Año */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center gap-4">
          <Filter className="w-5 h-5 text-gray-600" />
          <span className="font-medium text-gray-700">Filtrar por:</span>
          <select
            value={mesSeleccionado}
            onChange={(e) => setMesSeleccionado(parseInt(e.target.value))}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {meses.map((mes) => (
              <option key={mes.valor} value={mes.valor}>
                {mes.nombre}
              </option>
            ))}
          </select>
          <select
            value={anioSeleccionado}
            onChange={(e) => setAnioSeleccionado(parseInt(e.target.value))}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {anios.map((anio) => (
              <option key={anio} value={anio}>
                {anio}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Lista de Movimientos Agrupados por Tipo */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Movimientos ({selectedSalon === 'central' 
              ? movimientos.filter(mov => {
                  const tipoClave = getTipoClave(mov.tipo_movimiento, mov.origen, mov.destino);
                  return tipoClave !== 'asignacion-evento' && mov.tipo_movimiento !== 'salida';
                }).length 
              : movimientos.length})
          </h2>
        </div>
        <div className="p-6">
          {(() => {
            // Filtrar movimientos: si es inventario central, excluir asignaciones a eventos y movimientos de tipo "salida"
            const movimientosFiltrados = selectedSalon === 'central'
              ? movimientos.filter(mov => {
                  const tipoClave = getTipoClave(mov.tipo_movimiento, mov.origen, mov.destino);
                  // Excluir asignaciones a eventos y movimientos de tipo "salida"
                  return tipoClave !== 'asignacion-evento' && mov.tipo_movimiento !== 'salida';
                })
              : movimientos;

            if (movimientosFiltrados.length === 0) {
              return (
                <div className="text-center py-8 text-gray-500">
                  No hay movimientos para {selectedSalon === 'central' ? 'el inventario central' : 'este salón'} en el mes y año seleccionados
                </div>
              );
            }

            // Agrupar movimientos por tipo
            const movimientosAgrupados = {};
            movimientosFiltrados.forEach((movimiento) => {
              const tipoClave = getTipoClave(movimiento.tipo_movimiento, movimiento.origen, movimiento.destino);
              if (!movimientosAgrupados[tipoClave]) {
                movimientosAgrupados[tipoClave] = {
                  tipoNombre: getTipoNombre(movimiento.tipo_movimiento, movimiento.origen, movimiento.destino),
                  tipoColor: getTipoColor(movimiento.tipo_movimiento, movimiento.origen, movimiento.destino),
                  tipoIcono: getTipoIcono(movimiento.tipo_movimiento, movimiento.origen, movimiento.destino),
                  movimientos: []
                };
              }
              movimientosAgrupados[tipoClave].movimientos.push(movimiento);
            });

            // Ordenar tipos según si es central o salón
            const ordenTipos = selectedSalon === 'central'
              ? ['central-salon', 'salon-central', 'compra-entrante', 'edicion-central', 'otros']
              : ['asignacion-evento', 'central-salon', 'salon-central', 'edicion-central', 'otros'];
            const tiposOrdenados = Object.keys(movimientosAgrupados).sort((a, b) => {
              const indexA = ordenTipos.indexOf(a);
              const indexB = ordenTipos.indexOf(b);
              if (indexA === -1) return 1;
              if (indexB === -1) return -1;
              return indexA - indexB;
            });

            return (
              <div className="space-y-4">
                {tiposOrdenados.map((tipoClave) => {
                  const grupo = movimientosAgrupados[tipoClave];
                  const estaExpandido = tiposExpandidos[tipoClave] || false;

                  return (
                    <div key={tipoClave} className="border border-gray-200 rounded-lg overflow-hidden">
                      {/* Header del grupo - Clickable */}
                      <button
                        onClick={() => setTiposExpandidos(prev => ({
                          ...prev,
                          [tipoClave]: !prev[tipoClave]
                        }))}
                        className="w-full bg-gray-100 px-6 py-4 border-b border-gray-200 hover:bg-gray-200 transition flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <ChevronDown 
                            className={`w-5 h-5 text-gray-600 transition-transform ${estaExpandido ? '' : '-rotate-90'}`} 
                          />
                          <div className={`p-2 rounded-lg ${grupo.tipoColor}`}>
                            {grupo.tipoIcono}
                          </div>
                          <h3 className="text-lg font-semibold text-gray-900">{grupo.tipoNombre}</h3>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span>{grupo.movimientos.length} {grupo.movimientos.length === 1 ? 'movimiento' : 'movimientos'}</span>
                        </div>
                      </button>
                      
                      {/* Lista de movimientos del grupo - Condicionalmente visible */}
                      {estaExpandido && (
                        <div className="p-4 space-y-3 bg-white">
                          {grupo.movimientos.map((movimiento) => {
                            // Determinar si es incremento o decremento para ediciones
                            const esIncremento = movimiento.motivo?.toLowerCase().includes('incremento') || 
                                                 movimiento.motivo?.toLowerCase().includes('aumento') ||
                                                 movimiento.motivo?.toLowerCase().includes('+');
                            const esDecremento = movimiento.motivo?.toLowerCase().includes('decremento') || 
                                                 movimiento.motivo?.toLowerCase().includes('disminución') ||
                                                 movimiento.motivo?.toLowerCase().includes('-');

                            return (
                              <div
                                key={movimiento.id}
                                className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition"
                              >
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-3">
                                      <h3 className="text-lg font-semibold text-gray-900">
                                        {movimiento.inventario_items?.nombre}
                                      </h3>
                                      {/* Indicador de + o - para ediciones */}
                                      {movimiento.tipo_movimiento === 'entrada' && movimiento.origen?.toLowerCase() === 'central' && !movimiento.destino && (
                                        <span className={`px-2 py-1 text-xs rounded-full font-bold ${
                                          esIncremento ? 'bg-green-200 text-green-800' : 
                                          esDecremento ? 'bg-red-200 text-red-800' : 
                                          'bg-gray-200 text-gray-800'
                                        }`}>
                                          {esIncremento ? '+' : esDecremento ? '-' : '±'}
                                        </span>
                                      )}
                                    </div>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                                      <div className="text-sm">
                                        <span className="font-medium text-gray-700">Cantidad: </span>
                                        <span className="text-gray-900 font-semibold">
                                          {parseFloat(movimiento.cantidad).toFixed(2)} {movimiento.inventario_items?.unidad_medida}
                                        </span>
                                      </div>
                                      {movimiento.motivo && (
                                        <div className="text-sm">
                                          <span className="font-medium text-gray-700">Motivo: </span>
                                          <span className="text-gray-900">{movimiento.motivo}</span>
                                        </div>
                                      )}
                                    </div>

                                    {movimiento.contratos && (
                                      <div className="text-sm mb-3 p-2 bg-purple-50 rounded-lg">
                                        <span className="font-medium text-gray-700">Evento: </span>
                                        <span className="text-gray-900">
                                          {movimiento.contratos.codigo_contrato} - {movimiento.contratos.clientes?.nombre_completo}
                                        </span>
                                        {movimiento.contratos.salones && (
                                          <span className="text-gray-600 ml-2">
                                            ({movimiento.contratos.salones.nombre})
                                          </span>
                                        )}
                                      </div>
                                    )}

                                    <div className="flex items-center gap-6 pt-3 border-t border-gray-200 text-sm">
                                      <div className="flex items-center gap-2">
                                        <Calendar className="w-4 h-4 text-gray-500" />
                                        <span className="font-medium text-gray-700">Fecha: </span>
                                        <span className="text-gray-900">
                                          {new Date(movimiento.fecha_movimiento).toLocaleDateString('es-ES', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                          })}
                                        </span>
                                      </div>
                                      {movimiento.usuarios_inventario && (
                                        <div className="flex items-center gap-2">
                                          <User className="w-4 h-4 text-gray-500" />
                                          <span className="font-medium text-gray-700">Usuario: </span>
                                          <span className="text-gray-900">{movimiento.usuarios_inventario.nombre_completo}</span>
                                        </div>
                                      )}
                                    </div>
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
            );
          })()}
        </div>
      </div>
    </div>
  );
}

export default MovimientosInventario;
