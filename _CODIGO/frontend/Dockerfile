# Dockerfile de Desarrollo para Frontend
FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install

COPY . .

# Exponer puerto 80
EXPOSE 80

# Ejecutar directamente el servidor de desarrollo en el puerto 80
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "80"]
