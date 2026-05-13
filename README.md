# Proyecto MDAA - Model-Driven Architecture for Audio

Este repositorio contiene la implementación completa del proyecto MDAA, una herramienta basada en Arquitectura Dirigida por Modelos para la creación y gestión de sistemas de síntesis de audio.

> [!TIP]
> ### ⚡ Guía de Arranque (macOS, Linux, Windows WSL)
>
> ### Opción 1: Usando el script de inicio
> Ejecuta el script desde la raíz del proyecto:
> ```bash
> ./ejecutor/start.sh
> ```
>
> ### Opción 2: Usando Docker Compose directamente
> Si prefieres gestionar los contenedores manualmente:
> - **Arranque** (segundo plano): `docker compose up -d`
> - **Parada**: `docker compose down`
> - **Ver logs**: `docker compose logs -f`
> 3. Una vez finalizado el arranque, accede a la aplicación en: **[http://localhost](http://localhost)**
> 4. **Credenciales de prueba**:
>    - **Usuario**: `test@uned.es`
>    - **Password**: `11111111`
>
> **⚠️ Puertos utilizados**: Asegúrate de que los siguientes puertos estén libres antes de empezar:
> - `80`: Frontend
> - `8081`: Backend API
> - `8080`: Keycloak (Auth)
> - `3306`: MariaDB (Database)
> - `8082`: Adminer (DB Management)
> - `8025 / 1025`: MailHog (Email)
>
> **Carga de ejemplos**: Más adelante en la sección de [Casos de Prueba](#casos-de-prueba-casos_de_prueba) se detalla cómo cargar automáticamente proyectos de ejemplo ya creados en el sistema.
>
> **Para detener el sistema**: Pulsa `Ctrl+C` en el terminal donde se está ejecutando el script o cierra el terminal.

## 🐳 Infraestructura Docker

En la raíz y la carpeta `docker` se define la infraestructura necesaria para desplegar el entorno completo:

- **docker-compose.yml (Raíz)**: Orquestador principal que levanta los servicios de:
  - `mariadb`: Base de datos relacional para el backend y Keycloak.
  - `adminer`: Interfaz web para la gestión de la base de datos.
    - **Servidor**: `mariadb`
    - **Usuario**: `devuser`
    - **Contraseña**: `devpassword`
    - **Base de datos**: `basedb`
  - `mailhog`: Servidor SMTP local para pruebas de envío de correos. Simulará tu correo electronico para que puedas confirmar el registro de nuevos usuarios.
  - `keycloak`: Servidor de gestión de identidad y accesos (IAM).
    - **Admin User**: `admin`
    - **Admin Password**: `admin`
  - `backend`: Aplicación Spring Boot (Java).
  - `frontend`: Aplicación Vue.js.
- **Carpeta docker/**:
  - `init_db/`: Contiene scripts SQL de inicialización para la base de datos.
  - `volumenes/`: Directorios persistentes y configuraciones para servicios como Keycloak.

## 🚀 Scripts de Ejecutor

La carpeta `ejecutor` centraliza scripts de automatización para facilitar el flujo de trabajo:

- `start.sh`: Levanta toda la infraestructura Docker.
- `delete-TOTAL-docker.sh`: Detiene y elimina contenedores, volúmenes e imágenes del proyecto para un reset total.

> [!CAUTION]
> Este script `delete-TOTAL-docker.sh` ejecuta `docker system prune` y comandos de borrado masivo. Úsalo **SOLO** si no tienes otros contenedores, imágenes o volúmenes importantes en tu sistema Docker que no pertenezcan a este proyecto, ya que podría borrar datos de otros proyectos.

### Scripts de Automatización de Pruebas

Para facilitar el trabajo con los casos de prueba, se proporcionan dos scripts principales en la carpeta `ejecutor/`:

#### 1. `validar-test.sh`
Este script realiza una validación integral de un caso de prueba antes de ser procesado o instalado.
- **Importante**: El directorio del test que se pase como parámetro debe estar ubicado dentro de la carpeta `_DOCUMENTACION/_CASOS_DE_PRUEBA/`.
- **Requisitos Previos**: Es necesario tener instalado **Node.js** (que incluye `npm` y `npx`) en el sistema para que se puedan instalar las dependencias, generar y compilar los lenguajes DSL localmente.
- **Funcionamiento**: Actúa como un puente que invoca la validación Langium y las reglas de integridad referencial sobre los archivos JSON del test.
- **Parámetro**: El nombre del directorio del test (ej: `TEST_1`).
  ```bash
  ./ejecutor/validar-test.sh TEST_1
  ```
- **Resultado esperado**: 
  - Si es válido: Un mensaje indicando que la validación ha sido exitosa (✅).
  - Si es inválido: Un listado detallado de errores (sintácticos, rangos fuera de límites o referencias cruzadas rotas) y un mensaje de error (❌).

#### 2. `incluir-test.sh`
Este script automatiza la carga de un caso de prueba en la base de datos MariaDB del entorno Docker.
- **Importante**: El directorio del test que se pase como parámetro debe estar ubicado dentro de la carpeta `_DOCUMENTACION/_CASOS_DE_PRUEBA/`.
- **Funcionamiento**: Ejecuta el script Python `instaladorPrueba.py` que lee el archivo `proyecto.md` y los JSON de máquinas/relaciones para insertarlos en las tablas correspondientes.
- **Parámetro**: El nombre del directorio del test (ej: `TEST_1`).
  ```bash
  ./ejecutor/incluir-test.sh TEST_1
  ```
- **Resultado esperado**:
  - Un mensaje de éxito (✅ Instalación completada con éxito) y la disponibilidad inmediata del proyecto en la aplicación MDAA para el usuario `test@uned.es`.
  - En caso de fallo (por falta de conexión a la DB o errores de formato), se mostrará un mensaje descriptivo del error (❌).

---

### Casos de Prueba (`_CASOS_DE_PRUEBA`)

# Guía de Casos de Prueba e Instalación (MDAA)

Este directorio contiene los casos de prueba utilizados para validar la aplicación MDAA y la generación de código del proyecto. Además, incluye un script de automatización para cargar estos casos directamente en la base de datos MariaDB en desarrollo (el docker-compose cargado a través del script start.sh en la raíz del proyecto).

#### 🛠️ Requisitos Previos

Para ejecutar el script de instalación, necesitas:

1. **Python 3.x** instalado.
2. **Conector MySQL para Python**:
   ```bash
   pip3 install mysql-connector-python
   ```
3. **Contenedores Docker activos**: La base de datos MariaDB debe estar accesible en `localhost:3306`.

#### 📂 Estructura de un Caso de Prueba (`TEST_X`)

Para que el script `instaladorPrueba.py` procese correctamente un nuevo caso, el directorio debe seguir estrictamente la siguiente estructura:

```text
Nombre_del_Caso/
├── proyecto.md           # Título y descripción del proyecto
├── CIM/                  # Modelo Independiente de Computación
│   ├── cim_relations.json # Relaciones entre máquinas CIM
│   └── machines/         # Directorio con JSONs de cada máquina CIM
└── PIM/                  # Modelo Independiente de Plataforma
    ├── pim_relations.json # Relaciones técnicas PIM
    └── machines/         # Directorio con JSONs de cada máquina PIM
```

#### 🔍 Validación de Casos de Prueba

Antes de cargar un caso de prueba, es fundamental validar que cumple con las reglas estructurales y semánticas de todos los niveles DSL (CIM y PIM).

Existen dos formas de ejecutar la validación integral:

*   **Opción A (Directa)**: Ejecutar desde este directorio: `./validate-test.sh <NOMBRE_DEL_TEST>`
*   **Opción B (Desde Ejecutor)**: Utilizar el script puente: `./ejecutor/validar-test.sh <NOMBRE_DEL_TEST>`

#### 🚀 Cómo Cargar un Caso de Prueba

Utiliza el script disponible en la carpeta `ejecutor` para una carga rápida:
```bash
./ejecutor/incluir-test TEST_1
```

---

### Documentación (`_DOCUMENTACION`)

Todos los subdirectorios incluyen, salvo el de los casos de prueba, un archivo `main.pdf` con el documento del manual correspondiente ya compilado, además de las fuentes LaTeX (`.tex`) para su modificación. La carpeta asociada a los casos de prueba contiene un fichero `README.md` descriptor de su contenido:

- [**articulo**](_DOCUMENTACION/articulo/latex/main.pdf): Contiene el artículo que describe la investigación del proyecto MDAA.
- [**manual_dsl**](_DOCUMENTACION/manual_dsl/latex/main.pdf): Manual técnico detallado de los lenguajes de dominio específico (DSLs) desarrollados. Además, en este caso tenemos también un subdirectorio llamado `markdown`, con un fichero formato markdown por DSL desarrollado. Estos documentos fueron desarrollados como base para la exportación de infromación en la herramienta MDAA. 
- [**manual_mdaa**](_DOCUMENTACION/manual_mdaa/latex/main.pdf): Guía de usuario y manual de referencia de la aplicación MDAA.
- [**material_complementario**](_DOCUMENTACION/material_complementario/latex/main.pdf): Recursos adicionales, diagramas y anexos que apoyan la documentación principal, para dar una pequeña guía de qué es la generación digital de sonido.
- [**_CASOS_DE_PRUEBA**](_DOCUMENTACION/_CASOS_DE_PRUEBA/): Directorio con los casos de prueba utilizados para validar el sistema.

## 💻 Código Fuente (`_CODIGO`)

Esta carpeta contiene el núcleo técnico del sistema:

- **frontend**: Aplicación web desarrollada con **Vue 3** y **TypeScript** que permite la edición gráfica y gestión de proyectos MDA.
- **backend**: Servicio API REST desarrollado con **Java 21** y **Spring Boot 3**, encargado de la lógica de negocio, persistencia y seguridad.
- **dsl**: Implementación de los 4 lenguajes de dominio específico mediante **Langium**. En los archivos **README** de cada dsl se detalla la forma de compilar los lenguajes, ejemplos de uso y el funcionamiento de los validadores, mientras que en las **Guías técnicas** se encuentra la definición funcional y reglas de cada lenguaje:
  - `mdaa-cim-machine` ([README](_CODIGO/dsl/mdaa-cim-machine/README.md)) ([Guía técnica](_DOCUMENTACION/manual_dsl/markdown/cim-machines.md)): Definición individual de máquinas a nivel CIM.
  - `mdaa-cim-relations-machines` ([README](_CODIGO/dsl/mdaa-cim-relations-machines/README.md)) ([Guía técnica](_DOCUMENTACION/manual_dsl/markdown/cim-relations-machines.md)): Definición de conexiones y topología a nivel CIM.
  - `mdaa-pim-machine` ([README](_CODIGO/dsl/mdaa-pim-machine/README.md)) ([Guía técnica](_DOCUMENTACION/manual_dsl/markdown/pim-machines.md)): Definición técnica detallada de máquinas a nivel PIM.
  - `mdaa-pim-relations-machines` ([README](_CODIGO/dsl/mdaa-pim-relations-machines/README.md)) ([Guía técnica](_DOCUMENTACION/manual_dsl/markdown/pim-relations-machines.md)): Definición de conexiones técnicas a nivel PIM.
