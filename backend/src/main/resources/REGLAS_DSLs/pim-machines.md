# @schema MDA-Audio-PIM-Machine (Platform Independence Model)
# @context DSP Node Specification (Implementation-ready Synthesis for PD, Max, Web Audio)

Technical concretization of CIM models into implementable nodes. Defines specific synthesis algorithms, signal types, and parameter modifiability.

## @object Model (Root)
| Property | Type | Constraints | @mapping |
| :--- | :--- | :--- | :--- |
| `id` | UUIDv4 | 36 chars | PIM Machine Unique ID |
| `name` | String | Max 20 chars | Project-level display name |
| `ids_cim_reference`| Array[UUIDv4]| Required | Universe of CIM items implemented |
| `nodes` | Array[Node] | | Instances of DSP functional blocks |
| `edges` | Array[Edge] | | Direct signal/control connections |

## @interface Node (Base DSP Node)
Common structure for Generators, Modifiers, and Effects.
- `id` (UUIDv4): Unique instance identifier.
- `ids_references` (Array[UUIDv4]): Links to corresponding CIM elements.
- `others` (Array[OthersParameter]): Custom dynamic parameters.

### @type Parameter (DSP Property)
| Field | Type | Description | @constraint |
| :--- | :--- | :--- | :--- |
| `initialValue` | any | Default state | |
| `isModifiable` | Boolean | Signal modulation allowed | If false, reject incoming Control Edges |
| `isExternalInput` | Boolean | Expose to project bus | Must be false if `isModifiable` is false |

### @type ConnectionPoint (I/O Port)
- `isExternalInput`/`Output` (Boolean): Defines visibility for `PIM-Relations`.

## @object Edge (Signal Connection)
- `sourceNode`/`targetNode` (UUIDv4): Node instance references.
- `sourceParam`/`targetParam` (UUIDv4): Specific port/parameter references.
- `type` (Enum): `audio` (PCM bitstream) | `modification` (Control signal/LFO/Env).

## @dictionary Node_Definitions

### 1. Audio Generators (@category Source)
Produces PCM audio. Structural parameter `stereo` (Boolean) determines if `output_2` exists.
- **Oscillator**: Params: `waveform` (sine|sq|saw|tri|pulse|matrix), `frequency` (Hz), `pulseWidth`, `gain`, `phase`, `pan`.
- **Noise**: Params: `noiseType` (white|pink|brown), `gain`, `pan`.
- **Sample**: Params: `file` (Path), `loop` (Boolean), `gain`.

### 2. Parameter Modifiers (@category Control)
Produces modulation signals (typically 0-1 or Hz).
- **LFO**: Params: `waveform`, `rate` (Hz), `amplitude`, `sync` (Boolean).
- **Envelope**: Params: `envelopeType` (ADSR|ADR|AR|DAHDSR), `attack`, `decay`, `sustain`, `release`, `curve` (lin|exp|log).

### 3. Sound Modifiers (@category Effect)
Processes incoming audio. `stereo` determines `input_2`/`output_2` existence.
- **Filter**: `filterType` (LPF|HPF|BPF|Notch), `cutoff` (20-20k), `resonance` (Q), `slope`.
- **Reverb**: `roomSize`, `damping`, `decayTime`, `dryWet`.
- **Delay**: `delayTime`, `feedback`, `dryWet`.
- **Comp/Gain**: `gain`, `pan`, `threshold`, `ratio`.

### 4. Utilities (@category Summing)
- **Mixer**: Sums 2-10 signals via dynamic `input_1..10`.

## @semantic_mapping
This document is the **Synthesizer Implementation Blueprints**. Each node type maps directly to a DSP object in environments like PureData or Max/MSP. Connections of type `audio` are high-rate PCM streams, while `modification` are control-rate values (e.g., k-rate in Csound).
