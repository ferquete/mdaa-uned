# Manual de Referencia Técnica MDA-Audio-CIM-Relations-Machines

Este documento especifica el lenguaje **MDA-Audio-CIM-Relations-Machines** de relaciones entre máquinas definidas en el documento `cim-machine.md`. Este documento trabaja al mismo nivel de abstracción que el documento de especificación de máquinas ya mencionado, siguiendo la nomenclatura de Model-Driven-Architecture (MDA), este nivel se conoce como **CIM (Computational Independence Model)**. Mientras que el lenguaje de máquinas define la topología interna, este lenguaje orquesta la comunicación de alto nivel entre máquinas independientes a escala de proyecto.

En el CIM no se tiene porqué hablar de implementaciones concretas (osciladores, LFOs, filtros específicos) a bajo nivel, sino de **elementos** abstractos que capturan la intención del diseño de síntesis de la máquina.


---

## 1. Estructura del Modelo

El documento de relaciones define cómo fluye la información entre máquinas mediante una colección de vínculos abstractos.

### 1.1. Modelo Raíz (`Document`)

El objeto raíz contiene la descripción global del sistema de interconexiones.

| Atributo | Tipo | Descripción | Restricciones |
| :--- | :--- | :--- | :--- |
| `description` | STRING | Propósito general de las interconexiones. | Opcional. 1 a 600 caracteres. |
| `relations` | ARRAY[`Relation`] | Lista de objetos de relación entre máquinas. | Obligatorio. |

**Ejemplo de Documento:**
```json
{
  "description": "Simple Lead to Mixer routing.",
  "relations": [ ... ]
}
```

### 1.2. Objeto de Relación (`Relation`)

Define un vínculo direccional entre dos máquinas CIM independientes.

| Atributo | Tipo | Descripción | Restricciones |
| :--- | :--- | :--- | :--- |
| `id` | STRING | Identificador único de la relación. | Obligatorio. Exactamente 36 caracteres. |
| `source` | STRING | ID de la máquina de origen. | Obligatorio. Exactamente 36 caracteres. |
| `destination` | STRING | ID de la máquina de destino. | Obligatorio. Exactamente 36 caracteres. |
| `description` | STRING | Justificación técnica del vínculo. | Obligatorio. 10 a 600 caracteres. |

**Ejemplo de Relación:**
```json
{
  "id": "111e8400-e29b-41d4-a716-446655440111",
  "source": "LeadSynth",
  "destination": "MainMixer",
  "description": "Routes audio from lead to master mixer."
}
```

---

## 2. Reglas de Validación

Para garantizar la integridad del flujo entre máquinas, se aplican las siguientes restricciones:

### 2.1. Identidad y Formato
- **Unicidad de IDs**: Cada relación en el array `relations` debe tener un `id` único.
- **Formato UUID**: El campo `id` debe cumplir con el estándar de 36 caracteres.

### 2.2. Restricciones de Texto
- **Descripción Global**: Máximo 600 caracteres.
- **Descripción de Relación**: Entre 10 y 600 caracteres.

### 2.3. Interfaces Expuestas y Existencia
- **Existencia**: Los IDs especificados en `source` y `destination` deben corresponder a máquinas CIM que existan realmente en el proyecto.
- **Sin Auto-Relación**: Una máquina no puede conectarse consigo misma. Los campos `source` y `destination` deben ser diferentes.
- **Configuración de Origen (`source`)**: La máquina referenciada como **origen** DEBE contener al menos un elemento interno configurado con `hasExternalOutput: true`. Esto permite que la máquina "emita" señal hacia el exterior.
- **Configuración de Destino (`destination`)**: La máquina referenciada como **destino** DEBE contener al menos un elemento interno configurado con `hasExternalInput: true`. Esto permite que la máquina "reciba" señal desde el exterior.

En resumen, las relaciones CIM solo pueden existir si las interfaces individuales de las máquinas están habilitadas para la comunicación externa (puertos de entrada/salida) y si ambas entidades son máquinas distintas y existentes.

---

## 3. Guía de Uso

Las relaciones CIM expresan dependencias conceptuales (ej.: *La máquina de síntesis de leads alimenta a la máquina de mezcla principal*). No entran en detalles técnicos de canales, puertos específicos o parámetros muy concretos, ya que esa granularidad se define exclusivamente en el nivel **PIM**.

> [!TIP]
> Antes de definir una relación, asegúrese de que la máquina origen expone salidas y la destino acepta entradas en sus respectivos modelos CIM. De lo contrario, el validador bloqueará la creación del flujo.
