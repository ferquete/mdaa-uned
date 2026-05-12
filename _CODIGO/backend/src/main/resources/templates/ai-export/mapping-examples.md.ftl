<#ftl strip_whitespace=true>
# Node Type → Target Language Mapping Examples

This document provides **concrete, minimal code snippets** for each PIM node type,
mapped to the four supported audio synthesis target languages.
Use these as few-shot references when generating the full synthesis program.

---

## Legend

Each example shows the **minimum instantiation** for a node with representative parameters.
Replace the parameter values with those from `initialValue` in the actual model.

---

<#macro puredata_obj name args="">
`[${name}${args?has_content?then(" " + args, "")}]`<#t>
</#macro>

<#-- Macro para envolver contenido por lenguaje -->
<#macro lang target>
<#if targetLanguage == "" || targetLanguage == target><#lt>
<#nested>
</#if><#rt>
</#macro>

---

## 1. `oscillator` — Waveform Generator

<@lang "Web Audio API (JavaScript)">
### Web Audio API (JavaScript)
```javascript
// waveform: "sine" | "square" | "sawtooth" | "triangle"
const osc = ctx.createOscillator();
osc.type = "sine";           // initialValue of waveform param
osc.frequency.value = 440;   // initialValue of frequency param

// Modulation (optional)
// const modGain = ctx.createGain(); 
// lfo.connect(modGain).connect(osc.frequency);

osc.start();
```
</@lang>

<@lang "SuperCollider">
### SuperCollider (sclang)
```supercollider
// Estructura básica: { UGen.ar(freq, phase, mul, add) }
{ SinOsc.ar(440, 0, 0.8) }.play;

// Otros tipos:
// Pulse.ar(440, 0.5)      -- square/pulse
// Saw.ar(440)             -- sawtooth
// LFTri.ar(440)           -- triangle
// VarSaw.ar(440, 0, 0.5)  -- sawtooth/triangle variable
```
</@lang>

<@lang "Max/MSP">
### Max/MSP
```maxpat
[cycle~ 440]          // sine
[rect~ 440 0.5]       // square/pulse (width 0.5 = square)
[saw~ 440]            // sawtooth
[tri~ 440]            // triangle

// Modulation input: use the left inlet for frequency modulation signal
```
</@lang>

<@lang "Pure Data">
### Pure Data
```pd
[osc~ 440]            // sine generator
[phasor~ 440]         // sawtooth/ramp generator (0 to 1)

// Para otras formas de onda se suelen usar tablas [table] o 
// manipular [phasor~] con [expr~] o [cos~]
```
</@lang>

---

## 2. `noise` — Noise Generator

<@lang "Web Audio API (JavaScript)">
### Web Audio API (JavaScript)
```javascript
// Ruido blanco mediante AudioBuffer
const bufferSize = 2 * ctx.sampleRate;
const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
const data = noiseBuffer.getChannelData(0);
for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

const noise = ctx.createBufferSource();
noise.buffer = noiseBuffer;
noise.loop = true;
noise.start();
```
</@lang>

<@lang "SuperCollider">
### SuperCollider
```supercollider
{ WhiteNoise.ar(0.5) }.play;  // Ruido blanco
{ PinkNoise.ar(0.5) }.play;   // Ruido rosa
{ BrownNoise.ar(0.5) }.play;  // Ruido browniano
```
</@lang>

<@lang "Max/MSP">
### Max/MSP
```maxpat
[noise~]   // White noise
[pink~]    // Pink noise
```
</@lang>

<@lang "Pure Data">
### Pure Data
```pd
[noise~]   // White noise generator
```
</@lang>

---

## 3. `sample` — Audio File Playback

<@lang "Web Audio API (JavaScript)">
### Web Audio API (JavaScript)
```javascript
const response = await fetch("path/to/file.wav");
const arrayBuffer = await response.arrayBuffer();
const audioBuffer = await ctx.decodeAudioData(arrayBuffer);

const source = ctx.createBufferSource();
source.buffer = audioBuffer;
source.loop = true; 
source.playbackRate.value = 1.0;
source.start();
```
</@lang>

<@lang "SuperCollider">
### SuperCollider
```supercollider
b = Buffer.read(s, "path/to/file.wav");
{ PlayBuf.ar(1, b, BufRateScale.kr(b), loop: 1) }.play;
```
</@lang>

<@lang "Max/MSP">
### Max/MSP
```maxpat
[buffer~ mySample "file.wav"]
[groove~ mySample]   // Controlado por [sig~ 1.0] para velocidad
// o
[sfplay~ 1]          // Para streaming directo desde disco
```
</@lang>

