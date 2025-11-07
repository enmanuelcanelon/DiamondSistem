import { useState, useEffect, useMemo } from 'react';
import { 
  Sparkles, 
  Save, 
  Loader2, 
  Lock,
  AlertCircle,
  CheckCircle2,
  Info
} from 'lucide-react';
import toast from 'react-hot-toast';
import ImagenSeleccion from '@shared/components/ImagenSeleccion';
import { obtenerImagenDecoracion } from '@shared/utils/mapeoImagenes';

/**
 * Opciones de colores disponibles para servilletas con sus cantidades límite
 */
const SERVILLETAS_OPCIONES = [
  { color: 'blanca', label: 'Blanca', cantidad_disponible: Infinity, nota: 'Ilimitada' },
  { color: 'rosada', label: 'Rosada', cantidad_disponible: 40 },
  { color: 'azul', label: 'Azul', cantidad_disponible: 80 },
  { color: 'beige', label: 'Beige', cantidad_disponible: 80 },
  { color: 'roja', label: 'Roja', cantidad_disponible: 80 },
  { color: 'verde', label: 'Verde', cantidad_disponible: 80 },
  { color: 'morada', label: 'Morada', cantidad_disponible: 80 },
  { color: 'vinotinto', label: 'Vinotinto', cantidad_disponible: 80 },
  { color: 'negro', label: 'Negro', cantidad_disponible: 80 },
];

const CENTROS_OPCIONES = ['flor', 'rojo', 'azul', 'rosada', 'blanco', 'arbol', 'candelabro', 'cilindro'];
const BASE_OPCIONES = ['silver', 'dorado', 'clear', 'candelabro', 'arbol'];
const CHALLER_OPCIONES = ['dorado', 'silver', 'clear'];
const AROS_OPCIONES = ['silver', 'dorado', 'clear', 'otro'];
const RUNNER_OPCIONES = ['dorado', 'silver', 'morado', 'azul', 'rosado', 'verde', 'rojo', 'beige', 'negro', 'disco', 'blanco', 'gatsby', 'otros'];

