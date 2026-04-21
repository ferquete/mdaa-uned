# Manual de Referencia Técnica MDA-Audio-PIM

Este documento constituye la especificación técnica completa del lenguaje **MDA-Audio-PIM-Machines**. Define todos los nodos, parámetros, reglas de conectividad y restricciones de validación que rigen la gramática. Hay que ver el modelo que especifica este lenguaje como una concretización del modelo CIM, ya con nomenclatura tecnológica orientada a la implementación del sistema de sonido, pero sin llegar a atarse a ningún lenguaje de programación o tecnología específica. Un amáuina PIM no es mas que una concretización de N máquinas CIM, por lo que es fundamental que el modelo PIM sea coherente con el modelo CIM del que se deriva.

## 1. Bases del Modelo

El lenguaje MDA-Audio-PIM-Machine define un grafo dirigido de audio y control. Todos los elementos del grafo (nodos, aristas y parámetros) comparten una estructura base.

### 1.1. Modelo Raíz (`Model`)

El objeto raíz de un archivo MDA-Audio-PIM-Machine contiene la identificación global y los contenedores de nodos y aristas.

| Atributo | Tipo | Descripción | Restricciones |
| :--- | :--- | :--- | :--- |
| `id` | STRING | Identificador único de la máquina PIM. | Obligatorio. Formato UUIDv4 (36 caracteres). |
| `name` | STRING | Nombre descriptivo de la máquina. | Obligatorio. Máximo 20 caracteres. |
| `description` | STRING | Información general sobre la máquina. | Obligatorio. Máximo 600 caracteres. |
| `ids_cim_reference`| ARRAY[STRING]| Lista de IDs de máquinas CIM vinculadas. Piensa que una máquina PIM puede querer implementar varias máquinas CIM, no siempre es una relación 1:1. Este array define el universo de elementos en los que se moverá el modelo PIM de esta máquina. | Obligatorio. Puede estar vacío (`[]`). |
| `nodes` | ARRAY[Node] | Contenedor de todos los nodos de audio y control. | Obligatorio. Puede estar vacío. |
| `edges` | ARRAY[Edge] | Contenedor de todas las conexiones (aristas). | Obligatorio. Puede estar vacío. |

