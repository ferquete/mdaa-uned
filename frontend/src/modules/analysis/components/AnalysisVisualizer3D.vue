<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import * as THREE from 'three'
import BaseGraph3D from '@/shared/components/visualizers/BaseGraph3D.vue'
import { createTextTexture, createCableGroup } from '@/shared/utils/three-helpers'
import type { CimDocument } from '@/shared/types'

const props = defineProps<{
  machineJson: string
}>()

const baseGraphRef = ref<InstanceType<typeof BaseGraph3D> | null>(null)
const selectedNodeId = ref<string | null>(null)
const selectedEdgeData = ref<{ sourceId: string, targetId: string } | null>(null)
const adjacencyMap = new Map<string, Set<string>>()

const colors = {
  rel: 0x0070f3,
  ref: 0xee0000,
  mod: 0x059669,
  gen: 0x0070f3,
  genBorder: 0x00aaff,
  modBorder: 0x059669
}

const updateVisuals = () => {
  const objects = baseGraphRef.value?.objects()
  if (!objects) return

  objects.traverse((obj) => {
    if (obj instanceof THREE.Mesh || obj instanceof THREE.Sprite || obj instanceof THREE.LineSegments) {
      let isRelated = false
      const data = { ...obj.parent?.userData, ...obj.userData }
      const nodeId = data.nodeId
      const sourceId = data.sourceId
      const targetId = data.targetId
      const type = data.type

      if (!selectedNodeId.value && !selectedEdgeData.value) {
        isRelated = true
      } else if (selectedNodeId.value) {
        const id = selectedNodeId.value
        if (nodeId === id) isRelated = true
        else if (nodeId && adjacencyMap.get(id)?.has(nodeId)) isRelated = true
        else if ((type === 'cable' || type === 'connector') && (sourceId === id || targetId === id)) isRelated = true
      } else if (selectedEdgeData.value) {
        const edge = selectedEdgeData.value
        if (nodeId === edge.sourceId || nodeId === edge.targetId) isRelated = true
        else if ((type === 'cable' || type === 'connector') && (sourceId === edge.sourceId && targetId === edge.targetId)) isRelated = true
      }

      const opacity = isRelated ? 1 : 0.12
      if (obj.material) {
        const mat = obj.material as any
        mat.transparent = true
        mat.opacity = opacity
      }
    }
  })
}