<@lang "Pure Data">
### Pure Data
```pd
[readsf~ 1]          // Streaming mono
[soundfiler]         // Para cargar en un array/table
[tabplay~ myTable]   // Reproducción desde tabla
```
</@lang>

---

## 4. `envelope` — ADSR/AR Envelope Generator

<@lang "Web Audio API (JavaScript)">
### Web Audio API (JavaScript)
```javascript
const env = ctx.createGain();
const now = ctx.currentTime;
env.gain.setValueAtTime(0, now);
env.gain.linearRampToValueAtTime(1, now + 0.01); // Attack
env.gain.linearRampToValueAtTime(0.7, now + 0.1); // Decay -> Sustain
// Release (manual trigger)
// env.gain.exponentialRampToValueAtTime(0.001, now + releaseTime);
```
</@lang>

<@lang "SuperCollider">
### SuperCollider
```supercollider
// ADSR: attack, decay, sustainLevel, release
{ EnvGen.ar(Env.adsr(0.01, 0.1, 0.7, 0.3), gate: Impulse.kr(1)) }.play;

// AR (Percussive): attack, release
{ EnvGen.ar(Env.perc(0.01, 0.3), doneAction: 2) }.play;
```
</@lang>

<@lang "Max/MSP">
### Max/MSP
```maxpat
[adsr~ 10 100 0.7 300] // ms, ms, level, ms
[function]             // Editor gráfico que envía a [line~]
```
</@lang>

<@lang "Pure Data">
### Pure Data
```pd
[vline~]               // Generador de rampas precisas
// Mensaje: [1 10, 0.7 100 10, 0 300 500( -> [vline~]
// (valor tiempo retardo)
```
</@lang>

---

## 5. `frequency_filter` — Filter Node

<@lang "Web Audio API (JavaScript)">
### Web Audio API (JavaScript)
```javascript
const filter = ctx.createBiquadFilter();
filter.type = "lowpass";    // "highpass", "bandpass", "notch", "peaking"
filter.frequency.value = 1000;
filter.Q.value = 1.0;
```
</@lang>

<@lang "SuperCollider">
### SuperCollider
```supercollider
{ LPF.ar(WhiteNoise.ar(0.5), frequency: 1000) }.play;
{ HPF.ar(WhiteNoise.ar(0.5), 1000) }.play;
{ BPF.ar(WhiteNoise.ar(0.5), 1000, rq: 0.1) }.play; // rq = bandwidth/freq
```
</@lang>

<@lang "Max/MSP">
### Max/MSP
```maxpat
[lores~ 1000 0.5]      // Resonant LPF (freq, resonance 0-1)
[svf~ 1000 0.5]        // State Variable Filter (LP, HP, BP, Notch outputs)
[biquad~]              // Con coeficientes de [filtergraph~]
```
</@lang>

<@lang "Pure Data">
### Pure Data
```pd
[lop~ 1000]            // Simple LPF
[hip~ 1000]            // Simple HPF
[bp~ 1000 10]          // Bandpass (freq, Q)
[vcf~]                 // Voltage Controlled Filter (con entrada de señal para freq)
```
</@lang>

---

## 6. `gain_pan` — Level and Stereo Panning

<@lang "Web Audio API (JavaScript)">
### Web Audio API (JavaScript)
```javascript
const gain = ctx.createGain();
gain.gain.value = 0.5;

const panner = ctx.createStereoPanner();
panner.pan.value = 0.0; // -1 (izq) a 1 (der)
```
</@lang>

<@lang "SuperCollider">
### SuperCollider
```supercollider
{ Pan2.ar(SinOsc.ar(440) * 0.5, pos: 0) }.play; // pos: -1 a 1
```
</@lang>

<@lang "Max/MSP">
### Max/MSP
```maxpat
[*~ 0.5]    // Gain
[pan2S~]    // O implementación manual con [*~] y cos/sin
[panning~]  
```
</@lang>

<@lang "Pure Data">
### Pure Data
```pd
[*~ 0.5]    // Gain
[pan~]      // De la librería cyclone
// Manual: entrada -> [*~ left_vol] -> dac~ 1
//         entrada -> [*~ right_vol] -> dac~ 2
```
</@lang>

---

## 7. `mixer` — Audio Summing (Up to 10 inputs)

<@lang "Web Audio API (JavaScript)">
### Web Audio API (JavaScript)
```javascript
// En Web Audio, múltiples conexiones a un Nodo suman automáticamente
const mixerBus = ctx.createGain();
input1.connect(mixerBus);
input2.connect(mixerBus);
// ...
mixerBus.connect(destination);
```
</@lang>

