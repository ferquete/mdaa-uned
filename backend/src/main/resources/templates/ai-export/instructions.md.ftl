# AI Code Generation Instructions
## Project: ${projectName}

> **Generated on:** ${generatedAt}
> **Task**: From the MDA model below, generate a fully functional audio synthesis program.

---

## 1. Your Task

You are an expert audio programmer. Using the structured MDA (Model-Driven Architecture)
model provided in this ZIP, generate a complete, runnable audio synthesis program in the
target language: **${(targetLanguage?has_content)?then(targetLanguage, "specified by the user")}**.

The input you receive is organized in three abstraction layers:

| Layer | Folder | Purpose |
|-------|--------|---------|
| DSL Reference Manuals | `rules/` | Grammar rules and constraints for understanding the model |
| CIM Machines | `project/cim-machines/` | **What** each module does (technology-agnostic) |
| PIM Machines | `project/pim-machines/` | **How** modules are wired (typed nodes + parameter values) |
| Relations | `project/pim-relations.json` | Inter-machine connections (external ports) |
| Resolved Graph | `resolved/RESOLVED_GRAPH.json` | Human-readable cross-reference of all the above |
| Mapping Examples | `resolved/MAPPING_EXAMPLES.md` | Node-type → target language code snippets |

---

## 2. Architecture Overview

This project uses **MDA (Model-Driven Architecture)** with two levels:

### CIM (Computation Independent Model)
- Lives in `project/cim-machines/`
- Defines audio modules at a **conceptual level** (no implementation details)
- Each element has: name, description, params (text), external input/output flags, and internal routing

### PIM (Platform Independent Model)
- Lives in `project/pim-machines/`
- **Concretizes** the CIM into a **signal flow graph** with:
  - **Typed nodes** (`oscillator`, `lfo`, `frequency_filter`, `reverb`, `delay`, `distortion`,
    `chorus_flanger`, `compressor`, `equalizer`, `mixer`, `gain_pan`, `noise`, `sample`, `envelope`)
  - **Edges** of type `"audio"` (signal flow) or `"modification"` (control/modulation)
  - **Parameters** with `initialValue` (the default value to use if no modulation arrives)
  - **Ports** (`input_1`, `output_1`, etc.) that define connectivity

### PIM Relations
- Lives in `project/pim-relations.json`
- Connects `isExternalOutput` ports of one PIM machine to `isExternalInput` ports of another

---

## 3. Signal Flow Reading Guide

To reconstruct the synthesis graph:

1. **Start from** `resolved/RESOLVED_GRAPH.json` — it has all UUIDs already resolved to names.
2. For each PIM machine, read its `nodes` array to instantiate the synthesis objects.
3. Read `edges` to wire nodes together:
   - **Connectivity**: `sourceParam` and `targetParam` contain the **property name** of the port (e.g., `output_1`, `input_1`, `cutoff`), not a UUID.
   - `"audio"` edges → connect audio outputs to audio inputs
   - `"modification"` edges → connect control outputs (LFO, envelope) to modulatable parameters
4. Read `pimRelations` to wire machines together at the inter-machine level.
5. Use `initialValue` of each parameter as the **default/initial value** when instantiating the node.

---

## 4. Key DSL Concepts for Code Generation

### Stereo Mode
- If a node has `stereo: true`, it has both `output_1` (left) and `output_2` (right).
- Mono nodes only have `output_1`.
- Mixers and gain_pan follow the same rule for outputs.

### Modulation (`modification` edges)
- An LFO or envelope connecting to a parameter means the parameter is **modulated at runtime**.
- In languages that support it (Web Audio API, SuperCollider, Max/MSP), use the native
  modulation/signal-rate connection. Otherwise, implement periodic value updates.

### External Ports
- `isExternalOutput: true` on a port → this is a **machine output** (connect to speakers or another machine)
- `isExternalInput: true` on a port → this is a **machine input** (receives signal from another machine or external source)

### Parameter `others` Array
- Each node can have custom parameters in `others[]` — treat them as additional controllable parameters
  specific to that node instance with string `initialValue`.

---

## 5. Node Type → Target Language Mapping

Consult `resolved/MAPPING_EXAMPLES.md` for concrete code snippets per node type and target language.
The general mapping is:

| PIM Node Type | Audio Concept |
|---------------|---------------|
| `oscillator` | Periodic waveform generator (sine, square, sawtooth, triangle, pulse, matrix) |
| `noise` | Noise generator (white, pink, brownian) |
| `sample` | Audio file playback |
| `lfo` | Low-frequency oscillator for modulation (control rate) |
| `envelope` | ADSR/ADR/AR/DAHDSR envelope generator |
| `frequency_filter` | Biquad/IIR filter (LPF, HPF, BPF, Notch) |
| `reverb` | Convolution or algorithmic reverberation |
| `delay` | Echo/feedback delay line |
| `distortion` | Waveshaping / bitcrusher |
| `chorus_flanger` | Modulated delay for chorus or flanger |
| `compressor` | Dynamic range compressor |
| `equalizer` | Parametric EQ band |
| `mixer` | N-input audio summing bus (2–10 inputs) |
| `gain_pan` | Amplitude and stereo panning control |

---

## 6. Generation Instructions

1. **Instantiate** every node in each PIM machine following the type mapping above.
2. **Set initial values** from `params.initialValue` on creation.
3. **Wire audio edges**: connect source node output ports to target node input ports.
4. **Wire modulation edges**: connect LFO/envelope outputs to target parameter inputs.
5. **Wire inter-machine relations** from `pimRelations`.
6. **Respect stereo/mono**: instantiate single or dual channels as indicated by `stereo`.
7. **Output**: connect all nodes with `isExternalOutput: true` to the audio output / DAC.

> Do NOT invent parameters or connections not present in the model.
> Do NOT ignore `modification` edges — they define the dynamic behavior of the synthesizer.

---

## 7. Project Description

${projectDescription!"(No description provided.)"}
