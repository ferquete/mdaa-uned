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
`[${name}${args?has_content?then(" " + args, "")}]`
</#macro>

## 1. `oscillator` — Waveform Generator

### Web Audio API (JavaScript)
```javascript
// waveform: "sine" | "square" | "sawtooth" | "triangle"  (pulse → custom PeriodicWave)
const osc = ctx.createOscillator();
osc.type = "sine";           // initialValue of waveform param
osc.frequency.value = 440;   // initialValue of frequency param
osc.start();
```

### SuperCollider (sclang)
```supercollider
// Stereo: SinOsc.ar([440, 440], 0, 0.5)
// Mono:   SinOsc.ar(440, 0, 0.5)
{ SinOsc.ar(440, 0, 0.8) }.play
// square → Pulse.ar(440, 0.5)
// sawtooth → Saw.ar(440)
// triangle → LFTri.ar(440)  (or VarSaw with width=0.5)
```

### Max/MSP
```
[cycle~ 440]          // sine
[rect~ 440 0.5]       // square/pulse
[saw~ 440]            // sawtooth
[tri~ 440]            // triangle
```

### Pure Data
```
[osc~ 440]            // sine (standard)
[phasor~ 440]         // sawtooth (via [cos~] for other shapes)
```

---

## 2. `noise` — Noise Generator

### Web Audio API
```javascript
// White noise via AudioWorklet or ScriptProcessorNode
const bufferSize = 2 * ctx.sampleRate;
const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
const data = noiseBuffer.getChannelData(0);
for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
const noise = ctx.createBufferSource();
noise.buffer = noiseBuffer;
noise.loop = true;
noise.start();
```

### SuperCollider
```supercollider
// noiseType: white → WhiteNoise, pink → PinkNoise, brownian → BrownNoise
{ WhiteNoise.ar(0.5) }.play
```

### Max/MSP
```
[noise~]              // white
[pink~]               // pink (via spectral shaping)
```

### Pure Data
```
[noise~]              // white noise
```

---

## 3. `sample` — Audio File Playback

### Web Audio API
```javascript
const response = await fetch("path/to/file.wav");
const arrayBuffer = await response.arrayBuffer();
const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
const source = ctx.createBufferSource();
source.buffer = audioBuffer;
source.loop = true;   // initialValue of loop param
source.start();
```

### SuperCollider
```supercollider
b = Buffer.read(s, "path/to/file.wav");
{ PlayBuf.ar(1, b, BufRateScale.kr(b), loop: 1) }.play
```

### Max/MSP
```
[sfplay~ 1]           // mono playback
[groove~ 1]           // looping playback
```

### Pure Data
```
[readsf~ 1]           // streaming playback
[soundfiler]          // load into array, then [tabplay~]
```

---

## 4. `lfo` — Low-Frequency Oscillator (Modulation)

### Web Audio API
```javascript
const lfo = ctx.createOscillator();
lfo.type = "sine";
lfo.frequency.value = 2.5;   // rate param initialValue
const lfoGain = ctx.createGain();
lfoGain.gain.value = 100;    // amplitude scales modulation depth
lfo.connect(lfoGain);
// Connect lfoGain to any AudioParam, e.g.: lfoGain.connect(osc.frequency)
lfo.start();
```

### SuperCollider
```supercollider
// LFO modulating oscillator frequency
{ SinOsc.ar(440 + SinOsc.kr(2.5, 0, 100), 0, 0.5) }.play
```

### Max/MSP
```
[cycle~ 2.5]          // LFO signal
[*~ 100]              // scale amplitude
// connect to [frequency~] inlet of target
```

### Pure Data
```
[osc~ 2.5]            // LFO (audio rate; use [lop~] to smooth if needed)
[*~ 100]
// connect to signal inlet of frequency-controlled object
```

---

## 5. `envelope` — ADSR Envelope Generator

### Web Audio API
```javascript
// envelopeType: "ADSR" → attack, decay, sustain, release
const gainNode = ctx.createGain();
gainNode.gain.setValueAtTime(0, ctx.currentTime);
gainNode.gain.linearRampToValueAtTime(1, ctx.currentTime + 0.01);    // attack
gainNode.gain.linearRampToValueAtTime(0.7, ctx.currentTime + 0.1);   // decay→sustain
// On note-off:
gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.3);     // release
```

