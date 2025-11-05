# Configuración de Variables de Entorno

## Para Mac conectado a Backend en Windows

Crea un archivo `.env` en la carpeta `frontend/` con el siguiente contenido:

```env
VITE_API_URL=http://10.0.0.156:5000/api
```

**IMPORTANTE:** 
- Reemplaza `10.0.0.156` con la IP real de tu Windows
- El archivo debe llamarse exactamente `.env` (con el punto al inicio)
- Debe estar en la carpeta `frontend/` (no en `frontend/src/`)

## Pasos para crear el archivo en Mac:

1. Abre la terminal en Mac
2. Navega a la carpeta del frontend:
   ```bash
   cd ~/Desktop/DiamondSistem/frontend
   ```
3. Crea el archivo:
   ```bash
   nano .env
   ```
4. Pega este contenido:
   ```env
   VITE_API_URL=http://10.0.0.156:5000/api
   ```
   (Reemplaza `10.0.0.156` con la IP de tu Windows)
5. Guarda y cierra:
   - Presiona `Ctrl + X`
   - Presiona `Y` para confirmar
   - Presiona `Enter` para guardar
6. Reinicia el servidor de desarrollo:
   ```bash
   # Detén el servidor actual (Ctrl+C)
   npm run dev
   ```

## Verificar que funciona:

Después de crear el `.env` y reiniciar, verifica en la consola del navegador que las peticiones van a la IP correcta (no a `localhost:5000`).

