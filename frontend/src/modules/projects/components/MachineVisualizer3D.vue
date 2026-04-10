<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import type { CimDocument } from '@/shared/types'

const props = defineProps<{
  machineJson: string
}>()

const canvasRef = ref<HTMLDivElement | null>(null)
let scene: THREE.Scene
let camera: THREE.PerspectiveCamera
let renderer: THREE.WebGLRenderer
let controls: OrbitControls
let animationFrameId: number
let objects: THREE.Group
let raycaster: THREE.Raycaster
let mouse: THREE.Vector2
const selectedNodeId = ref<string | null>(null)
const selectedEdgeData = ref<{ sourceId: string, targetId: string } | null>(null)
const adjacencyMap = new Map<string, Set<string>>()
const clock = new THREE.Clock()

// Colores estáticos independientes del tema
const getThemeColors = () => {
  return {
    rel: 0x0070f3,
    ref: 0xee0000,
    mod: 0x059669,
    gen: 0x0070f3,
    genBorder: 0x00aaff,
    modBorder: 0x059669
  }
}

// Helper para crear texturas de texto para Sprites (Dinámico y sin difuminado)
const createTextTexture = (text: string) => {
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')
  if (!context) return null
  
  const fontSize = 48
  const paddingX = 60
  const paddingY = 30
  
  context.font = `Bold ${fontSize}px "JetBrains Mono", monospace`
  const textMetrics = context.measureText(text)
  const textWidth = textMetrics.width
  
  // Ajustar tamaño del canvas al contenido
  canvas.width = textWidth + (paddingX * 2)
  canvas.height = fontSize + (paddingY * 2)
  
  // Limpiar y dibujar fondo ajustado
  context.clearRect(0, 0, canvas.width, canvas.height)
  
  // Fondo sólido y nítido
  context.fillStyle = 'rgba(0, 0, 0, 0.85)'
  context.beginPath()
  const radius = 15
  context.roundRect(0, 0, canvas.width, canvas.height, radius)
  context.fill()
  
  // Borde nítido
  context.lineWidth = 3
  context.strokeStyle = 'rgba(255, 255, 255, 0.3)'
  context.stroke()
  
  // Texto sin sombras ni difuminados
  context.font = `Bold ${fontSize}px "JetBrains Mono", monospace`
  context.textAlign = 'center'
  context.textBaseline = 'middle'
  context.fillStyle = '#ffffff'
  context.fillText(text, canvas.width / 2, canvas.height / 2)
  
  const texture = new THREE.CanvasTexture(canvas)
  texture.minFilter = THREE.LinearFilter
  texture.magFilter = THREE.LinearFilter
  texture.needsUpdate = true
  
  return { texture, width: canvas.width, height: canvas.height }
}

// Helper para crear un "cable" 3D segmentado y animable
const createCable = (start: THREE.Vector3, end: THREE.Vector3, color: number, sourceId: string, targetId: string) => {
  const group = new THREE.Group()
  const distance = start.distanceTo(end)
  const radius = 0.04 // Un poco más fino para que luzca mejor como flujo
  
  const segmentLen = 0.6
  const gapLen = 0.4
  const totalLen = segmentLen + gapLen
  const numSegments = Math.ceil(distance / totalLen) + 1 // Uno extra para el efecto de wrap-around
  
  for (let i = 0; i < numSegments; i++) {
    const geometry = new THREE.CylinderGeometry(radius, radius, segmentLen, 6)
    const material = new THREE.MeshPhongMaterial({ 
      color: color,
      emissive: color,
      emissiveIntensity: 0.6,
      transparent: true,
      opacity: 0.8
    })
    const mesh = new THREE.Mesh(geometry, material)
    
    // Guardamos metadatos para la animación
    mesh.userData = { 
      type: 'cable-segment',
      index: i,
      totalSegments: numSegments,
      segmentLen,
      gapLen,
      distance,
      start: start.clone(),
      end: end.clone()
    }
    
    group.add(mesh)
  }
  
  group.userData = { type: 'cable', sourceId, targetId }
  return group
}

