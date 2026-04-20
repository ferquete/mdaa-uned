<script setup lang="ts">
import { Background } from '@vue-flow/background'
import { Controls } from '@vue-flow/controls'
import { Panel, VueFlow, useVueFlow, type EdgeTypesObject, type NodeTypesObject } from '@vue-flow/core'
import '@vue-flow/core/dist/style.css'
import '@vue-flow/core/dist/theme-default.css'
import { computed, markRaw, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'

import BaseModal from '@/shared/components/BaseModal.vue'
import PimCustomEdge from './PimCustomEdge.vue'
import PimCustomNode from './PimCustomNode.vue'
import PimEdgeModal from './PimEdgeModal.vue'
import PimEditorPalette from './PimEditorPalette.vue'
import PimEditorProperties from './PimEditorProperties.vue'
import PimEditorToolbar from './PimEditorToolbar.vue'
import PimNodeModal from './PimNodeModal.vue'

import { useAnalysisMachinesStore } from '@/modules/analysis/stores/analysisMachinesStore'
import { useUnsavedChanges } from '@/shared/composables/useUnsavedChanges'
import { usePimStore } from '../stores/pimStore'
import { PIM_MODIFIABLE_PARAMS, PIM_NODE_METADATA } from '../utils/pim-node-metadata'

const store = usePimStore()
const analysisStore = useAnalysisMachinesStore()
const localNodes = ref<any[]>([])
const localEdges = ref<any[]>([])

const nodeTypes: NodeTypesObject = {
  custom: markRaw(PimCustomNode) as any,
}

const edgeTypes: EdgeTypesObject = {
  custom: markRaw(PimCustomEdge) as any,
}

const { 
  onConnect, addEdges, addNodes, toObject, fromObject, project, findNode,
  onNodeClick, onPaneClick, removeEdges, removeNodes, getEdges
} = useVueFlow({ id: 'pim-flow' })

const isSaving = ref(false)
const showProperties = ref(false)
const selectedNodeId = ref<string | undefined>(undefined)
const showSaveConfirm = ref(false)
const showErrorModal = ref(false)
const errorMessage = ref('')
const saveMessage = ref('')

/**
 * El grafo es válido solo si todos los nodos locales tienen isValid !== false.
 */
const isGraphValid = computed(() => {
  return localNodes.value.every(n => n.data.isValid !== false)
})

// --- Snapshot para detectar cambios ---
const snapshotJson = ref('')
const snapshotPositions = ref('')
const { setUnsavedState, clearUnsavedState } = useUnsavedChanges()

// --- Gestión de Selección ---
onNodeClick(({ node }) => {
  selectedNodeId.value = node.id
  showProperties.value = true
})

onPaneClick(() => {
  selectedNodeId.value = undefined
  showProperties.value = false
})

// --- Referencia al contenedor para calcular posiciones ---
const vueFlowContainer = ref<HTMLElement | null>(null)

// --- Estados para Modales ---
const showNodeModal = ref(false)
const pendingNodeData = ref<any>(null)

// Estados para modal de arista (crear / editar)
const showEdgeModal = ref(false)
const pendingEdgeData = ref<any>(null)  // datos para nueva arista
const editingEdgeId = ref<string | null>(null) // id de arista en edición

// --- Referencias CIM Disponibles ---
const availableCimComponents = computed(() => {
  if (!store.selectedMachine) return []
  const machineId = store.selectedMachine.id
  const doc = store.parsedDocs[machineId]
  if (!doc || !doc.ids_cim_reference) return []
  
  const components: any[] = []
  
  doc.ids_cim_reference.forEach((uuid: string) => {
    const machine = analysisStore.machines.find(m => {
      const d = analysisStore.parsedDocs[m.id]
      return d?.id === uuid
    })
    
    if (machine) {
      const cimDoc = analysisStore.parsedDocs[machine.id]
      if (cimDoc && Array.isArray(cimDoc.elements)) {
        cimDoc.elements.forEach((el: any) => {
          // Elementos (Nodos) - Válidos para MODIFICACIÓN
          components.push({ id: el.id, name: `[${cimDoc.name}] ${el.name}`, type: 'el' })
          
          // SendTo (Aristas/Conexiones) - Válidos para AUDIO
          el.sendTo?.forEach((s: any) => components.push({ 
            id: s.id, 
            name: `[${cimDoc.name}] ${el.name} ➔ ${s.idRef.substring(0,8)}`, 
            type: 'edge' 
          }))
        })
      }
    }
  })
  
  return components
})

// --- Utilidades para posiciones GUI ---
const GUI_STORAGE_PREFIX = 'pim-gui-'

const loadGuiPositions = (machineId: number): Record<string, { x: number; y: number }> => {
  try {
    const raw = localStorage.getItem(`${GUI_STORAGE_PREFIX}${machineId}`)
    return raw ? JSON.parse(raw) : {}
  } catch { return {} }
}

const saveGuiPositions = (machineId: number) => {
  const flowState = toObject()
  const positions: Record<string, { x: number; y: number }> = {}
  flowState.nodes.forEach((n: any) => {
    positions[n.id] = n.position
  })
  localStorage.setItem(`${GUI_STORAGE_PREFIX}${machineId}`, JSON.stringify(positions))
}

const getCurrentPositionsJson = () => {
  return JSON.stringify(
    localNodes.value
      .map(n => ({ id: n.id, x: Math.round(n.position.x), y: Math.round(n.position.y) }))
      .sort((a, b) => a.id.localeCompare(b.id))
  )
}

// --- Carga Inicial ---
const loadMachineData = () => {
  if (store.selectedMachine) {
    const doc = store.parsedDocs[store.selectedMachine.id]
    if (doc) {
      const guiPositions = loadGuiPositions(store.selectedMachine.id)
      
      const flowNodes = doc.nodes.map((n: any) => ({
        id: n.id,
        type: 'custom',
        position: guiPositions[n.id] || { x: Math.random() * 400, y: Math.random() * 300 },
        data: { 
          name: n.name, 
          type: n.type, 
          description: n.description,
          parameters: n,
          isValid: true 
        }
      }))

      const flowEdges = doc.edges.map((e: any) => ({
        id: e.id,
        type: 'custom',
        source: e.sourceNode,
        target: e.targetNode,
        sourceHandle: e.sourceParam,
        targetHandle: e.targetParam,
        data: { type: e.type, description: e.description, ids_references: e.ids_references || [] },
        style: { stroke: e.type === 'audio' ? '#e11d48' : '#10b981', strokeWidth: 2 }
      }))

      localNodes.value = flowNodes
      localEdges.value = flowEdges
      setTimeout(() => fromObject({ nodes: flowNodes, edges: flowEdges }), 50)
      
      nextTick(() => {
        // Inicializar snapshots usando buildFinalJson para asegurar que el formato sea idéntico al comparado después
        const initialModel = buildFinalJson()
        if (initialModel) {
          snapshotJson.value = JSON.stringify(initialModel)
        }
        snapshotPositions.value = getCurrentPositionsJson()
        clearUnsavedState()
      })
    }
  }
}

onMounted(loadMachineData)
watch(() => store.selectedMachine?.id, loadMachineData)

onBeforeUnmount(() => {
  clearUnsavedState()
})

// --- Lógica de Drag & Drop ---
const onDragOver = (event: DragEvent) => {
  event.preventDefault()
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'copy'
  }
}

