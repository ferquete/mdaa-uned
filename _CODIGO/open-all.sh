#!/bin/bash

# URLs de la aplicación
FRONTEND_URL="http://localhost:5173"
ADMINER_URL="http://localhost:8082"
KEYCLOAK_URL="http://localhost:8080"
MAILHOG_URL="http://localhost:8025"
OPEN_WEBUI_URL="http://localhost:3000"

echo "🚀 Abriendo todas las interfaces web del proyecto en Chrome..."

# Abrir Chrome en MacOS con todas las pestañas
open -a "Google Chrome" "$FRONTEND_URL" "$ADMINER_URL" "$KEYCLOAK_URL" "$MAILHOG_URL" "$OPEN_WEBUI_URL"

echo "✅ Hecho."
