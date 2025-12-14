# 🚀 Inicio Rápido con Docker

## 1. Instalar Docker Desktop
- **Mac**: https://www.docker.com/products/docker-desktop/ (descargar e instalar)
- **Windows**: https://www.docker.com/products/docker-desktop/ (descargar e instalar)

## 2. Verificar Docker
```bash
docker --version
```

## 3. Iniciar Todo
```bash
cd DiamondSistem
docker-compose up --build
```

**Espera 5-10 minutos la primera vez** (descarga imágenes)

## 4. Acceder
- Vendedor: http://localhost:5173
- Cliente: http://localhost:5174
- Manager: http://localhost:5175
- Gerente: http://localhost:5176
- Administrador: http://localhost:5177
- Backend: http://localhost:5000

## 5. Detener
```bash
# Presiona Ctrl+C
# O en otra terminal:
docker-compose down
```

## Comandos Útiles
```bash
# Ver logs
docker-compose logs -f

# Reiniciar un servicio
docker-compose restart backend

# Detener todo
docker-compose down

# Empezar desde cero (elimina datos)
docker-compose down -v
docker-compose up --build
```

**¡Listo!** 🎉

Para más detalles, ver `GUIA_DOCKER.md`

