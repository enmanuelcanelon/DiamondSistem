import React from 'react';
import BentoCard from './BentoCard';
import { Clock, MapPin } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '@shared/config/api';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import useAuthStore from '@shared/store/useAuthStore';
import { useNavigate } from 'react-router-dom';
import { getImageUrl } from '@/lib/utils';

const BentoGrid = () => {
    const { user } = useAuthStore();
    const navigate = useNavigate();

    // Query para obtener información del contrato y evento
    const { data: contratoData } = useQuery({
        queryKey: ['contrato-dashboard', user?.contrato_id],
        queryFn: async () => {
            const response = await api.get(`/contratos/${user?.contrato_id}`);
            return response.data.contrato;
        },
        enabled: !!user?.contrato_id,
    });

    const evento = contratoData?.eventos;
    const contrato = contratoData;
    const fechaEvento = evento?.fecha_evento;
    const horaInicio = evento?.hora_inicio;
    const horaFin = evento?.hora_fin;
    const invitados = evento?.cantidad_invitados_confirmados || 0;
    const salon = contratoData?.salones?.nombre || 'Salón';
    
    // Calcular días restantes
    const diasRestantes = fechaEvento 
        ? Math.ceil((new Date(fechaEvento) - new Date()) / (1000 * 60 * 60 * 24))
        : 0;

    // Calcular información de pagos
    const totalContrato = parseFloat(contrato?.total_contrato || 0);
    const totalPagado = parseFloat(contrato?.total_pagado || 0);
    const saldoPendiente = parseFloat(contrato?.saldo_pendiente || 0);
    const porcentajePagado = totalContrato > 0 ? (totalPagado / totalContrato) * 100 : 0;
    const estadoPago = contrato?.estado_pago || 'pendiente';

    // Obtener número de mesas (si existe la funcionalidad)
    const mesas = contratoData?.mesas?.length || 0;

    // URLs de imágenes del backend con fallback a Unsplash
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
    const baseUrl = apiUrl.replace('/api', '') || 'http://localhost:5001';
    
    // Imágenes de fondo para las tarjetas (usando imágenes de Unsplash como fallback)
    // En producción, estas deberían ser reemplazadas por imágenes reales del backend
    const countdownImage = 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=2000&auto=format&fit=crop';
    const invitadosImage = 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=2000&auto=format&fit=crop';
    const mesasImage = 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?q=80&w=2000&auto=format&fit=crop';
    const playlistImage = 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=2000&auto=format&fit=crop';
    const detallesImage = 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?q=80&w=2000&auto=format&fit=crop';
    const pagosImage = 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?q=80&w=2000&auto=format&fit=crop';

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 auto-rows-[minmax(180px,auto)]">
                {/* Countdown - Large */}
                <BentoCard
                    large
                    className="bg-neutral-900 cursor-pointer"
                    imageSrc={countdownImage}
                >
                    <div className="flex flex-col justify-between h-full">
                        <div>
                            <h2 className="text-sm text-neutral-400 mb-2 uppercase tracking-wider font-medium">Faltan</h2>
                            <div className="text-7xl font-bold tracking-tighter text-white drop-shadow-lg">
                                {diasRestantes > 0 ? diasRestantes : 0}<span className="text-2xl font-normal text-neutral-300 ml-3">días</span>
                            </div>
                        </div>
                        <div className="flex flex-col items-end text-right mt-8">
                            {fechaEvento && (
                                <>
                                    <div className="text-xl font-medium text-white mb-1 drop-shadow-md">
                                        {format(new Date(fechaEvento), "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
                                    </div>
                                    {(horaInicio || horaFin) && (
                                        <div className="text-sm text-neutral-300 flex items-center gap-2 drop-shadow-md">
                                            <Clock size={14} />
                                            {horaInicio ? horaInicio.substring(0, 5) : '--'} - {horaFin ? horaFin.substring(0, 5) : '--'}
                                        </div>
                                    )}
                                </>
                            )}
                            <div className="mt-4 pt-4 border-t border-white/20 text-sm text-neutral-300 flex items-center gap-2 w-full justify-end drop-shadow-md">
                                <MapPin size={14} />
                                {salon}
                            </div>
                        </div>
                    </div>
                </BentoCard>

                {/* Invitados */}
                <BentoCard
                    className="bg-neutral-900 cursor-pointer"
                    imageSrc={invitadosImage}
                    onClick={() => navigate('/mesas/' + user?.contrato_id)}
                >
                    <div className="flex flex-col justify-center h-full">
                        <div className="text-sm text-neutral-400 mb-2 uppercase tracking-wider font-medium">Invitados</div>
                        <div className="text-5xl font-bold tracking-tight text-white mb-2 drop-shadow-lg">{invitados}</div>
                        <div className="text-sm text-neutral-300 drop-shadow-md">personas confirmadas</div>
                    </div>
                </BentoCard>

                {/* Mesas */}
                <BentoCard
                    className="bg-neutral-900 cursor-pointer"
                    imageSrc={mesasImage}
                    onClick={() => navigate('/mesas/' + user?.contrato_id)}
                >
                    <div className="flex flex-col justify-center h-full">
                        <div className="text-sm text-neutral-400 mb-2 uppercase tracking-wider font-medium">Mesas</div>
                        <div className="text-5xl font-bold tracking-tight text-white mb-2 drop-shadow-lg">{mesas}</div>
                        <div className="text-sm text-neutral-300 drop-shadow-md">configuradas</div>
                    </div>
                </BentoCard>

                {/* Playlist */}
                <BentoCard
                    className="bg-neutral-900 cursor-pointer"
                    imageSrc={playlistImage}
                    onClick={() => navigate('/playlist/' + user?.contrato_id)}
                >
                    <div className="flex flex-col justify-center h-full">
                        <div className="text-sm text-neutral-400 mb-2 uppercase tracking-wider font-medium">Playlist</div>
                        <div className="text-5xl font-bold tracking-tight text-white mb-2 drop-shadow-lg">0</div>
                        <div className="text-sm text-neutral-300 drop-shadow-md">canciones</div>
                    </div>
                </BentoCard>

                {/* Detalles */}
                <BentoCard
                    className="bg-neutral-900"
                    imageSrc={detallesImage}
                >
                    <div className="flex flex-col h-full">
                        <h3 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider drop-shadow-md">Detalles</h3>
                        <div className="space-y-4 flex-1">
                            {contratoData?.clientes && (
                                <div className="flex justify-between items-center text-sm border-b border-white/10 pb-2">
                                    <span className="text-neutral-400">Cliente</span>
                                    <span className="font-medium text-white drop-shadow-sm">{contratoData.clientes.nombre_completo}</span>
                                </div>
                            )}
                            <div className="flex justify-between items-center text-sm border-b border-white/10 pb-2">
                                <span className="text-neutral-400">Lugar</span>
                                <span className="font-medium text-white drop-shadow-sm">{salon}</span>
                            </div>
                            {contratoData?.paquetes && (
                                <div className="flex justify-between items-center text-sm border-b border-white/10 pb-2">
                                    <span className="text-neutral-400">Paquete</span>
                                    <span className="font-medium text-white drop-shadow-sm">{contratoData.paquetes.nombre}</span>
                                </div>
                            )}
                            {contratoData?.codigo_contrato && (
                                <div className="flex justify-between items-center text-sm pt-1">
                                    <span className="text-neutral-400">Contrato</span>
                                    <span className="font-mono text-xs bg-white/10 px-2 py-1 rounded text-neutral-200 backdrop-blur-sm">{contratoData.codigo_contrato}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </BentoCard>

                {/* Pagos - Large */}
                <BentoCard
                    large
                    className="bg-neutral-900 cursor-pointer"
                    imageSrc={pagosImage}
                    onClick={() => navigate('/contratos')}
                >
                    <div className="flex flex-col h-full">
                        <div className="flex items-center gap-3 mb-6">
                            <h3 className="text-sm font-semibold text-white uppercase tracking-wider drop-shadow-md">Pagos</h3>
                            <span className={`text-[10px] font-medium px-2 py-0.5 rounded border backdrop-blur-sm ${
                                estadoPago === 'completado' 
                                    ? 'bg-green-500/20 text-green-400 border-green-500/30'
                                    : estadoPago === 'parcial'
                                    ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                                    : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                            }`}>
                                {estadoPago === 'completado' ? 'Completado' : estadoPago === 'parcial' ? 'Parcial' : 'Pendiente'}
                            </span>
                        </div>

                        <div className="grid grid-cols-2 gap-8 mb-6">
                            <div>
                                <div className="text-sm text-neutral-400 mb-1">Total del contrato</div>
                                <div className="text-3xl font-bold text-white drop-shadow-lg">
                                    ${totalContrato.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-neutral-400">Pagado</span>
                                    <span className="text-green-400 font-medium drop-shadow-sm">
                                        ${totalPagado.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-neutral-400">Saldo pendiente</span>
                                    <span className="text-red-400 font-medium drop-shadow-sm">
                                        ${saldoPendiente.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="mt-auto">
                            <div className="flex justify-between text-xs text-neutral-400 mb-2">
                                <span>Progreso</span>
                                <span>{porcentajePagado.toFixed(0)}%</span>
                            </div>
                            <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden backdrop-blur-sm">
                                <div 
                                    className="h-full bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.5)] transition-all duration-500" 
                                    style={{ width: `${Math.min(porcentajePagado, 100)}%` }}
                                />
                            </div>
                        </div>
                    </div>
                </BentoCard>
            </div>
        </div>
    );
};

export default BentoGrid;

