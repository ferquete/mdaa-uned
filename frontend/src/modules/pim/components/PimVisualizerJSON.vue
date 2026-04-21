<script setup lang="ts">
import BaseDiffEditor from '@/shared/components/editors/BaseDiffEditor.vue'
import BaseJSONEditor from '@/shared/components/editors/BaseJSONEditor.vue'
import { useUnsavedChanges } from '@/shared/composables/useUnsavedChanges'
import { computed, ref, watch } from 'vue'
import { usePimStore } from '../stores/pimStore'
import { useAnalysisMachinesStore } from '@/modules/analysis/stores/analysisMachinesStore'
import { PIM_MACHINE_SCHEMA } from '../utils/pim-machine-schema'
import { PIM_RELATIONS_SCHEMA } from '../utils/pim-relations-schema'

const store = usePimStore()
const analysisStore = useAnalysisMachinesStore()
const localJson = ref('')
const isSyntaxValid = ref(true)
const businessErrors = ref<any[]>([])
const schemaMarkers = ref<any[]>([])
const isSaving = ref(false)
const saveMessage = ref('')
const isDiffEnabled = ref(false)

const isMachineView = computed(() => store.selectedMachine !== null)

const editorPath = computed(() => {
  if (isMachineView.value) return `pim-machine-${store.selectedMachine?.id}.json`
  return 'pim-relations.json'
})

const originalJsonStr = computed(() => {
  if (isMachineView.value) {
    return store.selectedMachine?.machine || '{}'
  }
  return store.currentPim?.machinesRelations || '{}'
})

const originalPrettyJson = computed(() => {
  try {
    const parsed = JSON.parse(originalJsonStr.value)
    return JSON.stringify(parsed, null, 2)
  } catch (e) {
    return originalJsonStr.value
  }
})

const currentSchema = computed(() => {
  return isMachineView.value ? PIM_MACHINE_SCHEMA : PIM_RELATIONS_SCHEMA
})

const { setUnsavedState, clearUnsavedState } = useUnsavedChanges()

const errors = computed(() => {
  const errs: any[] = []
  if (!isSyntaxValid.value) errs.push({ message: 'Error de sintaxis JSON' })
  businessErrors.value.forEach(e => errs.push(e))
  
  // Añadir errores de esquema (Monaco severity >= 3 captura Advertencias y Errores)
  schemaMarkers.value.forEach(m => {
    if (m.severity >= 3) {
      errs.push({ message: `${m.message} (línea ${m.startLineNumber})` })
    }
  })
  
  return errs
})

const isValid = computed(() => errors.value.length === 0)