const renderMachine = () => {
  const objects = baseGraphRef.value?.objects()
  if (!objects || !baseGraphRef.value) return
  
  baseGraphRef.value.clearObjects()
  
  try {
    const data: CimDocument = JSON.parse(props.machineJson || '{}')
    selectedNodeId.value = null
    adjacencyMap.clear()
    
    const generators = data.generators || []
    const modificators = data.modificators || []
    const allNodes = [...generators, ...modificators]
    if (allNodes.length === 0) return

    allNodes.forEach(node => adjacencyMap.set(node.id, new Set()))
    const nodePositions = new Map<string, THREE.Vector3>()
    const radius = Math.max(5, allNodes.length * 0.8)

    // Render Nodos
    allNodes.forEach((node, index) => {
      const angle = (index / allNodes.length) * Math.PI * 2
      const x = Math.cos(angle) * radius
      const y = Math.sin(index * 0.5) * 1.5
      const z = Math.sin(angle) * radius
      const pos = new THREE.Vector3(x, y, z)
      nodePositions.set(node.id, pos)

      const isGenerator = (node as any).$type === 'AudioGenerator' || generators.includes(node as any)
      const nodeGroup = new THREE.Group()
      nodeGroup.position.copy(pos)
      nodeGroup.userData = { nodeId: node.id }

      const geometry = new THREE.SphereGeometry(0.8, 32, 32)
      const material = new THREE.MeshStandardMaterial({ 
        color: isGenerator ? colors.gen : colors.mod,
        metalness: 0, roughness: 1, transparent: true
      })
      const mesh = new THREE.Mesh(geometry, material)
      mesh.userData = { nodeId: node.id, type: 'node' }
      nodeGroup.add(mesh)
      
      const labelData = createTextTexture(node.name || node.id)
      if (labelData) {
        const spriteMat = new THREE.SpriteMaterial({ map: labelData.texture, transparent: true, depthTest: false })
        const sprite = new THREE.Sprite(spriteMat)
        sprite.position.y = 1.8
        const aspectRatio = labelData.width / labelData.height
        sprite.scale.set(0.8 * aspectRatio, 0.8, 1)
        nodeGroup.add(sprite)
      }
      objects.add(nodeGroup)
    })

    // Render Connections
    const drawConnection = (sourceId: string, targetId: any, color: number) => {
      const tId = typeof targetId === 'string' ? targetId : targetId?.id
      if (!tId || sourceId === tId || !nodePositions.has(tId)) return
      
      adjacencyMap.get(sourceId)?.add(tId)
      adjacencyMap.get(tId)?.add(sourceId)

      const start = nodePositions.get(sourceId)!
      const end = nodePositions.get(tId)!
      const cable = createCableGroup(start, end, color, sourceId, tId)
      objects.add(cable)
    }

    generators.forEach(gen => {
      if (gen.refs) gen.refs.forEach(r => drawConnection(gen.id, r, colors.ref))
      if (gen.rels) gen.rels.forEach(r => drawConnection(gen.id, r, colors.rel))
    })
    modificators.forEach(mod => {
      if (mod.refs) mod.refs.forEach(r => drawConnection(mod.id, r, colors.ref))
    })

    // Suelo
    const platformGeo = new THREE.GridHelper(radius * 4, 30, 0x222222, 0x111111)
    platformGeo.position.y = -3
    objects.add(platformGeo)

  } catch (e) {
    console.error("Error al renderizar máquina 3D:", e)
  }
}

const onAnimate = (time: number) => {
  const objects = baseGraphRef.value?.objects()
  if (!objects) return
  
  const flowSpeed = 1.5
  objects.traverse((obj) => {
    if (obj.userData.type === 'cable-segment') {
      const d = obj.userData
      const totalLen = d.segmentLen + d.gapLen
      let flowOffset = (time * flowSpeed) % totalLen
      const normalizedT = (d.index * totalLen + flowOffset) % (d.distance + totalLen)
      
      if (normalizedT > d.distance) {
        obj.visible = false
      } else {
        obj.visible = true
        const pStart = new THREE.Vector3().lerpVectors(d.start, d.end, normalizedT / d.distance)
        const pEnd = new THREE.Vector3().lerpVectors(d.start, d.end, Math.min((normalizedT + d.segmentLen) / d.distance, 1.0))
        obj.position.copy(new THREE.Vector3().addVectors(pStart, pEnd).multiplyScalar(0.5))
        obj.lookAt(pEnd)
        obj.rotateX(Math.PI / 2)
      }
    }
  })
}

const onClick = (data: any) => {
  selectedNodeId.value = data.nodeId || null
  selectedEdgeData.value = data.edgeData || null
  updateVisuals()
}

watch(() => props.machineJson, () => renderMachine())
onMounted(() => setTimeout(renderMachine, 50))
</script>

<template>
  <BaseGraph3D ref="baseGraphRef" @click="onClick" @animate="onAnimate">
    <template #overlay>
      <div class="absolute bottom-4 left-4 flex items-center gap-6 pointer-events-none opacity-40 group-hover:opacity-100 transition-opacity">
        <div class="flex items-center gap-2">
          <div class="w-3 h-3 bg-node-generator rounded-full"></div>
          <span class="text-[10px] font-mono text-geist-fg">Generadores</span>
        </div>
        <div class="flex items-center gap-2">
          <div class="w-3 h-3 bg-node-modificator rounded-full"></div>
          <span class="text-[10px] font-mono text-geist-fg">Modificadores</span>
        </div>
      </div>
    </template>
  </BaseGraph3D>
</template>
