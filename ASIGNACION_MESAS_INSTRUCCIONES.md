# 🪑 Sistema de Asignación de Mesas - Instrucciones

## 📋 Resumen

Se ha implementado un sistema simple y eficiente para asignar mesas a los invitados de cada evento. Este sistema permite:

- ✅ Crear y gestionar mesas con capacidad personalizada
- ✅ Agregar invitados al evento
- ✅ Asignar/desasignar invitados a mesas de forma sencilla
- ✅ Ver el estado de ocupación de cada mesa en tiempo real
- ✅ Gestionar diferentes tipos de invitados (adulto, niño, bebé)

## 🚀 Pasos para Activar el Sistema

### 1. Detener el Servidor Backend

Antes de regenerar Prisma, debes detener el servidor backend:

```powershell
# En la terminal donde está corriendo el backend, presiona:
Ctrl + C
```

### 2. Ejecutar la Migración de Base de Datos

Abre **pgAdmin 4** o **psql** y ejecuta la siguiente migración:

```powershell
# Usando psql (asegúrate de tener la ruta correcta a psql en tu PATH)
# O ejecuta desde pgAdmin 4 copiando y pegando el contenido del archivo
```

**Opción A: Desde pgAdmin 4**
1. Abre pgAdmin 4
2. Conéctate a tu servidor PostgreSQL
3. Selecciona la base de datos `diamondsistem`
4. Abre la herramienta Query Tool
5. Copia y pega el contenido del archivo: `database/migration_seating_chart.sql`
6. Ejecuta el script (F5 o botón Execute)

**Opción B: Desde línea de comandos**
```powershell
# Navega al directorio del proyecto
cd C:\Users\eac\Desktop\DiamondSistem

# Ejecuta la migración (ajusta la ruta a psql según tu instalación)
& "C:\Program Files\PostgreSQL\16\bin\psql.exe" -U postgres -d diamondsistem -f database\migration_seating_chart.sql
```

### 3. Regenerar Cliente de Prisma

Después de ejecutar la migración, regenera el cliente de Prisma:

```powershell
cd backend
npx prisma generate
```

### 4. Reiniciar el Servidor Backend

Una vez regenerado Prisma, inicia nuevamente el servidor:

```powershell
# Asegúrate de estar en el directorio backend
npm run dev
```

### 5. Reiniciar el Frontend (si es necesario)

Si el frontend no estaba corriendo, inícialo:

```powershell
cd ../frontend
npm run dev
```

## 📱 Cómo Usar la Funcionalidad

### Acceder a la Asignación de Mesas

1. **Ve a Contratos**: Navega a la página de contratos
2. **Selecciona un Contrato**: Haz clic en "Ver Detalles" de cualquier contrato
3. **Botón de Asignación de Mesas**: En la parte superior, verás un botón verde "Asignación de Mesas"
4. **Haz clic**: Esto te llevará a la interfaz de asignación

### Crear Mesas

1. Haz clic en el botón **"Nueva Mesa"**
2. Completa los campos:
   - **Número de mesa** (obligatorio): Ej. 1, 2, 3...
   - **Nombre** (opcional): Ej. "Familia del novio", "Amigos"
   - **Capacidad** (obligatorio): Cantidad de personas que pueden sentarse
   - **Forma**: Redonda, Rectangular, o Cuadrada
3. Haz clic en **"Crear Mesa"**

### Agregar Invitados

1. En el panel izquierdo "Invitados Sin Mesa", haz clic en el botón **"+"**
2. Completa los campos:
   - **Nombre completo** (obligatorio)
   - **Email** (opcional)
   - **Teléfono** (opcional)
   - **Tipo**: Adulto, Niño, o Bebé
3. Haz clic en **"Guardar"**

### Asignar Invitados a Mesas

**Método Simple (Dropdown):**
1. En el panel izquierdo, cada invitado sin mesa tiene un dropdown
2. Selecciona la mesa deseada del dropdown
3. El invitado se asignará automáticamente a esa mesa

**Características:**
- ✅ No puedes asignar invitados a mesas que ya están llenas
- ✅ Ves la capacidad disponible en cada opción: `Mesa 1 - 5/10`
- ✅ Las mesas llenas aparecen deshabilitadas

### Desasignar Invitados

