# @schema MDA-Audio-PIM-Relations (Platform Independence Model)
# @context Fine-Grained DSP Routing (Inter-Machine Parameter Modulation)

Detailed technical orchestration between PIM machines. Establish direct modulation links between ports and parameters across machine boundaries.

## @object Document (Root)
| Property | Type | Constraints | @mapping |
| :--- | :--- | :--- | :--- |
| `description` | String | Max 600 chars | Network modulation goal |
| `relations` | Array[Relation] | | Set of cross-machine DSP links |

## @object Relation (Technical Link)
| Property | Type | Constraints | @mapping |
| :--- | :--- | :--- | :--- |
| `id` | UUIDv4 | Exact 36 chars | Relation ID |
| `source` | UUIDv4 | Reference to Output Port | Must have `isExternalOutput: true` |
| `destination`| UUIDv4 | Reference to Input/Param | Must have `isExternalInput: true` |
| `description` | String | [10, 300] chars | Control/Audio flow purpose |

### @constraint Integrity_Rules
- `@Rule_PortValidation`: `source` must be a valid port ID in one of the project's PIM machines.
- `@Rule_DestValidation`: `destination` must be a valid port or parameter ID in a *different* PIM machine instance.
- `@Rule_Visibility`: Connections only allowed if the PIM machine's internal design explicitly exposes the port (external flags).

## @semantic_mapping
This document is the **Global DSP Patchbay**. It maps how a specific signal (e.g., LFO Output) from Machine A modulates a specific parameter (e.g., Filter Cutoff) in Machine B. This document provides the final routing table for the synthesizer runtime.
