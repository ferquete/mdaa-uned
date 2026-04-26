# @schema MDA-Audio-CIM-Machine (Computational Independence Model)
# @context Synthesis Design Intent (Abstract DSP structure for Max/MSP, PureData, Web Audio)

Technical specification for high-level audio machine topology. CIM nodes define functional intent without implementation constraints.

## @object Document (Root)
| Property | Type | Constraints | @mapping |
| :--- | :--- | :--- | :--- |
| `id` | UUIDv4 | Exact 36 chars | Global Machine Unique ID |
| `name` | String | [1, 20] chars | Machine display name |
| `description` | String | [10, 600] chars | Functional purpose |
| `elements` | Array[Element] | | List of internal functional blocks |

## @object Element (Functional Block)
| Property | Type | Constraints | @mapping |
| :--- | :--- | :--- | :--- |
| `id` | UUIDv4 | Exact 36 chars | Component instance ID |
| `name` | String | [1, 20] chars | Block name |
| `description` | String | [10, 600] chars | Block DSP function |
| `params` | String | [10, 600] chars | Conceptual parameters (e.g., "Freq, Cutoff") |
| `externalOutput` | Object | @see ExternalConfig | Output port to project bus |
| `externalInput` | Object | @see ExternalConfig | Input port from project bus |
| `sendTo` | Array[SendTo] | | Internal directional signal routing |

### @fragment ExternalConfig
- `hasExternalOutput`/`Input` (Boolean): Enables global project-level connectivity.
- `description` (String): Port metadata. Max 600 chars.

## @object SendTo (Internal Routing)
Directional signal link between elements within the same machine.
- `id` (UUIDv4): Required.
- `idRef` (Reference): Must match an `id` of an `Element` in the same scope.
- `description` (String): [10, 600] chars.

### @constraint Semantic_Rules
- `@Rule_NoSelfReference`: `Element.id` != `SendTo.idRef`. Compiler rejects self-loops.
- `@Rule_IdUniqueness`: All `id` fields in document must be globally unique.

## @semantic_mapping
Use this document to map abstract synthesis intent to logical blocks. Fields like `params` define what the machine *can* do, while `sendTo` defines the *signal flow architecture*.
