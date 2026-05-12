# Manual de Despliegue MDAA en Azure

Este documento detalla los pasos para desplegar y gestionar el stack MDAA en Azure Container Instances (ACI).

## 1. Configuración Inicial de la Cuenta (Una sola vez)

1. **Login en Azure**:
   ```bash
   az login
   ```
2. **Registro de Proveedores**: Necesario para habilitar el uso de contenedores en tu suscripción.
   ```bash
   az provider register --namespace Microsoft.ContainerRegistry
   az provider register --namespace Microsoft.ContainerInstance
   ```
3. **Creación del Registro de Contenedores (ACR)**:
   ```bash
   az acr create --resource-group mdaa --name mdaaregistry --sku Basic
   az acr update --name mdaaregistry --admin-enabled true
   ```

## 2. Preparación del Almacenamiento (Portal Web)

Debido a errores conocidos en el CLI de Azure en macOS, realiza estos pasos en el **Portal de Azure**:

1. Ve a tu **Cuenta de almacenamiento `mdaa`**.
2. En **File Shares**, crea tres recursos compartidos:
   - `mariadb-share`: Para los datos persistentes de la BD.
   - `keycloak-share`: Para la configuración de seguridad.
   - `mariadb-init`: Para los scripts SQL de inicio.
3. **Subida de Archivos**:
   - Sube `./docker/volumenes/keycloak/realm-basedb.json` a `keycloak-share`.
   - Sube los archivos `.sql` de `./docker/init_db/mariadb/` a `mariadb-init`.

## 3. Construcción y Subida de Imágenes

Sincroniza tu código local con el registro de la nube usando el archivo **`docker-compose.prod.yml`**.

> [!IMPORTANT]
> Si usas un Mac (Apple Silicon M1/M2/M3), es **OBLIGATORIO** especificar la plataforma `linux/amd64`. Sin esto, los contenedores fallarán silenciosamente en Azure.

```bash
az acr login --name mdaaregistry

# Construir para arquitectura Intel/AMD (la que usa Azure)
docker build --platform linux/amd64 -t mdaaregistry.azurecr.io/backend:latest ./_CODIGO/backend
docker push mdaaregistry.azurecr.io/backend:latest

docker build --platform linux/amd64 -t mdaaregistry.azurecr.io/frontend:latest ./_CODIGO/frontend
docker push mdaaregistry.azurecr.io/frontend:latest
```

## 4. Archivos de Configuración de Despliegue

Usamos dos archivos complementarios según el paso en el que estemos:

- **`docker-compose.prod.yml`**: Se usa para construir las imágenes localmente y para orquestación estándar.
- **`azure-deploy.yaml`**: Formato nativo de Azure Container Instances. Es el que enviamos a la nube con `az container create`.

### Notas Críticas sobre el archivo YAML
- **Comando Keycloak**: El ejecutable debe ser `/opt/keycloak/bin/kc.sh`. Usar solo `start-dev` causará un error de "executable file not found".
- **Suscripciones**: Verifica siempre la región (`location: spaincentral`) según la política de tu suscripción.

### Lanzar Despliegue
1. **Obtener Clave de Almacenamiento**:
   ```bash
   az storage account keys list --account-name mdaa --resource-group mdaa --query "[0].value" -o tsv
   ```
2. **Asegurar Limpieza**: Si ya existe un despliegue previo, bórralo para aplicar cambios:
   ```bash
   az container delete --resource-group mdaa --name mdaa-stack --yes
   ```
3. **Ejecutar**:
   ```bash
   az container create --resource-group mdaa --file azure-deploy.yaml
   ```

## 5. Operaciones del Día a Día (Gestión y Consulta)

Antes de cualquier operación, asegúrate de estar logueado: `az login`.

### Consultar Estado y URLs
- **Ver estado general** (Running, Stopped, etc.):
  ```bash
  az container show --resource-group mdaa --name mdaa-stack --output table
  ```
- **Obtener la URL pública real (FQDN)**:
  ```bash
  az container show --resource-group mdaa --name mdaa-stack --query "ipAddress.fqdn" -o tsv
  ```
- **Ver logs en tiempo real**:
  ```bash
  az container logs --resource-group mdaa --name mdaa-stack --container-name backend
  ```