const onDrop = (event: DragEvent) => {
  const nodeType = event.dataTransfer?.getData('nodeType')
  if (!nodeType || !vueFlowContainer.value) return

  const rect = vueFlowContainer.value.getBoundingClientRect()
  const position = project({ 
    x: event.clientX - rect.left, 
    y: event.clientY - rect.top 
  })
  
  pendingNodeData.value = { type: nodeType, position }
  showNodeModal.value = true
}

const handleConfirmNode = (name: string, description: string, ids_references: string[]) => {
  if (!pendingNodeData.value) return
  
  const { type, position } = pendingNodeData.value
  const id = crypto.randomUUID()
  const meta = PIM_NODE_METADATA[type]
  const defaultParams: any = { id, name, type, description, ids_references, others: [] }
  
  // Inicializar puertos de audio por defecto para que pulsen desde el inicio
  if (meta) {
    meta.inputs.forEach(i => {
      defaultParams[i.id] = { id: crypto.randomUUID(), ids_references: [], isExternalInput: true }
    })
    meta.outputs.forEach(o => {
      defaultParams[o.id] = { id: crypto.randomUUID(), ids_references: [], isExternalOutput: true }
    })
  }
  
  if (type === 'oscillator') {
    defaultParams.waveform = { initialValue: 'sine', id: crypto.randomUUID(), ids_references: [], isExternalInput: false }
    defaultParams.frequency = { initialValue: 440, id: crypto.randomUUID(), ids_references: [], isExternalInput: false }
    defaultParams.gain = { initialValue: 0.5, id: crypto.randomUUID(), ids_references: [], isExternalInput: false }
    defaultParams.pan = { initialValue: 0, id: crypto.randomUUID(), ids_references: [], isExternalInput: false }
  } else if (type === 'mixer') {
    defaultParams.inputs_number = 2; defaultParams.stereo = false
  } else if (type === 'lfo') {
    defaultParams.waveform = { initialValue: 'sine', id: crypto.randomUUID(), ids_references: [], isExternalInput: false }
    defaultParams.rate = { initialValue: 1, id: crypto.randomUUID(), ids_references: [], isExternalInput: false }
    defaultParams.amplitude = { initialValue: 1, id: crypto.randomUUID(), ids_references: [], isExternalInput: false }
    defaultParams.phase = { initialValue: 0, id: crypto.randomUUID(), ids_references: [], isExternalInput: false }
    defaultParams.sync = { initialValue: false, id: crypto.randomUUID(), ids_references: [], isExternalInput: false }
  }

  const newNode = {
    id,
    type: 'custom',
    position,
    data: { 
      name, 
      type, 
      description,
      isValid: true,
      parameters: defaultParams
    }
  }
  
  addNodes([newNode])
  showNodeModal.value = false
  pendingNodeData.value = null
  selectedNodeId.value = id
  
  setTimeout(() => {
    showProperties.value = true
  }, 100)
}

