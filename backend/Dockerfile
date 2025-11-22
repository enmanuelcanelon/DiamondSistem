FROM node:18-alpine

# Instalar dependencias del sistema para Puppeteer
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    python3 \
    make \
    g++

# Configurar Puppeteer para usar Chromium del sistema
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Copiar imágenes de fondo desde la raíz del proyecto (fuera de /app para que no se sobrescriban)
COPY fondoDiamond.png /fondoDiamond.png
COPY fondoRevolutionGeneral.png /fondoRevolutionGeneral.png

WORKDIR /app

# Copiar archivos de dependencias
COPY backend/package*.json ./
COPY backend/prisma ./prisma/

# Instalar dependencias
RUN npm install

# Generar Prisma Client
RUN npx prisma generate

# Copiar el resto del código del backend
COPY backend/ .

# Crear directorio de logs
RUN mkdir -p logs

# Exponer puerto
EXPOSE 5000

# Comando por defecto (se puede sobrescribir en docker-compose)
CMD ["npm", "run", "dev"]