### Recuperación de Claves (Si pierdes el acceso)
- **Password del Registro (ACR)**: `az acr credential show --name mdaaregistry --query "passwords[0].value" -o tsv`
- **Clave del Storage (Azure Files)**: `az storage account keys list --account-name mdaa --resource-group mdaa --query "[0].value" -o tsv`

### Control de Ejecución (Ahorro de Costes)
- **PARAR (Ahorro)**: `az container stop --resource-group mdaa --name mdaa-stack`
- **ARRANCAR**: `az container start --resource-group mdaa --name mdaa-stack`
- **ELIMINAR**: `az container delete --resource-group mdaa --name mdaa-stack --yes`

### Limpieza del Registro (ACR)
Para liberar espacio o eliminar versiones antiguas de las imágenes:

- **Listar repositorios**: `az acr repository list --name mdaaregistry --output table`
- **Listar etiquetas (tags)**: `az acr repository show-tags --name mdaaregistry --repository backend --output table`
- **Eliminar una imagen específica**:
  ```bash
  az acr repository delete --name mdaaregistry --image backend:latest --yes
  az acr repository delete --name mdaaregistry --image frontend:latest --yes
  ```
- **Eliminar todas las imágenes sin etiqueta (Untagged/Dangling)**:
  ```bash
  # Ejemplo para backend
  az acr repository untagged-list --name mdaaregistry --repository backend -o tsv | xargs -I% az acr repository delete --name mdaaregistry --image backend@% --yes
  # Ejemplo para frontend
  az acr repository untagged-list --name mdaaregistry --repository frontend -o tsv | xargs -I% az acr repository delete --name mdaaregistry --image frontend@% --yes
  ```

### 6. Automatización de Horarios (Ahorro Avanzado)

Dado que ACI no tiene "Auto-shutdown" nativo como las VMs, se recomienda usar **Azure Logic Apps** para evitar facturación innecesaria:

1. **Logic Apps (Recomendado)**:
   - Crea una Logic App de tipo **Consumo**.
   - Usa el disparador **Recurrence** (ej: 22:00 para apagar, 08:00 para encender).
   - Añade la acción **Azure Container Instance -> Stop/Start container group**.
   - Con esto, los 200 USD de crédito pueden durar hasta **75-80 días** (apagando 12h/día).

2. **Tareas de Automatización (Portal)**:
   - En el menú lateral del recurso `mdaa-stack`, busca **Automatización > Tareas (Tasks)**.
   - Añade una tarea predefinida de "Start" y otra de "Stop" con el horario deseado.

## 7. Información de Referencia y Acceso

- **URL Principal de Acceso (App)**: [http://mdaa-app.spaincentral.azurecontainer.io](http://mdaa-app.spaincentral.azurecontainer.io)
- **URL Keycloak (Admin Panel)**: [http://mdaa-app.spaincentral.azurecontainer.io:8080](http://mdaa-app.spaincentral.azurecontainer.io:8080)
- **URL Backend (API Health)**: [http://mdaa-app.spaincentral.azurecontainer.io:8081](http://mdaa-app.spaincentral.azurecontainer.io:8081)

### Credenciales por Defecto:
- **Administrador Keycloak**: `admin` / `admin`
- **Base de Datos**: `basedb` / `devuser` / `devpassword`
- **Usuario de Prueba (App)**: `test@uned.es` / `11111111`

- **Registro ACR**: `mdaaregistry.azurecr.io`

## 8. Ciclo Rápido: Login, Build y Redeploy (Solo Comandos)

Copia y pega este bloque para actualizar el entorno completo.

```bash
# 1. Autenticación (Azure y Docker Registry)
az login
az acr login --name mdaaregistry

# 2. Compilación y Subida (Forzando arquitectura Intel/AMD para Azure)
docker build --platform linux/amd64 -t mdaaregistry.azurecr.io/backend:latest ./_CODIGO/backend
docker push mdaaregistry.azurecr.io/backend:latest

docker build --platform linux/amd64 -t mdaaregistry.azurecr.io/frontend:latest ./_CODIGO/frontend
docker push mdaaregistry.azurecr.io/frontend:latest

# 3. Reinicio del Stack (Borrar y Volver a Desplegar)
az container delete --resource-group mdaa --name mdaa-stack --yes
az container create --resource-group mdaa --file azure-deploy.yaml
```