### 1.2. Ejemplo de Estructura Raíz

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440001",
  "name": "Full Technical Test",
  "description": "Descripcion de hasta 600 caracteres...",
  "ids_cim_reference": [
    "550e8400-e29b-41d4-a716-446655440000"
  ],
  "nodes": [...],
  "edges": [...]
}
```

### 1.2. Interfaces Base

#### Elementos Principales (Nodos y Aristas)

| Atributo | Tipo | Descripción | Restricciones |
| :--- | :--- | :--- | :--- |
| `id` | STRING | Identificador único universal. | Obligatorio. Formato UUIDv4 (36 caracteres). |
| `description` | STRING | Información textual sobre el propósito del elemento. | Opcional. Máximo 600 caracteres. |
| `ids_references`| ARRAY[STRING]| Referencias a elementos del modelo CIM, sean cuales sean estos, pero siempre dentro de las máquinas referenciadas en `ids_cim_reference`. Podemos ver a `ids_cim_reference` como la lista que define el universo de elementos CIM que pueden ser referenciados en `ids_references`. Solo elementos dentros de esas máquinas CIM, no se podrá elegir la máquina CIM en si, ya que eso se selecciona en `ids_cim_reference`.  | Obligatorio. Puede estar vacío (`[]`). |

#### Estructura de Parámetro de Configuración (`Parameter`)
Cualquier propiedad de configuración de un nodo (excepto el listado `others`) es un objeto de tipo `Parameter`.
| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| `id` | UUID | Identificador único del parámetro. |
| `ids_references` | string[] | Referencias a elementos del modelo CIM, sean cuales sean estos, pero siempre dentro de las máquinas referenciadas en `ids_cim_reference`. Podemos ver a `ids_cim_reference` como la lista que define el universo de elementos CIM que pueden ser referenciados en `ids_references`. Solo elementos dentros de esas máquinas CIM, no se podrá elegir la máquina CIM en si, ya que eso se selecciona en `ids_cim_reference`. |
| `initialValue` | any | Valor inicial del parámetro. |
| `isModifiable` | boolean | Indica si el parámetro acepta modulaciones de otros nodos de la máquina. De inicio, siempre será true. Cuando está a true, podemos conectar una arista de tipo modification a este parámetro.  |
| `isExternalInput` | boolean | Flag de externalización. Si es `true`, indica que este parámetro puede recibir modificaciones desde fuera de esta máquina PIM. Por defecto es `false` para parámetros. **Nota: Solo puede ser true si `isModifiable` es true.** |
| `description` | string | (Opcional) Descripción del propósito del parámetro. |

> [!IMPORTANT]
> **Regla de Integridad Semántica**: Un parámetro que no sea modulable internamente (`isModifiable: false`) **no puede** ser una entrada externa (`isExternalInput: true`). El sistema forzará ambos a `false` si se desactiva la modulación.

#### Estructura de Parámetro Dinámico (`OthersParameter`)
Todos los nodos disponen obligatoriamente de un array interno `others` (aunque esté vacío), que permite anidar parámetros de control customizados.
| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| `id` | UUID | Identificador único del parámetro customizado. |
| `name` | string | **Obligatorio.** Nombre del parámetro (1 a 20 caracteres). |
| `ids_references` | string[] | Referencias a elementos del modelo CIM, sean cuales sean estos, pero siempre dentro de las máquinas referenciadas en `ids_cim_reference`. Podemos ver a `ids_cim_reference` como la lista que define el universo de elementos CIM que pueden ser referenciados en `ids_references`. Solo elementos dentros de esas máquinas CIM, no se podrá elegir la máquina CIM en si, ya que eso se selecciona en `ids_cim_reference`. |
| `initialValue` | string | **Obligatorio y estricto.** Únicamente string, de 1 a 100 caracteres. |
| `isModifiable` | boolean | Indica si el parámetro acepta modulaciones de otros nodos de la máquina. De inicio, siempre será true. Cuando está a true, podemos conectar una arista de tipo modification a este parámetro.  |
| `isExternalInput` | boolean | Flag de externalización. Si es `true`, indica que este parámetro dinámico puede recibir modificaciones desde fuera de esta máquina PIM. Por defecto es `false`. |
| `description` | string | (Opcional) Descripción del propósito del parámetro. |

### Puntos de Conexión (`ConnectionPoint`)

Los puntos de conexión son los puertos de entrada o salida de audio y control de los nodos.

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| `id` | UUID | Identificador único del punto de conexión. |
| `ids_references` | string[] | **Obligatorio.** Puede estar vacío (`[]`) si no hay vinculación conceptual. |
| `isExternalInput` | boolean | Solo para entradas de audio o control. Si es `true`, la entrada puede recibir señal desde fuera de la máquina. Por defecto es `true`. |
| `isExternalOutput` | boolean | Solo para salidas de audio o control. Si es `true`, la salida puede enviar señal hacia fuera de la máquina. Por defecto es `true`. |
| `description` | string | (Opcional) Descripción del propósito del punto. |

> [!IMPORTANT]
> Los puntos de conexión **NO** disponen de los campos `initialValue` ni `isModifiable`. Su configuración es puramente topológica.

---

## 2. Definición de Aristas (`Edges`)

Las aristas establecen la conexión entre nodos.

| Atributo | Descripción |
| :--- | :--- |
| `sourceNode` | UUID del nodo de origen. |
| `sourceParam`| UUID del parámetro de salida del nodo origen. |
| `targetNode` | UUID del nodo de destino. |
| `targetParam`| UUID del parámetro de entrada del nodo destino. |
| `type` | Tipo de señal: `"audio"` o `"modification"`. |

### 2.1. Reglas de Conectividad
- **Señal `audio`**: Solo puede conectar salidas de audio (como `output_1`) con entradas de sonido (`input_x`). Sus `ids_references` solo pueden apuntar a conexiones conceptuales (sendTo) en los modelos CIM.
- **Señal `modification`**: Solo puede conectar salidas de control con parámetros donde `isModifiable` sea `true`. Sus `ids_references` solo pueden apuntar a elementos/nodos de control en los modelos CIM.
- **Cascada de Integridad**: Al desactivar `isModifiable` en un parámetro, el sistema de diseño visual **borrará automáticamente** todas las aristas que tengan ese parámetro como destino para mantener la coherencia del modelo.
- **Prohibición**: No se pueden modificar parámetros de configuración (`stereo`, `inputs_number`).

---

## 3. Diccionario de Nodos

### 3.1. Generadores de Audio (`AudioGeneratorNode`)

Generan señales sonoras. Todos cuentan con el fragmento `AudioOutputFields`:
- `stereo`: Parámetro booleano obligatorio. Define si el nodo opera en un canal (mono) o dos (estéreo). **Nota**: Es un parámetro estructural; no admite modulación (`isModifiable: false`) ni externalización (`isExternalInput: false`).
- `output_1`: Salida principal (Audio).
- `output_2`: Salida secundaria (solo si `stereo` es `true`).

#### Oscilador (`oscillator`)
| Parámetro | Tipo | Rango / Valores | Descripción |
| :--- | :--- | :--- | :--- |
| `waveform` | STRING/Matrix| `sine`, `square`, `sawtooth`, `triangle`, `pulse`, `matrix` | Forma de la onda. |
| `frequency` | NUMBER | 0 - 20,000 | Frecuencia en Hz. |
| `pulseWidth` | NUMBER | 0 - 1 | Ancho de pulso (solo para `pulse`). |
| `gain` | NUMBER | 0 - 1 | Ganancia inicial. |
| `phase` | NUMBER | 0 - 2π (6.283) | Fase inicial. |
| `pan` | NUMBER | -1 a 1 | Posicionamiento estéreo. |

#### Ejemplo: Oscillator
```json
{
  "type": "oscillator",
  "id": "550e8400-e29b-41d4-a716-446655440002",
  "name": "Master Osc",
  "description": "Oscilador principal de prueba.",
  "ids_references": ["771e8400-e29b-41d4-a716-446655440111"],
  "others": [],
  "waveform": {
    "id": "550e8400-e29b-41d4-a716-446655440003",
    "ids_references": ["771e8400-e29b-41d4-a716-446655440111"],
    "initialValue": "sine",
    "isModifiable": true
  },
  "frequency": { ... },
  "stereo": {
    "id": "550e8400-e29b-41d4-a716-446655440009",
    "ids_references": ["771e8400-e29b-41d4-a716-446655440111"],
    "initialValue": false
  },
  "output_1": {
    "id": "550e8400-e29b-41d4-a716-446655440010",
    "ids_references": ["771e8400-e29b-41d4-a716-446655440111"]
  }
}
```

#### Ruido (`noise`)
| Parámetro | Tipo | Rango / Valores | Descripción |
| :--- | :--- | :--- | :--- |
| `noiseType` | STRING | `white`, `pink`, `brownian` | Color del ruido. |
| `amplitude` | NUMBER | 0 - 1 | Amplitud de la señal. |
| `gain` | NUMBER | 0 - 1 | Ganancia de salida. |
| `pan` | NUMBER | -1 a 1 | Posicionamiento estéreo. |

#### Sample (`sample`)
| Parámetro | Tipo | Rango / Valores | Descripción |
| :--- | :--- | :--- | :--- |
| `file` | STRING | Ruta de archivo | Path al recurso de audio. |
| `loop` | BOOLEAN | `true`, `false` | Indica si el sample se repite. |
| `gain` | NUMBER | 0 - 1 | Ganancia de salida. |
| `pan` | NUMBER | -1 a 1 | Posicionamiento estéreo (DEBE ser 0 si `stereo` es `false`). |

---

### 3.2. Modificadores de Parámetro (`ParameterModifierNode`)

Generan señales de control (`modification`).

#### LFO (`lfo`)
| Parámetro | Tipo | Rango / Valores | Descripción |
| :--- | :--- | :--- | :--- |
| `waveform` | STRING/Matrix| `sine`, `square`, etc. | Onda del modulador. |
| `rate` | NUMBER | 0.01 - 50 | Velocidad en Hz. |
| `amplitude` | NUMBER | 0 - 1 | Profundidad de la modulación. |
| `phase` | NUMBER | 0 - 360 | Fase en grados. |
| `sync` | BOOLEAN | `true`, `false` | Sincronización con el tempo. |
| `output` | - | Punto de salida | Señal de modificación. |

#### Envolvente (`envelope`)
| Parámetro | Tipo | Rango / Valores | Descripción |
| :--- | :--- | :--- | :--- |
| `envelopeType`| STRING | `ADSR`, `ADR`, `AR`, `DAHDSR` | Tipo de arquitectura de envolvente. |
| `attack` | NUMBER | >= 0 | Tiempo de ataque. |
| `decay` | NUMBER | >= 0 | Tiempo de caída. |
| `sustain` | NUMBER | 0 - 1 | Nivel de sostenido. |
| `release` | NUMBER | >= 0 | Tiempo de relajación. |
| `delay` | NUMBER | >= 0 | Retraso inicial (solo en `DAHDSR`). |
| `hold` | NUMBER | >= 0 | Tiempo de mantenimiento (solo en `DAHDSR`). |
| `curve` | STRING | `linear`, `exponential`, `logarithmic`| Curva de interpolación. |
| `output` | - | Punto de salida | Señal de modificación. |

---

### 3.3. Modificadores de Sonido / Efectos (`SoundModifierNode`)

Procesan audio. Todos usan el fragmento `SoundModifierFields`:
- `stereo`: Define si el nodo procesa en estéreo.
- `input_1`, `input_2` (si stereo): Entradas de audio.
- `output_1`, `output_2` (si stereo): Salidas de audio.

#### Filtro de Frecuencia (`frequency_filter`)
| Parámetro | Tipo | Rango / Valores | Descripción |
| :--- | :--- | :--- | :--- |
| `filterType` | STRING | `LPF`, `HPF`, `BPF`, `Notch` | Tipo de filtro. |
| `cutoff` | NUMBER | 20 - 20,000 | Frecuencia de corte. |
| `resonance` | NUMBER | 0 - 10 | Resonancia (Q). |
| `slope` | STRING | `12dB/oct`, `24dB/oct`, `48dB/oct` | Pendiente de atenuación. |

{
  "type": "frequency_filter",
  "id": "550e8400-e29b-41d4-a716-446655440043",
  "name": "Main Filter",
  "description": "Filtro con stereo.",
  "ids_references": ["771e8400-e29b-41d4-a716-446655440111"],
  "others": [],
  "filterType": { ... },
  "stereo": {
    "id": "550e8400-e29b-41d4-a716-446655440048",
    "ids_references": ["771e8400-e29b-41d4-a716-446655440111"],
    "initialValue": true
  },
  "input_1": { ... },
  "output_1": { ... },
  "output_2": { ... }
}

#### Reverb (`reverb`)
| Parámetro | Tipo | Rango / Valores | Descripción |
| :--- | :--- | :--- | :--- |
| `roomSize` | NUMBER | 0 - 1 | Tamaño del espacio. |
| `damping` | NUMBER | 0 - 1 | Absorción de altas frecuencias. |
| `decayTime` | NUMBER | >= 0 | Tiempo de reverberación. |
| `dryWet` | NUMBER | 0 - 1 | Mezcla señal seca/procesada. |

#### Delay / Eco (`delay`)
| Parámetro | Tipo | Rango / Valores | Descripción |
| :--- | :--- | :--- | :--- |
| `delayTime` | NUMBER | >= 0 | Tiempo de retraso. |
| `feedback` | NUMBER | 0 - 1 | Retroalimentación. |
| `lowPassCutoff`| NUMBER | 20 - 20,000 | Filtro de paso bajo interno. |
| `highPassCutoff`| NUMBER | 20 - 20,000 | Filtro de paso alto interno. |
| `dryWet` | NUMBER | 0 - 1 | Mezcla señal seca/procesada. |

#### Distorsión (`distortion`)
| Parámetro | Tipo | Rango / Valores | Descripción |
| :--- | :--- | :--- | :--- |
| `drive` | NUMBER | 0 - 1 | Cantidad de saturación. |
| `tone` | NUMBER | 0 - 1 | Control de brillo. |
| `distType` | STRING | `soft-clipping`, `hard-clipping`, `bitcrush`| Algoritmo de distorsión. |
| `outputLevel` | NUMBER | 0 - 1 | Volumen final de salida. |

#### Chorus / Flanger (`chorus_flanger`)
| Parámetro | Tipo | Rango / Valores | Descripción |
| :--- | :--- | :--- | :--- |
| `rate` | NUMBER | >= 0 | Velocidad de modulación. |
| `depth` | NUMBER | 0 - 1 | Profundidad del efecto. |
| `feedback` | NUMBER | 0 - 1 | Retroalimentación (más drástico en Flanger). |
| `mix` | NUMBER | 0 - 1 | Mezcla final. |

#### Compresor (`compressor`)
| Parámetro | Tipo | Rango / Valores | Descripción |
| :--- | :--- | :--- | :--- |
| `threshold` | NUMBER | Valor en dB | Umbral de activación. |
| `ratio` | NUMBER | >= 1 | Relación de compresión. |
| `attack` | NUMBER | >= 0 | Rapidez de ataque. |
| `release` | NUMBER | >= 0 | Tiempo de relajación. |
| `makeupGain` | NUMBER | >= 0 | Compensación de volumen. |

#### Ecualizador Paramétrico (`equalizer`)
| Parámetro | Tipo | Rango / Valores | Descripción |
| :--- | :--- | :--- | :--- |
| `bandFrequency`| NUMBER | 20 - 20,000 | Frecuencia central de la banda. |
| `bandwidth` | NUMBER | Valor Q | Ancho de banda (Bell/Shelf). |
| `gain` | NUMBER | Valor en dB | Realce o atenuación. |

---

### 3.4. Nodos de Mezcla y Nivel

#### Mezclador (`mixer`)
Este nodo permite la suma de hasta 10 señales.
| Parámetro | Tipo | Rango / Valores | Descripción |
| :--- | :--- | :--- | :--- |
| `stereo` | BOOLEAN | `true`, `false` | Modo de salida. |
| `inputs_number`| NUMBER | 1 - 10 | Número de entradas `input_x` habilitadas. |
| `input_1..10` | - | `ConnectionPoint` | Conexiones de audio. |
| `output_1..2` | - | `ConnectionPoint` | Salida principal (L) y (R). |

#### Ganancia y Paneo (`gain_pan`)
Nodo **Gain & Pan**: Control de amplitud y posición. Posee una única entrada fija (`input_1`) y salidas según el modo estéreo.
| Parámetro | Tipo | Rango / Valores | Descripción |
| :--- | :--- | :--- | :--- |
| `gain` | NUMBER | 0 - 1 | Nivel de ganancia. |
| `pan` | NUMBER | -1 a 1 | Posicionamiento estéreo. |
| `stereo` | BOOLEAN | `true`, `false` | Modo estéreo. |
| `input_1` | - | `ConnectionPoint` | Nodo de audio a procesar (fijo 1 entrada). |
| `output_1..2` | - | `ConnectionPoint` | Salidas de audio. |

---

## 4. Apéndice Técnico de Restricciones

### 4.1. Formato de Matriz (`Matrix`)
Utilizada en generadores para formas de onda personalizadas.
- **Tamaño**: Variable entre 4x4 y 1000x1000 elementos.
- **Estructura**: Debe ser estrictamente cuadrada (filas == columnas).
- **Contenido**: Solo se permiten valores binarios (0 o 1).

---

