import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, FileCheck, Calendar, DollarSign, Eye, Download, Filter } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../config/api';
import { generarNombreEvento, getEventoEmoji } from '../utils/eventNames';

function Contratos() {
  const [searchTerm, setSearchTerm] = useState('');
  const [estadoPagoFiltro, setEstadoPagoFiltro] = useState('');
  const [estadoContratoFiltro, setEstadoContratoFiltro] = useState('');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');

  const { data: contratos, isLoading } = useQuery({
    queryKey: ['contratos'],
    queryFn: async () => {
      const response = await api.get('/contratos');
      return response.data.contratos;
    },
  });

  // Filtrar contratos
  const contratosFiltrados = contratos?.filter(contrato => {
    const searchLower = searchTerm.toLowerCase();
    const matchSearch = 
      contrato.codigo_contrato.toLowerCase().includes(searchLower) ||
      contrato.clientes?.nombre_completo.toLowerCase().includes(searchLower);
    
    const matchEstadoPago = !estadoPagoFiltro || contrato.estado_pago === estadoPagoFiltro;
    const matchEstadoContrato = !estadoContratoFiltro || contrato.estado === estadoContratoFiltro;
    
    // Filtro por fecha de creación del contrato (fecha_firma)
    const fechaCreacion = new Date(contrato.fecha_firma);
    const matchFechaDesde = !fechaDesde || fechaCreacion >= new Date(fechaDesde);
    const matchFechaHasta = !fechaHasta || fechaCreacion <= new Date(fechaHasta);
    
    return matchSearch && matchEstadoPago && matchEstadoContrato && matchFechaDesde && matchFechaHasta;
  });

  const handleDescargarContrato = async (contratoId, codigoContrato) => {
    try {
      const response = await api.get(`/contratos/${contratoId}/pdf-contrato`, {
        responseType: 'blob'
      });
      
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Contrato-${codigoContrato}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      alert('Error al descargar el contrato');
      console.error(error);
    }
  };

  const getEstadoPagoColor = (estadoPago) => {
    switch (estadoPago) {
      case 'pendiente':
        return 'bg-yellow-100 text-yellow-800';
      case 'parcial':
        return 'bg-blue-100 text-blue-800';
      case 'pagado':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getEstadoContratoColor = (estado) => {
    switch (estado) {
      case 'activo':
        return 'bg-green-100 text-green-800';
      case 'completado':
        return 'bg-blue-100 text-blue-800';
      case 'cancelado':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Contratos</h1>
        <p className="text-gray-600 mt-1">Gestiona tus contratos y pagos</p>
      </div>

      {/* Búsqueda y filtros */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar por código o cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              />
            </div>
            <select 
              value={estadoPagoFiltro}
              onChange={(e) => setEstadoPagoFiltro(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
            >
              <option value="">Estado de Pago</option>
              <option value="pendiente">Pendiente</option>
              <option value="parcial">Parcial</option>
              <option value="pagado">Pagado</option>
            </select>
            <select 
              value={estadoContratoFiltro}
              onChange={(e) => setEstadoContratoFiltro(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
            >
              <option value="">Estado</option>
              <option value="activo">Activo</option>
              <option value="completado">Completado</option>
              <option value="cancelado">Cancelado</option>
            </select>
          </div>
          {/* Filtros de fecha de creación */}
          <div className="flex gap-4 items-center">
            <Calendar className="w-5 h-5 text-gray-400" />
            <span className="text-sm text-gray-700 font-medium">Fecha de creación:</span>
            <div className="flex gap-2 items-center">
              <label className="text-sm text-gray-600">Desde:</label>
              <input
                type="date"
                value={fechaDesde}
                onChange={(e) => setFechaDesde(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-sm"
              />
            </div>
            <div className="flex gap-2 items-center">
              <label className="text-sm text-gray-600">Hasta:</label>
              <input
                type="date"
                value={fechaHasta}
                onChange={(e) => setFechaHasta(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-sm"
              />
            </div>
            {(fechaDesde || fechaHasta) && (
              <button
                onClick={() => {
                  setFechaDesde('');
                  setFechaHasta('');
                }}
                className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
              >
                Limpiar
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Lista de contratos */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl p-6 shadow-sm border animate-pulse">
              <div className="flex items-center justify-between mb-4">
                <div className="h-6 bg-gray-200 rounded w-32"></div>
                <div className="h-6 bg-gray-200 rounded w-24"></div>
              </div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      ) : contratosFiltrados?.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center shadow-sm border">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileCheck className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {searchTerm || estadoPagoFiltro || estadoContratoFiltro ? 'No se encontraron contratos' : 'No hay contratos'}
          </h3>
          <p className="text-gray-600 mb-6">
            {searchTerm || estadoPagoFiltro || estadoContratoFiltro ? 'Intenta con otros filtros' : 'Los contratos se generan desde las ofertas aceptadas'}
          </p>
          {!searchTerm && !estadoPagoFiltro && !estadoContratoFiltro && (
            <Link
              to="/ofertas"
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
            >
              Ver Ofertas
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {contratosFiltrados?.map((contrato) => (
            <div
              key={contrato.id}
              className="bg-white rounded-xl p-6 shadow-sm border hover:shadow-md transition"
            >
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">{getEventoEmoji(contrato)}</span>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {generarNombreEvento(contrato)}
                      </h3>
                      <p className="text-xs text-gray-500 font-mono">
                        {contrato.codigo_contrato}
                      </p>
                    </div>
                    <span className={`px-3 py-1 text-xs font-medium rounded-full ${getEstadoContratoColor(contrato.estado)}`}>
                      {contrato.estado.charAt(0).toUpperCase() + contrato.estado.slice(1)}
                    </span>
                    <span className={`px-3 py-1 text-xs font-medium rounded-full ${getEstadoPagoColor(contrato.estado_pago)}`}>
                      {contrato.estado_pago === 'pagado' ? 'Pagado' : contrato.estado_pago === 'parcial' ? 'Pago Parcial' : 'Pago Pendiente'}
                    </span>
                  </div>

                  <p className="text-gray-600 mb-3 ml-11">
                    Cliente: <span className="font-medium">{contrato.clientes?.nombre_completo || 'Sin cliente'}</span>
                  </p>

                  <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      {contrato.fecha_evento ? new Date(contrato.fecha_evento).toLocaleDateString('es-ES', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      }) : 'Fecha no disponible'}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{contrato.cantidad_invitados || 0} invitados</span>
                    </div>
                  </div>
                </div>

                <div className="lg:text-right space-y-2">
                  <div>
                    <p className="text-sm text-gray-600">Total Contrato</p>
                    <p className="text-2xl font-bold text-gray-900">
                      ${parseFloat(contrato.total_contrato || 0).toLocaleString()}
                    </p>
                  </div>

                  <div className="flex flex-col gap-1 text-sm">
                    <div className="flex justify-between gap-4">
                      <span className="text-gray-600">Pagado:</span>
                      <span className="font-medium text-green-600">
                        ${parseFloat(contrato.total_pagado || 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span className="text-gray-600">Pendiente:</span>
                      <span className="font-medium text-orange-600">
                        ${parseFloat(contrato.saldo_pendiente || 0).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Barra de progreso de pago */}
              <div className="mt-4">
                <div className="flex justify-between text-xs text-gray-600 mb-1">
                  <span>Progreso de Pago</span>
                  <span>
                    {contrato.total_contrato > 0 
                      ? ((parseFloat(contrato.total_pagado || 0) / parseFloat(contrato.total_contrato)) * 100).toFixed(0)
                      : 0
                    }%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full transition-all"
                    style={{ 
                      width: `${contrato.total_contrato > 0 
                        ? (parseFloat(contrato.total_pagado || 0) / parseFloat(contrato.total_contrato)) * 100
                        : 0
                      }%` 
                    }}
                  ></div>
                </div>
              </div>

              {/* Acciones */}
              <div className="mt-4 pt-4 border-t space-y-3">
                <div className="flex gap-3">
                  <Link
                    to={`/contratos/${contrato.id}`}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition text-sm font-medium"
                  >
                    <Eye className="w-4 h-4" />
                    Ver Detalles
                  </Link>
                  {contrato.estado_pago !== 'pagado' && (
                    <Link
                      to={`/contratos/${contrato.id}?action=pago`}
                      className="flex-1 px-4 py-2 border border-indigo-300 text-indigo-600 rounded-lg hover:bg-indigo-50 transition text-sm font-medium text-center"
                    >
                      Registrar Pago
                    </Link>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleDescargarContrato(contrato.id, contrato.codigo_contrato)}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 border border-indigo-300 text-indigo-600 rounded-lg hover:bg-indigo-50 transition text-xs font-medium"
                  >
                    <Download className="w-3 h-3" />
                    Descargar Contrato PDF
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

export default Contratos;

