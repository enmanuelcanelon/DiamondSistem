# 🚀 Setup del Sistema de Inventario

## Pasos para Configurar el Sistema de Inventario

### 1. ✅ Schema de Base de Datos (YA COMPLETADO)
El schema de Prisma ya está sincronizado con la base de datos.

### 2. Poblar Catálogo de Items

Ejecuta el script SQL para crear todos los items del inventario:

**Opción A: Desde pgAdmin 4**
1. Abre pgAdmin 4
2. Conéctate a tu servidor PostgreSQL
3. Selecciona la base de datos `diamondsistem`
4. Abre la herramienta Query Tool
5. Copia y pega el contenido del archivo: `database/seeds_inventario.sql`
6. Ejecuta el script (F5 o botón Execute)

**Opción B: Desde línea de comandos**
```powershell
# Ajusta la ruta a psql según tu instalación
& "C:\Program Files\PostgreSQL\16\bin\psql.exe" -U postgres -d diamondsistem -f database\seeds_inventario.sql
```

### 3. Inicializar Inventario Central

Ejecuta el script para inicializar el inventario central con 100 unidades de cada item:

**Opción A: Desde pgAdmin 4**
1. Abre Query Tool en pgAdmin 4
2. Copia y pega el contenido del archivo: `database/init_inventario_central.sql`
3. Ejecuta el script (F5)

**Opción B: Desde línea de comandos**
```powershell
& "C:\Program Files\PostgreSQL\16\bin\psql.exe" -U postgres -d diamondsistem -f database\init_inventario_central.sql
```

### 4. Crear Usuario de Inventario

Ejecuta el script para crear un usuario de prueba:

**Opción A: Desde pgAdmin 4**
1. Abre Query Tool en pgAdmin 4
2. Copia y pega el contenido del archivo: `database/create_usuario_inventario.sql`
3. Ejecuta el script (F5)

**Opción B: Desde línea de comandos**
```powershell
& "C:\Program Files\PostgreSQL\16\bin\psql.exe" -U postgres -d diamondsistem -f database\create_usuario_inventario.sql
```

**Credenciales de Prueba:**
- Código: `INV001`
- Password: `Inventario123!`

### 5. Instalar Dependencias del Frontend

```powershell
cd frontend-inventario
npm install
```

### 6. Iniciar el Sistema

**Terminal 1 - Backend:**
```powershell
cd backend
npm run dev
```

**Terminal 2 - Frontend Inventario:**
```powershell
cd frontend-inventario
npm run dev
```

### 7. Acceder al Sistema

Abre tu navegador en:
- **Frontend Inventario**: http://localhost:5177
- **Backend API**: http://localhost:5000

### 8. Login

Usa las credenciales:
- Código de Usuario: `INV001`
- Password: `Inventario123!`

## 📋 Funcionalidades Disponibles

### Dashboard
- Ver inventario central con alertas de stock bajo
- Ver inventario por salones (Diamond, Kendall, Doral)
- Estadísticas de items y alertas

### Asignaciones
- Ver todas las asignaciones de inventario a eventos
- Filtrar por contrato, salón o estado
- Editar asignaciones manualmente

### API Endpoints

- `GET /api/inventario/central` - Inventario central
- `GET /api/inventario/salones` - Inventario por salones
- `GET /api/inventario/asignaciones` - Asignaciones
- `GET /api/inventario/alertas` - Alertas de stock bajo
- `POST /api/inventario/calcular/:contratoId` - Calcular inventario necesario
- `POST /api/inventario/asignar/:contratoId` - Asignar inventario automáticamente
- `POST /api/inventario/transferencia` - Transferir items entre almacén y salones

## 🔄 Job Automático

El sistema tiene un job configurado que se ejecuta **diariamente a las 2:00 AM** para asignar automáticamente inventario a contratos que están a 1 mes del evento.

También puedes ejecutarlo manualmente:
```bash
POST /api/inventario/ejecutar-asignacion-automatica
```

## ⚠️ Notas Importantes

1. **Configuración Base**: El sistema está configurado para 80 invitados base en el salón Diamond. Kendall y Doral usan la misma configuración.

2. **Cálculo Proporcional**: Si un evento tiene más de 80 invitados, el sistema calcula proporcionalmente las cantidades necesarias.

3. **Asignación Automática**: El sistema intenta tomar primero del inventario del salón, y si no hay suficiente, toma del almacén central.

4. **Alertas**: El sistema alerta cuando el stock está por debajo de la cantidad mínima (20 para central, 10 para salones).

## 🐛 Troubleshooting

### Error: "No hay suficiente stock"
- Verifica que el inventario central tenga suficientes unidades
- Usa la ruta de transferencia para mover items del central a los salones

### Error: "Item no encontrado"
- Asegúrate de haber ejecutado `seeds_inventario.sql`
- Verifica que los items estén activos en la base de datos

### El job no se ejecuta
- Verifica que el servidor backend esté corriendo
- Revisa los logs del servidor para ver si hay errores
- El job se ejecuta a las 2:00 AM (zona horaria: America/New_York)

