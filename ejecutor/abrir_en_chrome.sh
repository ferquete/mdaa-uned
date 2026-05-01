#!/bin/bash

# URLs de la aplicación
FRONTEND_URL="http://localhost:80"
ADMINER_URL="http://localhost:8082"
KEYCLOAK_URL="http://localhost:8080"
MAILHOG_URL="http://localhost:8025"
echo "🚀 Abriendo todas las interfaces web del proyecto en Chrome..."

# Abrir Chrome en MacOS con todas las pestañas
open -a "Google Chrome" "$FRONTEND_URL" "$ADMINER_URL" "$KEYCLOAK_URL" "$MAILHOG_URL"



echo "✅ Hecho."
