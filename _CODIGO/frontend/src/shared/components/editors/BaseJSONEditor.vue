<script setup lang="ts">
import { computed } from 'vue'
import { VueMonacoEditor } from '@guolao/vue-monaco-editor'
import { useTheme } from '@/shared/composables/useTheme'

interface Props {
  modelValue: string
  readOnly?: boolean
  height?: string
  options?: any
  schema?: any // Esquema JSON opcional
  path?: string // Ruta única para aislamiento de esquemas en Monaco
}

const props = withDefaults(defineProps<Props>(), {
  readOnly: false,
  height: '100%',
  options: () => ({}),
  schema: null,
  path: 'model.json'
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'change', value: string): void
  (e: 'editorDidMount', editor: any, monaco: any): void
  (e: 'validation-change', markers: any[]): void
}>()

const { isDark } = useTheme()

const editorTheme = computed(() => isDark.value ? 'dracula' : 'vs')

const defaultOptions = computed(() => ({
  automaticLayout: true,
  formatOnPaste: true,
  formatOnType: true,
  scrollBeyondLastLine: false,
  minimap: { 
    enabled: true,
    scale: 1,
    showSlider: 'mouseover' 
  },
  readOnly: props.readOnly,
  fontSize: 12,
  fontFamily: "'JetBrains Mono', 'Monaco', 'Consolas', monospace",
  lineHeight: 1.6,
  padding: { top: 16, bottom: 16 },
  folding: true,
  foldingHighlight: true,
  foldingStrategy: 'indentation',
  showFoldingControls: 'always',
  ...props.options
}))

const monacoInstance = ref<any>(null)

const updateSchema = (monaco: any) => {
  if (!monaco || !props.schema) return
  
  // Limpiar configuraciones previas para evitar conflictos de esquemas antiguos
  monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
    validate: true,
    allowComments: false,
    schemas: [{
      uri: `mda://schema/${props.path}`,
      fileMatch: [props.path, `inmemory://model/${props.path}`, `file:///${props.path}`],
      schema: props.schema
    }]
  })
}

const handleEditorWillMount = (monaco: any) => {
  monacoInstance.value = monaco
  
  // Registrar tema Dracula
  monaco.editor.defineTheme('dracula', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '6272a4', fontStyle: 'italic' },
      { token: 'string', foreground: 'f1fa8c' },
      { token: 'string.key', foreground: '50fa7b' },
      { token: 'number', foreground: 'bd93f9' },
      { token: 'keyword', foreground: 'ff79c6' },
      { token: 'delimiter', foreground: 'f8f8f2' },
      { token: 'attribute.name', foreground: '50fa7b' },
      { token: 'attribute.value', foreground: 'f1fa8c' },
    ],
    colors: {
      'editor.background': '#282a36',
      'editor.foreground': '#f8f8f2',
      'editor.lineHighlightBackground': '#44475a',
      'editor.selectionBackground': '#44475a',
      'editor.inactiveSelectionBackground': '#3d404f',
      'editorCursor.foreground': '#f8f8f2',
      'editorIndentGuide.background': '#44475a',
      'editorIndentGuide.activeBackground': '#6272a4',
      'editorLineNumber.foreground': '#6272a4',
      'editorLineNumber.activeForeground': '#f8f8f2',
    }
  })

  updateSchema(monaco)
}

watch([() => props.path, () => props.schema], () => {
  if (monacoInstance.value) {
    updateSchema(monacoInstance.value)
  }
})

const onEditorMount = (editor: any, monaco: any) => {
  const getMarkers = () => {
    const model = editor.getModel();
    if (model) {
      // Capturar todos los marcadores para la URI del modelo actual
      const markers = monaco.editor.getModelMarkers({ resource: model.uri });
      emit('validation-change', markers);
    }
  }

  // Listener global de cambios en marcadores
  monaco.editor.onDidChangeMarkers(() => {
    getMarkers();
  });

  // Verificación inmediata y periódica inicial (Monaco puede tardar en validar)
  getMarkers();
  setTimeout(getMarkers, 200);
  setTimeout(getMarkers, 1000);
  setTimeout(getMarkers, 3000);

  emit('editorDidMount', editor, monaco)
}

const onInputChange = (value: string | undefined) => {
  const val = value || ''
  emit('update:modelValue', val)
  emit('change', val)
}

const formatJson = () => {
  try {
    const parsed = JSON.parse(props.modelValue)
    const formatted = JSON.stringify(parsed, null, 2)
    emit('update:modelValue', formatted)
    emit('change', formatted)
  } catch (e) {
    // Si no es válido no hace nada
  }
}

defineExpose({ formatJson })
</script>

<template>
  <div class="base-json-editor w-full h-full flex flex-col overflow-hidden relative" :style="{ height }">
    <div class="flex-1 overflow-hidden">
      <VueMonacoEditor
        :value="modelValue"
        language="json"
        :path="path"
        :theme="editorTheme"
        :options="defaultOptions"
        @before-mount="handleEditorWillMount"
        @mount="onEditorMount"
        @update:value="onInputChange"
      />
    </div>
    
    <!-- Botón de Formateo flotante -->
    <button 
      v-if="!readOnly"
      @click="formatJson"
      class="absolute bottom-20 right-8 z-10 p-2 rounded-md bg-geist-accents-2/50 hover:bg-geist-accents-2 text-geist-accents-5 border border-geist-border backdrop-blur-sm transition-all"
      title="Formatear JSON"
    >
      <i class="fa-solid fa-wand-magic-sparkles text-xs"></i>
    </button>
  </div>
</template>

<style>
.base-json-editor .monaco-editor {
  padding: 0 !important;
}

/* Limpieza de fondos para que brille el tema Dracula */
.base-json-editor .monaco-editor, 
.base-json-editor .monaco-editor-background, 
.base-json-editor .margin-view-overlays {
  background-color: transparent !important;
}

.base-json-editor .monaco-editor .margin {
  background-color: transparent !important;
}
</style>
