import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DollarSign, CheckCircle2, XCircle, Loader2, AlertCircle, RefreshCw, User, Calendar, FileText, ChevronDown, ChevronUp, Filter, Download } from 'lucide-react';
import api from '@shared/config/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

function ComisionesAdministracion() {
  const queryClient = useQueryClient();
  const fechaActual = new Date();
  const [mesSeleccionado, setMesSeleccionado] = useState(fechaActual.getMonth() + 1);
  const [añoSeleccionado, setAñoSeleccionado] = useState(fechaActual.getFullYear());
  const [vendedoresExpandidos, setVendedoresExpandidos] = useState({});
  const [comisionAPagar, setComisionAPagar] = useState(null);
  const [montoPago, setMontoPago] = useState('');
  const [comisionARevertir, setComisionARevertir] = useState(null);

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

  const { data: comisionesData, isLoading } = useQuery({
    queryKey: ['comisiones-administracion', mesSeleccionado, añoSeleccionado],
    queryFn: async () => {
      const response = await api.get('/inventario/comisiones', {
        params: {
          mes: mesSeleccionado,
          año: añoSeleccionado
        }
      });
      return response.data;
    },
  });

  const pagarComisionMutation = useMutation({
    mutationFn: async ({ contrato_id, tipo, monto }) => {
      const response = await api.post('/inventario/comisiones/pagar', {
        contrato_id,
        tipo,
        monto: parseFloat(monto)
      });
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(['comisiones-administracion', mesSeleccionado, añoSeleccionado]);
      toast.success(data.message);
      setComisionAPagar(null);
      setMontoPago('');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Error al registrar el pago');
    }
  });

  const revertirPagoMutation = useMutation({
    mutationFn: async ({ contrato_id, tipo }) => {
      const response = await api.post('/inventario/comisiones/revertir', {
        contrato_id,
        tipo
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['comisiones-administracion', mesSeleccionado, añoSeleccionado]);
      toast.success('Pago de comisión revertido');
      setComisionARevertir(null);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Error al revertir el pago');
    }
  });

  const handlePagar = (comision) => {
    setComisionAPagar(comision);
    setMontoPago(comision.monto_pendiente?.toString() || comision.monto_total?.toString() || '');
  };

  const handleRevertir = (comision) => {
    setComisionARevertir(comision);
  };

  const registrarPago = () => {
    if (comisionAPagar && montoPago) {
      const monto = parseFloat(montoPago);
      if (isNaN(monto) || monto <= 0) {
        toast.error('El monto debe ser un número positivo');
        return;
      }
      const montoPendiente = comisionAPagar.monto_pendiente || comisionAPagar.monto_total;
      if (monto > montoPendiente) {
        toast.error(`El monto excede el pendiente ($${montoPendiente.toFixed(2)})`);
        return;
      }
      pagarComisionMutation.mutate({
        contrato_id: comisionAPagar.contrato_id,
        tipo: comisionAPagar.tipo,
        monto: monto
      });
    }
  };

  const [descargandoPDF, setDescargandoPDF] = useState(false);

  const handleDescargarResumen = async () => {
    try {
      setDescargandoPDF(true);
      const response = await api.get('/inventario/comisiones/resumen-pdf', {
        params: {
          mes: mesSeleccionado,
          año: añoSeleccionado
        },
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      const nombresMeses = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
      ];
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

  const revertirPago = () => {
    if (comisionARevertir) {
      revertirPagoMutation.mutate({
        contrato_id: comisionARevertir.contrato_id,
        tipo: comisionARevertir.tipo
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <p className="ml-3 text-gray-600">Cargando comisiones...</p>
      </div>
    );
  }

  const vendedores = comisionesData?.vendedores || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestión de Comisiones</h1>
        <p className="text-gray-600">Confirma y gestiona los pagos de comisiones desbloqueadas a vendedores</p>
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
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
          <p className="text-gray-500">No hay vendedores con comisiones registradas</p>
        </div>
      ) : (
        <div className="space-y-6">
          {vendedores.map((item) => {
            const estaExpandido = vendedoresExpandidos[item.vendedor.id];
            return (
              <div key={item.vendedor.id} className="bg-white rounded-lg shadow-sm">
                {/* Header del Vendedor */}
                <div 
                  className="flex items-center justify-between p-6 cursor-pointer hover:bg-gray-50 transition"
                  onClick={() => toggleVendedor(item.vendedor.id)}
                >
                  <div className="flex items-center gap-3 flex-1">
                    {estaExpandido ? (
                      <ChevronUp className="w-5 h-5 text-gray-500" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-500" />
                    )}
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">{item.vendedor.nombre_completo}</h2>
                      <p className="text-sm text-gray-500">{item.vendedor.codigo_vendedor}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Total Desbloqueadas</p>
                    <p className="text-2xl font-bold text-blue-600">
                      ${parseFloat(item.comisiones.total_desbloqueadas || 0).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>

                {/* Contenido Expandible */}
                {estaExpandido && (
                  <div className="px-6 pb-6 border-t border-gray-200">
                    {/* Resumen de Comisiones */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 mt-6">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-sm text-gray-500 mb-1">Pendientes de Pago</p>
                        <p className="text-xl font-bold text-yellow-600">
                          ${parseFloat(item.comisiones.pendientes || 0).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4">
                        <p className="text-sm text-gray-500 mb-1">Pagadas</p>
                        <p className="text-xl font-bold text-green-600">
                          ${parseFloat(item.comisiones.pagadas || 0).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                      </div>
                      <div className="bg-blue-50 rounded-lg p-4">
                        <p className="text-sm text-gray-500 mb-1">Total</p>
                        <p className="text-xl font-bold text-blue-600">
                          ${parseFloat(item.comisiones.total || 0).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>

                    {/* Comisiones Pendientes */}
                    {item.comisiones_pendientes && item.comisiones_pendientes.length > 0 && (
                      <div className="mb-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                          <AlertCircle className="w-5 h-5 text-yellow-600" />
                          Comisiones Pendientes de Pago ({item.comisiones_pendientes.length})
                        </h3>
                        <div className="space-y-4">
                          {item.comisiones_pendientes.map((comision, idx) => (
                            <div key={`${comision.contrato_id}-${comision.tipo}-${idx}`} className="border border-yellow-200 rounded-lg p-4 bg-yellow-50">
                              <div className="mb-3">
                                <div className="flex items-center gap-3 mb-3">
                                  <FileText className="w-4 h-4 text-gray-500" />
                                  <span className="font-semibold text-gray-900">{comision.codigo_contrato}</span>
                                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                    comision.tipo === 'primera_mitad' 
                                      ? 'bg-blue-100 text-blue-800' 
                                      : 'bg-purple-100 text-purple-800'
                                  }`}>
                                    {comision.tipo === 'primera_mitad' ? 'Primera Mitad (1.5%)' : 'Segunda Mitad (1.5%)'}
                                  </span>
                                </div>
                                
                                {/* Información del Contrato */}
                                <div className="bg-white rounded-lg p-3 mb-3 space-y-2">
                                  <div className="flex justify-between">
                                    <span className="text-sm text-gray-600">Total Contrato:</span>
                                    <span className="text-sm font-semibold text-gray-900">
                                      ${parseFloat(comision.total_contrato || 0).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </span>
                                  </div>
                                  
                                  {comision.tipo === 'primera_mitad' ? (
                                    <>
                                      {comision.primer_pago && (
                                        <div className="flex justify-between">
                                          <span className="text-sm text-gray-600">Primer Pago:</span>
                                          <span className="text-sm font-semibold text-gray-900">
                                            ${parseFloat(comision.primer_pago.monto).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} - {format(new Date(comision.primer_pago.fecha), 'dd/MM/yyyy', { locale: es })}
                                          </span>
                                        </div>
                                      )}
                                      {comision.segundo_pago && (
                                        <div className="flex justify-between">
                                          <span className="text-sm text-gray-600">Segundo Pago:</span>
                                          <span className="text-sm font-semibold text-gray-900">
                                            ${parseFloat(comision.segundo_pago.monto).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} - {format(new Date(comision.segundo_pago.fecha), 'dd/MM/yyyy', { locale: es })}
                                          </span>
                                        </div>
                                      )}
                                    </>
                                  ) : (
                                    comision.pago_50_porciento && (
                                      <div className="flex justify-between">
                                        <span className="text-sm text-gray-600">Pago 50%:</span>
                                        <span className="text-sm font-semibold text-gray-900">
                                          ${parseFloat(comision.pago_50_porciento.monto).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} - {format(new Date(comision.pago_50_porciento.fecha), 'dd/MM/yyyy', { locale: es })}
                                        </span>
                                      </div>
                                    )
                                  )}
                                  
                                  <div className="border-t pt-2 mt-2">
                                    <div className="flex justify-between mb-1">
                                      <span className="text-sm text-gray-600">1.5% del Total:</span>
                                      <span className="text-sm font-semibold text-blue-600">
                                        ${parseFloat(comision.monto_total || 0).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                      </span>
                                    </div>
                                    {comision.monto_pagado > 0 && (
                                      <div className="flex justify-between mb-1">
                                        <span className="text-sm text-gray-600">Monto Pagado:</span>
                                        <span className="text-sm font-semibold text-green-600">
                                          ${parseFloat(comision.monto_pagado || 0).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </span>
                                      </div>
                                    )}
                                    <div className="flex justify-between">
                                      <span className="text-sm font-semibold text-gray-900">Pendiente:</span>
                                      <span className="text-sm font-bold text-yellow-600">
                                        ${parseFloat(comision.monto_pendiente || comision.monto_total || 0).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="flex justify-end gap-2">
                                <button
                                  onClick={() => handlePagar(comision)}
                                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2"
                                >
                                  <DollarSign className="w-4 h-4" />
                                  Pagar
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Comisiones Pagadas */}
                    {item.comisiones_pagadas && item.comisiones_pagadas.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                          <CheckCircle2 className="w-5 h-5 text-green-600" />
                          Comisiones Pagadas ({item.comisiones_pagadas.length})
                        </h3>
                        <div className="space-y-4">
                          {item.comisiones_pagadas.map((comision, idx) => (
                            <div key={`${comision.contrato_id}-${comision.tipo}-${idx}`} className="border border-green-200 rounded-lg p-4 bg-green-50">
                              <div className="mb-3">
                                <div className="flex items-center gap-3 mb-3">
                                  <FileText className="w-4 h-4 text-gray-500" />
                                  <span className="font-semibold text-gray-900">{comision.codigo_contrato}</span>
                                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                    comision.tipo === 'primera_mitad' 
                                      ? 'bg-blue-100 text-blue-800' 
                                      : 'bg-purple-100 text-purple-800'
                                  }`}>
                                    {comision.tipo === 'primera_mitad' ? 'Primera Mitad (1.5%)' : 'Segunda Mitad (1.5%)'}
                                  </span>
                                </div>
                                
                                {/* Información del Contrato */}
                                <div className="bg-white rounded-lg p-3 mb-3 space-y-2">
                                  <div className="flex justify-between">
                                    <span className="text-sm text-gray-600">Total Contrato:</span>
                                    <span className="text-sm font-semibold text-gray-900">
                                      ${parseFloat(comision.total_contrato || 0).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </span>
                                  </div>
                                  
                                  {comision.tipo === 'primera_mitad' ? (
                                    <>
                                      {comision.primer_pago && (
                                        <div className="flex justify-between">
                                          <span className="text-sm text-gray-600">Primer Pago:</span>
                                          <span className="text-sm font-semibold text-gray-900">
                                            ${parseFloat(comision.primer_pago.monto).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} - {format(new Date(comision.primer_pago.fecha), 'dd/MM/yyyy', { locale: es })}
                                          </span>
                                        </div>
                                      )}
                                      {comision.segundo_pago && (
                                        <div className="flex justify-between">
                                          <span className="text-sm text-gray-600">Segundo Pago:</span>
                                          <span className="text-sm font-semibold text-gray-900">
                                            ${parseFloat(comision.segundo_pago.monto).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} - {format(new Date(comision.segundo_pago.fecha), 'dd/MM/yyyy', { locale: es })}
                                          </span>
                                        </div>
                                      )}
                                    </>
                                  ) : (
                                    comision.pago_50_porciento && (
                                      <div className="flex justify-between">
                                        <span className="text-sm text-gray-600">Pago 50%:</span>
                                        <span className="text-sm font-semibold text-gray-900">
                                          ${parseFloat(comision.pago_50_porciento.monto).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} - {format(new Date(comision.pago_50_porciento.fecha), 'dd/MM/yyyy', { locale: es })}
                                        </span>
                                      </div>
                                    )
                                  )}
                                  
                                  <div className="border-t pt-2 mt-2">
                                    <div className="flex justify-between mb-1">
                                      <span className="text-sm text-gray-600">1.5% del Total:</span>
                                      <span className="text-sm font-semibold text-blue-600">
                                        ${parseFloat(comision.monto_total || 0).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                      </span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-sm font-semibold text-gray-900">Monto Pagado:</span>
                                      <span className="text-sm font-bold text-green-600">
                                        ${parseFloat(comision.monto_pagado || comision.monto_total || 0).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                      </span>
                                    </div>
                                    <div className="flex justify-between mt-1">
                                      <span className="text-xs text-gray-500">Fecha de Pago:</span>
                                      <span className="text-xs text-gray-500">
                                        {comision.fecha_pago 
                                          ? format(new Date(comision.fecha_pago), 'dd/MM/yyyy', { locale: es })
                                          : 'N/A'}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="flex justify-end gap-2">
                                <button
                                  onClick={() => handleRevertir(comision)}
                                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center gap-2"
                                >
                                  <RefreshCw className="w-4 h-4" />
                                  Revertir
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Sin comisiones */}
                    {(!item.comisiones_pendientes || item.comisiones_pendientes.length === 0) && 
                     (!item.comisiones_pagadas || item.comisiones_pagadas.length === 0) && (
                      <div className="text-center py-8 text-gray-500">
                        <DollarSign className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                        <p>Este vendedor no tiene comisiones registradas</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de Pago */}
      {comisionAPagar && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Registrar Pago de Comisión</h3>
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <p className="text-sm text-gray-500">Contrato</p>
              <p className="font-semibold text-gray-900">{comisionAPagar.codigo_contrato}</p>
              <p className="text-sm text-gray-500 mt-2">Tipo</p>
              <p className="font-semibold text-gray-900">
                {comisionAPagar.tipo === 'primera_mitad' ? 'Primera Mitad (1.5%)' : 'Segunda Mitad (1.5%)'}
              </p>
              <p className="text-sm text-gray-500 mt-2">Monto Total</p>
              <p className="font-semibold text-gray-900">
                ${parseFloat(comisionAPagar.monto_total || 0).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              {comisionAPagar.monto_pagado > 0 && (
                <>
                  <p className="text-sm text-gray-500 mt-2">Monto Pagado</p>
                  <p className="font-semibold text-green-600">
                    ${parseFloat(comisionAPagar.monto_pagado || 0).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </>
              )}
              <p className="text-sm text-gray-500 mt-2">Pendiente</p>
              <p className="text-xl font-bold text-yellow-600">
                ${parseFloat(comisionAPagar.monto_pendiente || comisionAPagar.monto_total || 0).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Monto a Pagar
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                max={comisionAPagar.monto_pendiente || comisionAPagar.monto_total}
                value={montoPago}
                onChange={(e) => setMontoPago(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="0.00"
              />
              <p className="text-xs text-gray-500 mt-1">
                Puedes pagar parcialmente. Máximo: ${parseFloat(comisionAPagar.monto_pendiente || comisionAPagar.monto_total || 0).toFixed(2)}
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setComisionAPagar(null);
                  setMontoPago('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                disabled={pagarComisionMutation.isPending}
              >
                Cancelar
              </button>
              <button
                onClick={registrarPago}
                disabled={pagarComisionMutation.isPending || !montoPago || parseFloat(montoPago) <= 0}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center justify-center gap-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {pagarComisionMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Registrando...
                  </>
                ) : (
                  <>
                    <DollarSign className="w-4 h-4" />
                    Registrar Pago
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Reversión de Pago */}
      {comisionARevertir && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Revertir Pago de Comisión</h3>
            <p className="text-gray-600 mb-4">
              ¿Estás seguro de que deseas revertir este pago? La comisión volverá a estar pendiente.
            </p>
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <p className="text-sm text-gray-500">Contrato</p>
              <p className="font-semibold text-gray-900">{comisionARevertir.codigo_contrato}</p>
              <p className="text-sm text-gray-500 mt-2">Cliente</p>
              <p className="font-semibold text-gray-900">{comisionARevertir.cliente}</p>
              <p className="text-sm text-gray-500 mt-2">Tipo</p>
              <p className="font-semibold text-gray-900">
                {comisionARevertir.tipo === 'primera_mitad' ? 'Primera Mitad (1.5%)' : 'Segunda Mitad (1.5%)'}
              </p>
              <p className="text-sm text-gray-500 mt-2">Monto</p>
              <p className="text-xl font-bold text-red-600">
                ${parseFloat(comisionARevertir.monto).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setComisionARevertir(null)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                disabled={revertirPagoMutation.isPending}
              >
                Cancelar
              </button>
              <button
                onClick={revertirPago}
                disabled={revertirPagoMutation.isPending}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center justify-center gap-2"
              >
                {revertirPagoMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Revirtiendo...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    Revertir Pago
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

export default ComisionesAdministracion;