const initScene = () => {
  if (!canvasRef.value) return

  // Scene
  scene = new THREE.Scene()
  scene.background = null

  // Camera
  const width = canvasRef.value.clientWidth
  const height = canvasRef.value.clientHeight
  camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000)
  camera.position.set(0, 8, 12)

  // Renderer
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
  renderer.setSize(width, height)
  renderer.setPixelRatio(window.devicePixelRatio)
  canvasRef.value.appendChild(renderer.domElement)

  // Controls
  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.dampingFactor = 0.05
  controls.minDistance = 5
  controls.maxDistance = 50

  // Lights
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
  scene.add(ambientLight)

  const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2)
  directionalLight.position.set(10, 20, 10)
  scene.add(directionalLight)

  const colors = getThemeColors()
  const hLight = new THREE.HemisphereLight(colors.gen, colors.mod, 0.6)
  scene.add(hLight)

  // Raycaster
  raycaster = new THREE.Raycaster()
  mouse = new THREE.Vector2()

  // Group to hold all machine components
  objects = new THREE.Group()
  scene.add(objects)

  canvasRef.value.addEventListener('click', onClick)

  renderMachine()
  animate()
}

const onClick = (event: MouseEvent) => {
  if (!canvasRef.value || !camera || !objects) return

  const rect = canvasRef.value.getBoundingClientRect()
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

  raycaster.setFromCamera(mouse, camera)
  
  // Buscar intersecciones en nodos y etiquetas
  const intersects = raycaster.intersectObjects(objects.children, true)
  
  if (intersects.length > 0) {
    let target = intersects[0].object
    // Encontrar el grupo del nodo (padre) si es una malla o sprite
    while (target.parent && !target.userData.nodeId && target !== objects) {
      target = target.parent as any
    }

    const nodeId = target.userData.nodeId
    if (nodeId) {
      selectedEdgeData.value = null
      selectedNodeId.value = selectedNodeId.value === nodeId ? null : nodeId
      updateVisuals()
      return
    }

    const type = target.userData.type || target.parent?.userData.type
    if (type === 'connector' || type === 'cable') {
      const edgeData = { 
        sourceId: target.userData.sourceId || target.parent?.userData.sourceId, 
        targetId: target.userData.targetId || target.parent?.userData.targetId 
      }
      
      if (edgeData.sourceId && edgeData.targetId) {
        selectedNodeId.value = null
        if (selectedEdgeData.value?.sourceId === edgeData.sourceId && selectedEdgeData.value?.targetId === edgeData.targetId) {
          selectedEdgeData.value = null
        } else {
          selectedEdgeData.value = edgeData
        }
        updateVisuals()
        return
      }
    }
  }
  
  // Si pulsamos fuera, deseleccionamos
  selectedNodeId.value = null
  selectedEdgeData.value = null
  updateVisuals()
}

const updateVisuals = () => {
  if (!objects) return

  objects.traverse((obj) => {
    if (obj instanceof THREE.Mesh || obj instanceof THREE.Sprite || obj instanceof THREE.LineSegments) {
      let isRelated = false
      
      // Buscar metadatos en el propio objeto o en su padre (para cables segmentados y grupos de nodos)
      const data = { ...obj.parent?.userData, ...obj.userData }
      const nodeId = data.nodeId
      const sourceId = data.sourceId
      const targetId = data.targetId
      const type = data.type

      if (!selectedNodeId.value && !selectedEdgeData.value) {
        // Estado normal: todo visible
        isRelated = true
      } else if (selectedNodeId.value) {
        const id = selectedNodeId.value
        // Verificar relación con nodo
        if (nodeId === id) {
          isRelated = true
        } else if (nodeId && adjacencyMap.get(id)?.has(nodeId)) {
          isRelated = true
        } else if (type === 'cable' || type === 'connector') {
          if (sourceId === id || targetId === id) isRelated = true
        }
      } else if (selectedEdgeData.value) {
        const edge = selectedEdgeData.value
        // Verificar relación con arista
        if (nodeId === edge.sourceId || nodeId === edge.targetId) {
          isRelated = true
        } else if (type === 'cable' || type === 'connector') {
          if (sourceId === edge.sourceId && targetId === edge.targetId) isRelated = true
        }
      }

      const opacity = isRelated ? 1 : 0.12
      if (obj.material) {
        const mat = obj.material as any
        mat.transparent = true
        mat.opacity = opacity
        if (mat.emissive) {
          mat.emissiveIntensity = isRelated ? 0.3 : 0
        }
      }
    }
  })
}