const validateInternal = (val: string) => {
  try {
    const parsed = JSON.parse(val)
    isSyntaxValid.value = true
    const manualErrors: any[] = []
    const activeCimElements = new Set<string>()
    const activeCimConnections = new Set<string>()
    
    // 1. Verificación de Referencias CIM (Integridad Referencial)
    const availableCimDocIds = new Set<string>()
    const allCimElementIds = new Set<string>()

    // Recopilar IDs de máquinas CIM disponibles y sus elementos
    analysisStore.machines.forEach(m => {
      const doc = analysisStore.parsedDocs[m.id]
      if (doc?.id) {
        availableCimDocIds.add(doc.id)
        doc.elements?.forEach((e: any) => {
          if (e.id) allCimElementIds.add(e.id)
        })
      }
    })

    if (isMachineView.value) {
      // Validar tipos de nodos
      const validNodeTypes = [
        'oscillator', 'noise', 'sample', 
        'lfo', 'envelope', 
        'frequency_filter', 'reverb', 'delay', 'distortion', 'chorus_flanger', 'compressor', 'equalizer',
        'mixer', 'gain_pan'
      ]

      // Mapa de parámetros obligatorios por tipo (incluyendo CP)
      const NODE_REQUIREMENTS: Record<string, string[]> = {
        oscillator: ['waveform', 'frequency', 'pulseWidth', 'gain', 'phase', 'pan', 'stereo', 'output_1'],
        noise: ['noiseType', 'amplitude', 'gain', 'pan', 'stereo', 'output_1'],
        sample: ['file', 'loop', 'gain', 'pan', 'stereo', 'output_1'],
        lfo: ['waveform', 'rate', 'amplitude', 'phase', 'sync', 'output'],
        envelope: ['envelopeType', 'attack', 'decay', 'sustain', 'release', 'delay', 'hold', 'curve', 'output'],
        frequency_filter: ['filterType', 'cutoff', 'resonance', 'slope', 'stereo', 'input_1', 'output_1'],
        reverb: ['roomSize', 'damping', 'decayTime', 'dryWet', 'stereo', 'input_1', 'output_1'],
        delay: ['delayTime', 'feedback', 'lowPassCutoff', 'highPassCutoff', 'dryWet', 'stereo', 'input_1', 'output_1'],
        distortion: ['drive', 'tone', 'distType', 'outputLevel', 'stereo', 'input_1', 'output_1'],
        chorus_flanger: ['rate', 'depth', 'feedback', 'mix', 'stereo', 'input_1', 'output_1'],
        compressor: ['threshold', 'ratio', 'attack', 'release', 'makeupGain', 'stereo', 'input_1', 'output_1'],
        equalizer: ['bandFrequency', 'bandwidth', 'gain', 'stereo', 'input_1', 'output_1'],
        mixer: ['stereo', 'inputs_number', 'output_1'],
        gain_pan: ['gain', 'pan', 'stereo', 'input_1', 'output_1']
      }

      parsed.nodes?.forEach((node: any, idx: number) => {
        if (!node.type) {
          manualErrors.push({ message: `Nodo ${idx}: Falta el campo "type"` })
          return
        }
        
        if (!validNodeTypes.includes(node.type)) {
          manualErrors.push({ message: `Nodo ${idx}: Tipo "${node.type}" no válido.` })
          return
        }

        // Validar parámetros obligatorios base para el tipo
        const reqs = NODE_REQUIREMENTS[node.type] || []
        reqs.forEach(param => {
          if (!node[param]) manualErrors.push({ message: `Nodo ${idx} (${node.type}): Falta el parámetro obligatorio "${param}"` })
        })

        // Validación dinámica de Stereo
        if (node.stereo) {
          const isStereo = node.stereo.initialValue === true || node.stereo.initialValue === 'true'
          
          if (isStereo) {
            // Requiere output_2
            if (!node.output_2) manualErrors.push({ message: `Nodo ${idx} (${node.type}): En modo stereo falta "output_2"` })
            if (['frequency_filter', 'reverb', 'delay', 'distortion', 'chorus_flanger', 'compressor', 'equalizer', 'mixer', 'gain_pan'].includes(node.type)) {
              if (!node.input_2 && !['mixer', 'gain_pan'].includes(node.type)) manualErrors.push({ message: `Nodo ${idx} (${node.type}): En modo stereo falta "input_2"` })
            }
          } else {
            // Mono: No debe tener output_2
            if (node.output_2) manualErrors.push({ message: `Nodo ${idx} (${node.type}): En modo mono no debe existir "output_2"` })
            if (node.input_2) manualErrors.push({ message: `Nodo ${idx} (${node.type}): En modo mono no debe existir "input_2"` })
          }
        }

        // Restricción especial para 'stereo'
        if (node.stereo) {
            if (node.stereo.isModifiable === true) {
                manualErrors.push({ message: `Negocio: El parámetro 'stereo' del nodo '${node.name}' no puede ser modulable.` })
            }
            if (node.stereo.isExternalInput === true) {
                manualErrors.push({ message: `Negocio: El parámetro 'stereo' del nodo '${node.name}' no puede ser una entrada externa.` })
            }
        }
        
        // Validar isModifiable en todos los objetos que parecen parámetros
        // EXCEPTO stereo (estructural), puertos de audio y campos de sistema
        Object.keys(node).forEach(key => {
          const val = node[key]
          
          // Saltamos metadatos y campos de sistema
          if (['id', 'name', 'description', 'type', 'ids_references', 'others', 'stereo'].includes(key)) return
          
          // Saltamos puertos de audio (input_X, output_X)
          if (key.startsWith('input_') || key.startsWith('output_') || key === 'output' || key === 'inputs_number') return

          // Si es un objeto (parámetro de audio real), debe tener isModifiable
          if (val && typeof val === 'object' && !Array.isArray(val)) {
            if (val.isModifiable === undefined) {
              manualErrors.push({ message: `Restricción PIM: Al parámetro "${key}" le falta la propiedad "isModifiable". (Nodo: ${node.name || idx})` })
            }
          }
        })
        
        // --- Validación de Rangos Numéricos ---
        const checkRange = (paramName: string, min: number, max?: number) => {
          const val = node[paramName]?.initialValue
          if (val === undefined || val === null || val === '') return
          const num = Number(val)
          if (isNaN(num)) return

          if (num < min) {
            manualErrors.push({ message: `Nodo ${idx} (${node.type}): "${paramName}" debe ser >= ${min}` })
          }
          if (max !== undefined && num > max) {
            manualErrors.push({ message: `Nodo ${idx} (${node.type}): "${paramName}" debe ser <= ${max}` })
          }
        }

        if (node.type === 'oscillator') {
          checkRange('frequency', 0, 20000)
          checkRange('pulseWidth', 0, 1)
          checkRange('gain', 0, 1)
          checkRange('phase', 0, 6.2831853)
          checkRange('pan', -1, 1)
        } else if (node.type === 'noise') {
          checkRange('amplitude', 0, 1)
          checkRange('gain', 0, 1)
          checkRange('pan', -1, 1)
        } else if (node.type === 'sample') {
          checkRange('gain', 0, 1)
          checkRange('pan', -1, 1)
        } else if (node.type === 'lfo') {
          checkRange('rate', 0.01, 50)
          checkRange('amplitude', 0, 1)
          checkRange('phase', 0, 360)
        } else if (node.type === 'envelope') {
          checkRange('attack', 0)
          checkRange('decay', 0)
          checkRange('sustain', 0, 1)
          checkRange('release', 0)
          checkRange('delay', 0)
          checkRange('hold', 0)
        } else if (node.type === 'frequency_filter') {
          checkRange('cutoff', 20, 20000)
          checkRange('resonance', 0, 10)
        } else if (node.type === 'reverb') {
          checkRange('roomSize', 0, 1)
          checkRange('damping', 0, 1)
          checkRange('decayTime', 0)
          checkRange('dryWet', 0, 1)
        } else if (node.type === 'delay') {
          checkRange('delayTime', 0)
          checkRange('feedback', 0, 1)
          checkRange('lowPassCutoff', 20, 20000)
          checkRange('highPassCutoff', 20, 20000)
          checkRange('dryWet', 0, 1)
        } else if (node.type === 'distortion') {
          checkRange('drive', 0, 1)
          checkRange('tone', 0, 1)
          checkRange('outputLevel', 0, 1)
        } else if (node.type === 'chorus_flanger') {
          checkRange('rate', 0)
          checkRange('depth', 0, 1)
          checkRange('feedback', 0, 1)
          checkRange('mix', 0, 1)
        } else if (node.type === 'compressor') {
          checkRange('attack', 0)
          checkRange('release', 0)
          checkRange('ratio', 1)
          checkRange('makeupGain', 0)
        } else if (node.type === 'equalizer') {
          checkRange('bandFrequency', 20, 20000)
          checkRange('bandwidth', 0)
        } else if (node.type === 'mixer') {
          checkRange('inputs_number', 1, 10)
        } else if (node.type === 'gain_pan') {
          checkRange('gain', 0, 1)
          checkRange('pan', -1, 1)
        }

        // Validación dinámica de Mixer Inputs
        if (node.type === 'mixer' && node.inputs_number) {
          const num = Number(node.inputs_number.initialValue)
          if (!isNaN(num)) {
            for (let i = 1; i <= num; i++) {
              if (!node[`input_${i}`]) manualErrors.push({ message: `Mixer ${idx}: Falta "input_${i}" (requerido por inputs_number=${num})` })
            }
            for (let i = num + 1; i <= 10; i++) {
              if (node[`input_${i}`]) manualErrors.push({ message: `Mixer ${idx}: No debe existir "input_${i}" (inputs_number=${num})` })
            }
          }
        }
      })

      // Validar ids_cim_reference: deben ser IDs de máquinas CIM reales
      const referencedCimIds = parsed.ids_cim_reference || []
      
      referencedCimIds.forEach((cimId: string) => {
        if (!availableCimDocIds.has(cimId)) {
          manualErrors.push({ message: `Negocio: La máquina CIM '${cimId}' no existe en el proyecto.` })
        } else {
          // Si la máquina existe, indexar sus elementos y conexiones
          analysisStore.machines.forEach(m => {
            const doc = analysisStore.parsedDocs[m.id]
            if (doc?.id === cimId) {
              doc.elements?.forEach((e: any) => {
                activeCimElements.add(e.id)
                e.sendTo?.forEach((s: any) => activeCimConnections.add(s.id))
              })
            }
          })
        }
      })

      // Validar ids_references recursivamente: deben estar en el "universo" de las máquinas vinculadas
      const checkCimRefs = (obj: any, path: string) => {
        if (!obj || typeof obj !== 'object') return
        
        if (Array.isArray(obj.ids_references)) {
          obj.ids_references.forEach((refId: string) => {
            if (refId && !activeCimElements.has(refId)) {
              manualErrors.push({ message: `Negocio: El elemento CIM '${refId}' no pertenece a las máquinas vinculadas en ids_cim_reference.` })
            }
          })
        }

        Object.entries(obj).forEach(([key, val]) => {
          if (key !== 'ids_references') checkCimRefs(val, `${path}.${key}`)
        })
      }
      checkCimRefs(parsed, 'root')

    } else {
      // Validación de Relaciones PIM
      const availablePimDocIds = new Set<string>()
      Object.values(store.parsedDocs).forEach(doc => {
        if (doc.id) availablePimDocIds.add(doc.id)
      })

      // Validar que source y destination apunten a algo válido
      parsed.relations?.forEach((rel: any, idx: number) => {
        if (rel.source && rel.source.length !== 36) manualErrors.push({ message: `Relación ${idx}: ID origen inválido` })
        if (rel.destination && rel.destination.length !== 36) manualErrors.push({ message: `Relación ${idx}: ID destino inválido` })
        
        // El validador de relaciones PIM no tiene el 'type' de la arista del editor visual,
        // pero el validador cruzado de validate.ts sí podrá hacerlo.
      })

      // Validar tipos de referencia en Edges (si estamos en vista de máquina PIM técnica)
      if (parsed.edges) {
        parsed.edges.forEach((edge: any, idx: number) => {
          (edge.ids_references || []).forEach((refId: string) => {
            if (edge.type === 'audio') {
              if (activeCimElements.has(refId) && !activeCimConnections.has(refId)) {
                manualErrors.push({ message: `Arista ${idx} (audio): '${refId}' es un elemento, pero las señales audio deben referenciar conexiones conceptuales.` })
              }
            } else if (edge.type === 'modification') {
              if (activeCimConnections.has(refId) && !activeCimElements.has(refId)) {
                manualErrors.push({ message: `Arista ${idx} (mod): '${refId}' es una conexión, pero las modulaciones deben referenciar elementos conceptuales.` })
              }
            }
          })
        })
      }
    }
    
    businessErrors.value = manualErrors
  } catch (e: any) {
    isSyntaxValid.value = false
    businessErrors.value = [{ message: `Error de sintaxis: ${e.message}` }]
  }
}