// --- Eliminación de Nodo ---
/**
 * Elimina el nodo seleccionado junto con todas sus aristas entrantes y salientes.
 */
const handleDeleteNode = (nodeId: string) => {
  const allEdges = getEdges.value
  const edgesToRemove = allEdges.filter(e => e.source === nodeId || e.target === nodeId)
  
  if (edgesToRemove.length > 0) {
    removeEdges(edgesToRemove.map(e => e.id))
  }
  removeNodes([nodeId])
  
  showProperties.value = false
  selectedNodeId.value = undefined
}

// --- Lógica de Conexión ---
onConnect((params) => {
  const sourceNode = findNode(params.source)
  const targetNode = findNode(params.target)
  
  if (!sourceNode || !targetNode) return

  const sourceIsMod = params.sourceHandle === 'output' && (sourceNode.data?.type === 'lfo' || sourceNode.data?.type === 'envelope')
  const targetIsMod = !params.targetHandle?.startsWith('input_') 
  
  if (sourceIsMod !== targetIsMod) {
    errorMessage.value = 'No se pueden mezclar señales de Audio con señales de Modulación.'
    showErrorModal.value = true
    return
  }

  const type = sourceIsMod ? 'modification' : 'audio'
  pendingEdgeData.value = { ...params, type }
  editingEdgeId.value = null
  showEdgeModal.value = true
})

/**
 * Datos iniciales para el modal de arista (creación o edición).
 */
const edgeModalInitialData = computed(() => {
  if (!editingEdgeId.value) return null
  const edge = localEdges.value.find(e => e.id === editingEdgeId.value)
  if (!edge) return null
  return {
    description: edge.data?.description || '',
    ids_references: edge.data?.ids_references || []
  }
})