const renderMachine = () => {
  if (!objects) return
  
  const colors = getThemeColors()
  
  // Limpieza profunda de geometrías y materiales
  while(objects.children.length > 0){ 
    const obj = objects.children[0]
    const cleanup = (o: THREE.Object3D) => {
      if (o instanceof THREE.Mesh || o instanceof THREE.Sprite || o instanceof THREE.LineSegments) {
        if (o.geometry) o.geometry.dispose()
        if (o.material) {
          if (Array.isArray(o.material)) {
            o.material.forEach(m => m.dispose())
          } else {
            o.material.dispose()
          }
        }
      }
      o.children.forEach(cleanup)
    }
    cleanup(obj)
    objects.remove(obj)
  }

  try {
    const jsonStr = props.machineJson || '{}'
    const data: CimDocument = JSON.parse(jsonStr)
    
    selectedNodeId.value = null
    adjacencyMap.clear()
    
    const generators = data.generators || []
    const modificators = data.modificators || []
    const allNodes = [...generators, ...modificators]
    
    if (allNodes.length === 0) return

    // Construir mapa de adyacencia inicial
    allNodes.forEach(node => adjacencyMap.set(node.id, new Set()))

    const nodePositions = new Map<string, THREE.Vector3>()
    const total = allNodes.length
    const radius = Math.max(5, total * 0.8)

    // 1. Renderizar Nodos
    allNodes.forEach((node, index) => {
      const angle = (index / total) * Math.PI * 2
      const x = Math.cos(angle) * radius
      const y = Math.sin(index * 0.5) * 1.5
      const z = Math.sin(angle) * radius
      const pos = new THREE.Vector3(x, y, z)
      nodePositions.set(node.id, pos)

      const isGenerator = (node as any).$type === 'CimGenerator' || generators.includes(node as any)
      
      const nodeGroup = new THREE.Group()
      nodeGroup.position.copy(pos)
      nodeGroup.userData = { nodeId: node.id }

      // Cuerpo del nodo (Esferas para todo según preferencia)
      const geometry = new THREE.SphereGeometry(0.8, 32, 32)
      
      const material = new THREE.MeshStandardMaterial({ 
        color: isGenerator ? colors.gen : colors.mod,
        metalness: 0,
        roughness: 1,
        transparent: true,
        emissiveIntensity: 0
      })
      
      const mesh = new THREE.Mesh(geometry, material)
      mesh.userData = { nodeId: node.id, type: 'node' }
      nodeGroup.add(mesh)
      
      // Borde brillante
      const wireGeo = new THREE.EdgesGeometry(geometry)
      const wireMat = new THREE.LineBasicMaterial({ 
        color: isGenerator ? colors.genBorder : colors.modBorder,
        transparent: true,
        opacity: 0.8
      })
      const wireframe = new THREE.LineSegments(wireGeo, wireMat)
      wireframe.userData = { nodeId: node.id, type: 'node_wire' }
      nodeGroup.add(wireframe)
      
      // Etiqueta de Texto (Sprite Dinámico)
      const labelData = createTextTexture(node.name || node.id)
      if (labelData) {
        const spriteMat = new THREE.SpriteMaterial({ 
          map: labelData.texture, 
          transparent: true,
          depthTest: false 
        })
        const sprite = new THREE.Sprite(spriteMat)
        sprite.userData = { nodeId: node.id, type: 'label' }
        sprite.position.y = 1.8
        const aspectRatio = labelData.width / labelData.height
        const baseHeight = 0.8
        sprite.scale.set(baseHeight * aspectRatio, baseHeight, 1)
        nodeGroup.add(sprite)
      }
      
      objects.add(nodeGroup)
    })

    // 2. Renderizar Conexiones (Cables 3D) con Anti-solapamiento
    const drawConnection = (sourceId: string, targetId: string | any, color: number) => {
      const targetIdStr = typeof targetId === 'string' ? targetId : targetId?.id
      if (!targetIdStr) return
      if (!allNodes.some(n => n.id === targetIdStr)) return // Check existence
      if (sourceId === targetIdStr) return // Prevent self-referential lines mapping visually

      // Registrar relación en mapa
      adjacencyMap.get(sourceId)?.add(targetIdStr)
      adjacencyMap.get(targetIdStr)?.add(sourceId)

      const baseStart = nodePositions.get(sourceId)
      const baseEnd = nodePositions.get(targetIdStr)
      
      if (baseStart && baseEnd) {
        // Lógica de Anti-solapamiento (Jittering determinista)
        // Generamos un offset basado en la combinación de IDs para que sea siempre el mismo
        const hash = (str: string) => {
          let h = 0;
          for (let i = 0; i < str.length; i++) h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
          return h;
        };
        
        const seed = hash(`${sourceId}-${targetIdStr}`);
        const jitterScale = 0.4; // Qué tanto se alejan del eje central en la superficie
        
        // Calcular vectores perpendiculares para el jitter
        const dir = new THREE.Vector3().subVectors(baseEnd, baseStart).normalize();
        let ortho = new THREE.Vector3(1, 0, 0);
        if (Math.abs(dir.x) > 0.9) ortho.set(0, 1, 0);
        ortho.cross(dir).normalize();
        const ortho2 = new THREE.Vector3().crossVectors(dir, ortho).normalize();
        
        // Aplicar jitter basado en el hash
        const angle = (seed % 100) / 100 * Math.PI * 2;
        const jitterOffset = new THREE.Vector3()
          .addScaledVector(ortho, Math.cos(angle) * jitterScale)
          .addScaledVector(ortho2, Math.sin(angle) * jitterScale);

        // Puntos finales ajustados en la superficie (radio 0.8)
        const start = baseStart.clone().add(jitterOffset).normalize().multiplyScalar(0.8).add(baseStart);
        // Para el destino, recalculamos la dirección desde el nuevo inicio corregido
        const finalDir = new THREE.Vector3().subVectors(baseEnd, start).normalize();
        const end = baseEnd.clone().sub(finalDir.clone().multiplyScalar(0.8));

        const cable = createCable(start, end, color, sourceId, targetIdStr);
        objects.add(cable);
      }
    }

    generators.forEach(gen => {
      if (gen.refs) gen.refs.forEach(r => drawConnection(gen.id, r, colors.ref))
      if (gen.rels) gen.rels.forEach(r => drawConnection(gen.id, r, colors.rel))
    })

    modificators.forEach(mod => {
      if (mod.refs) mod.refs.forEach(r => drawConnection(mod.id, r, colors.ref))
    })

    // Suelo técnico
    const platformGeo = new THREE.GridHelper(radius * 4, 30, 0x222222, 0x111111)
    platformGeo.position.y = -3
    objects.add(platformGeo)

  } catch (e) {
    console.error("Error al renderizar máquina 3D:", e)
  }
}

