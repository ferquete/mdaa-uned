<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import ModuleViewHeader from '@/shared/components/layout/ModuleViewHeader.vue'
import GenericConfirmDeleteModal from '@/shared/components/modals/GenericConfirmDeleteModal.vue'
import { useExport } from '@/shared/composables/useExport'
import { useUnsavedChanges } from '@/shared/composables/useUnsavedChanges'
import { useAnalysisMachinesStore } from '@/modules/analysis/stores/analysisMachinesStore'
import { usePimStore } from '../stores/pimStore'
import { useProjectStore } from '@/modules/projects/stores/projectStore'
import PimEditor from '../components/PimEditor.vue'
import PimVisualEditor from '../components/PimVisualEditor.vue'
import PimMachineModal from '../components/PimMachineModal.vue'
import PimRelationsVisualEditor from '../components/PimRelationsVisualEditor.vue'
import AiExportLanguageModal from '@/shared/components/modals/AiExportLanguageModal.vue'
import apiClient from '@/shared/api/apiClient'

const analysisStore = useAnalysisMachinesStore()
const store = usePimStore()
const projectStore = useProjectStore()
const { exportToJson } = useExport()
const { runWithGuard } = useUnsavedChanges()
const route = useRoute()

const projectId = computed(() => Number(route.params.id))

// Modales
const showPimModal = ref(false)
const showAiLanguageModal = ref(false)
const showDeleteConfirm = ref(false)

const isMachineSelected = computed(() => store.selectedMachine !== null)

const breadcrumbs = computed(() => {
  const list = []
  if (analysisStore.selectedNodeId === 'diseno') {
    list.push({ 
      label: 'Diseño Conceptual', 
      active: true,
      showPencil: false,
      canAddMachine: true
    })
  } else if (isMachineSelected.value) {
    const machine = store.selectedMachine!
    const doc = store.parsedDocs[machine.id]
    list.push({ label: 'Conceptual', active: false })
    list.push({ 
      label: doc?.name || `Máquina PIM ${machine.id}`, 
      active: true,
      canDelete: true,
      showPencil: true
    })
  }
  return list
})

const handleExport = () => {
  if (analysisStore.selectedNodeId === 'diseno' && store.currentPim) {
    exportToJson(store.currentPim.machinesRelations, 'diseno-pim-relations')
  } else if (isMachineSelected.value) {
    const machine = store.selectedMachine!
    const doc = store.parsedDocs[machine.id]
    exportToJson(JSON.stringify(doc, null, 2), `pim-machine-${doc?.name || machine.id}`)
  }
}

const handleRequestAiExport = () => {
  showAiLanguageModal.value = true
}

