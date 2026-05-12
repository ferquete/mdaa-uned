# @schema MDA-Audio-CIM-Relations (Computational Independence Model)
# @context High-Level Signal Routing (Project-wide Inter-Machine communication)

Orchestrates communication between independent `CIM-Machine` instances at project scale. Defines the global signal bus.

## @object Document (Root)
| Property | Type | Constraints | @mapping |
| :--- | :--- | :--- | :--- |
| `description` | String | [1, 1000] chars | Inter-machine network purpose |
| `relations` | Array[Relation] | | Set of global interconnections |

## @object Relation (Inter-Machine Link)
| Property | Type | Constraints | @mapping |
| :--- | :--- | :--- | :--- |
| `id` | UUIDv4 | Exact 36 chars | Relation unique identifier |
| `source` | UUIDv4 | Exact 36 chars | Source CIM Machine ID |
| `destination` | UUIDv4 | Exact 36 chars | Destination CIM Machine ID |
| `description` | String | [10, 1000] chars | DSP Bus justification |

### @constraint Validation_Rules
- `@Rule_Existence`: `source` and `destination` IDs must resolve to existing CIM machines in project scope.
- `@Rule_Disjointness`: `source` != `destination`. No feedback loops at CIM level.
- `@Rule_InterfaceSource`: Source machine MUST have at least one element with `externalOutput: true`.
- `@Rule_InterfaceDest`: Destination machine MUST have at least one element with `externalInput: true`.

## @semantic_mapping
This document defines the **Project Signal Topology**. Use it to determine which machines act as Synthesis Sources (Oscillators/Samplers) and which act as Processing/Output sinks (Filters/Mixers) at a conceptual level.
