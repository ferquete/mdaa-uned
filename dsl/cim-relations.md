# Manual de Referencia Técnica - CIM Relations

Este lenguaje se utiliza para establecer conexiones de alto nivel entre máquinas de audio definidas en el nivel CIM (Modelo Independiente de Computación). Permite orquestar el flujo de trabajo global del proyecto.

## 1. Estructura del Documento

El lenguaje utiliza una estructura compatible con JSON para definir la lista maestra de relaciones.

### 1.1. Propiedades Raíz

| Atributo | Tipo | Descripción | Restricciones |
| :--- | :--- | :--- | :--- |
| `description` | STRING | Propósito general de las interconexiones. | Opcional. 1-600 caracteres. |
| `relations` | ARRAY | Lista de objetos de relación. | Obligatorio. |

### 1.2. Objeto Relation (Relación)

Define un vínculo direccional entre dos máquinas independientes.

| Atributo | Tipo | Descripción | Restricciones |
| :--- | :--- | :--- | :--- |
| `id` | STRING | Identificador único de la relación. | Obligatorio. Exactamente 36 caracteres. |
| `source` | STRING | ID de la máquina de origen. | Obligatorio. 1-36 caracteres. |
| `destination` | STRING | ID de la máquina de destino. | Obligatorio. 1-36 caracteres. |
| `description` | STRING | Justificación técnica del vínculo. | Obligatorio. 10-300 caracteres. |

---

## 2. Reglas de Validación

El compilador aplica las siguientes restricciones para garantizar la integridad del modelo:

1.  **Unicidad de IDs**: Cada relación dentro del array `relations` debe poseer un `id` único.
2.  **Formato de Identificadores**: El campo `id` debe seguir el estándar de 36 caracteres (formato UUID).
3.  **Límites de Texto**:
    *   La descripción del documento no puede superar los 600 caracteres.
    *   La descripción de cada relación debe tener entre 10 y 300 caracteres.

> [!TIP]
> Aunque el lenguaje permite nombres descriptivos para `source` y `destination`, se recomienda utilizar los UUIDs de las máquinas CIM para mantener la trazabilidad absoluta en entornos automatizados.