<@lang "SuperCollider">
### SuperCollider
```supercollider
// Mix.ar([]) suma un array de señales
{ Mix.ar([sig1, sig2, sig3]) * 0.3 }.play;
```
</@lang>

<@lang "Max/MSP">
### Max/MSP
```maxpat
[+~] // Suma básica. Para muchos canales se suelen encadenar o usar [matrix~]
```
</@lang>

<@lang "Pure Data">
### Pure Data
```pd
[+~] // Suma de señales.
```
</@lang>

---

## 8. `delay` — Echo/Delay Line

<@lang "Web Audio API (JavaScript)">
### Web Audio API (JavaScript)
```javascript
const delay = ctx.createDelay(5.0); // max delay time
delay.delayTime.value = 0.5;

const feedback = ctx.createGain();
feedback.gain.value = 0.4;

// Loop de feedback
delay.connect(feedback);
feedback.connect(delay);
```
</@lang>

<@lang "SuperCollider">
### SuperCollider
```supercollider
{ CombN.ar(SinOsc.ar(440), maxdelaytime: 1.0, delaytime: 0.5, decaytime: 2.0) }.play;
// DelayN (no feedback), DelayL / DelayC (interpolación lineal/cúbica)
```
</@lang>

<@lang "Max/MSP">
### Max/MSP
```maxpat
[tapin~ 1000]  // Buffer de 1000ms
[tapout~ 500]  // Salida con delay de 500ms
```
</@lang>

<@lang "Pure Data">
### Pure Data
```pd
[delwrite~ myDelay 1000] // Buffer
[delread~ myDelay 500]   // Lectura fija
[vd~ myDelay]            // Lectura variable (para chorus/flanger)
```
</@lang>

---

## 9. `reverb` — Reverberation

<@lang "Web Audio API (JavaScript)">
### Web Audio API (JavaScript)
```javascript
const reverb = ctx.createConvolver();
// Requiere cargar un Impulse Response (IR) en reverb.buffer
```
</@lang>

<@lang "SuperCollider">
### SuperCollider
```supercollider
{ FreeVerb.ar(in, mix: 0.33, room: 0.5, damp: 0.5) }.play;
{ GVerb.ar(in, roomsize: 10, revtime: 3) }.play;
```
</@lang>

<@lang "Max/MSP">
### Max/MSP
```maxpat
[freeverb~]
[plate~]
```
</@lang>

<@lang "Pure Data">
### Pure Data
```pd
[freeverb~] // Reverberación clásica
```
</@lang>

---

## Appendix: File Syntax for Visual Languages

If the target is a visual language, use the following syntax to generate the actual file content.

<@lang "Pure Data">
### Pure Data (.pd) Syntax
A Pure Data file is a plain text file. Use this structure to encapsulate a PIM Machine:

```pd
#N canvas 0 0 450 300 10;
#X obj 50 50 inlet~;
#X obj 50 100 osc~ 440;
#X obj 50 150 *~ 0.5;
#X obj 50 200 outlet~;
#X connect 0 0 1 0;
#X connect 1 0 2 0;
#X connect 2 0 3 0;
```
*Note: `#N canvas` defines the window. `#X obj X Y name args` defines objects. `#X connect sourceNode sourceOutlet targetNode targetInlet` defines wires.*
</@lang>

<@lang "Max/MSP">
### Max/MSP (.maxpat) Syntax
A Max file is a JSON structure. Use this as a reference:

```json
{
  "patcher": {
    "fileversion": 1,
    "appversion": { "major": 8 },
    "rect": [ 100.0, 100.0, 640.0, 480.0 ],
    "boxes": [
      { "box": { "maxclass": "newobj", "text": "inlet~", "id": "obj-1", "patching_rect": [ 50.0, 50.0, 30.0, 30.0 ] } },
      { "box": { "maxclass": "newobj", "text": "osc~ 440", "id": "obj-2", "patching_rect": [ 50.0, 100.0, 60.0, 20.0 ] } },
      { "box": { "maxclass": "newobj", "text": "outlet~", "id": "obj-3", "patching_rect": [ 50.0, 200.0, 30.0, 30.0 ] } }
    ],
    "lines": [
      { "patchline": { "source": [ "obj-1", 0 ], "destination": [ "obj-2", 0 ] } },
      { "patchline": { "source": [ "obj-2", 0 ], "destination": [ "obj-3", 0 ] } }
    ]
  }
}
```
</@lang>