# 📋 Plan de Refactorización Fase 3 - Extracción de Componentes

**Fecha Inicio**: Diciembre 3, 2025  
**Estado**: 🔄 EN PROGRESO  
**Archivo Original**: `CrearOferta.jsx` (4,677 líneas)

---

## 🎯 Objetivo

Transformar `CrearOferta.jsx` de un archivo monolítico de 4,677 líneas en un componente orquestador limpio que delega la lógica de cada paso a componentes especializados.

---

## 📊 Análisis del Archivo Original

### Estructura Actual:
- **Línea 1-100**: Imports y configuración inicial
- **Línea 100-2700**: Lógica de estado, hooks, handlers, funciones auxiliares
- **Línea 2720-2758**: Paso 1 - Selección de Cliente (~38 líneas)
- **Línea 2761-3402**: Paso 2 - Detalles del Evento (~641 líneas) ⚠️ MÁS COMPLEJO
- **Línea 3405-3944**: Paso 3 - Paquete y Temporada (~539 líneas)
- **Línea 3944-4642**: Paso 4 - Servicios Adicionales (~698 líneas)
- **Línea 4642-4778**: Paso 5 - Resumen (~136 líneas)
- **Línea 4778+**: Navegación y modales

### Complejidad por Paso:
1. **Paso 1**: ⭐ Simple (38 líneas) - Selección de cliente
2. **Paso 2**: ⭐⭐⭐⭐⭐ Muy Complejo (641 líneas) - Calendario, fecha, hora, salón
3. **Paso 3**: ⭐⭐⭐⭐ Complejo (539 líneas) - Paquetes, temporadas, precios
4. **Paso 4**: ⭐⭐⭐⭐ Complejo (698 líneas) - Servicios adicionales, cantidades
5. **Paso 5**: ⭐⭐ Moderado (136 líneas) - Resumen y confirmación

---

## 🏗️ Estrategia de Refactorización

### Enfoque: Incremental y Seguro

1. **Crear componentes de paso** en carpeta `components/CrearOferta/`
2. **Cada componente recibe props** con el estado y handlers necesarios
3. **Reemplazar en CrearOferta.jsx** gradualmente
4. **Probar cada paso** antes de continuar al siguiente

### Principios:
- ✅ **Sin cambios de lógica** - Solo extracción
- ✅ **Props claras** - Documentar todas las dependencias
- ✅ **Componentes reutilizables** - Subcomponentes cuando sea posible
- ✅ **Testing incremental** - Verificar cada paso

---

## 📦 Componentes a Crear

### ✅ 1. Paso1ClienteEvento.jsx
**Estado**: ✅ COMPLETADO  
**Ubicación**: `frontend-vendedor/src/components/CrearOferta/Paso1ClienteEvento.jsx`  
**Props**:
- `formData` - Estado del formulario
- `setFormData` - Actualizar formulario
- `clientes` - Lista de clientes
- `isLoadingClientes` - Estado de carga

**Tamaño**: 56 líneas (comprimido desde 38)

---

### 🔄 2. Paso2FechaHoraSalon.jsx
**Estado**: 🔄 EN PROGRESO  
**Complejidad**: ⭐⭐⭐⭐⭐  
**Tamaño Original**: 641 líneas

**Subcomponentes necesarios**:
- `CalendarioEventos.jsx` - Vista de calendario con eventos (~300 líneas)
- `SelectorHorario.jsx` - Selectores de hora inicio/fin (~200 líneas)
- `FormularioEvento.jsx` - Homenajeado, tipo, salón (~100 líneas)

**Props requeridas** (muy extensas):
- `formData`, `setFormData`, `handleChange`
- `tipoEvento`, `setTipoEvento`, `tipoEventoOtro`, `setTipoEventoOtro`
- `salones`, `salonSeleccionado`, `setSalonSeleccionado`
- `lugarPersonalizado`, `setLugarPersonalizado`
- `mesCalendario`, `setMesCalendario`, `añoCalendario`, `setAñoCalendario`
- `horasOcupadas`, `cargandoHorasOcupadas`
- `errorHorario`, `setErrorHorario`
- `errorDisponibilidad`, `verificandoDisponibilidad`
- `excedeCapacidad`
- Funciones: `irAlMesActual`, `cambiarMesCalendario`, `renderizarCalendario`, `verificarRangoOcupado`

