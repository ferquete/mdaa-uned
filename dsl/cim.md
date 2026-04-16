# Manual de Referencia Técnica MDA-Audio-CIM

Este documento es la especificación técnica completa del lenguaje **MDA-Audio-CIM**. Define la estructura de las máquinas de audio en el nivel Independiente de Computación, así como las reglas para establecer relaciones de alto nivel entre ellas.

En el CIM no se habla de implementaciones concretas (osciladores, LFOs, filtros específicos). Se habla de **generadores de audio** y **modificadores**, abstracciones que capturan la intención del diseño sin fijar la tecnología de síntesis.

---

## 1. Bases del Modelo

### 1.1. Modelo Raíz (`Document`)

El objeto raíz de un archivo MDA-Audio-CIM identifica a la máquina y contiene sus dos contenedores fundamentales.

| Atributo | Tipo | Descripción | Restricciones |
| :--- | :--- | :--- | :--- |
| `id` | STRING | Identificador único de la máquina CIM. | Obligatorio. Exactamente 36 caracteres (UUID). |
| `name` | STRING | Nombre descriptivo de la máquina. | Obligatorio. 1 a 20 caracteres. |
| `description` | STRING | Propósito y contexto de la máquina. | Obligatorio. 10 a 6.000 caracteres. |
| `generators` | ARRAY[AudioGenerator] | Fuentes de señal de audio. | Obligatorio. Puede estar vacío. |
| `modificators` | ARRAY[Modificator] | Procesadores y moduladores de parámetros. | Obligatorio. Puede estar vacío. |

### 1.2. Interfaz Base (`Base`)

`AudioGenerator` y `Modificator` comparten la misma estructura base. Todos los campos son obligatorios.

| Atributo | Tipo | Descripción | Restricciones |
| :--- | :--- | :--- | :--- |
| `id` | STRING | Identificador único del componente. | Obligatorio. Exactamente 36 caracteres (UUID). |
| `name` | STRING | Nombre del generador o modificador. | Obligatorio. 1 a 20 caracteres. |
| `description` | STRING | Descripción funcional del componente. | Obligatorio. 10 a 6.000 caracteres. |
| `params` | STRING | Lista textual de parámetros relevantes. | Obligatorio. 10 a 300 caracteres. |
| `sendTo` | ARRAY[SendTo] | Conexiones de salida hacia otros componentes. | Obligatorio. Puede estar vacío. |

### 1.3. Objeto de Conexión (`SendTo`)

Define un vínculo direccional desde un componente hacia otro dentro de la misma máquina.

| Atributo | Tipo | Descripción | Restricciones |
| :--- | :--- | :--- | :--- |
| `id` | STRING | Identificador único de esta conexión. | Obligatorio. Exactamente 36 caracteres (UUID). |
| `idRef` | REF[Base] | Referencia al componente de destino. | Obligatorio. Debe existir en el documento. |
| `description` | STRING | Justificación técnica del vínculo. | Obligatorio. 10 a 300 caracteres. |

> [!IMPORTANT]
> Un componente **no puede referenciarse a sí mismo** en su lista `sendTo`. El compilador rechaza cualquier auto-referencia como error fatal.

---

## 2. Tipos de Componentes

### 2.1. Generadores de Audio (`AudioGenerator`)

Representan cualquier fuente de señal sonora dentro de la máquina. A este nivel no se especifica el algoritmo de síntesis: eso corresponde al PIM. Lo que se define es qué genera el componente y hacia qué otros componentes envía su señal.

Ejemplos típicos de generadores:
- Osciladores (tono, forma de onda).
- Samplers (reproducción de muestras de audio).
- Generadores de ruido (texturas, transitorios).

El campo `params` describe en lenguaje natural los parámetros conceptuales del generador (ej.: `"Frequency, Waveform, Pulse Width"`).

### 2.2. Modificadores (`Modificator`)

Representan cualquier componente que transforma, procesa o modula la señal de otro componente. Pueden actuar sobre la señal de audio directamente o sobre los parámetros de un generador u otro modificador.

Ejemplos típicos de modificadores:
- Filtros de frecuencia (paso bajo, paso alto, notch).
- Efectos temporales (reverb, delay, chorus).
- Procesadores de dinámica (compresor, limitador).
- Moduladores de control (envolventes ADSR, LFOs).

