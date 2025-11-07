import { AlertCircle, CheckCircle, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState } from 'react';

function RecordatorioEvento({ contrato, playlistData, mesasData, ajustesData }) {
  const [cerrado, setCerrado] = useState(false);

  // Calcular días hasta el evento
  const fechaEvento = new Date(contrato?.fecha_evento);
  const hoy = new Date();
  const diasHastaEvento = Math.ceil((fechaEvento - hoy) / (1000 * 60 * 60 * 24));

  // Solo mostrar si falta 1 mes o menos (30 días)
  if (diasHastaEvento > 30 || diasHastaEvento < 0 || cerrado) {
    return null;
  }

  // Verificar qué está completo y qué falta
  const checks = {
    playlist: {
      completo: playlistData?.total > 0,
      label: 'Playlist Musical',
      link: `/playlist/${contrato?.id}`,
      descripcion: 'Agrega tus canciones favoritas y prohibidas',
    },
    mesas: {
      completo: mesasData?.total > 0,
      label: 'Asignación de Mesas',
      link: `/mesas/${contrato?.id}`,
      descripcion: 'Organiza la distribución de tus invitados',
    },
    ajustes: {
      completo: ajustesData?.progreso_total > 0,
      label: 'Ajustes del Evento',
      link: '/ajustes',
      descripcion: 'Configura menú, decoración, pastel, etc.',
    },
  };

  // Contar pendientes
  const pendientes = Object.values(checks).filter(c => !c.completo).length;

  // Si todo está completo, no mostrar nada
  if (pendientes === 0) {
    return null;
  }

  return (
    <div className="card border-l-4 border-l-gray-900">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          <div className="w-12 h-12 bg-gray-900 rounded-full flex items-center justify-center">
            <AlertCircle className="w-7 h-7 text-white" />
          </div>
        </div>

        <div className="flex-1">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                ⏰ ¡Tu evento está cerca!
              </h3>
              <p className="text-sm text-gray-700 mt-1">
                Faltan <strong>{diasHastaEvento} días</strong> para tu evento. 
                Completa los siguientes detalles:
              </p>
            </div>
            <button
              onClick={() => setCerrado(true)}
              className="text-gray-600 hover:text-gray-900 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-3">
            {Object.entries(checks).map(([key, check]) => (
              <div key={key} className="flex items-center gap-3">
                {check.completo ? (
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                ) : (
                  <div className="w-5 h-5 border-2 border-gray-400 rounded-full flex-shrink-0" />
                )}
                <div className="flex-1">
                  <Link
                    to={check.link}
                    className={`font-medium ${
                      check.completo 
                        ? 'text-gray-600 line-through' 
                        : 'text-gray-900 hover:text-gray-700 hover:underline'
                    }`}
                  >
                    {check.label}
                  </Link>
                  {!check.completo && (
                    <p className="text-xs text-gray-600 mt-0.5">
                      {check.descripcion}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-700">
                <strong>{pendientes}</strong> de {Object.keys(checks).length} pendientes
              </p>
              <div className="flex gap-2">
                <div className="h-2 w-24 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gray-900 transition-all duration-500"
                    style={{ 
                      width: `${((Object.keys(checks).length - pendientes) / Object.keys(checks).length) * 100}%` 
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RecordatorioEvento;

