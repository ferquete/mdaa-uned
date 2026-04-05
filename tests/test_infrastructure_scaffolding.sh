#!/bin/bash
set -e

echo "Running tests for docker-compose.yml..."

if [ ! -f "docker-compose.yml" ]; then
  echo "Error: docker-compose.yml not found."
  exit 1
fi

echo "Verifying docker-compose.yml syntax..."
docker-compose config -q
echo "Syntax is valid."

echo "Checking for required services..."
services=("postgres" "redis" "mailhog" "keycloak")
for service in "${services[@]}"; do
  if ! docker-compose config --services | grep -q "^$service$"; then
    echo "Error: Service $service not found in docker-compose.yml."
    exit 1
  fi
done
echo "All required services found."

echo "All tests passed!"