### SuperCollider
```supercollider
// ADSR
Env.adsr(0.01, 0.1, 0.7, 0.3).kr(2)  // gate-based
// AR
Env.ar(0.01, 0.3).kr(2)
```

### Max/MSP
```
[adsr~ 10 100 70 300]   // attack(ms) decay(ms) sustain(%) release(ms)
```

### Pure Data
```
[vline~]              // manual envelope via breakpoints
// or use [env~] for follower, [linen~] for AR
```

---

## 6. `frequency_filter` — Biquad Filter

### Web Audio API
```javascript
const filter = ctx.createBiquadFilter();
filter.type = "lowpass";    // filterType: LPF→lowpass, HPF→highpass, BPF→bandpass, Notch→notch
filter.frequency.value = 1000;   // cutoff
filter.Q.value = 1.0;            // resonance
```

### SuperCollider
```supercollider
// LPF
{ LPF.ar(in, 1000) }.play
// HPF → HPF, BPF → BPF, Notch → BRF
// resonance → RLPF.ar(in, 1000, 0.1)   (rq = 1/Q)
```

### Max/MSP
```
[biquad~]             // with coefficient objects [lores~], [hi~], [reson~]
[lores~ 1000 0.5]     // low-resonant filter: freq, resonance(0-1)
```

### Pure Data
```
[lop~ 1000]           // simple one-pole lowpass
[bp~ 1000 10]         // bandpass: freq, Q
[vcf~]                // voltage-controlled filter (more precise)
```

---

## 7. `reverb` — Reverberation

### Web Audio API
```javascript
const convolver = ctx.createConvolver();
// Load impulse response for realistic reverb, or use:
const reverb = ctx.createConvolver(); // with generated IR based on roomSize/decayTime
const dryGain = ctx.createGain(); dryGain.gain.value = 1 - 0.4; // 1 - dryWet
const wetGain = ctx.createGain(); wetGain.gain.value = 0.4;      // dryWet
```

### SuperCollider
```supercollider
{ FreeVerb.ar(in, mix: 0.4, room: 0.7, damp: 0.5) }.play
// or: GVerb.ar(in, roomsize: 10, revtime: 3)
```

### Max/MSP
```
[freeverb~]           // roomSize, damping, dryWet
[yafr2~]              // or platform reverb objects
```

### Pure Data
```
[freeverb~]           // roomsize damping wet
```

---

## 8. `delay` — Echo / Delay Line

### Web Audio API
```javascript
const delay = ctx.createDelay(5.0);  // max delay time
delay.delayTime.value = 0.5;         // delayTime param
const feedback = ctx.createGain();
feedback.gain.value = 0.4;           // feedback param
delay.connect(feedback);
feedback.connect(delay);             // feedback loop
```

### SuperCollider
```supercollider
{ var d = DelayN.ar(in, 1.0, 0.5); d + (d * 0.4) }.play
// CombN for feedback: CombN.ar(in, 1.0, 0.5, 2.0)  (decayTime)
```

### Max/MSP
```
[delay~ 22050]        // samples
[tapin~ 1000]         // ms, with [tapout~ 500]
```

### Pure Data
```
[delwrite~ mydelay 1000]   // write tap (1000ms max)
[delread~ mydelay 500]     // read tap (500ms delay)
```

---

## 9. `distortion` — Waveshaping / Saturation

### Web Audio API
```javascript
const dist = ctx.createWaveShaper();
// soft-clipping curve:
const curve = new Float32Array(256);
for (let i = 0; i < 256; i++) {
  const x = (i * 2) / 256 - 1;
  curve[i] = (Math.PI + drive * 400) * x / (Math.PI + drive * 400 * Math.abs(x));
}
dist.curve = curve;
```

### SuperCollider
```supercollider
// soft clipping
{ SoftClipAmp.ar(in, 0.8) }.play
// hard clipping
{ in.clip(-0.5, 0.5) }.play
// bitcrushing
{ Decimator.ar(in, 44100/8, 6) }.play
```

