# Relaciones PIM (`PIM Relations`)

Este lenguaje, MDA-Audio-PIM-Relations-Machines, permite orquestar las interconexiones entre máquinas PIM. A diferencia del nivel CIM, donde las relaciones son entre máquinas completas, el nivel PIM (Platform Independence Model) establece vínculos directos entre puntos de conexión y parámetros específicos. 


## 1. Estructura del Documento

El lenguaje utiliza una estructura JSON para definir el grafo de relaciones.

### 1.1. Propiedades Raíz

| Atributo | Tipo | Descripción | Restricciones |
| :--- | :--- | :--- | :--- |
| `description` | STRING | Propósito de la red de relaciones. | Opcional. 1 a 600 caracteres. |
| `relations` | ARRAY | Lista de objetos de relación detallada. | Obligatorio. Puede estar vacío. |

### 1.2. Ejemplo de Estructura Raíz

```json
{
  "description": "0123456789 (hasta 600 caracteres)",
  "relations": [
    {
      "id": "550e8400-e29b-41d4-a716-446655661001",
      "source": "550e8400-e29b-41d4-a716-446655445001",
      "destination": "550e8400-e29b-41d4-a716-446655444004",
      "description": "Modulacion de amplitud (10 a 300 caracteres)"
    }
  ]
}
```

### 1.2. Objeto Relation (Relación PIM)

Define un vínculo técnico entre un punto de salida y un punto de entrada o parámetro.

| Atributo | Tipo | Descripción | Restricciones |
| :--- | :--- | :--- | :--- |
| `id` | STRING | Identificador único de la relación. | Obligatorio. UUID de 36 caracteres. |
| `source` | STRING | ID del **output** de una máquina PIM, que tenga su propiedad `isExternalOutput` en true. | Obligatorio. UUID de 36 caracteres. |
| `destination`| STRING | ID del **input** o **parámetro** de una máquina PIM, que tenga su propiedad `isExternalInput` en true. | Obligatorio. UUID de 36 caracteres. |
| `description` | STRING | Descripción de la modulación o flujo. | Obligatorio. 10 a 300 caracteres. |

#### Ejemplo de Relación Detallada
```json
{
  "id": "550e8400-e29b-41d4-a716-446655661001",
  "source": "550e8400-e29b-41d4-a716-446655445001",
  "destination": "550e8400-e29b-41d4-a716-446655444004",
  "description": "Conexion de oscilador a ganancia del amplificador."
}
```

---

## 2. Reglas de Validación

El compilador de PIM Relations aplica las siguientes reglas de integridad:

1. **Formato UUID Estricto**: Los campos `id`, `source` y `destination` deben tener exactamente 36 caracteres. No se permiten nombres descriptivos; solo identificadores técnicos.
2. **Unicidad de IDs**: El `id` de cada relación debe ser único en todo el documento.
3. **Restricciones de Texto**:
    - Descripción del documento: máx. 600 caracteres.
    - Descripción de relación: entre 10 y 300 caracteres.

---

## 3. Guía de Uso Táctico

Este lenguaje es el puente final antes de la generación de código de bajo nivel. Mientras que en **CIM Relations** decimos *La Máquina A se conecta a la B*, en **PIM Relations** especificamos *El `output_1` de la instancia 550e8400... se conecta al `frequency` de la instancia a1b2c3d4...*.

> [!IMPORTANT]
> Los IDs utilizados en `source` y `destination` deben corresponder a identificadores definidos en los archivos `.json` de máquinas PIM correspondientes, siguiendo las reglas ya expuestas.
