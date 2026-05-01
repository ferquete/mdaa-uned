#!/bin/bash

# URLs de la aplicación
FRONTEND_URL="http://localhost:80"
ADMINER_URL="http://localhost:8082"
KEYCLOAK_URL="http://localhost:8080"
MAILHOG_URL="http://localhost:8025"
echo "🚀 Abriendo todas las interfaces web del proyecto en Chrome..."

# Detectar sistema operativo y abrir Chrome
if [[ "$OSTYPE" == "darwin"* ]]; then
  # MacOS: Abrir URLs una a una para evitar bloqueos y asegurar que todas se carguen
  if ! pgrep -x "Google Chrome" > /dev/null; then
    open -a "Google Chrome"
    sleep 5 # Tiempo generoso para el primer arranque
  fi

  for url in "$ADMINER_URL" "$KEYCLOAK_URL" "$MAILHOG_URL" "$FRONTEND_URL"; do
    open -a "Google Chrome" "$url"
    sleep 0.5
  done


elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
  # Linux
  if command -v google-chrome &> /dev/null; then
    google-chrome "$ADMINER_URL" "$KEYCLOAK_URL" "$MAILHOG_URL" "$FRONTEND_URL" &
  elif command -v google-chrome-stable &> /dev/null; then
    google-chrome-stable "$ADMINER_URL" "$KEYCLOAK_URL" "$MAILHOG_URL" "$FRONTEND_URL" &
  else
    echo "⚠️ No se encontró google-chrome. Intentando con el navegador por defecto..."
    xdg-open "$ADMINER_URL"
    xdg-open "$KEYCLOAK_URL"
    xdg-open "$MAILHOG_URL"
    xdg-open "$FRONTEND_URL"
  fi

else
  echo "❌ Sistema operativo no soportado para apertura automática."
  echo "Por favor, abre manualmente: $FRONTEND_URL"
fi




echo "✅ Hecho."
