# Guía de Casos de Prueba e Instalación (MDAA)

Este directorio contiene los casos de prueba utilizados para validar la aplicación MDAA y la generación de código del proyecto. Además, incluye un script de automatización para cargar estos casos directamente en la base de datos MariaDB en desarrollo (el docker-compose cargado a través del script start.sh en la raíz del proyecto).

## 🛠️ Requisitos Previos

Para ejecutar el script de instalación, necesitas:

1. **Python 3.x** instalado.
2. **Conector MySQL para Python**:
   ```bash
   pip3 install mysql-connector-python
   ```
3. **Contenedores Docker activos**: La base de datos MariaDB debe estar accesible en `localhost:3306`. Es un contenedor que se carga con el resto de la aplicación MDAA.

---

## 📂 Estructura de un Caso de Prueba (`TEST_X`)

Para que el script `instaladorPrueba.py` procese correctamente un nuevo caso, el directorio debe seguir estrictamente la siguiente estructura:

```text
Nombre_del_Caso/
├── proyecto.md           # Título y descripción del proyecto
├── CIM/                  # Modelo Independiente de Computación
│   ├── cim_relations.json # Relaciones entre máquinas CIM
│   └── machines/         # Directorio con JSONs de cada máquina CIM
├── PIM/                  # Modelo Independiente de Plataforma
│   ├── pim_relations.json # Relaciones técnicas PIM
│   └── machines/         # Directorio con JSONs de cada máquina PIM
└── IMP/                  # Implementación generada (Zip obtenido por la aplicacion MDAA y ok.pd, que es el resultado obtenido por la IA en base a este zip)
```

### Detalle de Archivos

| Archivo / Carpeta | Descripción |
| :--- | :--- |
| `proyecto.md` | Debe contener un título de primer nivel (`# Título`) que se usará como nombre del proyecto, y el resto del texto como descripción. |
| `CIM/` | Contiene la definición del modelo de análisis. |
| `PIM/` | Contiene la definición del modelo de diseño técnico. |
| `IMP/` | Contiene la implementación generada. Su contenido será: Un fichero zip con lo generado por la aplicación MDAA para este proyecto y un fichero `ok.pd` con el código generado definitivo. |
| `machines/` | Carpeta que contiene un archivo `.json` independiente por cada máquina definida en ese nivel (CIM o PIM). |
| `relations.json` | Archivo JSON que describe las conexiones (aristas) entre las máquinas del nivel correspondiente. |

---

## 🔍 Validación de Casos de Prueba

Antes de cargar un nuevo caso de prueba, es fundamental validar que cumple con las reglas estructurales y semánticas de todos los niveles DSL (CIM y PIM). Para ello, existen dos formas de ejecutar la validación integral:

*   **Opción A (Directa)**: Ejecutar desde este directorio:
    ```bash
    ./validate-test.sh <NOMBRE_DEL_TEST>
    ```
*   **Opción B (Desde Ejecutor)**: Utilizar el script puente desde la raíz o la carpeta `ejecutor`:
    ```bash
    ./ejecutor/validar-test.sh <NOMBRE_DEL_TEST>
    ```

El script de validación realiza comprobaciones automáticas de:
1.  **Esquema JSON**: Cumplimiento de la estructura base.
2.  **Validación Langium**: Reglas de negocio (longitudes, rangos, etc.).
3.  **Integridad Referencial**: Las relaciones (CIM/PIM) y referencias cruzadas (PIM->CIM) deben apuntar a IDs de máquinas y elementos existentes.


---

## 🚀 Cómo Cargar un Caso de Prueba

El script `instaladorPrueba.py` asocia automáticamente el proyecto al usuario de prueba predeterminado (`test@uned.es`).

### Método Recomendado (Helper Script)
Utiliza el script disponible en la carpeta `ejecutor` para una carga rápida:
```bash
./ejecutor/incluir-test TEST_1
```

### Método Manual (Python Directo)
Ejecuta el script pasando como argumento la ruta al directorio del caso que deseas instalar:

```bash
python3 _DOCUMENTACION/_CASOS_DE_PRUEBA/instaladorPrueba.py _DOCUMENTACION/_CASOS_DE_PRUEBA/TEST_1
```


### ¿Qué hace el script?
1. Extrae los metadatos de `proyecto.md`.
2. Busca al usuario `test@uned.es` en la base de datos para obtener su ID.
3. Crea un nuevo registro en la tabla `projects`.
4. Inserta las estructuras JSON de relaciones en las tablas `cim` y `pim`.
5. Carga individualmente cada máquina en las tablas `cim_machines` y `pim_machines`.

---

> [!CAUTION]
> El script está configurado para conectarse a `localhost:3306` con las credenciales por defecto (`devuser` / `devpassword`). 