### Max/MSP
```
[overdrive~]          // soft saturation
[clip~ -0.5 0.5]      // hard clipping
[degrade~]            // bitcrusher
```

### Pure Data
```
[clip~ -0.8 0.8]      // hard clip
// soft: use [expr~ tanh($v1 * 3)]
```

---

## 10. `chorus_flanger` — Modulated Delay

### Web Audio API
```javascript
// Chorus: multiple detuned copies via delay + LFO
const delay = ctx.createDelay(0.05);
const lfo = ctx.createOscillator(); lfo.frequency.value = rate;
const lfoGain = ctx.createGain(); lfoGain.gain.value = depth * 0.005;
lfo.connect(lfoGain); lfoGain.connect(delay.delayTime);
lfo.start();
```

### SuperCollider
```supercollider
{ Chorus.ar(in, 0.02, 2.0, 0.5, 0.5) }.play   // (in, maxDelayTime, rate, depth, mix)
```

### Max/MSP
```
[chorus~]             // or use [flanger~]
```

### Pure Data
```
// Manual: [delwrite~] + [delread~ name 20] + LFO modulating read time
```

---

## 11. `compressor` — Dynamic Range Compression

### Web Audio API
```javascript
const comp = ctx.createDynamicsCompressor();
comp.threshold.value = -24;   // threshold (dB)
comp.ratio.value = 4;         // ratio
comp.attack.value = 0.003;    // attack (s)
comp.release.value = 0.25;    // release (s)
comp.knee.value = 30;         // soft knee
```

### SuperCollider
```supercollider
{ Compander.ar(in, in, thresh: 0.5, slopeBelow: 1, slopeAbove: 0.25, clampTime: 0.01, relaxTime: 0.1) }.play
```

### Max/MSP
```
[omx.comp~]           // professional compressor object
[compress~]           // simpler version
```

### Pure Data
```
// No native; implement with [env~] (envelope follower) + [*~] gain control
```

---

## 12. `equalizer` — Parametric EQ Band

### Web Audio API
```javascript
const eq = ctx.createBiquadFilter();
eq.type = "peaking";
eq.frequency.value = 1000;    // bandFrequency
eq.Q.value = 1.0;             // bandwidth → Q
eq.gain.value = 3;            // gain (dB)
```

### SuperCollider
```supercollider
{ MidEQ.ar(in, 1000, 0.5, 3) }.play  // freq, rq, db
```

### Max/MSP
```
[biquad~]             // with peaking coefficients from [equalizer~]
[peq~]                // parametric EQ
```

### Pure Data
```
[bp~ 1000 1.0]        // bandpass as EQ band approximation
```

---

## 13. `mixer` — N-input Audio Summing Bus

### Web Audio API
```javascript
// Each input connects to a shared GainNode acting as bus
const bus = ctx.createGain();
bus.gain.value = 1.0 / inputCount;  // normalize
source1.connect(bus);
source2.connect(bus);
// ... up to 10 inputs
bus.connect(ctx.destination);
```

### SuperCollider
```supercollider
{ Mix.ar([in1, in2, in3]) }.play
// or with Bus:
// MixerChannel in JITLib
```

### Max/MSP
```
[+~]                   // two inputs; chain for more
[gain~]                // with multiple inlets after [dspstate~]
```

### Pure Data
```
[+~]                   // chain multiple [+~] objects for N inputs
```

---

## 14. `gain_pan` — Amplitude and Panning

### Web Audio API
```javascript
const gainNode = ctx.createGain();
gainNode.gain.value = 0.8;       // gain param
const panner = ctx.createStereoPanner();
panner.pan.value = -0.5;         // pan param (-1 left, +1 right)
source.connect(gainNode).connect(panner).connect(ctx.destination);
```

### SuperCollider
```supercollider
{ Pan2.ar(in * 0.8, -0.5) }.play  // (signal * gain, pan)
```

### Max/MSP
```
[*~ 0.8]              // gain
[pan~]                // stereo panning: [pan~ 0.25]  (0=left, 0.5=center, 1=right)
```

### Pure Data
```
[*~ 0.8]
[pan~]                // from cyclone library, same convention as Max
```

---

*This file was auto-generated by the MDA-Audio AI Export system.*