const handleValidationChange = (markers: any[]) => {
  schemaMarkers.value = markers
}

// Watcher para detectar cambio de nodo o carga inicial
watch(originalJsonStr, (newVal) => {
  if (newVal === undefined) return
  try {
    const parsed = JSON.parse(newVal || '{}')
    
    // Asegurar que name esté presente si es una máquina y falta
    const machine = store.selectedMachine
    if (machine && !parsed.name) {
      parsed.name = machine.name
    }
    
    localJson.value = JSON.stringify(parsed, null, 2)
  } catch (e) {
    localJson.value = newVal || ''
  }
  
  // Limpiar marcadores ANTES de validar para evitar ruido visual de la selección previa
  schemaMarkers.value = []
  validateInternal(localJson.value)
  clearUnsavedState()
}, { immediate: true })

const isDirty = computed(() => {
  if (!localJson.value) return false
  const currentClean = localJson.value.replace(/\s/g, '')
  const originalClean = originalJsonStr.value.replace(/\s/g, '')
  return currentClean !== originalClean
})

watch([isDirty, isValid], () => {
  if ((!store.currentPim && !isMachineView.value) || isSaving.value) return
  
  if (isDirty.value) {
    setUnsavedState(true, isValid.value, async () => {
      await handleSave()
      return true
    })
  } else {
    clearUnsavedState()
  }
})

