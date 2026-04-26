<template>
  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-full h-full drop-shadow-sm">
    <!-- Main Frame (slightly irregular for sketch look) -->
    <path d="M12 15 L85 14 L88 85 L15 88 Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
    <path d="M14 17 L83 16 L86 83 L17 86 Z" stroke="currentColor" stroke-width="0.5" opacity="0.3" />
    
    <!-- Panels -->
    <path d="M12 50 L88 48" stroke="currentColor" stroke-width="1" opacity="0.6" />
    <path d="M50 15 L48 85" stroke="currentColor" stroke-width="1" opacity="0.6" />
    
    <!-- Knobs and dials (Sketch style) -->
    <g opacity="0.8">
      <!-- Top Left Panel -->
      <circle cx="25" cy="28" r="6" stroke="currentColor" stroke-width="1.2" />
      <path d="M25 28 L30 23" stroke="currentColor" stroke-width="1.5" /> <!-- Marker -->
      
      <circle cx="40" cy="35" r="3" stroke="currentColor" stroke-width="1" />
      <circle cx="25" cy="42" r="3" stroke="currentColor" stroke-width="1" />
      
      <!-- Top Right Panel -->
      <rect x="65" y="22" width="6" height="12" rx="1" stroke="currentColor" stroke-width="1" />
      <rect x="75" y="22" width="6" height="12" rx="1" stroke="currentColor" stroke-width="1" />
      <path d="M68 28 L72 28" stroke="currentColor" stroke-width="1" />
      
      <!-- Bottom Panels -->
      <path d="M20 60 L40 60 L40 75 L20 75 Z" stroke="currentColor" stroke-width="1" />
      <circle cx="30" cy="67" r="4" stroke="currentColor" stroke-width="1" />
      
      <path d="M60 65 Q 75 60 85 70" stroke="currentColor" stroke-width="1.2" /> <!-- Waveform sketch -->
    </g>
    
    <!-- Patch Cables (The "soul" of the modular synth) -->
    <path d="M30 42 Q 55 65 78 30" stroke="currentColor" stroke-width="0.8" stroke-dasharray="2 2" opacity="0.5" />
    <path d="M25 45 Q 10 95 65 70" stroke="currentColor" stroke-width="0.8" stroke-dasharray="3 2" opacity="0.4" />
    
    <!-- Detail hatching -->
    <path d="M85 15 L90 18 M88 48 L93 51 M90 85 L95 88" stroke="currentColor" stroke-width="0.5" opacity="0.3" />
  </svg>
</template>

<script setup lang="ts">
// Componente de icono de sintetizador estilo boceto arquitectónico
</script>
