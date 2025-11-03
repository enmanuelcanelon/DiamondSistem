import { Calendar, Clock, PartyPopper } from 'lucide-react';
import { useState, useEffect } from 'react';

function EventCountdown({ fechaEvento, nombreEvento = "tu evento" }) {
  const [diasRestantes, setDiasRestantes] = useState(null);
  const [horasRestantes, setHorasRestantes] = useState(null);
  const [minutosRestantes, setMinutosRestantes] = useState(null);
  const [yapaso, setYaPaso] = useState(false);
  const [esHoy, setEsHoy] = useState(false);

  useEffect(() => {
    const calcularTiempoRestante = () => {
      if (!fechaEvento) return;

      const ahora = new Date();
      const fecha = new Date(fechaEvento);
      
      // Ajustar la fecha del evento al inicio del día
      fecha.setHours(0, 0, 0, 0);
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);

      const diferenciaMilisegundos = fecha - hoy;
      const dias = Math.floor(diferenciaMilisegundos / (1000 * 60 * 60 * 24));

      // Si la fecha ya pasó
      if (dias < 0) {
        setYaPaso(true);
        setDiasRestantes(Math.abs(dias));
        return;
      }

      // Si es hoy
      if (dias === 0) {
        setEsHoy(true);
        const fechaEventoCompleta = new Date(fechaEvento);
        const diferencia = fechaEventoCompleta - ahora;
        const horas = Math.floor(diferencia / (1000 * 60 * 60));
        const minutos = Math.floor((diferencia % (1000 * 60 * 60)) / (1000 * 60));
        setHorasRestantes(horas);
        setMinutosRestantes(minutos);
        return;
      }

      setDiasRestantes(dias);
      setYaPaso(false);
      setEsHoy(false);
    };

    calcularTiempoRestante();
    const intervalo = setInterval(calcularTiempoRestante, 60000); // Actualizar cada minuto

    return () => clearInterval(intervalo);
  }, [fechaEvento]);

  if (!fechaEvento) return null;

  // Si el evento ya pasó
  if (yapaso) {
    return (
      <div className="bg-gradient-to-r from-gray-600 to-gray-700 rounded-xl p-6 text-white shadow-lg">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
            <Calendar className="w-8 h-8" />
          </div>
          <div>
            <p className="text-sm text-gray-200">El evento fue hace</p>
            <p className="text-4xl font-bold">{diasRestantes}</p>
            <p className="text-lg">{diasRestantes === 1 ? 'día' : 'días'}</p>
          </div>
        </div>
      </div>
    );
  }

  // Si el evento es HOY
  if (esHoy) {
    return (
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl p-6 text-white shadow-lg animate-pulse">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
            <PartyPopper className="w-8 h-8" />
          </div>
          <div>
            <p className="text-2xl font-bold">¡HOY ES EL DÍA!</p>
            <p className="text-lg">🎉 {nombreEvento} 🎉</p>
            {horasRestantes !== null && (
              <p className="text-sm mt-2">
                {horasRestantes > 0 ? `En ${horasRestantes}h ${minutosRestantes}m` : `¡Ya comenzó!`}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Countdown normal
  const getGradientColor = () => {
    if (diasRestantes <= 7) return 'from-red-600 to-pink-600';
    if (diasRestantes <= 30) return 'from-orange-600 to-yellow-600';
    if (diasRestantes <= 90) return 'from-purple-600 to-pink-600';
    return 'from-blue-600 to-indigo-600';
  };

  const getMensajeUrgencia = () => {
    if (diasRestantes === 1) return '¡Mañana es el gran día!';
    if (diasRestantes <= 7) return '¡Ya casi llega!';
    if (diasRestantes <= 30) return 'Faltan pocos días';
    if (diasRestantes <= 90) return 'El evento se acerca';
    return 'Aún tienes tiempo para planear';
  };

  return (
    <div className={`bg-gradient-to-r ${getGradientColor()} rounded-xl p-6 text-white shadow-lg`}>
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
          {diasRestantes <= 7 ? (
            <Clock className="w-8 h-8 animate-bounce" />
          ) : (
            <Calendar className="w-8 h-8" />
          )}
        </div>
        <div className="flex-1">
          <p className="text-sm text-white/90">{getMensajeUrgencia()}</p>
          <div className="flex items-baseline gap-2">
            <p className="text-5xl font-bold">{diasRestantes}</p>
            <p className="text-2xl">{diasRestantes === 1 ? 'día' : 'días'}</p>
          </div>
          <p className="text-sm text-white/80 mt-1">para {nombreEvento}</p>
        </div>
      </div>

      {/* Barra de progreso visual */}
      <div className="mt-4">
        <div className="w-full bg-white/20 rounded-full h-2">
          <div
            className="bg-white h-2 rounded-full transition-all"
            style={{ 
              width: `${Math.max(0, Math.min(100, ((180 - diasRestantes) / 180) * 100))}%` 
            }}
          ></div>
        </div>
        <p className="text-xs text-white/70 mt-1 text-right">
          {diasRestantes > 180 ? 'Más de 6 meses' : `${Math.round((diasRestantes / 180) * 100)}% del tiempo de planificación`}
        </p>
      </div>
    </div>
  );
}

export default EventCountdown;