1. En el panel derecho, dentro de cada mesa, verás los invitados asignados
2. Pasa el mouse sobre un invitado
3. Aparecerá un botón rojo con el icono `-`
4. Haz clic para desasignar al invitado
5. El invitado regresará al panel "Invitados Sin Mesa"

### Eliminar Mesas o Invitados

**Eliminar Mesa:**
- Haz clic en el icono de **papelera roja** en la esquina superior derecha de la mesa
- Los invitados asignados a esa mesa quedarán sin asignar automáticamente

**Eliminar Invitado:**
- Pasa el mouse sobre un invitado sin mesa
- Haz clic en el icono de **papelera roja**
- El invitado se eliminará permanentemente

## 🎨 Indicadores Visuales

### Barra de Progreso de Capacidad

Cada mesa muestra una barra de progreso que indica su estado de ocupación:

- 🟢 **Verde**: Menos del 70% de capacidad
- 🟡 **Amarillo**: Entre 70% y 100% de capacidad
- 🔴 **Rojo**: Capacidad completa (100% o más)

### Contadores

- **Panel Izquierdo**: "Invitados Sin Mesa (X)" - Muestra cuántos invitados faltan por asignar
- **Panel Derecho**: "Mesas (X)" - Muestra cuántas mesas hay creadas
- **Cada Mesa**: "X/Y" - Muestra invitados asignados vs capacidad

## 🔐 API Endpoints (para referencia)

### Mesas
- `GET /api/mesas/contrato/:contratoId` - Obtener mesas de un contrato
- `POST /api/mesas` - Crear mesa
- `PUT /api/mesas/:id` - Actualizar mesa
- `DELETE /api/mesas/:id` - Eliminar mesa

### Invitados
- `GET /api/invitados/contrato/:contratoId` - Obtener invitados de un contrato
- `POST /api/invitados` - Crear invitado(s)
- `PUT /api/invitados/:id` - Actualizar invitado
- `PATCH /api/invitados/:id/asignar-mesa` - Asignar/desasignar mesa
- `DELETE /api/invitados/:id` - Eliminar invitado

## 🗄️ Estructura de Base de Datos

### Tabla: `mesas`
```sql
- id (PK)
- contrato_id (FK -> contratos)
- numero_mesa
- nombre_mesa (opcional)
- capacidad
- forma (redonda, rectangular, cuadrada)
- notas (opcional)
- posicion_x, posicion_y (para futura visualización gráfica)
- fecha_creacion, fecha_actualizacion
```

### Tabla: `invitados`
```sql
- id (PK)
- contrato_id (FK -> contratos)
- nombre_completo
- email (opcional)
- telefono (opcional)
- tipo (adulto, niño, bebe)
- mesa_id (FK -> mesas, nullable)
- confirmado (boolean)
- asistira (boolean, nullable)
- restricciones_alimentarias (opcional)
- notas (opcional)
- fecha_creacion, fecha_actualizacion
```

## 🎯 Próximos Pasos (Opcionales)

Si deseas ampliar la funcionalidad, puedes:

1. **Vista Gráfica de Plano**: Usar las coordenadas `posicion_x` y `posicion_y` para crear un plano visual drag-and-drop
2. **Confirmación de Asistencia**: Activar el campo `confirmado` y `asistira` para que los clientes confirmen
3. **Restricciones Alimentarias**: Agregar formularios para capturar necesidades especiales de cada invitado
4. **Exportar a PDF**: Generar un PDF con el plano de mesas para imprimir
5. **Etiquetas/Tags**: Agrupar invitados por categorías (familia, amigos, trabajo, etc.)

## ❓ Solución de Problemas

### Error: "Mesa ya está llena"
- Revisa la capacidad de la mesa
- Desasigna invitados o aumenta la capacidad de la mesa

### No aparecen mesas o invitados
- Verifica que estés viendo el contrato correcto
- Asegúrate de que el backend esté corriendo
- Revisa la consola del navegador (F12) para ver errores

### Error al crear mesa: "Número de mesa ya existe"
- Cada mesa debe tener un número único por contrato
- Usa un número diferente o elimina la mesa anterior

## 📞 Soporte

Si tienes problemas o dudas, revisa:
- Los logs del backend en la terminal
- La consola del navegador (F12 → Console)
- Los mensajes de error que aparecen en las alertas

---

**¡Sistema de Asignación de Mesas listo para usar! 🎉**