const handleExportAi = async (language: string) => {
  showAiLanguageModal.value = false
  try {
    const params = new URLSearchParams({ targetLanguage: language })
    const blob = await apiClient.getBlob(`/api/v1/projects/${projectId.value}/export-ai?${params.toString()}`);
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    
    // Obtener nombre del proyecto y formatear fecha/hora
    const project = projectStore.projects.find(p => p.id === projectId.value)
    const projectName = project?.name || `proyecto-${projectId.value}`
    const sanitizedName = projectName.toLowerCase().replace(/\s+/g, '-')
    const sanitizedLang = language.split(' ')[0].toLowerCase()
    
    const now = new Date()
    const timestamp = now.getFullYear() +
      String(now.getMonth() + 1).padStart(2, '0') +
      String(now.getDate()).padStart(2, '0') + '_' +
      String(now.getHours()).padStart(2, '0') +
      String(now.getMinutes()).padStart(2, '0')

    link.setAttribute('download', `${sanitizedLang}_${sanitizedName}_${timestamp}.zip`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  } catch (error: any) {
    console.error('Error al exportar para IA:', error);
  }
}

const setMode = (mode: '2D' | 'JSON' | 'FORM') => {
  if (mode === 'JSON' || mode === '2D') {
    // Proteger cambio de modo si hay cambios sin guardar en el editor gráfico
    runWithGuard(() => {
      store.visualizerMode = mode
    })
  }
}

// Proteger cambio de nodo si hay cambios sin guardar en el editor gráfico
watch(() => analysisStore.selectedNodeId, (newId, oldId) => {
  if (newId !== oldId) {
    runWithGuard(() => {
      store.visualizerMode = '2D'
    })
  }
})

const handleAddMachine = () => {
  showPimModal.value = true
}

const handleConfirmPimSave = async (name: string, description: string, cimReferences: string[]) => {
  if (isMachineSelected.value) {
    await store.updateMachine(store.selectedMachine!.id, name, description, cimReferences)
  } else {
    await store.addMachine(projectId.value, name, description, cimReferences)
  }
  showPimModal.value = false
}

const handleDeleteRequest = () => {
  showDeleteConfirm.value = true
}

const confirmDelete = async () => {
  if (isMachineSelected.value) {
    await store.deleteMachine(store.selectedMachine!.id)
  }
  showDeleteConfirm.value = false
}
</script>

<template>
  <div class="pim-dashboard flex flex-col h-full bg-geist-bg font-sans">
    <template v-if="analysisStore.selectedNodeId === 'diseno' || isMachineSelected">
      <ModuleViewHeader 
        module-name="Conceptual"
        :breadcrumbs="breadcrumbs"
        :visualizer-mode="store.visualizerMode"
        :graph-label="'Editor Gráfico'"
        :show-export="true"
        :show-form-mode="false"
        :show-info="false"
        :description="isMachineSelected ? store.parsedDocs[store.selectedMachine!.id]?.description : store.parsedPimRelations.description"
        :show-ai-export="analysisStore.selectedNodeId === 'diseno'"
        @set-mode="setMode"
        @export="handleExport"
        @export-ai="handleRequestAiExport"
        @add-machine="handleAddMachine"
        @edit-basic="showPimModal = true"
        @delete="handleDeleteRequest"
      />
  
      <div class="flex-1 relative overflow-hidden">
        <div v-if="store.visualizerMode === 'JSON'" class="w-full h-full">
          <PimEditor />
        </div>
        <div v-else-if="isMachineSelected" class="w-full h-full text-geist-fg">
          <PimVisualEditor />
        </div>
        <PimRelationsVisualEditor v-else />
      </div>
    </template>
    
    <div v-else class="w-full h-full flex items-center justify-center">
      <div class="text-center opacity-50 px-4">
        <div class="w-20 h-20 rounded-3xl bg-geist-accents-1 flex items-center justify-center mx-auto mb-6 border border-geist-border rotate-3 shadow-sm">
          <i class="fa-solid fa-pen-nib text-3xl text-geist-accents-4 -rotate-3"></i>
        </div>
        <h3 class="text-xl font-bold text-geist-fg tracking-tight">Diseño Conceptual</h3>
        <p class="text-xs text-geist-accents-5 mt-2 max-w-[240px] mx-auto leading-relaxed">Selecciona el nodo principal o una máquina PIM en el árbol para comenzar el modelado conceptual.</p>
      </div>
    </div>

    <!-- Modal de Creación/Edición -->
    <PimMachineModal
      :show="showPimModal"
      :title="isMachineSelected ? 'Editar Máquina PIM' : 'Nueva Máquina PIM'"
      :confirm-text="isMachineSelected ? 'Guardar Cambios' : 'Crear Máquina'"
      :initial-data="isMachineSelected ? { 
        name: store.parsedDocs[store.selectedMachine!.id]?.name || '', 
        description: store.parsedDocs[store.selectedMachine!.id]?.description || '',
        ids_cim_reference: store.parsedDocs[store.selectedMachine!.id]?.ids_cim_reference || []
      } : null"
      @close="showPimModal = false"
      @confirm="handleConfirmPimSave"
    />

    <!-- Confirmación de Borrado -->
    <GenericConfirmDeleteModal
      :show="showDeleteConfirm"
      :item-name="isMachineSelected ? store.parsedDocs[store.selectedMachine!.id]?.name : ''"
      @close="showDeleteConfirm = false"
      @confirm="confirmDelete"
    />

    <!-- Selección de Lenguaje para IA -->
    <AiExportLanguageModal
      :show="showAiLanguageModal"
      @close="showAiLanguageModal = false"
      @confirm="handleExportAi"
    />
  </div>
</template>

<style scoped>
.pim-dashboard {
  animation: fade-in 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes fade-in {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
