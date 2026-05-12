# Manual de Referencia Técnica MDA-Audio-CIM-Machine

Este documento es la especificación técnica completa del lenguaje **MDA-Audio-CIM-Machine**. Define la estructura de las máquinas de audio en el nivel más abstracto, así como las relaciones de sus elementos internos entre sí, y las entradas y salidas desde el exterior que pueden recivir o enviar. Siguiendo la nomenclatura de Model-Driven-Architecture (MDA), este nivel se conoce como **CIM (Computational Independence Model)**.

En el CIM no se tiene porqué hablar de implementaciones concretas (osciladores, LFOs, filtros específicos) a bajo nivel, sino de **elementos** abstractos que capturan la intención del diseño de síntesis de la máquina.

---

## 1. Bases del Modelo

Una máquina es un conjunto de elementos que trabajan juntos para producir sonido. A su vez, como veremos más adelante, las máuinas coperan entre si para intercambiar sonido o valores de modificación (ejemplos: volumen, frecuencia, etc)  entre ellas.

### 1.1. Modelo Raíz (`Document`)

El objeto raíz de un archivo MDA-Audio-CIM identifica a la máquina y contiene sus elementos compositivos.

| Atributo | Tipo | Descripción | Restricciones |
| :--- | :--- | :--- | :--- |
| `id` | STRING | Identificador único de la máquina CIM. | Obligatorio. Exactamente 36 caracteres (UUID). |
| `name` | STRING | Nombre descriptivo de la máquina. | Obligatorio. 1 a 20 caracteres. |
| `description` | STRING | Propósito y contexto de la máquina. | Obligatorio. 10 a 600 caracteres. |
| `elements` | ARRAY[Element] | Componentes que representan generadores de sonido, modificadores de parámetros o procesadores de sonidos. | Obligatorio. Puede estar vacío. |

