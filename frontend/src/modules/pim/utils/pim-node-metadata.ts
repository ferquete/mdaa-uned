/**
 * Metadata de los nodos PIM para el editor visual.
 * Define iconos, categorías y puertos de conexión.
 */

export interface PimNodePort {
  id: string;
  name: string;
  type: 'audio' | 'modification';
  position: 'left' | 'right' | 'top' | 'bottom';
  isInput: boolean;
}

export interface PimNodeTypeMetadata {
  type: string;
  label: string;
  icon: string;
  colorClass: string;
  category: string;
  inputs: PimNodePort[];
  outputs: PimNodePort[];
}

export const PIM_NODE_METADATA: Record<string, PimNodeTypeMetadata> = {
  // Generadores
  oscillator: {
    type: 'oscillator',
    label: 'Oscilador',
    icon: 'fa-wave-square',
    colorClass: 'text-node-generator',
    category: 'Generadores',
    inputs: [],
    outputs: [
      { id: 'output_1', name: 'Out 1', type: 'audio', position: 'right', isInput: false },
      { id: 'output_2', name: 'Out 2 (Stereo)', type: 'audio', position: 'right', isInput: false }
    ]
  },
  noise: {
    type: 'noise',
    label: 'Ruido',
    icon: 'fa-braille',
    colorClass: 'text-node-generator',
    category: 'Generadores',
    inputs: [],
    outputs: [
      { id: 'output_1', name: 'Out 1', type: 'audio', position: 'right', isInput: false },
      { id: 'output_2', name: 'Out 2 (Stereo)', type: 'audio', position: 'right', isInput: false }
    ]
  },
  sample: {
    type: 'sample',
    label: 'Sample',
    icon: 'fa-file-audio',
    colorClass: 'text-node-generator',
    category: 'Generadores',
    inputs: [],
    outputs: [
      { id: 'output_1', name: 'Out 1', type: 'audio', position: 'right', isInput: false },
      { id: 'output_2', name: 'Out 2 (Stereo)', type: 'audio', position: 'right', isInput: false }
    ]
  },

  // Modificadores de Parámetros
  lfo: {
    type: 'lfo',
    label: 'LFO',
    icon: 'fa-signature',
    colorClass: 'text-node-modificator',
    category: 'Modificadores',
    inputs: [],
    outputs: [
      { id: 'output', name: 'Mod Out', type: 'modification', position: 'right', isInput: false }
    ]
  },
  envelope: {
    type: 'envelope',
    label: 'Envolvente',
    icon: 'fa-chart-line',
    colorClass: 'text-node-modificator',
    category: 'Modificadores',
    inputs: [],
    outputs: [
      { id: 'output', name: 'Mod Out', type: 'modification', position: 'right', isInput: false }
    ]
  },

  // Modificadores de Sonido (Efectos)
  frequency_filter: {
    type: 'frequency_filter',
    label: 'Filtro',
    icon: 'fa-filter',
    colorClass: 'text-geist-success',
    category: 'Efectos',
    inputs: [
      { id: 'input_1', name: 'In 1', type: 'audio', position: 'left', isInput: true },
      { id: 'input_2', name: 'In 2 (Stereo)', type: 'audio', position: 'left', isInput: true }
    ],
    outputs: [
      { id: 'output_1', name: 'Out 1', type: 'audio', position: 'right', isInput: false },
      { id: 'output_2', name: 'Out 2 (Stereo)', type: 'audio', position: 'right', isInput: false }
    ]
  },
  reverb: {
    type: 'reverb',
    label: 'Reverb',
    icon: 'fa-water',
    colorClass: 'text-geist-success',
    category: 'Efectos',
    inputs: [
      { id: 'input_1', name: 'In 1', type: 'audio', position: 'left', isInput: true },
      { id: 'input_2', name: 'In 2 (Stereo)', type: 'audio', position: 'left', isInput: true }
    ],
    outputs: [
      { id: 'output_1', name: 'Out 1', type: 'audio', position: 'right', isInput: false },
      { id: 'output_2', name: 'Out 2 (Stereo)', type: 'audio', position: 'right', isInput: false }
    ]
  },
  delay: {
    type: 'delay',
    label: 'Delay',
    icon: 'fa-clock-rotate-left',
    colorClass: 'text-geist-success',
    category: 'Efectos',
    inputs: [
      { id: 'input_1', name: 'In 1', type: 'audio', position: 'left', isInput: true },
      { id: 'input_2', name: 'In 2 (Stereo)', type: 'audio', position: 'left', isInput: true }
    ],
    outputs: [
      { id: 'output_1', name: 'Out 1', type: 'audio', position: 'right', isInput: false },
      { id: 'output_2', name: 'Out 2 (Stereo)', type: 'audio', position: 'right', isInput: false }
    ]
  },
  distortion: {
    type: 'distortion',
    label: 'Distorsión',
    icon: 'fa-bolt',
    colorClass: 'text-geist-success',
    category: 'Efectos',
    inputs: [
      { id: 'input_1', name: 'In 1', type: 'audio', position: 'left', isInput: true },
      { id: 'input_2', name: 'In 2 (Stereo)', type: 'audio', position: 'left', isInput: true }
    ],
    outputs: [
      { id: 'output_1', name: 'Out 1', type: 'audio', position: 'right', isInput: false },
      { id: 'output_2', name: 'Out 2 (Stereo)', type: 'audio', position: 'right', isInput: false }
    ]
  },
  chorus_flanger: {
    type: 'chorus_flanger',
    label: 'Chorus/Flanger',
    icon: 'fa-users',
    colorClass: 'text-geist-success',
    category: 'Efectos',
    inputs: [
      { id: 'input_1', name: 'In 1', type: 'audio', position: 'left', isInput: true },
      { id: 'input_2', name: 'In 2 (Stereo)', type: 'audio', position: 'left', isInput: true }
    ],
    outputs: [
      { id: 'output_1', name: 'Out 1', type: 'audio', position: 'right', isInput: false },
      { id: 'output_2', name: 'Out 2 (Stereo)', type: 'audio', position: 'right', isInput: false }
    ]
  },
  compressor: {
    type: 'compressor',
    label: 'Compresor',
    icon: 'fa-arrows-to-dot',
    colorClass: 'text-geist-success',
    category: 'Efectos',
    inputs: [
      { id: 'input_1', name: 'In 1', type: 'audio', position: 'left', isInput: true },
      { id: 'input_2', name: 'In 2 (Stereo)', type: 'audio', position: 'left', isInput: true }
    ],
    outputs: [
      { id: 'output_1', name: 'Out 1', type: 'audio', position: 'right', isInput: false },
      { id: 'output_2', name: 'Out 2 (Stereo)', type: 'audio', position: 'right', isInput: false }
    ]
  },
  equalizer: {
    type: 'equalizer',
    label: 'Ecualizador',
    icon: 'fa-sliders',
    colorClass: 'text-geist-success',
    category: 'Efectos',
    inputs: [
      { id: 'input_1', name: 'In 1', type: 'audio', position: 'left', isInput: true },
      { id: 'input_2', name: 'In 2 (Stereo)', type: 'audio', position: 'left', isInput: true }
    ],
    outputs: [
      { id: 'output_1', name: 'Out 1', type: 'audio', position: 'right', isInput: false },
      { id: 'output_2', name: 'Out 2 (Stereo)', type: 'audio', position: 'right', isInput: false }
    ]
  },

  // Mezcla
  mixer: {
    type: 'mixer',
    label: 'Mezclador',
    icon: 'fa-blender',
    colorClass: 'text-node-rel',
    category: 'Mezcla',
    inputs: Array.from({ length: 10 }, (_, i) => ({
      id: `input_${i + 1}`,
      name: `Input ${i + 1}`,
      type: 'audio',
      position: 'left',
      isInput: true
    })),
    outputs: [
      { id: 'output_1', name: 'Out L', type: 'audio', position: 'right', isInput: false },
      { id: 'output_2', name: 'Out R', type: 'audio', position: 'right', isInput: false }
    ]
  },
  gain_pan: {
    type: 'gain_pan',
    label: 'Ganancia/Pan',
    icon: 'fa-left-right',
    colorClass: 'text-node-rel',
    category: 'Mezcla',
    inputs: [
      { id: 'input_1', name: 'Input', type: 'audio', position: 'left', isInput: true }
    ],
    outputs: [
      { id: 'output_1', name: 'Out L', type: 'audio', position: 'right', isInput: false },
      { id: 'output_2', name: 'Out R', type: 'audio', position: 'right', isInput: false }
    ]
  }
};

/**
 * Mapa de parámetros modifiables por tipo de nodo.
 * Estos generarán puertos de entrada (Handles) de tipo 'modification' (verdes).
 */
export const PIM_MODIFIABLE_PARAMS: Record<string, string[]> = {
  oscillator: ['frequency', 'gain', 'pan'],
  noise: ['amplitude', 'gain', 'pan'],
  sample: ['gain', 'pan'],
  lfo: ['rate', 'amplitude'],
  envelope: ['attack', 'decay', 'sustain', 'release'],
  frequency_filter: ['cutoff', 'resonance'],
  reverb: ['roomSize', 'dryWet'],
  delay: ['delayTime', 'feedback', 'dryWet'],
  distortion: ['drive', 'outputLevel'],
  chorus_flanger: ['rate', 'depth', 'mix'],
  compressor: ['threshold', 'makeupGain'],
  equalizer: ['gain'],
  gain_pan: ['gain', 'pan']
};
