FROM node:20-alpine

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias
RUN npm install

# Copiar el resto del código
COPY . .

# Exponer puerto
EXPOSE 5173

# Comando de desarrollo (--host 0.0.0.0 permite acceso desde fuera del contenedor)
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