const edgeModalTitle = computed(() =>
  editingEdgeId.value ? 'Editar Arista' : 'Nueva Conexión'
)

const edgeModalConfirmText = computed(() =>
  editingEdgeId.value ? 'Guardar Cambios' : 'Conectar'
)

/**
 * Confirma la creación o edición de una arista.
 */
const handleConfirmEdge = (description: string, ids_references: string[]) => {
  if (editingEdgeId.value) {
    // Edición: actualizar datos en localEdges
    const edge = localEdges.value.find(e => e.id === editingEdgeId.value)
    if (edge) {
      edge.data = {
        ...edge.data,
        description,
        ids_references
      }
    }
  } else if (pendingEdgeData.value) {
    const { type } = pendingEdgeData.value
    const id = crypto.randomUUID()
    addEdges([{
      ...pendingEdgeData.value,
      id,
      type: 'custom',
      data: { type, description, ids_references },
      style: { stroke: type === 'audio' ? '#e11d48' : '#10b981', strokeWidth: 2 }
    }])
  }
  
  showEdgeModal.value = false
  pendingEdgeData.value = null
  editingEdgeId.value = null
}

/**
 * Abre el modal de edición para una arista existente.
 */
const handleEditEdge = (edgeId: string) => {
  editingEdgeId.value = edgeId
  showEdgeModal.value = true
}

/**
 * Elimina una arista por su id.
 */
const handleDeleteEdge = (edgeId: string) => {
  removeEdges([edgeId])
}

/**
 * Elimina las aristas que entren al handle de un parámetro cuando se desactiva isModifiable.
 * El handle de entrada de un parámetro modifiable tiene la forma "mod_<paramName>".
 */
const handleRemoveEdgesForParam = (nodeId: string, paramName: string) => {
  const targetHandle = `mod_${paramName}`
  const allEdges = getEdges.value
  const toRemove = allEdges
    .filter(e => e.target === nodeId && e.targetHandle === targetHandle)
    .map(e => e.id)
  if (toRemove.length > 0) {
    removeEdges(toRemove)
  }
}

// --- Persistencia ---

/**
 * Genera el JSON final de la máquina PIM a partir del estado del grafo.
 */
