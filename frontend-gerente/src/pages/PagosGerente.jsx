import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Filter, Calendar, DollarSign, Loader2, FileText, User, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '@shared/config/api';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

function PagosGerente() {
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

  const { data: pagosData, isLoading } = useQuery({
    queryKey: ['gerente-pagos', mesSeleccionado, añoSeleccionado],
    queryFn: async () => {
      const params = {
        mes: mesSeleccionado,
        año: añoSeleccionado
      };
      
      const response = await api.get('/gerentes/pagos', { params });
      return response.data;
    },
  });

  const pagos = pagosData?.pagos || [];
  const totalPagos = pagosData?.total_pagos || 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
        <p className="ml-3 text-gray-600">Cargando pagos...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Todos los Pagos</h1>
            <p className="text-gray-600">Visualiza todos los pagos registrados en el sistema</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Total Pagos</p>
            <p className="text-2xl font-bold text-purple-600">
              ${parseFloat(totalPagos).toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Selector de Mes y Año */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-5 h-5 text-gray-500" />
          <h2 className="text-lg font-semibold text-gray-900">Seleccionar Mes y Año</h2>
        </div>
        <div className="flex items-center gap-2 bg-white rounded-lg border-2 border-purple-200 p-2 w-fit">
          <button
            onClick={() => cambiarMes('anterior')}
            className="p-1 hover:bg-purple-50 rounded transition"
            title="Mes anterior"
          >
            <ChevronLeft className="w-5 h-5 text-purple-600" />
          </button>
          
          <div className="flex items-center gap-2 px-3">
            <Calendar className="w-4 h-4 text-purple-600" />
            <select
              value={mesSeleccionado}
              onChange={(e) => setMesSeleccionado(parseInt(e.target.value))}
              className="text-sm font-semibold text-gray-900 bg-transparent border-none outline-none cursor-pointer"
            >
              {nombresMeses.map((mes, index) => (
                <option key={index} value={index + 1}>{mes}</option>
              ))}
            </select>
            <select
              value={añoSeleccionado}
              onChange={(e) => setAñoSeleccionado(parseInt(e.target.value))}
              className="text-sm font-semibold text-gray-900 bg-transparent border-none outline-none cursor-pointer"
            >
              {Array.from({ length: 5 }, (_, i) => fechaActual.getFullYear() - 2 + i).map(año => (
                <option key={año} value={año}>{año}</option>
              ))}
            </select>
          </div>

          <button
            onClick={() => cambiarMes('siguiente')}
            className="p-1 hover:bg-purple-50 rounded transition"
            title="Mes siguiente"
          >
            <ChevronRight className="w-5 h-5 text-purple-600" />
          </button>

          {(mesSeleccionado !== fechaActual.getMonth() + 1 || añoSeleccionado !== fechaActual.getFullYear()) && (
            <button
              onClick={resetearMes}
              className="ml-2 px-3 py-1 text-xs font-medium text-purple-600 hover:bg-purple-50 rounded transition"
              title="Volver al mes actual"
            >
              Hoy
            </button>
          )}
        </div>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Pagos</p>
              <p className="text-2xl font-bold text-gray-900">{pagos.length}</p>
            </div>
            <FileText className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Monto Total</p>
              <p className="text-2xl font-bold text-gray-900">
                ${parseFloat(totalPagos).toLocaleString()}
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-green-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Promedio por Pago</p>
              <p className="text-2xl font-bold text-gray-900">
                ${pagos.length > 0 ? parseFloat(totalPagos / pagos.length).toLocaleString('es-ES', { maximumFractionDigits: 2 }) : '0'}
              </p>
            </div>
            <Calendar className="w-8 h-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Lista de Pagos */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <p className="text-sm text-gray-600">
            Mostrando {pagos.length} pagos
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contrato
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vendedor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Monto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Método
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {pagos.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                    No hay pagos registrados
                  </td>
                </tr>
              ) : (
                pagos.map((pago) => (
                  <tr key={pago.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {pago.fecha_pago 
                        ? format(new Date(pago.fecha_pago), 'dd/MM/yyyy', { locale: es })
                        : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {pago.contratos?.codigo_contrato || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {pago.contratos?.clientes?.nombre_completo || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {pago.contratos?.vendedores?.nombre_completo || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                      ${parseFloat(pago.monto || 0).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {pago.metodo_pago || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default PagosGerente;