const animate = () => {
  animationFrameId = requestAnimationFrame(animate)
  if (controls) controls.update()
  
  const time = clock.getElapsedTime()
  const flowSpeed = 1.5 // Velocidad del flujo

  if (objects) {
    objects.traverse((obj) => {
      if (obj.userData.type === 'cable-segment') {
        const d = obj.userData
        const totalLen = d.segmentLen + d.gapLen
        
        // Calcular desplazamiento basado en el tiempo
        let flowOffset = (time * flowSpeed) % totalLen
        
        // Posición original del segmento
        const baseOffset = d.index * totalLen
        const currentT = baseOffset + flowOffset
        
        // Si el segmento está fuera de la longitud total del cable, lo ocultamos o lo recirculamos
        const normalizedT = currentT % (d.distance + totalLen)
        
        if (normalizedT > d.distance) {
          obj.visible = false
        } else {
          obj.visible = true
          // Actualizar posición y orientación del segmento
          const pStart = new THREE.Vector3().lerpVectors(d.start, d.end, normalizedT / d.distance)
          const pEnd = new THREE.Vector3().lerpVectors(d.start, d.end, Math.min((normalizedT + d.segmentLen) / d.distance, 1.0))
          
          obj.position.copy(new THREE.Vector3().addVectors(pStart, pEnd).multiplyScalar(0.5))
          obj.lookAt(pEnd)
          obj.rotateX(Math.PI / 2)
          
          // Desvanecimiento suave en los extremos para un flujo natural
          let fadeOpacity = 1.0
          if (normalizedT < d.segmentLen) fadeOpacity = normalizedT / d.segmentLen
          if (normalizedT > d.distance - d.segmentLen) fadeOpacity = (d.distance - normalizedT) / d.segmentLen
          
          if ((obj as THREE.Mesh).material instanceof THREE.Material) {
            ((obj as THREE.Mesh).material as THREE.Material).opacity = Math.max(0, fadeOpacity * 0.8)
          }
        }
      }
    })
  }

  if (renderer && scene && camera) {
    renderer.render(scene, camera)
  }
}

