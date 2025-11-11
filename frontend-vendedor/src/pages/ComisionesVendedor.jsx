import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DollarSign, CheckCircle2, XCircle, Loader2, AlertCircle, Calendar, FileText, Filter, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../config/api';
import useAuthStore from '../store/useAuthStore';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

function ComisionesVendedor() {
  const { user } = useAuthStore();
  const fechaActual = new Date();
  const [mesSeleccionado, setMesSeleccionado] = useState(fechaActual.getMonth() + 1);
  const [añoSeleccionado, setAñoSeleccionado] = useState(fechaActual.getFullYear());

  const nombresMeses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const cambiarMes = (direccion) => {
    if (direccion === 'anterior') {
      if (mesSeleccionado === 1) {
        setMesSeleccionado(12);
        setAñoSeleccionado(añoSeleccionado - 1);
      } else {
        setMesSeleccionado(mesSeleccionado - 1);
      }
    } else {
      if (mesSeleccionado === 12) {
        setMesSeleccionado(1);
        setAñoSeleccionado(añoSeleccionado + 1);
      } else {
        setMesSeleccionado(mesSeleccionado + 1);
      }
    }
  };

  const resetearMes = () => {
    setMesSeleccionado(fechaActual.getMonth() + 1);
    setAñoSeleccionado(fechaActual.getFullYear());
  };

  const { data: comisionesData, isLoading, isError } = useQuery({
    queryKey: ['vendedor-comisiones', user?.id, mesSeleccionado, añoSeleccionado],
    queryFn: async () => {
      const response = await api.get(`/vendedores/${user.id}/comisiones`, {
        params: {
          mes: mesSeleccionado,
          año: añoSeleccionado
        }
      });
      return response.data;
    },
    enabled: !!user?.id
  });

  const [descargandoPDF, setDescargandoPDF] = useState(false);

  const handleDescargarResumen = async () => {
    try {
      setDescargandoPDF(true);
      const response = await api.get(`/vendedores/${user.id}/comisiones/resumen-pdf`, {
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <p className="text-red-700">Error al cargar las comisiones</p>
      </div>
    );
  }

  const { vendedor, comisiones, comisiones_pendientes, comisiones_pagadas } = comisionesData || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Mis Comisiones</h1>
        <p className="text-gray-600">Visualiza y descarga el resumen de tus comisiones</p>
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
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition flex items-center gap-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
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
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-white rounded-lg border-2 border-indigo-200 p-2">
            <button
              onClick={() => cambiarMes('anterior')}
              className="p-1 hover:bg-indigo-50 rounded transition"
              title="Mes anterior"
            >
              <ChevronLeft className="w-5 h-5 text-indigo-600" />
            </button>
            
            <div className="flex items-center gap-2 px-3">
              <select
                value={mesSeleccionado}
                onChange={(e) => setMesSeleccionado(parseInt(e.target.value))}
                className="text-sm font-semibold text-gray-900 bg-transparent border-none outline-none cursor-pointer"
              >
                {nombresMeses.map((mes, index) => (
                  <option key={index + 1} value={index + 1}>
                    {mes}
                  </option>
                ))}
              </select>
              <select
                value={añoSeleccionado}
                onChange={(e) => setAñoSeleccionado(parseInt(e.target.value))}
                className="text-sm font-semibold text-gray-900 bg-transparent border-none outline-none cursor-pointer"
              >
                {Array.from({ length: 5 }, (_, i) => fechaActual.getFullYear() - i).map((año) => (
                  <option key={año} value={año}>
                    {año}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => cambiarMes('siguiente')}
              className="p-1 hover:bg-indigo-50 rounded transition"
              title="Mes siguiente"
            >
              <ChevronRight className="w-5 h-5 text-indigo-600" />
            </button>

            {(mesSeleccionado !== fechaActual.getMonth() + 1 || añoSeleccionado !== fechaActual.getFullYear()) && (
              <button
                onClick={resetearMes}
                className="ml-2 px-3 py-1 text-xs font-medium text-indigo-600 hover:bg-indigo-50 rounded transition"
                title="Volver al mes actual"
              >
                Hoy
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Resumen de Comisiones */}
      {vendedor && (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="p-6 bg-gradient-to-r from-indigo-50 to-indigo-100 border-b border-indigo-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">{vendedor.nombre_completo}</h3>
                <p className="text-sm text-gray-600">{vendedor.codigo_vendedor}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-600">Total Desbloqueadas</p>
                <p className="text-2xl font-bold text-indigo-600">
                  ${parseFloat(comisiones?.total_desbloqueadas || 0).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Resumen de Comisiones */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-xs text-gray-600 mb-1">Pendientes de Pago</p>
                <p className="text-2xl font-bold text-yellow-700">
                  ${parseFloat(comisiones?.pendientes || 0).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-xs text-gray-600 mb-1">Pagadas</p>
                <p className="text-2xl font-bold text-green-700">
                  ${parseFloat(comisiones?.pagadas || 0).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
              <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                <p className="text-xs text-gray-600 mb-1">Total</p>
                <p className="text-2xl font-bold text-indigo-700">
                  ${parseFloat(comisiones?.total || 0).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
            </div>

            {/* Comisiones Pendientes */}
            {comisiones_pendientes && comisiones_pendientes.length > 0 && (
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <XCircle className="w-5 h-5 text-yellow-600" />
                  Comisiones Pendientes de Pago ({comisiones_pendientes.length})
                </h4>
                <div className="overflow-x-auto">
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
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              comision.tipo === 'primera_mitad' 
                                ? 'bg-blue-100 text-blue-800' 
                                : 'bg-purple-100 text-purple-800'
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
                          <td className="px-4 py-3 text-sm font-semibold text-yellow-700">
                            ${parseFloat(comision.monto_pendiente || 0).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Comisiones Pagadas */}
            {comisiones_pagadas && comisiones_pagadas.length > 0 && (
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  Comisiones Pagadas ({comisiones_pagadas.length})
                </h4>
                <div className="overflow-x-auto">
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
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              comision.tipo === 'primera_mitad' 
                                ? 'bg-blue-100 text-blue-800' 
                                : 'bg-purple-100 text-purple-800'
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
                          <td className="px-4 py-3 text-sm font-semibold text-green-700">
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
              </div>
            )}

            {(!comisiones_pendientes || comisiones_pendientes.length === 0) && 
             (!comisiones_pagadas || comisiones_pagadas.length === 0) && (
              <div className="text-center py-8 text-gray-500">
                <FileText className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                <p>No hay comisiones registradas para este período</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default ComisionesVendedor;

