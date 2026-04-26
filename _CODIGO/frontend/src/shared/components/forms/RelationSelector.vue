<script setup lang="ts">
import { computed } from 'vue'

interface Option {
  id: string
  name: string
}

interface Selection {
  id: string
  description: string
}

interface Props {
  title: string
  subtitle?: string
  options: Option[]
  selected: Selection[]
  validationError?: (id: string) => string | undefined
  colorClass?: string
  bgClass?: string
  ringClass?: string
}

const props = withDefaults(defineProps<Props>(), {
  colorClass: 'text-geist-fg',
  bgClass: 'bg-geist-accents-2',
  ringClass: 'ring-geist-border'
})

const emit = defineEmits<{
  (e: 'toggle', id: string): void
  (e: 'update-description', id: string, description: string): void
}>()

const isSelected = (id: string) => props.selected.some(s => s.id === id)
const getSelection = (id: string) => props.selected.find(s => s.id === id)

const handleToggle = (id: string) => {
  emit('toggle', id)
}

const handleUpdateDescription = (id: string, event: Event) => {
  const target = event.target as HTMLTextAreaElement
  emit('update-description', id, target.value)
}
</script>

<template>
  <div class="relation-selector">
    <div class="flex items-center gap-2 mb-6">
      <h3 class="text-xs uppercase tracking-[0.2em] font-bold text-geist-accents-4">{{ title }}</h3>
      <div class="h-px flex-1 bg-geist-border opacity-50"></div>
    </div>
    
    <p v-if="subtitle" class="text-xs text-geist-accents-4 mb-4 font-mono italic">{{ subtitle }}</p>
    
    <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
      <div 
        v-for="opt in options" 
        :key="opt.id"
        class="flex flex-col border rounded-lg transition-all overflow-hidden w-full"
        :class="isSelected(opt.id) 
          ? `${bgClass} border-transparent ring-1 ${ringClass}` 
          : 'bg-geist-accents-1 border-geist-border hover:bg-geist-accents-2'"
      >
        <button 
          @click="handleToggle(opt.id)"
          class="flex items-center gap-2 p-3 text-xs font-medium text-left transition-colors w-full"
          :class="isSelected(opt.id) ? colorClass : 'text-geist-accents-5'"
        >
          <i class="fa-solid transition-transform duration-300" :class="isSelected(opt.id) ? 'fa-check-circle scale-110' : 'fa-circle-plus opacity-40'"></i>
          <span class="truncate">{{ opt.name }}</span>
          <span class="ml-auto text-[10px] font-mono opacity-40">{{ opt.id }}</span>
        </button>

        <div v-if="isSelected(opt.id)" class="px-3 pb-3 pt-1 border-t border-black/5 animate-in fade-in slide-in-from-top-2 duration-300">
          <label class="text-[9px] font-bold uppercase tracking-wider mb-1 flex justify-between" :class="colorClass">
            Descripción de la relación
            <div class="flex items-center gap-2">
              <span v-if="validationError?.(opt.id)" class="text-[9px] text-geist-error normal-case font-mono">{{ validationError(opt.id) }}</span>
              <span 
                class="text-[9px] font-mono opacity-50"
                :class="{ 'text-geist-error': (getSelection(opt.id)?.description.length || 0) >= 600 }"
              >
                {{ getSelection(opt.id)?.description.length || 0 }}/600
              </span>
            </div>
          </label>
          <textarea 
            :value="getSelection(opt.id)?.description"
            @input="handleUpdateDescription(opt.id, $event)"
            rows="2"
            maxlength="600"
            class="geist-input !text-[11px] !py-1.5 resize-none transition-colors"
            :class="{'border-geist-error bg-geist-error/10': validationError?.(opt.id)}"
            placeholder="Obligatorio (min 10 caracteres)..."
          ></textarea>
        </div>
      </div>

      <div v-if="options.length === 0" class="col-span-full py-8 border-2 border-dashed border-geist-border rounded-xl flex flex-col items-center justify-center bg-geist-accents-1/30">
        <i class="fa-solid fa-ghost text-geist-accents-2 text-2xl mb-2"></i>
        <p class="text-xs text-geist-accents-4 font-mono">No hay elementos disponibles.</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.relation-selector {
  width: 100%;
}
</style>
