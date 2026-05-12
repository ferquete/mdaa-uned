# Drum Machine Synthesizer

Sintetizador de percusion modular que emula los elementos clasicos de una caja de ritmos electronica. El sistema genera sonidos de bombo, caja, hi-hat y percusion abierta mediante osciladores de corta duracion, ruido filtrado y envolventes percusivas rapidas. Cada voz percusiva es una maquina independiente procesada por un mezclador maestro con compresion final.

Bloques clave:
- **Kick Drum**: Oscilador sinusoidal con pitch-drop rapido y envolvente percusiva.
- **Snare Drum**: Mezcla de oscilador y ruido blanco con envolvente snap.
- **Drum Mixer**: Mezclador y compresor maestro de percusion.