function SeccionDecoracion({ ajustes, onGuardar, guardando, estaBloqueado, contrato }) {
  const [datos, setDatos] = useState({
    tipo_decoracion: ajustes?.tipo_decoracion || '',
    
    // Decoración Básica
    cojines_color: ajustes?.cojines_color || '',
    centro_mesa_1: ajustes?.centro_mesa_1 || '',
    base_color: ajustes?.base_color || '',
    challer_color: ajustes?.challer_color || '',
    servilletas_color: ajustes?.servilletas_color || '',
    aros_color: ajustes?.aros_color || '',
    aros_nota: ajustes?.aros_nota || '',
    runner_tipo: ajustes?.runner_tipo || '',
    runner_nota: ajustes?.runner_nota || '',
    stage_tipo: ajustes?.stage_tipo || '',
    stage_color_globos: ajustes?.stage_color_globos || '',
    
    // Decoración Premium
    decoracion_premium_detalles: ajustes?.decoracion_premium_detalles || '',
    
    // Campos genéricos que ya existían
    estilo_decoracion: ajustes?.estilo_decoracion || '',
    estilo_decoracion_otro: ajustes?.estilo_decoracion_otro || '',
    colores_principales: ajustes?.colores_principales || '',
    tematica: ajustes?.tematica || '',
    notas_decoracion: ajustes?.notas_decoracion || '',
  });

  // Determinar el tipo de decoración basado en el contrato
  useEffect(() => {
    if (contrato?.contratos_servicios) {
      const servicioDecoracion = contrato.contratos_servicios.find(
        cs => cs.servicios?.categoria === 'Decoración'
      );
      
      if (servicioDecoracion) {
        const nombre = servicioDecoracion.servicios.nombre.toLowerCase();
        const tipo = nombre.includes('plus') || nombre.includes('premium') ? 'premium' : 'basica';
        
        setDatos(prev => ({ ...prev, tipo_decoracion: tipo }));
      }
    }
  }, [contrato]);

  // Calcular invitados totales del contrato
  const totalInvitados = contrato?.cantidad_invitados || 0;


  const handleSubmit = (e) => {
    e.preventDefault();
    // No hay validación especial de servilletas, solo se guardan los colores seleccionados
    onGuardar('decoracion', datos);
  };

  const esBasica = datos.tipo_decoracion === 'basica';
  const esPremium = datos.tipo_decoracion === 'premium';

  // ===== FUNCIÓN AUXILIAR PARA RENDERIZAR CAMPOS DE DECORACIÓN BÁSICA =====
  const renderDecoracionBasicaFields = () => {
    return (
      <div className="space-y-6">
        {/* Cojines */}
        <div className="bg-white rounded-lg border p-4">
          <label className="block text-sm font-bold text-gray-900 mb-3">
            Cojines *
          </label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="cojines"
                value="negros"
                checked={datos.cojines_color === 'negros'}
                onChange={(e) => setDatos({ ...datos, cojines_color: e.target.value })}
                className="w-4 h-4 text-gray-700"
              />
              <span className="text-sm">Negros</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="cojines"
                value="blancos"
                checked={datos.cojines_color === 'blancos'}
                onChange={(e) => setDatos({ ...datos, cojines_color: e.target.value })}
                className="w-4 h-4 text-gray-700"
              />
              <span className="text-sm">Blancos</span>
            </label>
          </div>
          {/* Mostrar imagen cuando se selecciona un color de cojín */}
          {datos.cojines_color && (
            <div className="mt-3 flex justify-center">
              <ImagenSeleccion
                urlImagen={obtenerImagenDecoracion('cojin', datos.cojines_color)}
                alt={`Cojines ${datos.cojines_color}`}
                tamaño="small"
              />
            </div>
          )}
        </div>

        {/* Centro de Mesa */}
        <div className="bg-white rounded-lg border p-4">
          <label className="block text-sm font-bold text-gray-900 mb-3">
            Centro de Mesa *
          </label>
          <select
            value={datos.centro_mesa_1}
            onChange={(e) => setDatos({ ...datos, centro_mesa_1: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 outline-none"
          >
            <option value="">Seleccionar...</option>
            {CENTROS_OPCIONES.map(c => (
              <option key={c} value={c} className="capitalize">{c}</option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-2">
            💡 <strong>Nota:</strong> La opción "Cilindro" incluye 3 cilindros por mesa
          </p>
          {/* Mostrar imagen cuando se selecciona un centro de mesa */}
          {datos.centro_mesa_1 && (
            <div className="mt-3 flex justify-center">
              <ImagenSeleccion
                urlImagen={obtenerImagenDecoracion('centro_mesa', datos.centro_mesa_1)}
                alt={`Centro de mesa ${datos.centro_mesa_1}`}
                tamaño="medium"
              />
            </div>
          )}
        </div>

        {/* Base y Challer */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-lg border p-4">
            <label className="block text-sm font-bold text-gray-900 mb-3">
              Base *
            </label>
            <select
              value={datos.base_color}
              onChange={(e) => setDatos({ ...datos, base_color: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 outline-none"
            >
              <option value="">Seleccionar...</option>
              {BASE_OPCIONES.map(b => (
                <option key={b} value={b} className="capitalize">{b}</option>
              ))}
            </select>
            {/* Mostrar imagen cuando se selecciona una base */}
            {datos.base_color && (
              <div className="mt-3 flex justify-center">
                <ImagenSeleccion
                  urlImagen={obtenerImagenDecoracion('base', datos.base_color)}
                  alt={`Base ${datos.base_color}`}
                  tamaño="small"
                />
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg border p-4">
            <label className="block text-sm font-bold text-gray-900 mb-3">
              Challer (Cargador de Plato) *
            </label>
            <select
              value={datos.challer_color}
              onChange={(e) => setDatos({ ...datos, challer_color: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 outline-none"
            >
              <option value="">Seleccionar...</option>
              {CHALLER_OPCIONES.map(c => (
                <option key={c} value={c} className="capitalize">{c}</option>
              ))}
            </select>
            {/* Mostrar imagen cuando se selecciona un challer */}
            {datos.challer_color && (
              <div className="mt-3 flex justify-center">
                <ImagenSeleccion
                  urlImagen={obtenerImagenDecoracion('challer', datos.challer_color)}
                  alt={`Challer ${datos.challer_color}`}
                  tamaño="small"
                />
              </div>
            )}
          </div>
        </div>

        {/* Servilletas */}
        <div className="bg-white rounded-lg border p-4">
          <label className="block text-sm font-bold text-gray-900 mb-3">
            Servilletas *
          </label>
          <select
            value={datos.servilletas_color}
            onChange={(e) => setDatos({ ...datos, servilletas_color: e.target.value })}
            disabled={estaBloqueado}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 outline-none"
          >
            <option value="">Seleccionar color...</option>
            {SERVILLETAS_OPCIONES.map(opcion => (
              <option key={opcion.color} value={opcion.color}>
                {opcion.label}
              </option>
            ))}
          </select>
          {/* Mostrar imagen cuando se selecciona un color de servilleta */}
          {datos.servilletas_color && (
            <div className="mt-3 flex justify-center">
              <ImagenSeleccion
                urlImagen={obtenerImagenDecoracion('servilleta', datos.servilletas_color)}
                alt={`Servilleta ${datos.servilletas_color}`}
                tamaño="small"
              />
            </div>
          )}
        </div>

        {/* Aros */}
        <div className="bg-white rounded-lg border p-4">
          <label className="block text-sm font-bold text-gray-900 mb-3">
            Aros (Anillos para Servilleta) *
          </label>
          <div className="space-y-3">
            <select
              value={datos.aros_color}
              onChange={(e) => setDatos({ ...datos, aros_color: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 outline-none"
            >
              <option value="">Seleccionar...</option>
              {AROS_OPCIONES.map(a => (
                <option key={a} value={a} className="capitalize">{a}</option>
              ))}
            </select>
            {datos.aros_color === 'otro' && (
              <input
                type="text"
                value={datos.aros_nota}
                onChange={(e) => setDatos({ ...datos, aros_nota: e.target.value })}
                placeholder="Especifica el tipo de aro..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 outline-none"
              />
            )}
            {/* Mostrar imagen cuando se selecciona un aro */}
            {datos.aros_color && datos.aros_color !== 'otro' && (
              <div className="mt-3 flex justify-center">
                <ImagenSeleccion
                  urlImagen={obtenerImagenDecoracion('aros', datos.aros_color)}
                  alt={`Aro ${datos.aros_color}`}
                  tamaño="small"
                />
              </div>
            )}
          </div>
        </div>

        {/* Runner */}
        <div className="bg-white rounded-lg border p-4">
          <label className="block text-sm font-bold text-gray-900 mb-3">
            Runner (Camino de Mesa) *
          </label>
          <div className="space-y-3">
            <select
              value={datos.runner_tipo}
              onChange={(e) => setDatos({ ...datos, runner_tipo: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 outline-none"
            >
              <option value="">Seleccionar...</option>
              {RUNNER_OPCIONES.map(r => (
                <option key={r} value={r} className="capitalize">{r}</option>
              ))}
            </select>
            {datos.runner_tipo === 'otros' && (
              <input
                type="text"
                value={datos.runner_nota}
                onChange={(e) => setDatos({ ...datos, runner_nota: e.target.value })}
                placeholder="Especifica el tipo de runner..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 outline-none"
              />
            )}
            {/* Mostrar imagen cuando se selecciona un runner */}
            {datos.runner_tipo && datos.runner_tipo !== 'otros' && (
              <div className="mt-3 flex justify-center">
                <ImagenSeleccion
                  urlImagen={obtenerImagenDecoracion('runner', datos.runner_tipo)}
                  alt={`Runner ${datos.runner_tipo}`}
                  tamaño="medium"
                />
              </div>
            )}
          </div>
        </div>

        {/* Stage */}
        <div className="bg-white rounded-lg border p-4">
          <label className="block text-sm font-bold text-gray-900 mb-3">
            Stage (Escenario/Fondo Principal) *
          </label>
          <div className="space-y-3">
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="stage"
                  value="globos"
                  checked={datos.stage_tipo === 'globos'}
                  onChange={(e) => setDatos({ ...datos, stage_tipo: e.target.value })}
                  className="w-4 h-4 text-gray-700"
                />
                <span className="text-sm">Globos</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="stage"
                  value="flores"
                  checked={datos.stage_tipo === 'flores'}
                  onChange={(e) => setDatos({ ...datos, stage_tipo: e.target.value })}
                  className="w-4 h-4 text-gray-700"
                />
                <span className="text-sm">Flores</span>
              </label>
            </div>
            {datos.stage_tipo === 'globos' && (
              <input
                type="text"
                value={datos.stage_color_globos}
                onChange={(e) => setDatos({ ...datos, stage_color_globos: e.target.value })}
                placeholder="Color(es) de los globos..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 outline-none"
              />
            )}
          </div>
        </div>
      </div>
    );
  };

  if (!datos.tipo_decoracion) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3 mb-6">
          <Sparkles className="w-6 h-6 text-gray-700" />
          <h2 className="text-2xl font-bold text-gray-900">Decoración</h2>
        </div>

        <div className="text-center py-12">
          <Sparkles className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">
            No se detectó un servicio de decoración en tu contrato.
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Contacta a tu asesor si crees que esto es un error.
          </p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Sparkles className="w-6 h-6 text-gray-700" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Decoración del Evento</h2>
            <p className="text-sm text-gray-600">
              Tipo de decoración: <span className="font-semibold capitalize">{datos.tipo_decoracion}</span>
            </p>
          </div>
        </div>
        {esPremium && (
          <span className="px-4 py-2 bg-gray-100 text-gray-900 border border-gray-300 rounded-full text-sm font-semibold">
            ⭐ Premium
          </span>
        )}
      </div>

      {/* ===== DECORACIÓN PREMIUM ===== */}
      {esPremium && (
        <div className="card border-l-4 border-l-gray-900">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-gray-700" />
            Detalles Especiales Premium
          </h3>
          <p className="text-sm text-gray-700 mb-4">
            La decoración premium incluye toda la decoración básica más elementos especiales como:
            animales de peluche, estructuras aéreas, columpio, arcos florales, etc.
          </p>
          
          <div className="space-y-4">
            {/* Incluir todos los campos de decoración básica también */}
            {renderDecoracionBasicaFields()}
            
            {/* Detalles Premium Adicionales */}
            <div>
              <label className="block text-sm font-medium text-purple-900 mb-2">
                Detalles Especiales Premium
              </label>
              <textarea
                value={datos.decoracion_premium_detalles}
                onChange={(e) => setDatos({ ...datos, decoracion_premium_detalles: e.target.value })}
                rows={4}
                placeholder="Describe los elementos especiales que deseas: animales de peluche, estructura de columpio, arcos florales, instalaciones aéreas, etc."
                className="w-full px-4 py-3 border-2 border-purple-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none bg-white"
              />
              <p className="text-xs text-gray-700 mt-2">
                💡 Sé específico con colores, tamaños y ubicación de los elementos especiales
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ===== DECORACIÓN BÁSICA ===== */}
      {esBasica && (
        <>
          {renderDecoracionBasicaFields()}
        </>
      )}

      {/* ===== CAMPOS GENERALES (PARA AMBOS TIPOS) ===== */}
      <div className="border-t pt-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Preferencias Generales</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Estilo General
            </label>
            <select
              value={datos.estilo_decoracion}
              onChange={(e) => setDatos({ ...datos, estilo_decoracion: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
            >
              <option value="">Seleccionar...</option>
              <option value="Clásico">Clásico</option>
              <option value="Moderno">Moderno</option>
              <option value="Rústico">Rústico</option>
              <option value="Elegante">Elegante</option>
              <option value="Vintage">Vintage</option>
              <option value="Bohemio">Bohemio</option>
              <option value="Minimalista">Minimalista</option>
              <option value="Romántico">Romántico</option>
              <option value="Otro">Otro</option>
            </select>
            {datos.estilo_decoracion === 'Otro' && (
              <input
                type="text"
                value={datos.estilo_decoracion_otro}
                onChange={(e) => setDatos({ ...datos, estilo_decoracion_otro: e.target.value })}
                placeholder="Especifica el estilo..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none mt-2"
              />
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Temática
            </label>
            <input
              type="text"
              value={datos.tematica}
              onChange={(e) => setDatos({ ...datos, tematica: e.target.value })}
              placeholder="Ej: Jardín, Playa, Cuento de Hadas"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Colores Principales
            </label>
            <input
              type="text"
              value={datos.colores_principales}
              onChange={(e) => setDatos({ ...datos, colores_principales: e.target.value })}
              placeholder="Ej: Blanco y dorado, Rosa y verde menta"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
            />
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Notas Adicionales
          </label>
          <textarea
            value={datos.notas_decoracion}
            onChange={(e) => setDatos({ ...datos, notas_decoracion: e.target.value })}
            rows="3"
            placeholder="Cualquier detalle especial sobre la decoración..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
          ></textarea>
        </div>
      </div>

      {/* Botón Guardar */}
      <button
        type="submit"
        disabled={guardando || estaBloqueado}
        className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {guardando ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Guardando...
          </>
        ) : estaBloqueado ? (
          <>
            <Lock className="w-5 h-5" />
            Bloqueado
          </>
        ) : (
          <>
            <Save className="w-5 h-5" />
            Guardar Cambios
          </>
        )}
      </button>
    </form>
  );
}

export default SeccionDecoracion;
