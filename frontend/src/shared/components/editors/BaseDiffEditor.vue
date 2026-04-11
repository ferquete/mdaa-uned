<script setup lang="ts">
import { computed } from 'vue'
import { VueMonacoDiffEditor } from '@guolao/vue-monaco-editor'
import { useTheme } from '@/shared/composables/useTheme'

interface Props {
  original: string
  modified: string
  height?: string
  options?: any
}

const props = withDefaults(defineProps<Props>(), {
  height: '100%',
  options: () => ({})
})

const { isDark } = useTheme()

const editorTheme = computed(() => isDark.value ? 'dracula' : 'vs')

const defaultOptions = computed(() => ({
  automaticLayout: true,
  renderSideBySide: true,
  readOnly: true,
  fontSize: 12,
  fontFamily: "'JetBrains Mono', 'Monaco', 'Consolas', monospace",
  lineHeight: 1.6,
  padding: { top: 16, bottom: 16 },
  minimap: { enabled: false },
  ...props.options
}))

const handleEditorWillMount = (monaco: any) => {
  // El tema Dracula ya debería estar registrado por el BaseJSONEditor 
  // pero lo registramos aquí también por seguridad si se usa solo
  monaco.editor.defineTheme('dracula', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '6272a4', fontStyle: 'italic' },
      { token: 'string', foreground: 'f1fa8c' },
      { token: 'number', foreground: 'bd93f9' },
    ],
    colors: {
      'editor.background': '#282a36',
      'editor.foreground': '#f8f8f2',
    }
  })
}
</script>

<template>
  <div class="base-diff-editor w-full h-full overflow-hidden" :style="{ height }">
    <VueMonacoDiffEditor
      :original="original"
      :modified="modified"
      language="json"
      :theme="editorTheme"
      :options="defaultOptions"
      @before-mount="handleEditorWillMount"
    />
  </div>
</template>

<style>
.base-diff-editor .monaco-editor, 
.base-diff-editor .monaco-editor-background, 
.base-diff-editor .margin-view-overlays {
  background-color: transparent !important;
}
</style>