**Ejemplo de Documento:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Oscillator Core",
  "description": "A fundamental oscillator machine for basic wave generation and shaping.",
  "elements": [ ... ]
}
```

### 1.2. Interfaz del Elemento (`Element`)

Todos los bloques funcionales se definen como `Element`. Todos los campos base son obligatorios.

| Atributo | Tipo | Descripción | Restricciones |
| :--- | :--- | :--- | :--- |
| `id` | STRING | Identificador único del componente. | Obligatorio. Exactamente 36 caracteres (UUID). |
| `name` | STRING | Nombre del elemento. | Obligatorio. 1 a 20 caracteres. |
| `description` | STRING | Descripción funcional del componente. | Obligatorio. 10 a 600 caracteres. |
| `params` | STRING | Lista textual de parámetros modificables relevantes. | Obligatorio. 10 a 600 caracteres. |
| `externalOutput` | ExternalOutput | Configuración de la salida externa hacia otras máquinas. | Obligatorio. |
| `externalInput` | ExternalInput | Configuración de la entrada externa desde otras máquinas. | Obligatorio. |
| `sendTo` | ARRAY[SendTo] | Conexiones de salida interna hacia otros elementos. | Obligatorio. Puede estar vacío. |

**Ejemplo de Elemento:**
```json
{
  "id": "771e8400-e29b-41d4-a716-446655440111",
  "name": "Sine Generator",
  "description": "Generates a pure sine wave at a fixed base frequency.",
  "params": "frequency: 440Hz, gain: 0.8, phase: 0.0",
  "externalInput": { "hasExternalInput": false },
  "externalOutput": {
    "hasExternalOutput": true,
    "description": "Audio output of the sine wave."
  },
  "sendTo": []
}
```

#### Configuración Externa

Los subobjetos `externalOutput` y `externalInput` definen si el elemento sirve como uno de los puertos de entrada/salida global de la máquina.

**ExternalOutput / ExternalInput:**
- `hasExternalOutput` / `hasExternalInput` (BOOLEAN): Habilita el puerto.
- `description` (STRING): Describe la naturaleza del puerto. Máximo 600 caracteres.

### 1.3. Objeto de Conexión Interna (`SendTo`)

Define un vínculo direccional desde un elemento hacia otro dentro de la misma máquina. El elemento referenciado en el campo `idRef` debe existir dentro del documento. 

| Atributo | Tipo | Descripción | Restricciones |
| :--- | :--- | :--- | :--- |
| `id` | STRING | Identificador único de esta conexión. | Obligatorio. Exactamente 36 caracteres (UUID). |
| `idRef` | REF[Element] | Referencia al elemento de destino. | Obligatorio. Debe existir en el documento. |
| `description` | STRING | Justificación técnica del vínculo. | Obligatorio. 10 a 600 caracteres. |

**Ejemplo de Conexión:**
```json
{
  "id": "b22e8400-e29b-41d4-a716-446655440333",
  "idRef": "c33e8400-e29b-41d4-a716-446655440444",
  "description": "Route filtered signal to the high pass filter element."
}
```

> [!IMPORTANT]
> Un elemento **no puede referenciarse a sí mismo** en su lista `sendTo`. El compilador rechaza cualquier auto-referencia como error fatal.

---

## 2. Tipos de Elemento de Audio (`Element`)

Representan cualquier bloque funcional de señal sonora dentro de la máquina. A este nivel no se especifica el algoritmo de síntesis: eso corresponde al PIM.

Los elementos típicos abarcan:
- **Fuentes / Generadores**: Osciladores, samplers, generadores de ruido.
- **Modificadores / Efectos**: Filtros, reverbs, delays, envolventes ADSR, etc.

El campo `params` describe en lenguaje natural los parámetros conceptuales del elemento (ej.: `"Frequency, Waveform"` o `"Cutoff, Resonance"`).

---

## 3. Reglas de Validación

Se aplican las siguientes restricciones para garantizar que el modelo sea procesable:

### 3.1. Reglas de Unicidad

| Alcance | Regla |
| :--- | :--- |
| **Global (Documento)** | Todos los `id` de todos los componentes (`Element`, `SendTo`, y de la propia máquina) deben ser únicos en el documento entero. |
| **Local (sendTo)** | No puede haber dos entradas en el array `sendTo` de un mismo componente con el mismo `id`. |

### 3.2. Restricciones de Campos

| Entidad | Campo | Restricción |
| :--- | :--- | :--- |
| `Document` | `id` | Exactamente 36 caracteres. |
| `Document` | `name` | Entre 1 y 20 caracteres. |
| `Document` | `description` | Entre 10 y 600 caracteres. |
| `Element` | `id` | Exactamente 36 caracteres. |
| `Element` | `name` | Entre 1 y 20 caracteres. |
| `Element` | `description` | Entre 10 y 600 caracteres. |
| `Element` | `params` | Entre 10 y 600 caracteres. |
| `Element` | `externalOutput/Input desc` | Máximo 600 caracteres. |
| `SendTo` | `id` | Exactamente 36 caracteres. |
| `SendTo` | `description` | Entre 10 y 600 caracteres. |

### 3.3. Restricciones de Conectividad

| Regla | Descripción |
| :--- | :--- |
| **Sin auto-referencia** | El `idRef` de un `SendTo` no puede apuntar al mismo elemento que lo contiene. |
| **Referencia válida** | El `idRef` debe resolver a un `Element` existente en el documento. |

---

## 4. Guía de Uso

CIM define conceptualmente una máquina de audio, entendiendo esta como un módulo que puede trabajar en solitario o bien en conjunto con otras máquinas (véase el documento `cim-relations-machines.md` para relaciones entre máquinas CIM). Proporciona el marco para que los diseñadores de sonido establezcan las capacidades de entrada/salida y el flujo interno sin preocuparse por la implementación técnica subyacente. Los modelos resultantes son la base para generar las especificaciones PIM detalladas.

