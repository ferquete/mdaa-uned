<script setup lang="ts">
import BaseModal from '@/shared/components/BaseModal.vue'
import { ref, watch } from 'vue'

interface Option {
  id: string
  name: string
  type: 'el' | 'edge'
}

interface Props {
  show: boolean
  title: string
  confirmText: string
  availableCimComponents: Option[]
  edgeType?: 'audio' | 'modification' | null
  initialData?: { description: string; ids_references: string[] } | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'confirm', description: string, ids_references: string[]): void
  (e: 'delete'): void
}>()

const localDescription = ref('')
const selectedRefs = ref<string[]>([])

const filteredComponents = computed(() => {
  if (!props.edgeType) return props.availableCimComponents
  
  return props.availableCimComponents.filter(opt => {
    if (props.edgeType === 'audio') {
      return opt.type === 'edge'
    } else {
      return opt.type === 'el'
    }
  })
})

watch(() => props.show, (isShowing) => {
  if (isShowing) {
    if (props.initialData) {
      localDescription.value = props.initialData.description ?? ''
      selectedRefs.value = [...(props.initialData.ids_references || [])]
    } else {
      localDescription.value = ''
      selectedRefs.value = []
    }
  }
}, { immediate: true })

const toggleRef = (id: string) => {
  const idx = selectedRefs.value.indexOf(id)
  if (idx === -1) selectedRefs.value.push(id)
  else selectedRefs.value.splice(idx, 1)
}

const handleConfirm = () => {
  emit('confirm', localDescription.value.trim(), selectedRefs.value)
}

const getIcon = (type: string) => {
  switch (type) {
    case 'el': return 'fa-cube text-node-generator'
    case 'edge': return 'fa-link text-geist-success'
    default: return 'fa-circle-dot'
  }
}
</script>

<template>
  <BaseModal :show="show" :title="title" @close="emit('close')">
    <div class="space-y-6 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">

      <!-- Cabecera Informativa -->
      <div class="p-3 rounded-xl bg-geist-accents-1/30 border border-geist-border/50 flex items-center gap-3">
        <div class="w-8 h-8 rounded-lg flex items-center justify-center bg-geist-bg border border-geist-border shadow-sm">
          <i :class="['fa-solid', edgeType === 'audio' ? 'fa-music text-rose-500' : 'fa-bolt text-emerald-500', 'text-xs']"></i>
        </div>
        <div>
          <p class="text-[10px] font-bold uppercase tracking-tight text-geist-fg">
            Tipo de Señal: {{ edgeType === 'audio' ? 'Audio' : 'Modulación' }}
          </p>
          <p class="text-[9px] text-geist-accents-5">
            {{ edgeType === 'audio' ? 'Solo puedes referenciar conexiones de señal CIM.' : 'Solo puedes referenciar elementos de control CIM.' }}
          </p>
        </div>
      </div>

      <!-- Descripción (opcional) -->
      <div class="space-y-2">
        <div class="flex justify-between items-center">
          <label class="text-[10px] font-bold uppercase tracking-widest text-geist-accents-5">
            Descripción <span class="normal-case font-normal opacity-60">(opcional)</span>
          </label>
          <span class="text-[10px] font-mono text-geist-accents-4">
            {{ localDescription.length }}/100
          </span>
        </div>
        <textarea
          v-model="localDescription"
          placeholder="Describe el propósito de esta conexión..."
          rows="3"
          maxlength="100"
          class="geist-input w-full resize-none py-2"
        ></textarea>
      </div>

      <!-- Referencias CIM -->
      <div class="space-y-3">
        <div class="flex items-center gap-2">
          <label class="text-[10px] font-bold uppercase tracking-widest text-geist-accents-5">Referencias CIM Disponibles</label>
          <div class="h-px flex-1 bg-geist-border opacity-30"></div>
        </div>

        <div v-if="filteredComponents.length === 0" class="p-4 border-2 border-dashed border-geist-border rounded-xl bg-geist-accents-1/30 text-center">
          <p class="text-[10px] text-geist-accents-4 italic">No hay componentes CIM válidos para este tipo de señal.</p>
        </div>

        <div v-else class="grid grid-cols-1 gap-2">
          <button
            v-for="opt in filteredComponents"
            :key="opt.id"
            @click="toggleRef(opt.id)"
            class="flex items-center gap-3 p-2.5 rounded-xl border transition-all text-left group"
            :class="selectedRefs.includes(opt.id)
              ? 'bg-geist-fg text-geist-bg border-transparent shadow-md'
              : 'bg-geist-accents-1/50 border-geist-border text-geist-fg hover:border-geist-accents-4'"
          >
            <div
              class="w-7 h-7 rounded-lg flex items-center justify-center border border-geist-border/20 shadow-sm transition-colors"
              :class="selectedRefs.includes(opt.id) ? 'bg-white/10' : 'bg-geist-bg'"
            >
              <i :class="['fa-solid', getIcon(opt.type), 'text-[11px]', selectedRefs.includes(opt.id) ? '!text-white' : '']"></i>
            </div>

            <div class="flex-1 min-w-0">
              <div class="flex items-center justify-between">
                <span class="text-[11px] font-bold truncate">{{ opt.name }}</span>
                <span class="text-[8px] font-mono opacity-40 ml-2">{{ opt.id.substring(0, 8) }}...</span>
              </div>
              <span class="text-[8px] uppercase tracking-tighter opacity-60 font-mono">
                {{ opt.type === 'el' ? 'Elemento CIM' : 'Conexión CIM' }}
              </span>
            </div>

            <div class="flex-shrink-0">
              <i
                class="fa-solid transition-all duration-300"
                :class="[selectedRefs.includes(opt.id) ? 'fa-circle-check text-geist-bg' : 'fa-circle-plus opacity-20 group-hover:opacity-60']"
              ></i>
            </div>
          </button>
        </div>
      </div>

      <!-- Acciones -->
      <div class="flex gap-3 pt-4 sticky bottom-0 bg-geist-bg pb-1 border-t border-geist-border/10">
        <button 
          v-if="initialData"
          class="flex items-center justify-center w-10 h-10 rounded-xl border border-geist-error/30 bg-geist-error/5 text-geist-error hover:bg-geist-error/10 transition-colors"
          title="Eliminar arista permanentemente"
          @click="emit('delete')"
        >
          <i class="fa-solid fa-trash-can text-sm"></i>
        </button>
        <button class="geist-button-secondary flex-1" @click="emit('close')">Cancelar</button>
        <button class="geist-button-primary flex-1" @click="handleConfirm">{{ confirmText }}</button>
      </div>
    </div>
  </BaseModal>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar { width: 4px; }
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: var(--color-geist-accents-2);
  border-radius: 10px;
}
</style>
