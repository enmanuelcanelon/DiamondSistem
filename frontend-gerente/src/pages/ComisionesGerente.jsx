import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DollarSign, CheckCircle2, XCircle, Loader2, AlertCircle, User, Calendar, FileText, ChevronDown, ChevronUp, Filter, Download } from 'lucide-react';
import api from '@shared/config/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

function ComisionesGerente() {
  const fechaActual = new Date();
  const [mesSeleccionado, setMesSeleccionado] = useState(fechaActual.getMonth() + 1);
  const [añoSeleccionado, setAñoSeleccionado] = useState(fechaActual.getFullYear());
  const [vendedoresExpandidos, setVendedoresExpandidos] = useState({});

  const nombresMeses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const toggleVendedor = (vendedorId) => {
    setVendedoresExpandidos(prev => ({
      ...prev,
      [vendedorId]: !prev[vendedorId]
    }));
  };

  const { data: comisionesData, isLoading, isError } = useQuery({
    queryKey: ['gerente-comisiones', mesSeleccionado, añoSeleccionado],
    queryFn: async () => {
      const response = await api.get('/gerentes/comisiones', {
        params: {
          mes: mesSeleccionado,
          año: añoSeleccionado
        }
      });
      return response.data;
    }
  });

  const [descargandoPDF, setDescargandoPDF] = useState(false);

  const handleDescargarResumen = async () => {
    try {
      setDescargandoPDF(true);
      const response = await api.get('/gerentes/comisiones/resumen-pdf', {
        params: {
          mes: mesSeleccionado,
          año: añoSeleccionado
        },
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Resumen-Comisiones-${nombresMeses[mesSeleccionado - 1]}-${añoSeleccionado}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('PDF descargado exitosamente');
    } catch (error) {
      toast.error('Error al descargar el PDF');
      console.error(error);
    } finally {
      setDescargandoPDF(false);
    }
  };

  const vendedores = comisionesData?.vendedores || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">Error al cargar las comisiones</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestión de Comisiones</h1>
        <p className="text-gray-600">Visualiza y descarga resúmenes de pagos de comisiones por vendedor</p>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-500" />
            <h2 className="text-lg font-semibold text-gray-900">Filtros</h2>
          </div>
          <button
            onClick={handleDescargarResumen}
            disabled={descargandoPDF}
            className="px-4 py-2 bg-foreground text-background rounded-lg hover:bg-foreground/90 transition flex items-center gap-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {descargandoPDF ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generando...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Descargar Resumen PDF
              </>
            )}
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Mes</label>
            <select
              value={mesSeleccionado}
              onChange={(e) => setMesSeleccionado(parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent"
            >
              {nombresMeses.map((mes, index) => (
                <option key={index + 1} value={index + 1}>
                  {mes}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Año</label>
            <select
              value={añoSeleccionado}
              onChange={(e) => setAñoSeleccionado(parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent"
            >
              {Array.from({ length: 5 }, (_, i) => fechaActual.getFullYear() - i).map((año) => (
                <option key={año} value={año}>
                  {año}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Vendedores con Comisiones */}
      {vendedores.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No hay vendedores con comisiones en este período</p>
        </div>
      ) : (
        <div className="space-y-4">
          {vendedores.map((vendedorData) => {
            const { vendedor, comisiones, comisiones_pendientes, comisiones_pagadas } = vendedorData;
            const estaExpandido = vendedoresExpandidos[vendedor.id];

            return (
              <div key={vendedor.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
                {/* Header del Vendedor */}
                <div
                  className="p-4 bg-muted/30 border-b cursor-pointer hover:bg-muted/50 transition"
                  onClick={() => toggleVendedor(vendedor.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <User className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <h3 className="font-semibold text-gray-900">{vendedor.nombre_completo}</h3>
                        <p className="text-sm text-gray-600">{vendedor.codigo_vendedor}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-xs text-gray-600">Total Desbloqueadas</p>
                        <p className="text-lg font-bold">
                          ${parseFloat(comisiones.total_desbloqueadas || 0).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                      </div>
                      {estaExpandido ? (
                        <ChevronUp className="w-5 h-5 text-gray-500" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-500" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Contenido Expandible */}
                {estaExpandido && (
                  <div className="p-6 space-y-6">
                    {/* Resumen de Comisiones */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-muted/50 border rounded-lg p-4">
                        <p className="text-xs text-muted-foreground mb-1">Pendientes de Pago</p>
                        <p className="text-2xl font-bold">
                          ${parseFloat(comisiones.pendientes || 0).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                      </div>
                      <div className="bg-muted/50 border rounded-lg p-4">
                        <p className="text-xs text-muted-foreground mb-1">Pagadas</p>
                        <p className="text-2xl font-bold">
                          ${parseFloat(comisiones.pagadas || 0).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                      </div>
                      <div className="bg-muted/50 border rounded-lg p-4">
                        <p className="text-xs text-muted-foreground mb-1">Total</p>
                        <p className="text-2xl font-bold">
                          ${parseFloat(comisiones.total || 0).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>

                    {/* Comisiones Pendientes */}
                    {comisiones_pendientes && comisiones_pendientes.length > 0 && (
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                          <XCircle className="w-5 h-5 text-muted-foreground" />
                          Comisiones Pendientes de Pago ({comisiones_pendientes.length})
                        </h4>

                        {/* Desktop Table */}
                        <div className="hidden md:block overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contrato</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Contrato</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Monto Comisión</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pagado</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pendiente</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {comisiones_pendientes.map((comision, idx) => (
                                <tr key={idx} className="hover:bg-gray-50">
                                  <td className="px-4 py-3 text-sm text-gray-900">{comision.codigo_contrato}</td>
                                  <td className="px-4 py-3 text-sm text-gray-600">{comision.cliente}</td>
                                  <td className="px-4 py-3 text-sm">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${comision.tipo === 'primera_mitad'
                                        ? 'bg-muted text-foreground'
                                        : 'bg-muted/50 text-muted-foreground'
                                      }`}>
                                      {comision.tipo === 'primera_mitad' ? 'Primera Mitad' : 'Segunda Mitad'}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 text-sm text-gray-900">
                                    ${parseFloat(comision.total_contrato || 0).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </td>
                                  <td className="px-4 py-3 text-sm text-gray-900">
                                    ${parseFloat(comision.monto_total || 0).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </td>
                                  <td className="px-4 py-3 text-sm text-gray-600">
                                    ${parseFloat(comision.monto_pagado || 0).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </td>
                                  <td className="px-4 py-3 text-sm font-semibold">
                                    ${parseFloat(comision.monto_pendiente || 0).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        {/* Mobile Cards */}
                        <div className="md:hidden space-y-3">
                          {comisiones_pendientes.map((comision, idx) => (
                            <div key={idx} className="bg-muted/20 border rounded-lg p-3 space-y-2">
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="font-medium text-gray-900">{comision.cliente}</p>
                                  <p className="text-xs text-gray-500">{comision.codigo_contrato}</p>
                                </div>
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${comision.tipo === 'primera_mitad'
                                    ? 'bg-muted text-foreground'
                                    : 'bg-muted/50 text-muted-foreground'
                                  }`}>
                                  {comision.tipo === 'primera_mitad' ? '1ª Mitad' : '2ª Mitad'}
                                </span>
                              </div>

                              <div className="grid grid-cols-2 gap-2 text-xs">
                                <div>
                                  <p className="text-gray-500">Comisión Total</p>
                                  <p className="font-medium">${parseFloat(comision.monto_total || 0).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                </div>
                                <div>
                                  <p className="text-gray-500">Pendiente</p>
                                  <p className="font-bold text-red-600">${parseFloat(comision.monto_pendiente || 0).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Comisiones Pagadas */}
                    {comisiones_pagadas && comisiones_pagadas.length > 0 && (
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                          <CheckCircle2 className="w-5 h-5 text-muted-foreground" />
                          Comisiones Pagadas ({comisiones_pagadas.length})
                        </h4>

                        {/* Desktop Table */}
                        <div className="hidden md:block overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contrato</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Contrato</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Monto Comisión</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pagado</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha Pago</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {comisiones_pagadas.map((comision, idx) => (
                                <tr key={idx} className="hover:bg-gray-50">
                                  <td className="px-4 py-3 text-sm text-gray-900">{comision.codigo_contrato}</td>
                                  <td className="px-4 py-3 text-sm text-gray-600">{comision.cliente}</td>
                                  <td className="px-4 py-3 text-sm">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${comision.tipo === 'primera_mitad'
                                        ? 'bg-muted text-foreground'
                                        : 'bg-muted/50 text-muted-foreground'
                                      }`}>
                                      {comision.tipo === 'primera_mitad' ? 'Primera Mitad' : 'Segunda Mitad'}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 text-sm text-gray-900">
                                    ${parseFloat(comision.total_contrato || 0).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </td>
                                  <td className="px-4 py-3 text-sm text-gray-900">
                                    ${parseFloat(comision.monto_total || 0).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </td>
                                  <td className="px-4 py-3 text-sm font-semibold">
                                    ${parseFloat(comision.monto_pagado || 0).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </td>
                                  <td className="px-4 py-3 text-sm text-gray-600">
                                    {comision.fecha_pago
                                      ? format(new Date(comision.fecha_pago), 'dd/MM/yyyy', { locale: es })
                                      : '-'}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        {/* Mobile Cards */}
                        <div className="md:hidden space-y-3">
                          {comisiones_pagadas.map((comision, idx) => (
                            <div key={idx} className="bg-muted/20 border rounded-lg p-3 space-y-2">
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="font-medium text-gray-900">{comision.cliente}</p>
                                  <p className="text-xs text-gray-500">{comision.codigo_contrato}</p>
                                </div>
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${comision.tipo === 'primera_mitad'
                                    ? 'bg-muted text-foreground'
                                    : 'bg-muted/50 text-muted-foreground'
                                  }`}>
                                  {comision.tipo === 'primera_mitad' ? '1ª Mitad' : '2ª Mitad'}
                                </span>
                              </div>

                              <div className="grid grid-cols-2 gap-2 text-xs">
                                <div>
                                  <p className="text-gray-500">Pagado</p>
                                  <p className="font-bold text-green-600">${parseFloat(comision.monto_pagado || 0).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                </div>
                                <div>
                                  <p className="text-gray-500">Fecha</p>
                                  <p className="font-medium">
                                    {comision.fecha_pago
                                      ? format(new Date(comision.fecha_pago), 'dd/MM/yyyy', { locale: es })
                                      : '-'}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {(!comisiones_pendientes || comisiones_pendientes.length === 0) &&
                      (!comisiones_pagadas || comisiones_pagadas.length === 0) && (
                        <div className="text-center py-8 text-gray-500">
                          <FileText className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                          <p>No hay comisiones registradas para este vendedor</p>
                        </div>
                      )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default ComisionesGerente;