**Estrategia**:
1. Crear primero `CalendarioEventos.jsx` (lógica de calendario separada)
2. Luego `SelectorHorario.jsx` (hora inicio/fin)
3. Finalmente `Paso2FechaHoraSalon.jsx` (orquestador)

---

### ⏳ 3. Paso3PaquetePersonas.jsx
**Estado**: PENDIENTE  
**Complejidad**: ⭐⭐⭐⭐  
**Tamaño Original**: ~539 líneas

**Funcionalidades**:
- Selección de paquete
- Ajuste de precio base
- Temporada y sus ajustes
- Cantidad de invitados
- Capacidad del salón
- Modales de confirmación

---

### ⏳ 4. Paso4ServiciosAdicionales.jsx
**Estado**: PENDIENTE  
**Complejidad**: ⭐⭐⭐⭐  
**Tamaño Original**: ~698 líneas

**Funcionalidades**:
- Lista de servicios adicionales
- Cantidades y opciones
- Servicios excluyentes (Photobooth 360 vs Print)
- Cálculo de precios
- Descuentos

---

### ⏳ 5. Paso5Resumen.jsx
**Estado**: PENDIENTE  
**Complejidad**: ⭐⭐  
**Tamaño Original**: ~136 líneas

**Funcionalidades**:
- Resumen completo de la oferta
- Detalle de precios
- Botón enviar
- Notas finales

---

## 🎯 Resultado Esperado

### CrearOferta.jsx Final (~500-800 líneas):
```jsx
// Estructura simplificada:
function CrearOferta() {
  // Estado centralizado (200-300 líneas)
  const [pasoActual, setPasoActual] = useState(1);
  const [formData, setFormData] = useState({...});
  // ... resto del estado

  // Hooks personalizados (50-100 líneas)
  const { data: clientes } = useQuery(...);
  const { data: paquetes } = useQuery(...);
  // ...

  // Handlers y funciones (200-300 líneas)
  const handleChange = () => {...};
  const siguientePaso = () => {...};
  // ...

  // Renderizado (100-200 líneas)
  return (
    <div>
      <IndicadorPasos pasoActual={pasoActual} totalPasos={5} />
      
      {pasoActual === 1 && <Paso1ClienteEvento {...props} />}
      {pasoActual === 2 && <Paso2FechaHoraSalon {...props} />}
      {pasoActual === 3 && <Paso3PaquetePersonas {...props} />}
      {pasoActual === 4 && <Paso4ServiciosAdicionales {...props} />}
      {pasoActual === 5 && <Paso5Resumen {...props} />}
      
      <NavegacionPasos 
        pasoActual={pasoActual}
        onAnterior={anteriorPaso}
        onSiguiente={siguientePaso}
        onGuardar={handleSubmit}
      />
      
      <Modales {...props} />
    </div>
  );
}
```

### Beneficios:
✅ Reducción de ~4,600 líneas a ~600-800 líneas  
✅ Componentes especializados y reutilizables  
✅ Más fácil de mantener y debuggear  
✅ Mejor performance (React puede optimizar mejor)  
✅ Testing más sencillo (cada paso es independiente)  
✅ Onboarding más rápido para nuevos desarrolladores  

---

## 🚧 Desafíos Identificados

1. **Estado Compartido Complejo**: Muchos estados interdependientes
2. **Callbacks Anidados**: Handlers que llaman a otros handlers
3. **Lógica de Validación**: Dispersa en múltiples lugares
4. **Props Drilling**: Muchas props para pasar a componentes hijos

### Soluciones:
- Considerar **Context API** para estado compartido extenso
- Crear **custom hooks** para lógica reutilizable
- Centralizar validaciones en funciones helper
- Usar **composition** en lugar de props drilling

---

## 📈 Progreso

- [x] Análisis del archivo original
- [x] Plan de refactorización
- [x] Paso 1 - Cliente ✅
- [ ] Paso 2 - Fecha/Hora/Salón 🔄
  - [ ] Subcomponente: CalendarioEventos
  - [ ] Subcomponente: SelectorHorario
  - [ ] Componente principal Paso 2
- [ ] Paso 3 - Paquete/Personas
- [ ] Paso 4 - Servicios Adicionales
- [ ] Paso 5 - Resumen
- [ ] Integración en CrearOferta.jsx
- [ ] Testing completo
- [ ] Documentación final

---

**Última Actualización**: Diciembre 3, 2025  
**Progreso Global**: 15% (1 de 7 componentes completados)

