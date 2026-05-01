# Proyecto MDAA - Model-Driven Architecture for Audio

Este repositorio contiene la implementación completa del proyecto MDAA, una herramienta basada en Arquitectura Dirigida por Modelos para la creación y gestión de sistemas de síntesis de audio.

## 🐳 Infraestructura Docker

En la raíz y la carpeta `docker` se define la infraestructura necesaria para desplegar el entorno completo:

- **docker-compose.yml (Raíz)**: Orquestador principal que levanta los servicios de:
  - `mariadb`: Base de datos relacional para el backend y Keycloak.
  - `adminer`: Interfaz web para la gestión de la base de datos.
  - `mailhog`: Servidor SMTP local para pruebas de envío de correos.
  - `keycloak`: Servidor de gestión de identidad y accesos (IAM).
  - `backend`: Aplicación Spring Boot (Java).
  - `frontend`: Aplicación Vue.js.
- **Carpeta docker/**:
  - `init_db/`: Contiene scripts SQL de inicialización para la base de datos.
  - `volumenes/`: Directorios persistentes y configuraciones para servicios como Keycloak.

## 🚀 Scripts de Ejecutor

La carpeta `ejecutor` centraliza scripts de automatización para facilitar el flujo de trabajo:

- `start.sh`: Levanta toda la infraestructura Docker.
- `delete-TOTAL-docker.sh`: Detiene y elimina contenedores, volúmenes e imágenes del proyecto para un reset total.
- `incluir-test.sh`: Script de conveniencia para cargar un caso de prueba específico en la base de datos.
- `validar-test.sh`: Ejecuta la validación completa (sintáctica y semántica) de un caso de prueba.
- `abrir-en-chrome.sh`: Abre automáticamente las URLs de los servicios (frontend, Keycloak, Adminer) en el navegador.

## 📂 Documentación y Pruebas (`_DOCUMENTACION`)

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

### Otros Directorios de Documentación

Todos los subdirectorios incluyen un archivo `main.pdf` con el contenido generado, además de las fuentes LaTeX (`.tex`) para su modificación:

- **articulo**: Contiene el artículo científico que describe la investigación y metodología del proyecto.
- **manual_dsl**: Manual técnico detallado de los lenguajes de dominio específico (DSLs) desarrollados.
- **manual_mdaa**: Guía de usuario y manual de referencia de la aplicación MDAA.
- **material_complementario**: Recursos adicionales, diagramas y anexos que apoyan la documentación principal.

## 💻 Código Fuente (`_CODIGO`)

Esta carpeta contiene el núcleo técnico del sistema:

- **frontend**: Aplicación web desarrollada con **Vue 3** y **TypeScript** que permite la edición gráfica y gestión de proyectos MDA.
- **backend**: Servicio API REST desarrollado con **Java 21** y **Spring Boot 3**, encargado de la lógica de negocio, persistencia y seguridad.
- **dsl**: Implementación de los 4 lenguajes de dominio específico mediante **Langium**:
  - `mdaa-cim-machine`: Definición individual de máquinas a nivel CIM.
  - `mdaa-cim-relations-machines`: Definición de conexiones y topología a nivel CIM.
  - `mdaa-pim-machine`: Definición técnica detallada de máquinas a nivel PIM.
  - `mdaa-pim-relations-machines`: Definición de conexiones técnicas a nivel PIM.
- **docker**: Archivos de configuración Docker específicos para el despliegue de los componentes de código.
