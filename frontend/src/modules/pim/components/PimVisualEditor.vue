<script setup lang="ts">
import { ref, markRaw, onMounted } from 'vue'
import { VueFlow, useVueFlow, Panel, type NodeTypesObject } from '@vue-flow/core'
import { Background } from '@vue-flow/background'
import { Controls } from '@vue-flow/controls'
import '@vue-flow/core/dist/style.css'
import '@vue-flow/core/dist/theme-default.css'

import PimEditorPalette from './PimEditorPalette.vue'
import PimEditorToolbar from './PimEditorToolbar.vue'
import PimEditorProperties from './PimEditorProperties.vue'
import PimCustomNode from './PimCustomNode.vue'
import GenericAddEditModal from '@/shared/components/modals/GenericAddEditModal.vue'

import { usePimStore } from '../stores/pimStore'
import { PIM_NODE_METADATA, PIM_MODIFIABLE_PARAMS } from '../utils/pim-node-metadata'

const store = usePimStore()
const localNodes = ref<any[]>([])
const localEdges = ref<any[]>([])

const nodeTypes: NodeTypesObject = {
  custom: markRaw(PimCustomNode) as any,
}

const { 
  onConnect, addEdges, addNodes, toObject, fromObject, project, findNode,
  onNodeClick, onPaneClick
} = useVueFlow()

const isSaving = ref(false)
const showProperties = ref(false)
const selectedNodeId = ref<string | undefined>(undefined)

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
const showEdgeModal = ref(false)
const pendingEdgeData = ref<any>(null)