const handleResize = () => {
  if (!canvasRef.value || !camera || !renderer) return
  const width = canvasRef.value.clientWidth
  const height = canvasRef.value.clientHeight
  camera.aspect = width / height
  camera.updateProjectionMatrix()
  renderer.setSize(width, height)
}

onMounted(() => {
  initScene()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  if (canvasRef.value) {
    canvasRef.value.removeEventListener('click', onClick)
  }
  window.removeEventListener('resize', handleResize)
  cancelAnimationFrame(animationFrameId)
  if (renderer) {
    renderer.dispose()
  }
})

watch(() => props.machineJson, () => {
  renderMachine()
})
</script>

<template>
  <div class="machine-3d-visualizer w-full h-full relative group">
    <div ref="canvasRef" class="w-full h-full cursor-grab active:cursor-grabbing"></div>
    
    <!-- Overlay Indicators -->
    <div class="absolute bottom-4 left-4 flex items-center gap-6 pointer-events-none opacity-40 group-hover:opacity-100 transition-opacity">
      <div class="flex items-center gap-2">
        <div class="w-3 h-3 bg-[var(--color-node-generator)] rounded-full shadow-[0_0_8px_var(--color-node-generator)]"></div>
        <span class="text-[10px] font-mono uppercase tracking-tighter text-geist-fg">Generadores</span>
      </div>
      <div class="flex items-center gap-2">
        <div class="w-3 h-3 bg-[var(--color-node-modificator)] rounded-full shadow-[0_0_8px_var(--color-node-modificator)]"></div>
        <span class="text-[10px] font-mono uppercase tracking-tighter text-geist-fg">Modificadores</span>
      </div>
      
      <div class="h-3 w-px bg-geist-accents-2 mx-1"></div>
      
      <div class="flex items-center gap-2">
        <div class="w-4 h-0 border-t-2 border-[var(--color-node-rel)] border-dashed"></div>
        <span class="text-[10px] font-mono uppercase tracking-tighter text-geist-fg">Propiedades</span>
      </div>
      <div class="flex items-center gap-2">
        <div class="w-4 h-0 border-t-2 border-[var(--color-node-ref)] border-dashed"></div>
        <span class="text-[10px] font-mono uppercase tracking-tighter text-geist-fg">Relaciones</span>
      </div>
    </div>
    
    <!-- Interaction Hint -->
    <div class="absolute top-4 right-4 text-[9px] font-mono text-geist-accents-4 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
      Exploración 3D
    </div>
  </div>
</template>

<style scoped>
.machine-3d-visualizer {
  background: radial-gradient(circle at center, rgba(0,0,0,0.1) 0%, transparent 80%);
}
</style>