const buildFinalJson = () => {
  if (!store.selectedMachine) return null
  
  const flowState = toObject()
  
  const pimNodes = flowState.nodes.map((n: any) => {
    const rawData = n.data.parameters
    const metadata = PIM_NODE_METADATA[n.data.type]
    
    // El orden de campos en el nodo debe ser coherente con el DSL
    const node: any = {
      type: n.data.type,
      id: n.id,
      name: n.data.name,
      description: n.data.description || '',
      ids_references: rawData?.ids_references || [],
      others: Array.isArray(rawData?.others) ? rawData.others.map((o: any) => ({
        id: o.id,
        name: o.name,
        ids_references: o.ids_references || [],
        initialValue: typeof o.initialValue === 'object' ? (o.initialValue.initialValue ?? '') : o.initialValue,
        isModifiable: o.isModifiable ?? true,
        isExternalInput: o.isExternalInput ?? false,
        description: o.description || ''
      })) : []
    }

    const wrapParam = (key: string, value: any) => {
      const existing = rawData?.[key]
      const modFlags = rawData?._isModifiable || {}
      
      // Limpiar valor si viene anidado por error
      let cleanValue = value
      if (value !== null && typeof value === 'object' && 'initialValue' in value) {
        cleanValue = value.initialValue
      }

      const param: any = {
        id: (existing && typeof existing === 'object' && existing.id) ? existing.id : crypto.randomUUID(),
        ids_references: (existing && typeof existing === 'object') ? (existing.ids_references || []) : [],
        initialValue: cleanValue,
        isModifiable: modFlags[key] ?? (existing && typeof existing === 'object' && 'isModifiable' in existing ? existing.isModifiable : true),
        isExternalInput: (existing && typeof existing === 'object' && existing.isExternalInput !== undefined) 
          ? existing.isExternalInput 
          : false
      }
      
      if (existing?.description) param.description = existing.description
      return param
    }

    const wrapCP = (key: string) => {
      const existing = rawData?.[key]
      const isInput = metadata?.inputs.some(i => i.id === key)
      const isOutput = metadata?.outputs.some(o => o.id === key)

      const cp: any = {
        id: (existing && typeof existing === 'object' && existing.id) ? existing.id : crypto.randomUUID(),
        ids_references: (existing && typeof existing === 'object') ? (existing.ids_references || []) : []
      }

      if (isInput) {
        cp.isExternalInput = (existing && typeof existing === 'object' && existing.isExternalInput !== undefined)
          ? existing.isExternalInput
          : true
      }
      if (isOutput) {
        cp.isExternalOutput = (existing && typeof existing === 'object' && existing.isExternalOutput !== undefined)
          ? existing.isExternalOutput
          : true
      }
      if (existing?.description) cp.description = existing.description
      
      return cp
    }

    // Añadir parámetros técnicos según el orden del DSL
    const paramsList = PIM_MODIFIABLE_PARAMS[n.data.type] || []
    paramsList.forEach((p: string) => {
      if (rawData?.[p] !== undefined) {
        node[p] = wrapParam(p, rawData[p])
      }
    })

    // Añadir campos de audio comunes si existen
    if (metadata) {
      if ('stereo' in (rawData || {}) || metadata.inputs.length > 0 || metadata.outputs.length > 0) {
        node.stereo = wrapParam('stereo', rawData?.stereo ?? false)
        if (node.stereo.initialValue === true) {
          node.ping_pong = wrapParam('ping_pong', rawData?.ping_pong ?? false)
        }
      }
      metadata.inputs.forEach((i: any) => {
        // Solo incluir input_2 si es estéreo
        if (i.id === 'input_2' && node.stereo?.initialValue !== true) return
        node[i.id] = wrapCP(i.id)
      })
      metadata.outputs.forEach((o: any) => {
        // Solo incluir output_2 si es estéreo
        if (o.id === 'output_2' && node.stereo?.initialValue !== true) return
        node[o.id] = wrapCP(o.id)
      })
    }

    // Campos especiales como waveform, etc. (ya cubiertos por paramsList normalmente, pero asegurar)
    const specialKeys = ['waveform', 'noiseType', 'filterType', 'envelopeType', 'inputs_number']
    specialKeys.forEach(k => {
      if (rawData?.[k] !== undefined && !node[k]) {
        node[k] = wrapParam(k, rawData[k])
      }
    })

    return node
  })

  const pimEdges = flowState.edges.map((e: any) => ({
    id: e.id,
    description: e.data?.description || '',
    sourceNode: e.source,
    sourceParam: e.sourceHandle,
    targetNode: e.target,
    targetParam: e.targetHandle,
    type: e.data?.type || 'audio',
    ids_references: e.data?.ids_references || []
  }))

  return {
    id: store.parsedDocs[store.selectedMachine.id]?.id || crypto.randomUUID(),
    name: store.parsedDocs[store.selectedMachine.id]?.name || '',
    description: store.parsedDocs[store.selectedMachine.id]?.description || '',
    ids_cim_reference: store.parsedDocs[store.selectedMachine.id]?.ids_cim_reference || [],
    nodes: pimNodes,
    edges: pimEdges
  }
}

/**
 * Detecta si hay cambios respecto al snapshot original.
 */
const isDirty = computed(() => {
  if (!snapshotJson.value) return false
  const currentJson = JSON.stringify(buildFinalJson())
  const technicalDirty = currentJson !== snapshotJson.value
  const graphicalDirty = getCurrentPositionsJson() !== snapshotPositions.value
  return technicalDirty || graphicalDirty
})

const checkDirtyState = () => {
  if (isDirty.value) {
    setUnsavedState(true, true, async () => {
      await executeSave()
      return true
    })
  } else {
    clearUnsavedState()
  }
}

watch([localNodes, localEdges], checkDirtyState, { deep: true })