// --- Carga Inicial ---
onMounted(() => {
  if (store.selectedMachine) {
    const doc = store.parsedDocs[store.selectedMachine.id]
    if (doc) {
      const flowNodes = doc.nodes.map((n: any) => ({
        id: n.id,
        type: 'custom',
        position: n.gui || { x: Math.random() * 400, y: Math.random() * 300 },
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
        source: e.sourceNode,
        target: e.targetNode,
        sourceHandle: e.sourceParam,
        targetHandle: e.targetParam,
        label: e.description,
        data: { type: e.type, description: e.description },
        style: { stroke: e.type === 'audio' ? '#e11d48' : '#10b981', strokeWidth: 2 }
      }))

      localNodes.value = flowNodes
      localEdges.value = flowEdges
      setTimeout(() => fromObject({ nodes: flowNodes, edges: flowEdges }), 50)
    }
  }
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

const handleConfirmNode = (name: string, description: string) => {
  if (!pendingNodeData.value) return
  
  const { type, position } = pendingNodeData.value
  const id = crypto.randomUUID()
  
  const defaultParams: any = { id, name, type, description, ids_references: ["ref_project_description"] }
  
  if (type === 'oscillator') {
    defaultParams.waveform = 'sine'; defaultParams.frequency = 440; defaultParams.gain = 0.5; defaultParams.pan = 0; defaultParams.pulseWidth = 0.5; defaultParams.phase = 0
  } else if (type === 'mixer') {
    defaultParams.inputs_number = 2; defaultParams.stereo = false
  } else if (type === 'lfo') {
    defaultParams.waveform = 'sine'; defaultParams.rate = 1; defaultParams.amplitude = 1
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
  showProperties.value = true
}

// --- Lógica de Conexión ---
onConnect((params) => {
  const sourceNode = findNode(params.source)
  const targetNode = findNode(params.target)
  
  if (!sourceNode || !targetNode) return

  const sourceIsMod = params.sourceHandle === 'output' && (sourceNode.data.type === 'lfo' || sourceNode.data.type === 'envelope')
  const targetIsMod = !params.targetHandle?.startsWith('input_') 
  
  if (sourceIsMod !== targetIsMod) {
    alert('Error: No se pueden mezclar señales de Audio con señales de Modulación.')
    return
  }

  const type = sourceIsMod ? 'modification' : 'audio'
  pendingEdgeData.value = { ...params, type }
  showEdgeModal.value = true
})

const handleConfirmEdge = (_name: string, description: string) => {
  if (!pendingEdgeData.value) return
  
  const { type } = pendingEdgeData.value
  const id = crypto.randomUUID()
  
  addEdges([{
    ...pendingEdgeData.value,
    id,
    label: description,
    data: { type, description },
    style: { stroke: type === 'audio' ? '#e11d48' : '#10b981', strokeWidth: 2 }
  }])
  
  showEdgeModal.value = false
  pendingEdgeData.value = null
}

// --- Persistencia ---
const handleSave = async () => {
  if (!store.selectedMachine) return
  isSaving.value = true
  
  const flowState = toObject()
  
  const pimNodes = flowState.nodes.map((n: any) => {
    const rawData = n.data.parameters
    const metadata = PIM_NODE_METADATA[n.data.type]
    
    const node: any = {
      id: n.id,
      name: n.data.name,
      description: n.data.description || '',
      type: n.data.type,
      ids_references: rawData?.ids_references || ["ref_project_description"],
      gui: n.position
    }

    const wrapParam = (key: string, value: any) => {
      const existing = rawData?.[key] || {}
      return {
        id: existing.id || crypto.randomUUID(),
        ids_references: existing.ids_references || ["ref_cim_machine_description"],
        initialValue: value,
        isModifiable: existing.isModifiable ?? true,
        description: existing.description || ''
      }
    }

    const wrapCP = (key: string) => {
      const existing = rawData?.[key] || {}
      return {
        id: existing.id || crypto.randomUUID(),
        ids_references: existing.ids_references || ["ref_cim_machine_description"],
        description: existing.description || ''
      }
    }

    const paramsList = PIM_MODIFIABLE_PARAMS[n.data.type] || []
    paramsList.forEach(p => {
      if (rawData?.[p] !== undefined) {
        node[p] = wrapParam(p, rawData[p])
      }
    })

    if (metadata) {
      if ('stereo' in (rawData || {}) || metadata.inputs.length > 0 || metadata.outputs.length > 0) {
        node.stereo = wrapParam('stereo', rawData?.stereo ?? false)
      }
      metadata.inputs.forEach((i: any) => node[i.id] = wrapCP(i.id))
      metadata.outputs.forEach((o: any) => node[o.id] = wrapCP(o.id))
    }

    if (rawData) {
      if ('waveform' in rawData) node.waveform = wrapParam('waveform', rawData.waveform)
      if ('noiseType' in rawData) node.noiseType = wrapParam('noiseType', rawData.noiseType)
      if ('filterType' in rawData) node.filterType = wrapParam('filterType', rawData.filterType)
      if ('envelopeType' in rawData) node.envelopeType = wrapParam('envelopeType', rawData.envelopeType)
      if ('inputs_number' in rawData) node.inputs_number = wrapParam('inputs_number', rawData.inputs_number)
    }

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
    ids_references: ["ref_project_description"]
  }))

  const finalJson = {
    id: store.parsedDocs[store.selectedMachine.id]?.id || crypto.randomUUID(),
    name: store.selectedMachine.name,
    description: store.selectedMachine.description,
    ids_cim_reference: store.parsedDocs[store.selectedMachine.id]?.ids_cim_reference || [],
    nodes: pimNodes,
    edges: pimEdges
  }

  const result = await store.updateMachineRawJson(store.selectedMachine.id, JSON.stringify(finalJson, null, 2))
  if (result.success) console.log('Modelo PIM guardado con éxito')
  isSaving.value = false
}

const handleCapture = () => console.log('Capturando imagen...')
</script>

<template>
  <div class="pim-visual-editor flex flex-col h-full bg-geist-bg select-none relative overflow-hidden">
    <PimEditorToolbar @save="handleSave" @capture="handleCapture" />

    <div class="flex-1 flex overflow-hidden relative">
      <PimEditorPalette />

      <main 
        ref="vueFlowContainer" 
        class="flex-1 relative bg-geist-accents-1/30 overflow-hidden"
        @dragover="onDragOver"
        @drop="onDrop"
      >
        <VueFlow
          v-model:nodes="localNodes"
          v-model:edges="localEdges"
          :node-types="nodeTypes"
          fit-view-on-init
          class="pim-flow-canvas"
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
        </VueFlow>
      </main>

      <transition name="slide-right">
        <PimEditorProperties 
          v-if="showProperties"
          :node-id="selectedNodeId"
          @close="showProperties = false"
        />
      </transition>
    </div>

    <GenericAddEditModal
      :show="showNodeModal"
      title="Configurar Nuevo Nodo"
      entity-label="Nodo"
      confirm-text="Crear Nodo"
      @close="showNodeModal = false"
      @confirm="handleConfirmNode"
    />

    <GenericAddEditModal
      :show="showEdgeModal"
      title="Descripción de la Conexión"
      entity-label="Conexión"
      confirm-text="Conectar"
      :show-name-field="false"
      @close="showEdgeModal = false"
      @confirm="handleConfirmEdge"
    />

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
