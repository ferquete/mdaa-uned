<script setup lang="ts">
import { computed } from 'vue'
import { VueMonacoEditor } from '@guolao/vue-monaco-editor'
import { useTheme } from '@/shared/composables/useTheme'

interface Props {
  modelValue: string
  readOnly?: boolean
  height?: string
  options?: any
}

const props = withDefaults(defineProps<Props>(), {
  readOnly: false,
  height: '100%',
  options: () => ({})
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'change', value: string): void
  (e: 'editorDidMount', editor: any): void
}>()

const { isDark } = useTheme()

const editorTheme = computed(() => isDark.value ? 'vs-dark' : 'light')

const onEditorMount = (editor: any, monaco: any) => {
  emit('editorDidMount', editor)
}

const defaultOptions = computed(() => ({
  automaticLayout: true,
  formatOnPaste: true,
  formatOnType: true,
  scrollBeyondLastLine: false,
  minimap: { enabled: false },
  readOnly: props.readOnly,
  fontSize: 12,
  fontFamily: "'JetBrains Mono', 'Monaco', 'Consolas', monospace",
  lineHeight: 1.6,
  padding: { top: 16, bottom: 16 },
  ...props.options
}))

const handleEditorWillMount = (monaco: any) => {
  // Aquí se podrían registrar lenguajes personalizados o temas si fuera necesario
}

const handleEditorDidMount = (editor: any) => {
  emit('editorDidMount', editor)
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
      class="absolute bottom-4 right-8 z-10 p-2 rounded-md bg-geist-accents-2/50 hover:bg-geist-accents-2 text-geist-accents-5 border border-geist-border backdrop-blur-sm transition-all"
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
/* Asegurar que el fondo del editor coincida con el tema de la app si hay transparencia */
.vs-dark .monaco-editor, .vs-dark .monaco-editor-background, .vs-dark .margin-view-overlays {
  background-color: #1a1a1a !important;
}
</style>
