<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { VueMonacoEditor, useMonaco } from '@guolao/vue-monaco-editor'
import { useProjectStore } from '@/modules/projects/stores/projectStore'
import { useUnsavedChanges } from '@/shared/composables/useUnsavedChanges'
import type { editor, MarkerSeverity } from 'monaco-editor'

const props = defineProps<{
  machine: any
}>()

const store = useProjectStore()
const { setUnsavedState, clearUnsavedState } = useUnsavedChanges()
const { monacoRef } = useMonaco()

const code = ref('')
const isSaving = ref(false)
const saveMessage = ref('')
const hasSyntaxErrors = ref(false)
const customErrors = ref<string[]>([])

const isContentValid = computed(() => !hasSyntaxErrors.value && customErrors.value.length === 0)

// Helper: generar JSON schema baseado en Reglas Langium
const baseNodeProps = {
  id: { type: "string", minLength: 1, maxLength: 30, description: "ID único de la máquina (1-30 chars)" },
  name: { type: "string", minLength: 1, maxLength: 20, description: "Nombre visual (1-20 chars)" },
  description: { type: "string", minLength: 10, maxLength: 300, description: "Descripción detallada (10-300 chars)" },
  inputs: { type: "string", minLength: 10, maxLength: 300 },
  outputs: { type: "string", minLength: 10, maxLength: 300 },
  params: { type: "string", minLength: 10, maxLength: 300 }
}

const refProp = {
  type: "array",
  items: {
    type: "object",
    properties: {
      id: { type: "string" },
      description: { type: "string", minLength: 10, maxLength: 300 }
    },
    required: ["id", "description"]
  }
}

const cimSchema = {
  type: "object",
  properties: {
    $type: { type: "string" },
    generators: {
      type: "array",
      items: {
        type: "object",
        properties: {
          $type: { type: "string" },
          ...baseNodeProps,
          refs: refProp,
          rels: refProp
        },
        required: ["id", "name", "description", "inputs", "outputs", "params"]
      }
    },
    modificators: {
      type: "array",
      items: {
        type: "object",
        properties: {
          $type: { type: "string" },
          ...baseNodeProps,
          refs: refProp
        },
        required: ["id", "name", "description", "inputs", "outputs", "params"]
      }
    }
  }
}

const editorTheme = ref('vs')
let themeObserver: MutationObserver | null = null

let isInitializing = false

onMounted(() => {
  isInitializing = true
  // Indentación por defecto al deserializar para que sea más legible
  const parsed = typeof props.machine.machine === 'string' 
    ? JSON.parse(props.machine.machine || '{}') 
    : props.machine.machine
    
  code.value = JSON.stringify(parsed, null, 2)
  clearUnsavedState()
  setTimeout(() => { isInitializing = false }, 100)

  // Observador dinámico de tema
  const updateTheme = () => {
    editorTheme.value = document.documentElement.classList.contains('dark') ? 'vs-dark' : 'vs'
  }
  updateTheme()
  themeObserver = new MutationObserver((m) => {
    if (m.some(mutation => mutation.attributeName === 'class')) updateTheme()
  })
  themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
})

onBeforeUnmount(() => {
  themeObserver?.disconnect()
})

// Registrar JSON schema en Monaco Editor
watch(monacoRef, (monacoInst) => {
  if (monacoInst) {
    ;(monacoInst.languages as any).json.jsonDefaults.setDiagnosticsOptions({
      validate: true,
      schemas: [{
        uri: "http://cim-dsl/schema.json",
        fileMatch: ["*"],
        schema: cimSchema
      }]
    })
  }
}, { immediate: true })

/**
 * Custom Validator: Busca IDs duplicados como dicta el Langium validator
 */
const validateCustomLogic = (jsonString: string) => {
  customErrors.value = []
  try {
    const obj = JSON.parse(jsonString)
    const reportedIds = new Set<string>()
    const allNodes = [...(obj.generators || []), ...(obj.modificators || [])]
    
    allNodes.forEach(node => {
      if (node.id) {
        if (reportedIds.has(node.id)) {
          customErrors.value.push(`El ID '${node.id}' ya está en uso. Los IDs deben ser únicos.`)
        } else {
          reportedIds.add(node.id)
        }
      }
    })

    // Validar relaciones/referencias orfanas
    allNodes.forEach(node => {
      // Validar rels
      ;(node.rels || []).forEach((rel: any) => {
        if (rel.id && !reportedIds.has(rel.id)) {
           customErrors.value.push(`El ID referenciado '${rel.id}' en la relación de '${node.id}' ya no existe en el documento.`)
        }
      })
      // Validar refs
      ;(node.refs || []).forEach((ref: any) => {
        if (ref.id && !reportedIds.has(ref.id)) {
           customErrors.value.push(`El ID referenciado '${ref.id}' en la referencia de '${node.id}' ya no existe en el documento.`)
        }
      })
    })
  } catch(e) {
    // Si no parsea, hasSyntaxErrors lo capturará en handleValidate
  }
}

/**
 * Handle del Editor cuando procesa el texto (incluye Schema Errors y Syntax Errors)
 */
