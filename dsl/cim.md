# Modelo Independiente de Computación (CIM)

Este documento describe los lenguajes específicos de dominio (DSL) utilizados para definir el Modelo Independiente de Computación (CIM) en el sistema MDA-Audio. El CIM se divide en dos gramáticas principales: una para la definición interna de las máquinas de audio y otra para establecer las relaciones de alto nivel entre ellas. En este documento hablamos de la definición interna de estas máquinas.

## 1. Lenguaje de Definición de Máquinas de Audio (CIM Machine)

Este lenguaje permite definir la estructura lógica y los componentes internos de una máquina de síntesis o procesamiento de audio. Una máquina es un componente compuesto por generadores de sonidos y/o modificadores de parámetros internos de esos u otros generadores.

### 1.1. Estructura y Gramática

El documento se define como una secuencia obligatoria de campos:

```langium
entry Document:
    'id' id=STRING
    'name' name=STRING
    'description' description=STRING
    'generators' '[' (generators+=AudioGenerator (',' generators+=AudioGenerator)*)? ']'
    'modificators' '[' (modificators+=Modificator (',' modificators+=Modificator)*)? ']'
;
```

### 1.2. Reglas de Validación

El sistema aplica restricciones estrictas para asegurar que el modelo sea procesable por las etapas posteriores de la arquitectura MDA:

| Elemento | Propiedad | Regra de Validación |
| :--- | :--- | :--- |
| **Global** | `id` | Unicidad absoluta en todo el documento. Obligatorio (36 caracteres). |
| **Documento**| `name` | 1 a 20 caracteres. |
| **Documento**| `description`| 10 a 6000 caracteres. |
| **Componentes**| `name` | 1 a 20 caracteres. |
| **Componentes**| `description`| 10 a 300 caracteres (específica por nodo). |
| **Componentes**| `params` | 10 a 300 caracteres. |
| **Conexión** | `idRef` | Prohibida la auto-referencia (un nodo no puede enviarse señal a sí mismo). |
| **Conexión** | `description`| 10 a 300 caracteres. |

---

## 2. Lenguaje de Relaciones entre Máquinas (CIM Relations)

Este lenguaje orquesta la comunicación entre máquinas independientes. Para más detalles, consulte el manual específico: [Manual de CIM Relations](file:///Users/fernandorealcisneros/trabajo/master/GENERACION_CODIGO/PARCIALES/PEP4/ProyectoBase/dsl/cim-relations.md).

### 2.1. Elementos Principales

#### RelationDocument (Documento de Relaciones)
Contenedor principal para las dependencias entre máquinas.
- **description**: Resumen de la lógica de interconexión (1-600 caracteres).
- **relations**: Colección de objetos de relación.

#### Relation (Relación)
Define un vínculo direccional.
- **id**: Identificador único (36 caracteres).
- **source**: ID de la máquina origen.
- **destination**: ID de la máquina destino.
- **description**: Justificación técnica del vínculo (10-300 caracteres).
