import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { History, Package, Calendar, User, ArrowRightLeft, Building2, ArrowLeft, Filter } from 'lucide-react';
import api from '@shared/config/api';

function MovimientosInventario() {
  const [selectedSalon, setSelectedSalon] = useState(null);
  const [selectedDia, setSelectedDia] = useState(null);
  const [selectedTipo, setSelectedTipo] = useState('');

  // Query para movimientos
  const { data: movimientosData, isLoading } = useQuery({
    queryKey: ['movimientos-inventario'],
    queryFn: async () => {
      const response = await api.get('/inventario/movimientos');
      return response.data;
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Cargando movimientos...</div>
      </div>
    );
  }

  const movimientos = movimientosData?.movimientos || [];
  
  // Debug: mostrar movimientos en consola
  if (movimientos.length > 0) {
    console.log('Total movimientos recibidos:', movimientos.length);
    console.log('Primeros 3 movimientos:', movimientos.slice(0, 3).map(m => ({
      id: m.id,
      tipo: m.tipo_movimiento,
      origen: m.origen,
      destino: m.destino,
      fecha: m.fecha_movimiento
    })));
  }
  
  // Obtener nombre del salón desde origen o destino
  const obtenerSalon = (movimiento) => {
    const salones = ['diamond', 'kendall', 'doral'];
    const destino = movimiento.destino?.toLowerCase()?.trim();
    const origen = movimiento.origen?.toLowerCase()?.trim();
    
    // Si el destino es un salón, ese es el salón
    if (destino && salones.includes(destino)) {
      return destino;
    }
    // Si el origen es un salón (y no es central, compra, o entrada), ese es el salón
    if (origen && salones.includes(origen) && origen !== 'central' && origen !== 'compra') {
      return origen;
    }
    // Para movimientos de asignación, el destino siempre es el salón
    if (movimiento.tipo_movimiento === 'asignacion' && destino && salones.includes(destino)) {
      return destino;
    }
    // Para movimientos de devolución, el origen es el salón
    if (movimiento.tipo_movimiento === 'devolucion' && origen && salones.includes(origen)) {
      return origen;
    }
    // Para movimientos de retorno a central (salida), el origen es el salón
    if (movimiento.tipo_movimiento === 'salida' && origen && salones.includes(origen)) {
      return origen;
    }
    return null; // No es de ningún salón
  };

  // Obtener nombre legible del tipo de movimiento
  const getTipoNombre = (tipo) => {
    switch (tipo) {
      case 'transferencia': return 'Transferencia';
      case 'asignacion': return 'Asignación';
      case 'devolucion': return 'Devolución';
      case 'salida': return 'Retorno a Central';
      case 'entrada': return 'Entrada';
      default: return tipo;
    }
  };

  const getTipoColor = (tipo) => {
    switch (tipo) {
      case 'entrada': return 'bg-green-100 text-green-800';
      case 'salida': return 'bg-orange-100 text-orange-800';
      case 'transferencia': return 'bg-blue-100 text-blue-800';
      case 'asignacion': return 'bg-purple-100 text-purple-800';
      case 'devolucion': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Capitalizar primera letra
  const capitalizar = (str) => {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  // Agrupar movimientos por salón y día (sin duplicar fechas)
  const agruparMovimientos = (movimientos) => {
    const agrupados = {};
    
    movimientos.forEach(movimiento => {
      const salon = obtenerSalon(movimiento);
      if (!salon) return; // Ignorar movimientos que no son de salones
      
      // Normalizar fecha: extraer solo año, mes y día (ignorar hora)
      const fecha = new Date(movimiento.fecha_movimiento);
      // Usar getFullYear, getMonth, getDate para evitar problemas de zona horaria
      const año = fecha.getFullYear();
      const mes = fecha.getMonth();
      const dia = fecha.getDate();
      
      // Crear fecha normalizada a medianoche local
      const fechaNormalizada = new Date(año, mes, dia);
      
      // Generar clave única usando año-mes-día
      const fechaSort = `${año}-${String(mes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
      
      if (!agrupados[salon]) {
        agrupados[salon] = {};
      }
      
      // Si ya existe el día, solo agregar el movimiento (no duplicar)
      if (!agrupados[salon][fechaSort]) {
        // Generar fechaKey una sola vez cuando se crea el día
        const fechaKey = fechaNormalizada.toLocaleDateString('es-ES', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
        
        agrupados[salon][fechaSort] = {
          fechaKey,
          fechaSort,
          movimientos: []
        };
      }
      
      agrupados[salon][fechaSort].movimientos.push(movimiento);
    });
    
    // Ordenar movimientos dentro de cada día por timestamp (más antiguo primero)
    Object.keys(agrupados).forEach(salon => {
      Object.keys(agrupados[salon]).forEach(fechaSort => {
        agrupados[salon][fechaSort].movimientos.sort((a, b) => {
          return new Date(a.fecha_movimiento) - new Date(b.fecha_movimiento);
        });
      });
    });
    
    return agrupados;
  };

  const movimientosAgrupados = agruparMovimientos(movimientos);
  
  // Debug: verificar agrupación
  if (Object.keys(movimientosAgrupados).length > 0) {
    Object.keys(movimientosAgrupados).forEach(salon => {
      const dias = Object.keys(movimientosAgrupados[salon]);
      console.log(`Salón ${salon}: ${dias.length} días únicos`, dias);
      dias.forEach(fechaSort => {
        console.log(`  - ${fechaSort}: ${movimientosAgrupados[salon][fechaSort].movimientos.length} movimientos`);
      });
    });
  }

  // Vista 1: Seleccionar Salón
  if (!selectedSalon) {
    const salones = ['diamond', 'kendall', 'doral'];
    
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Historial de Movimientos</h1>
          <p className="text-gray-600 mt-1">Selecciona un salón para ver sus movimientos</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {salones.map((salon) => {
            const dias = movimientosAgrupados[salon] ? Object.keys(movimientosAgrupados[salon]) : [];
            const totalMovimientos = dias.reduce((total, dia) => {
              return total + (movimientosAgrupados[salon][dia]?.movimientos.length || 0);
            }, 0);

            return (
              <button
                key={salon}
                onClick={() => setSelectedSalon(salon)}
                className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition text-left border-2 border-transparent hover:border-blue-500"
              >
                <div className="flex items-center gap-4 mb-4">
                  <Building2 className="w-12 h-12 text-blue-600" />
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">{capitalizar(salon)}</h3>
                    <p className="text-sm text-gray-600">Salón</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Total movimientos:</span>
                    <span className="font-semibold text-gray-900">{totalMovimientos}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Días con actividad:</span>
                    <span className="font-semibold text-gray-900">{dias.length}</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // Vista 2: Seleccionar Día
  if (!selectedDia) {
    const dias = movimientosAgrupados[selectedSalon] 
      ? Object.keys(movimientosAgrupados[selectedSalon]).sort((a, b) => {
          // Ordenar días de más reciente a más antiguo
          return new Date(b) - new Date(a);
        })
      : [];

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => {
              setSelectedSalon(null);
              setSelectedDia(null);
              setSelectedTipo('');
            }}
            className="text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Salón {capitalizar(selectedSalon)}</h1>
            <p className="text-gray-600 mt-1">Selecciona un día para ver los movimientos</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Días con actividad</h2>
          </div>
          <div className="p-6">
            {dias.length > 0 ? (
              <div className="space-y-2">
                {dias.map((fechaSort) => {
                  const diaData = movimientosAgrupados[selectedSalon][fechaSort];
                  const tiposMovimientos = [...new Set(diaData.movimientos.map(m => m.tipo_movimiento))];
                  
                  return (
                    <button
                      key={fechaSort}
                      onClick={() => setSelectedDia(fechaSort)}
                      className="w-full text-left p-4 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-500 transition flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <Calendar className="w-5 h-5 text-blue-600" />
                        <div>
                          <h3 className="font-semibold text-gray-900">{diaData.fechaKey}</h3>
                          <p className="text-sm text-gray-600">
                            {diaData.movimientos.length} {diaData.movimientos.length === 1 ? 'movimiento' : 'movimientos'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {tiposMovimientos.map(tipo => (
                          <span
                            key={tipo}
                            className={`px-2 py-1 text-xs rounded-full ${getTipoColor(tipo)}`}
                          >
                            {getTipoNombre(tipo)}
                          </span>
                        ))}
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No hay movimientos para este salón
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Vista 3: Ver Movimientos del Día con Filtro
  const diaData = movimientosAgrupados[selectedSalon][selectedDia];
  const tiposDisponibles = [...new Set(diaData.movimientos.map(m => m.tipo_movimiento))];
  const movimientosFiltrados = selectedTipo
    ? diaData.movimientos.filter(m => m.tipo_movimiento === selectedTipo)
    : diaData.movimientos;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => {
            setSelectedDia(null);
            setSelectedTipo('');
          }}
          className="text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {diaData.fechaKey} - {capitalizar(selectedSalon)}
          </h1>
          <p className="text-gray-600 mt-1">Movimientos del día</p>
        </div>
      </div>

      {/* Filtros de Tipo */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center gap-4">
          <Filter className="w-5 h-5 text-gray-600" />
          <span className="font-medium text-gray-700">Filtrar por tipo:</span>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setSelectedTipo('')}
              className={`px-4 py-2 rounded-lg transition ${
                selectedTipo === ''
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Todos
            </button>
            {tiposDisponibles.map(tipo => (
              <button
                key={tipo}
                onClick={() => setSelectedTipo(tipo)}
                className={`px-4 py-2 rounded-lg transition ${
                  selectedTipo === tipo
                    ? `${getTipoColor(tipo)} font-semibold`
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {getTipoNombre(tipo)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Lista de Movimientos */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Movimientos ({movimientosFiltrados.length})
          </h2>
        </div>
        <div className="p-6">
          {movimientosFiltrados.length > 0 ? (
            <div className="space-y-4">
              {movimientosFiltrados.map((movimiento) => (
                <div
                  key={movimiento.id}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <ArrowRightLeft className="w-5 h-5 text-blue-600" />
                        <h3 className="text-lg font-semibold text-gray-900">
                          {movimiento.inventario_items?.nombre}
                        </h3>
                        <span className={`px-2 py-1 text-xs rounded-full ${getTipoColor(movimiento.tipo_movimiento)}`}>
                          {getTipoNombre(movimiento.tipo_movimiento)}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                        <div className="text-sm">
                          <span className="font-medium text-gray-700">Cantidad: </span>
                          <span className="text-gray-900">
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
                        <div className="text-sm mb-3">
                          <span className="font-medium text-gray-700">Contrato: </span>
                          <span className="text-gray-900">
                            {movimiento.contratos.codigo_contrato} - {movimiento.contratos.clientes?.nombre_completo}
                          </span>
                        </div>
                      )}

                      <div className="flex items-center gap-6 pt-3 border-t border-gray-200 text-sm">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-500" />
                          <span className="font-medium text-gray-700">Hora: </span>
                          <span className="text-gray-900">
                            {new Date(movimiento.fecha_movimiento).toLocaleTimeString('es-ES', {
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit'
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
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No hay movimientos de este tipo para este día
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default MovimientosInventario;
