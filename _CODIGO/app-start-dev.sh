#!/bin/bash

echo "Arrancando Contenedores Docker para MDAA..."

cd docker
docker compose down && docker compose up -d 
#&&  docker logs -f base-keycloak
cd ..


echo "Arrancando servidores back y front de MDAA..."

# Iniciar el backend en segundo plano
echo "[1/2] Iniciando Backend de Spring Boot (WebFlux)..."
cd backend
./mvnw spring-boot:run &
BACKEND_PID=$!

# Vuelve a la raíz y lanza frontend en segundo plano
cd ..
echo "[2/2] Iniciando Frontend de Vue (Vite)..."
cd frontend
npm install
npm run build
npm run dev &
FRONTEND_PID=$!

cd ..

echo "--------------------------------------------------------"
echo "✅ Servidores iniciados con éxito."
echo "👉 Frontend disponible en: http://localhost:5173"
echo "👉 Backend escuchando en: HTTP :8081"
echo "🔴 Presiona Ctrl+C para detener ambos servidores."
echo "--------------------------------------------------------"

# Capturar Ctrl+C (SIGINT) o terminación para matar ambos procesos a la vez
trap "echo 'Apagando servidores...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0" SIGINT SIGTERM

# Mantener el script vivo esperando la ejecución de los pids
wait $BACKEND_PID
wait $FRONTEND_PID
