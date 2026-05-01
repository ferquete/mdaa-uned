# Dockerfile de Desarrollo para Frontend
FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install

COPY . .

# Exponer puerto 80
EXPOSE 80

# Ejecutar auditoría de seguridad, comprobación de tipos (para ver referencias no usadas) y arrancar dev
CMD npm audit || true && npx vue-tsc -b || true && npm run dev -- --host 0.0.0.0 --port 80
