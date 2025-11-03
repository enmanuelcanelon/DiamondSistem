# 🧪 Guía Completa de Pruebas del Sistema DiamondSistem

## 📋 Tabla de Contenidos
1. [Preparación](#preparación)
2. [Pruebas del Portal del Vendedor](#portal-del-vendedor)
3. [Pruebas del Portal del Cliente](#portal-del-cliente)
4. [Pruebas de Integración](#pruebas-de-integración)
5. [Checklist de Verificación](#checklist)
6. [Errores Comunes y Soluciones](#errores-comunes)

---

## 🚀 Preparación

### 1. Verificar que Todo Esté Corriendo

**Backend:**
```powershell
cd backend
npm run dev
```
✅ Debe mostrar: "Servidor corriendo en: http://localhost:5000"

**Frontend:**
```powershell
cd frontend
npm run dev
```
✅ Debe mostrar: "Local: http://localhost:5173"

**Base de Datos:**
- Verifica que PostgreSQL esté corriendo
- Verifica que la base de datos `diamondsistem` existe

### 2. Datos de Prueba

**Vendedor de Prueba:**
- Código: `VEND-001`
- Password: (el que configuraste en seeds.sql)

**Obtener Código de Acceso del Cliente:**
```sql
SELECT codigo_acceso_cliente, codigo_contrato, fecha_evento
FROM contratos
WHERE estado = 'activo'
LIMIT 1;
```

---

## 👨‍💼 Portal del Vendedor

### Test 1: Login
1. Ve a: `http://localhost:5173/login`
2. Ingresa código vendedor: `VEND-001`
3. Ingresa contraseña
4. Click en "Iniciar Sesión"

**✅ Resultado Esperado:**
- Redirección al dashboard
- Muestra nombre del vendedor
- Muestra estadísticas

### Test 2: Gestión de Clientes

#### 2.1 Crear Cliente
1. Click en "Clientes" en el sidebar
2. Click en "Nuevo Cliente"
3. Completa el formulario:
   - Nombre: "Juan Pérez"
   - Email: "juan@test.com"
   - Teléfono: "555-1234"
   - Tipo evento: "Boda"
4. Click en "Guardar"

**✅ Resultado Esperado:**
- Cliente aparece en la lista
- Mensaje de éxito
- Redirección a lista de clientes

#### 2.2 Editar Cliente
1. En lista de clientes, hover sobre una tarjeta
2. Click en ícono de editar (lápiz)
3. Modifica algún campo
4. Click en "Actualizar"

**✅ Resultado Esperado:**
- Cambios guardados
- Actualización inmediata en la lista

#### 2.3 Buscar Cliente
1. En la página de clientes
2. Escribe un nombre en la barra de búsqueda
3. Verifica filtrado en tiempo real

**✅ Resultado Esperado:**
- Lista filtra automáticamente
- Muestra solo resultados coincidentes

#### 2.4 Eliminar Cliente
1. Hover sobre un cliente
2. Click en ícono de papelera
3. Confirma eliminación

**✅ Resultado Esperado:**
- Cliente eliminado
- Lista actualizada

### Test 3: Gestión de Ofertas

#### 3.1 Crear Oferta
1. Click en "Ofertas" → "Nueva Oferta"
2. Completa formulario:
   - Cliente: Selecciona uno
   - Paquete: Selecciona uno
   - Fecha evento: (fecha futura)
   - Hora inicio/fin
   - Cantidad invitados
   - Lugar: Selecciona
3. Observa detección automática de temporada
4. Observa cálculo de precio en tiempo real
5. Agrega servicios adicionales
6. Click en "Crear Oferta"

**✅ Resultado Esperado:**
- Temporada detectada automáticamente
- Precio calculado correctamente
- Servicios del paquete mostrados
- Servicios adicionales excluyen los del paquete
- Oferta creada con código único

#### 3.2 Aceptar Oferta
1. En lista de ofertas, busca una pendiente
2. Click en "Aceptar Oferta"
3. Confirma

**✅ Resultado Esperado:**
- Estado cambia a "aceptada"
- Badge verde
- Aparece botón "Crear Contrato"

#### 3.3 Rechazar Oferta
1. Busca oferta pendiente
2. Click en "Rechazar"
3. Confirma

**✅ Resultado Esperado:**
- Estado cambia a "rechazada"
- Badge rojo
- No se puede crear contrato

#### 3.4 Editar Oferta
1. Busca oferta pendiente
2. Click en "Editar Oferta"
3. Modifica datos
4. Guarda

**✅ Resultado Esperado:**
- Cambios guardados
- Solo permite editar ofertas pendientes

#### 3.5 Descargar PDF de Oferta
1. En cualquier oferta, click en "Descargar Factura Proforma"
2. Verifica descarga

**✅ Resultado Esperado:**
- PDF descargado
- Contiene todos los datos
- Formato correcto

#### 3.6 Buscar y Filtrar Ofertas
1. Usa barra de búsqueda
2. Filtra por estado
3. Verifica resultados

**✅ Resultado Esperado:**
- Búsqueda funciona por código y cliente
- Filtros aplican correctamente

### Test 4: Gestión de Contratos

#### 4.1 Crear Contrato desde Oferta
1. Busca oferta aceptada
2. Click en "Crear Contrato"
3. Confirma

**✅ Resultado Esperado:**
- Contrato creado con código único
- Código de acceso generado
- Redirección a detalles del contrato

#### 4.2 Ver Detalles de Contrato
1. Click en "Ver Detalles" de un contrato
2. Verifica información mostrada

**✅ Resultado Esperado:**
- Info del evento completa
- Paquete y servicios
- Estado de pago con barra de progreso
- Botones de acción disponibles

#### 4.3 Registrar Pago
1. En detalle de contrato, click en "Registrar Pago"
2. Completa formulario:
   - Monto: (parte del saldo)
   - Método: Efectivo
   - Referencia: "TEST-001"
3. Click en "Registrar Pago"

**✅ Resultado Esperado:**
- Pago registrado
- Saldo pendiente actualizado
- Barra de progreso actualizada
- Estado de pago cambia si corresponde
- Historial de pagos muestra nuevo pago

#### 4.4 Descargar PDFs de Contrato
1. Click en "Descargar Contrato Completo"
2. Click en "Descargar Factura Proforma"

**✅ Resultado Esperado:**
- Ambos PDFs se descargan
- Contrato incluye términos
- Factura simplificada

#### 4.5 Buscar y Filtrar Contratos
1. Busca por código o nombre
2. Filtra por estado de pago
3. Filtra por estado del contrato

**✅ Resultado Esperado:**
- Búsqueda funciona
- Filtros múltiples funcionan juntos
- Resultados actualizan en tiempo real

### Test 5: Asignación de Mesas (Vendedor)

#### 5.1 Acceder a Mesas
1. Desde detalle de contrato
2. Click en "Asignación de Mesas"

**✅ Resultado Esperado:**
- Vista de mesas e invitados
- Dos paneles (invitados sin mesa y mesas)

#### 5.2 Crear Mesa
1. Click en "Nueva Mesa"
2. Completa:
   - Número: 1
   - Nombre: "Familia"
   - Capacidad: 10
   - Forma: Redonda
3. Guarda

**✅ Resultado Esperado:**
- Mesa creada
- Aparece en lista de mesas

#### 5.3 Agregar Invitados
1. Click en "+" en panel izquierdo
2. Agrega varios invitados
3. Verifica contador

**✅ Resultado Esperado:**
- Invitados agregados
- Contador actualizado
- Aparecen en "Sin Mesa"

#### 5.4 Asignar Invitados a Mesa
1. En invitado sin mesa
2. Selecciona mesa en dropdown
3. Verifica asignación

**✅ Resultado Esperado:**
- Invitado se mueve a la mesa
- Contador de mesa actualiza
- Barra de progreso de capacidad

#### 5.5 Desasignar Invitado
1. Hover sobre invitado en mesa
2. Click en botón "-"
3. Confirma

**✅ Resultado Esperado:**
- Invitado regresa a "Sin Mesa"
- Capacidad actualizada

### Test 6: Playlist Musical (Vendedor)

#### 6.1 Acceder a Playlist
1. Desde detalle de contrato
2. Click en "Playlist Musical"

**✅ Resultado Esperado:**
- Vista de playlist
- Estadísticas visibles

#### 6.2 Agregar Canciones
1. Click en "Agregar Canción"
2. Completa:
   - Título: "Perfect"
   - Artista: "Ed Sheeran"
   - Género: Pop
   - Categoría: Favorita
   - Notas: "Primer baile"
3. Guarda

**✅ Resultado Esperado:**
- Canción agregada
- Estadísticas actualizadas
- Iconos correctos según categoría

#### 6.3 Buscar y Filtrar Canciones
1. Usa búsqueda
2. Filtra por categoría

**✅ Resultado Esperado:**
- Búsqueda funciona
- Filtros funcionan

#### 6.4 Eliminar Canción
1. Hover sobre canción
2. Click en papelera
3. Confirma

**✅ Resultado Esperado:**
- Canción eliminada
- Lista actualizada

---

## 👥 Portal del Cliente

### Test 7: Login del Cliente

1. Ve a: `http://localhost:5173/cliente/login`
2. Ingresa código de acceso
3. Click en "Acceder a mi Evento"

**✅ Resultado Esperado:**
- Redirección al dashboard
- Muestra nombre del cliente
- Muestra código del contrato

### Test 8: Dashboard del Cliente

#### 8.1 Verificar Información
1. Verifica countdown de días
2. Verifica información del evento
3. Verifica estado de pago
4. Verifica paquete contratado

**✅ Resultado Esperado:**
- ⏰ **Contador de días**: Muestra "X días para tu evento"
  - Colores cambian según proximidad:
    - Azul: Más de 90 días
    - Morado: 30-90 días
    - Naranja: 7-30 días
    - Rojo: Menos de 7 días
    - Verde parpadeante: ¡HOY!
- Información correcta del evento
- Barra de progreso de pago funcional
- Tarjetas de estadísticas correctas

#### 8.2 Navegación
1. Click en cada card de estadísticas
2. Verifica redirección

**✅ Resultado Esperado:**
- Links funcionan
- Lleva a página correcta

### Test 9: Playlist del Cliente

1. Click en "Playlist" en menú
2. Agrega canciones favoritas
3. Marca canciones prohibidas
4. Agrega sugeridas
5. Busca y filtra

**✅ Resultado Esperado:**
- Cliente puede agregar canciones
- Todas las categorías funcionan
- Búsqueda funciona
- Estadísticas actualizadas

### Test 10: Mesas del Cliente

1. Click en "Mesas"
2. Crea mesas
3. Agrega invitados
4. Asigna invitados

**✅ Resultado Esperado:**
- Cliente puede gestionar mesas
- Misma funcionalidad que vendedor
- Interfaz amigable

### Test 11: Ajustes del Evento

#### 11.1 Sección Torta
1. Click en "Ajustes"
2. Tab "Torta"
3. Completa:
   - Sabor: Chocolate
   - Tamaño: 2 pisos
   - Relleno: Crema
4. Guarda

**✅ Resultado Esperado:**
- Datos guardados
- Barra de progreso actualizada

#### 11.2 Sección Decoración
1. Tab "Decoración"
2. Completa:
   - Estilo: Elegante
   - Temática: Jardín
   - Colores: Blanco y dorado
   - Flores: Rosas
3. Guarda

**✅ Resultado Esperado:**
- Datos guardados
- Progreso aumenta
- Cambios persisten

### Test 12: Chat Cliente-Vendedor

#### 12.1 Cliente Envía Mensaje
1. Click en "Chat" en menú del cliente
2. Escribe mensaje: "Hola, tengo una pregunta"
3. Envía

**✅ Resultado Esperado:**
- Mensaje enviado
- Aparece en burbuja azul/morada
- Hora correcta
- Scroll automático

#### 12.2 Vendedor Recibe y Responde
1. Login como vendedor (otra ventana)
2. Ve a detalles del contrato
3. Scroll abajo (futuro: sección chat)
4. O usa endpoint directamente

**✅ Resultado Esperado:**
- Vendedor ve mensaje
- Puede responder
- Marcado como leído

#### 12.3 Cliente Ve Respuesta
1. Espera 5 segundos (refetch automático)
2. O refresca página

**✅ Resultado Esperado:**
- Mensaje del vendedor aparece
- En burbuja blanca
- Indicador "Leído" en mensaje del cliente

---

## 🔗 Pruebas de Integración

### Test 13: Flujo Completo End-to-End

#### Escenario: "Cliente reserva una boda"

**Paso 1: Vendedor crea cliente**
1. Login vendedor
2. Crear cliente "María García"

**Paso 2: Vendedor crea oferta**
1. Nueva oferta para María
2. Paquete "Deluxe"
3. Fecha: 6 meses en el futuro
4. 150 invitados
5. Servicios adicionales: Banda en vivo

**Paso 3: Vendedor acepta oferta**
1. Acepta la oferta
2. Crea contrato

**Paso 4: Cliente accede**
1. Login con código de acceso
2. Ve countdown: "180 días para tu evento"
3. Ve información completa

**Paso 5: Cliente personaliza**
1. Agrega playlist (20 canciones)
2. Configura 15 mesas
3. Agrega 150 invitados
4. Asigna todos a mesas
5. Completa ajustes de torta y decoración

**Paso 6: Comunicación**
1. Cliente envía mensaje: "¿Puedo cambiar el color de las flores?"
2. Vendedor responde: "Claro, ¿qué color prefieres?"
3. Cliente: "Rosa pastel"

**Paso 7: Pagos**
1. Vendedor registra pago inicial: $5,000
2. Cliente ve actualización
3. Vendedor registra segundo pago: $5,000
4. Cliente ve progreso al 66%

**Paso 8: Finalizaciónes**
1. Cliente finaliza ajustes (100%)
2. Vendedor descarga contrato PDF
3. Cliente descarga factura

**✅ Resultado Esperado:**
- Todo el flujo completo sin errores
- Datos consistentes entre portales
- Actualizaciones en tiempo real
- PDFs generados correctamente

---

## ✅ Checklist de Verificación

### Funcionalidades del Vendedor
- [ ] Login/Logout
- [ ] Dashboard con estadísticas
- [ ] CRUD de Clientes
- [ ] Búsqueda de clientes
- [ ] Crear ofertas con cálculo automático
- [ ] Detección automática de temporada
- [ ] Editar ofertas pendientes
- [ ] Aceptar/Rechazar ofertas
- [ ] Crear contratos desde ofertas
- [ ] Registrar pagos
- [ ] Ver historial de pagos
- [ ] Buscar/Filtrar ofertas
- [ ] Buscar/Filtrar contratos
- [ ] Descargar PDF de ofertas
- [ ] Descargar PDF de contratos
- [ ] Gestionar mesas e invitados
- [ ] Gestionar playlist musical

### Funcionalidades del Cliente
- [ ] Login con código de acceso
- [ ] Dashboard personalizado
- [ ] **Countdown de días para el evento**
- [ ] Ver información del evento
- [ ] Ver estado de pagos
- [ ] Ver paquete y servicios
- [ ] Gestionar playlist musical
- [ ] Agregar canciones favoritas/prohibidas
- [ ] Gestionar mesas e invitados
- [ ] Asignar invitados a mesas
- [ ] Ajustar detalles de torta
- [ ] Ajustar decoración
- [ ] Chat con vendedor
- [ ] Ver info del vendedor asignado
- [ ] Descargar facturas

### Funcionalidades Generales
- [ ] Cálculo correcto de precios
- [ ] IVA 7% aplicado
- [ ] Tarifa de servicio 18% aplicada
- [ ] Descuentos funcionan
- [ ] Servicios mutuamente excluyentes
- [ ] Progreso de completado
- [ ] Responsive design
- [ ] Actualizaciones en tiempo real
- [ ] Manejo de errores
- [ ] Validaciones de formularios

---

## 🐛 Errores Comunes y Soluciones

### Error 1: "Código de acceso inválido"
**Solución:** Verifica que el código esté correcto en la BD:
```sql
SELECT codigo_acceso_cliente FROM contratos WHERE id = X;
```

### Error 2: Countdown no aparece
**Causa:** Fecha del evento no está en el contrato
**Solución:** Verifica que `fecha_evento` existe y es válida

### Error 3: Chat no actualiza
**Causa:** Backend no está corriendo o problema de red
**Solución:** Verifica que `http://localhost:5000` responde

### Error 4: PDFs vacíos o con errores
**Causa:** Datos incompletos en contrato
**Solución:** Verifica que el contrato tiene todos los datos necesarios

### Error 5: Precio calculado incorrecto
**Causa:** Temporada no detectada o servicios duplicados
**Solución:** Verifica seeds de temporadas y servicios

### Error 6: "Cannot read property of undefined"
**Causa:** Datos no cargados aún
**Solución:** Verifica que `isLoading` esté manejado correctamente

### Error 7: Invitados no se asignan a mesas
**Causa:** Mesa llena o ID incorrecto
**Solución:** Verifica capacidad de la mesa

### Error 8: Countdown muestra fecha incorrecta
**Causa:** Zona horaria o formato de fecha
**Solución:** Verifica que la fecha esté en formato ISO

---

## 📊 Métricas de Éxito

### Rendimiento
- [ ] Página carga en menos de 2 segundos
- [ ] Búsquedas responden en menos de 500ms
- [ ] Chat actualiza cada 5 segundos
- [ ] PDFs generan en menos de 3 segundos

### Usabilidad
- [ ] Usuario puede completar tarea sin ayuda
- [ ] Navegación intuitiva
- [ ] Mensajes de error claros
- [ ] Feedback visual inmediato

### Datos
- [ ] No hay pérdida de datos
- [ ] Transacciones son atómicas
- [ ] Validaciones previenen datos incorrectos
- [ ] Relaciones de BD mantienen integridad

---

## 🎯 Próximos Pasos

Después de completar todas las pruebas:

1. **Documentar bugs encontrados**
2. **Priorizar correcciones**
3. **Completar secciones de Ajustes restantes** (Menú, Entretenimiento, Fotografía)
4. **Implementar Emails Automáticos**
5. **Implementar Firma Digital**
6. **Optimizaciones de rendimiento**
7. **Deploy a producción**

---

**¡Sistema listo para pruebas! 🚀**