Al igual que los generadores, el campo `params` describe los parámetros conceptuales en lenguaje natural (ej.: `"Cutoff, Resonance, Drive"`).

---

## 3. Reglas de Validación

El compilador `mda-audio-cim-machine` aplica las siguientes restricciones para garantizar que el modelo sea procesable en etapas posteriores:

### 3.1. Reglas de Unicidad

| Alcance | Regla |
| :--- | :--- |
| **Global (Documento)** | Todos los `id` de todos los componentes (`AudioGenerator`, `Modificator`, `SendTo`) deben ser únicos en el documento entero. |
| **Local (sendTo)** | No puede haber dos entradas en el array `sendTo` de un mismo componente con el mismo `id`. |

### 3.2. Restricciones de Campos

| Elemento | Campo | Restricción |
| :--- | :--- | :--- |
| `Document` | `id` | Exactamente 36 caracteres. |
| `Document` | `name` | Entre 1 y 20 caracteres. |
| `Document` | `description` | Entre 10 y 6.000 caracteres. |
| `AudioGenerator` / `Modificator` | `id` | Exactamente 36 caracteres. |
| `AudioGenerator` / `Modificator` | `name` | Entre 1 y 20 caracteres. |
| `AudioGenerator` / `Modificator` | `description` | Entre 10 y 6.000 caracteres. |
| `AudioGenerator` / `Modificator` | `params` | Entre 10 y 300 caracteres. |
| `SendTo` | `id` | Exactamente 36 caracteres. |
| `SendTo` | `description` | Entre 10 y 300 caracteres. |

### 3.3. Restricciones de Conectividad

| Regla | Descripción |
| :--- | :--- |
| **Sin auto-referencia** | El `idRef` de un `SendTo` no puede apuntar al mismo componente que lo contiene. |
| **Referencia válida** | El `idRef` debe resolver a un `AudioGenerator` o `Modificator` existente en el documento. |

> [!CAUTION]
> La omisión de cualquier campo obligatorio o el incumplimiento de los límites de longitud provoca errores de compilación que bloquean la transformación al nivel PIM.

---

## 4. Relaciones CIM (`CIM Relations`)

Este lenguaje orquesta la comunicación de alto nivel entre máquinas CIM independientes. Mientras que el lenguaje de máquinas define la topología interna de cada máquina, CIM Relations define cómo fluye la información entre ellas a escala de proyecto.

### 4.1. Estructura del Documento

El documento de relaciones usa una estructura JSON con dos propiedades raíz.

| Atributo | Tipo | Descripción | Restricciones |
| :--- | :--- | :--- | :--- |
| `description` | STRING | Propósito general de las interconexiones. | Opcional. 1 a 600 caracteres. |
| `relations` | ARRAY | Lista de objetos de relación. | Obligatorio. |

### 4.2. Objeto Relation (Relación)

Define un vínculo direccional entre dos máquinas CIM independientes.

| Atributo | Tipo | Descripción | Restricciones |
| :--- | :--- | :--- | :--- |
| `id` | STRING | Identificador único de la relación. | Obligatorio. Exactamente 36 caracteres (UUID). |
| `source` | STRING | ID de la máquina de origen. | Obligatorio. 1 a 36 caracteres. |
| `destination` | STRING | ID de la máquina de destino. | Obligatorio. 1 a 36 caracteres. |
| `description` | STRING | Justificación técnica del vínculo. | Obligatorio. 10 a 300 caracteres. |

---

### 4.3. Reglas de Validación

1. **Unicidad de IDs**: Cada relación en el array `relations` debe tener un `id` único.
2. **Formato UUID**: El campo `id` debe tener exactamente 36 caracteres.
3. **Restricciones de texto**:
   - Descripción del documento: máx. 600 caracteres.
   - Descripción de cada relación: entre 10 y 300 caracteres.

---

### 4.4. Guía de Uso

Las relaciones CIM expresan dependencias conceptuales entre máquinas: "La máquina de síntesis de leads alimenta a la máquina de mezcla principal". No contienen detalles de parámetros ni de puntos de conexión específicos; esa granularidad pertenece al nivel PIM Relations.

> [!TIP]
> Aunque el lenguaje admite nombres descriptivos en `source` y `destination`, se recomienda usar los UUIDs de las máquinas CIM para garantizar trazabilidad absoluta en pipelines automatizados.