const handleValidate = (markers: editor.IMarker[]) => {
  // JSON Schema de Monaco lanza violaciones estructurales como Warnings (severity === 4).
  // Por tanto, bloqueamos al detectar cualquier señal severa >= 4 para cumplir con la obligatoriedad.
  hasSyntaxErrors.value = markers.some(m => m.severity >= 4) 
}

// Watcher de Cambios de Editor (Para Guard global)
watch(code, (newVal) => {
  if (isInitializing) return
  
  validateCustomLogic(newVal)
  
  setUnsavedState(true, isContentValid.value, async () => {
    isSaving.value = true
    saveMessage.value = ''
    
    // Auto-formatear antes de guardar puede ser buena idea
    const result = await store.updateMachineRawJson(props.machine.id, newVal)
    isSaving.value = false
    
    if (result.success) {
      saveMessage.value = 'Modelo guardado correctamente'
      setTimeout(() => { saveMessage.value = '' }, 3000)
      return true
    } else {
      saveMessage.value = 'Error al salvar: ' + result.message
      return false
    }
  })
})

const doSave = async () => {
  if (!isContentValid.value) return
  isSaving.value = true
  saveMessage.value = ''
  
  const result = await store.updateMachineRawJson(props.machine.id, code.value)
  isSaving.value = false
  
  if (result.success) {
    saveMessage.value = 'Modelo guardado correctamente'
    clearUnsavedState() // Lo sacamos del estado sucio
    setTimeout(() => { saveMessage.value = '' }, 3000)
  } else {
    saveMessage.value = 'Error al salvar: ' + result.message
  }
}

</script>

<template>
  <div class="h-full flex flex-col bg-geist-bg">
    <!-- Header Tools -->
    <div class="px-6 py-4 flex items-center justify-between border-b border-geist-border bg-geist-accents-1/30">
      <div class="flex items-center gap-3">
        <i class="fa-solid fa-code text-geist-accents-5"></i>
        <h2 class="text-xs font-bold uppercase tracking-widest text-geist-fg">Editor de Código Raw</h2>
        <span class="text-[10px] text-geist-accents-4 bg-geist-accents-1 px-2 py-0.5 rounded-sm border border-geist-border">Schema: mdaa-cim v1</span>
      </div>

      <div class="flex items-center gap-4">
        <!-- Error Indicators -->
        <transition name="fade">
          <div v-if="!isContentValid" class="flex items-center gap-2 text-[10px] font-mono text-geist-error animate-pulse bg-geist-error/10 px-2 py-1 rounded">
            <i class="fa-solid fa-triangle-exclamation"></i>
            Hay errores en el modelo
          </div>
        </transition>

        <transition name="fade">
          <span v-if="saveMessage" class="text-xs font-mono" :class="saveMessage.includes('Error') ? 'text-geist-error' : 'text-geist-success'">
            {{ saveMessage }}
          </span>
        </transition>

        <button 
          @click="doSave"
          :disabled="isSaving || !isContentValid"
          class="geist-button-primary !py-1.5 gap-2 transition-all"
          :class="(!isContentValid && !isSaving) ? 'opacity-50 cursor-not-allowed grayscale' : ''"
        >
          <i class="fa-solid" :class="isSaving ? 'fa-spinner fa-spin' : 'fa-floppy-disk'"></i>
          {{ isSaving ? 'Guardando...' : 'Guardar JSON' }}
        </button>
      </div>
    </div>

    <!-- Error Banner Custom (Unique IDs, etc) -->
    <div v-if="customErrors.length > 0" class="bg-geist-error/5 border-b border-geist-error/20 p-2">
      <div v-for="(err, idx) in customErrors" :key="idx" class="text-[11px] text-geist-error font-mono flex items-center gap-2 px-4 py-1">
        <i class="fa-solid fa-circle-xmark opacity-70"></i>
        {{ err }}
      </div>
    </div>

    <!-- Monaco Editor Container -->
    <div class="flex-1 w-full relative">
      <VueMonacoEditor
        v-model:value="code"
        language="json"
        :theme="editorTheme"
        :options="{
          minimap: { enabled: false },
          fontSize: 13,
          fontFamily: 'var(--font-mono)',
          formatOnType: true,
          formatOnPaste: true,
          scrollBeyondLastLine: false,
          padding: { top: 16 }
        }"
        @validate="handleValidate"
      />
    </div>
  </div>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

/* Modificar el subrayado de error (amarillo) propio de los advertencias de JSON Schema a ROJO (estilo puramente error) */
:deep(.squiggly-warning) {
  background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 6 3' enable-background='new 0 0 6 3' height='3' width='6'%3E%3Cg fill='%23ff0000'%3E%3Cpolygon points='5.5,0 2.5,3 1.1,3 4.1,0'/%3E%3Cpolygon points='4,0 6,2 6,0.6 5.4,0'/%3E%3Cpolygon points='0,2 1,3 2.4,3 0,0.6'/%3E%3C/g%3E%3C/svg%3E") repeat-x bottom left !important;
}

/* Opcional: hacer el icono de aviso rojo si pasa el ratón por encima del subrayado */
:deep(.codicon-warning) {
  color: var(--color-geist-error) !important;
}
</style>
