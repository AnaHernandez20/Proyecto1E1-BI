FROM node:20-alpine

WORKDIR /app

# Copia package.json y package-lock.json
COPY Front/ods-classifier/package*.json ./
RUN npm ci

# Copia el resto de la aplicación
COPY Front/ods-classifier ./

# Construye la aplicación ignorando errores de ESLint
RUN npm run build

EXPOSE 3000

# Ejecuta la aplicación en modo producción
CMD ["npm", "start"]