/**
 * Abre la confirmación antes de guardar.
 */
const handleSave = () => {
  showSaveConfirm.value = true
}

/**
 * Ejecuta el guardado real tras la confirmación.
 */
const executeSave = async () => {
  if (!store.selectedMachine) return
  isSaving.value = true
  showSaveConfirm.value = false
  
  const finalJson = buildFinalJson()
  if (!finalJson) {
    isSaving.value = false
    return
  }

  const result = await store.updateMachineRawJson(store.selectedMachine.id, JSON.stringify(finalJson, null, 2))
  
  isSaving.value = false
  if (result.success) {
    saveGuiPositions(store.selectedMachine.id)
    
    // Usamos nextTick para asegurar que la reactividad se asiente antes de tomar el nuevo snapshot
    nextTick(() => {
      const savedJson = buildFinalJson()
      if (savedJson) {
        snapshotJson.value = JSON.stringify(savedJson)
      }
      snapshotPositions.value = getCurrentPositionsJson()
      clearUnsavedState()
      saveMessage.value = 'Guardado con éxito'
      setTimeout(() => saveMessage.value = '', 3000)
    })
  } else {
    saveMessage.value = 'Error: ' + result.message
  }
}


</script>

<template>
  <div class="pim-visual-editor flex flex-col h-full bg-geist-bg select-none relative overflow-hidden">
    <PimEditorToolbar 
      @save="handleSave"
      :disabled="!isGraphValid || !isDirty"
    >
      <template #feedback>
        <span v-if="saveMessage" class="text-[10px] font-mono" :class="saveMessage.includes('Error') ? 'text-geist-error' : 'text-geist-success'">{{ saveMessage }}</span>
      </template>
    </PimEditorToolbar>

    <div class="flex-1 flex overflow-hidden relative">
      <PimEditorPalette />

      <main 
        ref="vueFlowContainer" 
        class="flex-1 relative bg-geist-accents-1/30 overflow-hidden"
        @dragover="onDragOver"
        @drop="onDrop"
      >
        <VueFlow
          id="pim-flow"
          v-model:nodes="localNodes"
          v-model:edges="localEdges"
          :node-types="nodeTypes"
          :edge-types="edgeTypes"
          fit-view-on-init
          class="pim-flow-canvas"
          @edge-double-click="({ edge }) => handleEditEdge(edge.id)"
        >
          <Background pattern-color="#888" :gap="20" />
          <Controls />
          
          <Panel position="top-right" class="mr-4 mt-4">
             <button 
              v-if="!showProperties && selectedNodeId"
              @click="showProperties = true"
              class="w-10 h-10 rounded-full bg-geist-bg border border-geist-border shadow-md flex items-center justify-center text-geist-accents-4 hover:text-geist-fg transition-all active:scale-90"
              title="Ver Propiedades"
            >
              <i class="fa-solid fa-sliders"></i>
            </button>
          </Panel>

          <!-- Nodos personalizados con sus eventos -->
          <template #node-custom="nodeProps">
            <PimCustomNode
              v-bind="nodeProps"
              @delete-node="handleDeleteNode"
            />
          </template>

          <!-- Eventos de aristas personalizadas delegados a través de VueFlow -->
          <template #edge-custom="edgeProps">
            <PimCustomEdge
              v-bind="edgeProps"
              @delete-edge="handleDeleteEdge"
              @edit-edge="handleEditEdge"
            />
          </template>
        </VueFlow>
      </main>

      <transition name="slide-right">
        <PimEditorProperties 
          v-if="showProperties"
          :node-id="selectedNodeId"
          :available-cim-components="availableCimComponents"
          @close="showProperties = false"
          @delete-node="handleDeleteNode"
          @remove-edges-for-param="handleRemoveEdgesForParam"
        />
      </transition>
    </div>

    <PimNodeModal
      :show="showNodeModal"
      title="Configurar Nuevo Elemento"
      confirm-text="Crear Elemento"
      :available-cim-components="availableCimComponents"
      @close="showNodeModal = false"
      @confirm="handleConfirmNode"
    />

    <PimEdgeModal
      :show="showEdgeModal"
      :title="edgeModalTitle"
      :confirm-text="edgeModalConfirmText"
      :available-cim-components="availableCimComponents"
      :edge-type="pendingEdgeData?.type || localEdges.find(e => e.id === editingEdgeId)?.data?.type"
      :initial-data="edgeModalInitialData"
      @close="showEdgeModal = false; editingEdgeId = null; pendingEdgeData = null"
      @confirm="handleConfirmEdge"
      @delete="() => { if (editingEdgeId) { handleDeleteEdge(editingEdgeId); showEdgeModal = false; editingEdgeId = null; } }"
    />

    <!-- Modal de Confirmación de Guardado -->
    <BaseModal :show="showSaveConfirm" title="Guardar Cambios" @close="showSaveConfirm = false">
      <div class="space-y-6">
        <div class="p-4 bg-geist-warning/5 border border-geist-warning/20 rounded-xl flex items-start gap-4">
          <div class="w-10 h-10 rounded-full bg-geist-warning/10 flex items-center justify-center flex-shrink-0">
            <i class="fa-solid fa-floppy-disk text-geist-warning text-xl"></i>
          </div>
          <div>
            <p class="text-sm text-geist-fg font-medium mb-1">
              Estás a punto de sobrescribir el modelo de la máquina.
            </p>
            <p class="text-xs text-geist-accents-5 leading-relaxed">
              Los cambios realizados en el editor gráfico reemplazarán el JSON almacenado actualmente. Esta acción actualizará tanto la base de datos como el editor JSON.
            </p>
          </div>
        </div>

        <div class="flex gap-3">
          <button 
            class="geist-button-secondary flex-1" 
            @click="showSaveConfirm = false"
          >
            Cancelar
          </button>
          <button 
            class="geist-button-primary flex-1" 
            @click="executeSave"
          >
            Confirmar y Guardar
          </button>
        </div>
      </div>
    </BaseModal>

    <!-- Modal de Error de Conexión -->
    <BaseModal :show="showErrorModal" title="Conexión Inválida" @close="showErrorModal = false">
      <div class="space-y-6">
        <div class="p-4 bg-geist-error/5 border border-geist-error/20 rounded-xl flex items-start gap-4">
          <div class="w-10 h-10 rounded-full bg-geist-error/10 flex items-center justify-center flex-shrink-0">
            <i class="fa-solid fa-circle-exclamation text-geist-error text-xl"></i>
          </div>
          <div>
            <p class="text-sm text-geist-fg font-medium mb-1">
              Incompatibilidad de Señal
            </p>
            <p class="text-xs text-geist-accents-5 leading-relaxed">
              {{ errorMessage }}
            </p>
          </div>
        </div>

        <div class="flex gap-3">
          <button 
            class="geist-button-primary flex-1 !bg-geist-fg" 
            @click="showErrorModal = false"
          >
            Entendido
          </button>
        </div>
      </div>
    </BaseModal>

    <transition name="fade">
      <div v-if="isSaving" class="absolute inset-0 bg-geist-bg/40 backdrop-blur-[2px] z-50 flex items-center justify-center">
        <div class="flex flex-col items-center gap-4">
          <div class="w-10 h-10 border-2 border-geist-accents-2 border-t-geist-fg rounded-full animate-spin"></div>
          <span class="text-[10px] font-bold uppercase tracking-widest text-geist-fg">Guardando Cambios...</span>
        </div>
      </div>
    </transition>
  </div>
</template>

<style>
.pim-flow-canvas {
  background-color: transparent !important;
}

.vue-flow__edge-path {
  stroke-dasharray: 5;
  animation: dash 20s linear infinite;
}

@keyframes dash {
  from { stroke-dashoffset: 1000; }
  to { stroke-dashoffset: 0; }
}

.slide-right-enter-active, .slide-right-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.slide-right-enter-from, .slide-right-leave-to {
  transform: translateX(100%);
  opacity: 0;
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>