const handleSave = async () => {
  if (!isValid.value) return
  if (!store.currentPim && !isMachineView.value) return

  isSaving.value = true
  let result;
  
  if (isMachineView.value) {
    result = await store.updateMachineRawJson(store.selectedMachine!.id, localJson.value)
  } else {
    result = await store.updatePimRelations(localJson.value)
  }
  
  isSaving.value = false
  if (result.success) {
    saveMessage.value = 'Guardado con éxito'
    clearUnsavedState()
    setTimeout(() => saveMessage.value = '', 3000)
    isDiffEnabled.value = false
  } else {
    saveMessage.value = 'Error: ' + result.message
  }
}
</script>

<template>
  <div class="pim-visualizer-json h-full flex flex-col bg-geist-bg">
    <!-- Header -->
    <div class="flex items-center justify-between px-6 py-3 border-b border-geist-border bg-geist-accents-1/20">
      <div class="flex items-center gap-3">
        <div class="w-8 h-8 rounded-lg bg-geist-fg/5 flex items-center justify-center text-geist-accents-4 border border-geist-border">
          <i class="fa-solid fa-code text-sm"></i>
        </div>
        <div class="flex flex-col">
          <span class="text-[9px] uppercase font-bold tracking-widest text-geist-accents-5">Editor JSON</span>
          <span class="text-[10px] font-mono text-geist-accents-4">{{ isMachineView ? 'Máquina' : 'Relaciones' }}</span>
        </div>
      </div>
      
      <div class="flex items-center gap-4">
        <span v-if="saveMessage" class="text-[10px] font-mono" :class="saveMessage.includes('Error') ? 'text-geist-error' : 'text-geist-success'">{{ saveMessage }}</span>
        
        <button 
          @click="isDiffEnabled = !isDiffEnabled"
          class="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-geist-border bg-geist-bg text-[10px] uppercase font-bold text-geist-accents-5 hover:text-geist-fg transition-all"
          :class="{ 'bg-geist-accents-2 text-geist-fg': isDiffEnabled }"
        >
          <i class="fa-solid fa-code-compare"></i>
          {{ isDiffEnabled ? 'Editor' : 'Comparar' }}
        </button>

        <button 
          @click="handleSave"
          :disabled="!isValid || isSaving || !isDirty"
          class="geist-button-primary !px-6 !py-2 gap-2 text-[10px] font-bold uppercase transition-all shadow-sm"
          :class="{ 'opacity-50 grayscale cursor-not-allowed': !isValid || isSaving || !isDirty }"
        >
          <i class="fa-solid" :class="isSaving ? 'fa-spinner fa-spin' : 'fa-floppy-disk'"></i>
          {{ isSaving ? 'Guardando...' : 'Aplicar Cambios' }}
        </button>
      </div>
    </div>

    <!-- Editor -->
    <div class="flex-1 min-h-0 relative">
      <BaseJSONEditor 
        v-if="!isDiffEnabled"
        v-model="localJson"
        :schema="currentSchema"
        :path="editorPath"
        @change="validateInternal"
        @validation-change="handleValidationChange"
      />
      <div v-else class="w-full h-full">
        <BaseDiffEditor 
          :original="originalPrettyJson" 
          :modified="localJson" 
        />
      </div>
    </div>

    <!-- Errors -->
    <div v-if="errors.length > 0" class="bg-geist-error/5 border-t border-geist-error/20 p-3 px-6 animate-in slide-in-from-bottom-2">
      <div class="flex items-start gap-4">
        <i class="fa-solid fa-circle-exclamation text-geist-error mt-0.5"></i>
        <div class="flex-1 overflow-hidden">
          <p class="text-[10px] font-bold text-geist-error uppercase tracking-widest mb-1">Errores de Validación</p>
          <div class="flex flex-wrap gap-x-4 gap-y-1">
            <div v-for="(err, idx) in errors.slice(0, 5)" :key="idx" class="flex items-center gap-2">
              <span class="text-[10px] font-mono text-geist-error">{{ err.message }}</span>
            </div>
            <span v-if="errors.length > 5" class="text-[10px] font-mono text-geist-error opacity-60">...y {{ errors.length - 5 }} más</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
