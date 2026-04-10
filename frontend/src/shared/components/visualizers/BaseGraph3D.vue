<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { disposeScene } from '@/shared/utils/three-helpers'

const canvasRef = ref<HTMLDivElement | null>(null)
let scene: THREE.Scene
let camera: THREE.PerspectiveCamera
let renderer: THREE.WebGLRenderer
let controls: OrbitControls
let animationFrameId: number
let objects: THREE.Group
let raycaster: THREE.Raycaster
let mouse: THREE.Vector2
const clock = new THREE.Clock()

const emit = defineEmits<{
  (e: 'click', data: { nodeId?: string, edgeData?: { sourceId: string, targetId: string } }): void
  (e: 'animate', time: number): void
}>()

const initScene = () => {
  if (!canvasRef.value) return

  scene = new THREE.Scene()
  scene.background = null

  const width = canvasRef.value.clientWidth
  const height = canvasRef.value.clientHeight
  camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000)
  camera.position.set(0, 8, 12)

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
  renderer.setSize(width, height)
  renderer.setPixelRatio(window.devicePixelRatio)
  canvasRef.value.appendChild(renderer.domElement)

  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.dampingFactor = 0.05
  controls.minDistance = 5
  controls.maxDistance = 50

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
  scene.add(ambientLight)

  const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2)
  directionalLight.position.set(10, 20, 10)
  scene.add(directionalLight)

  raycaster = new THREE.Raycaster()
  mouse = new THREE.Vector2()

  objects = new THREE.Group()
  scene.add(objects)

  canvasRef.value.addEventListener('click', onClick)

  animate()
}

const onClick = (event: MouseEvent) => {
  if (!canvasRef.value || !camera || !objects) return

  const rect = canvasRef.value.getBoundingClientRect()
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

  raycaster.setFromCamera(mouse, camera)
  const intersects = raycaster.intersectObjects(objects.children, true)
  
  if (intersects.length > 0) {
    let target = intersects[0].object
    while (target.parent && !target.userData.nodeId && target !== objects) {
      target = target.parent as any
    }

    const nodeId = target.userData.nodeId
    if (nodeId) {
      emit('click', { nodeId })
      return
    }

    const type = target.userData.type || target.parent?.userData.type
    if (type === 'connector' || type === 'cable') {
      const edgeData = { 
        sourceId: target.userData.sourceId || target.parent?.userData.sourceId, 
        targetId: target.userData.targetId || target.parent?.userData.targetId 
      }
      if (edgeData.sourceId && edgeData.targetId) {
        emit('click', { edgeData })
        return
      }
    }
  }
  
  emit('click', {})
}

const animate = () => {
  animationFrameId = requestAnimationFrame(animate)
  if (controls) controls.update()
  
  const time = clock.getElapsedTime()
  emit('animate', time)

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

const clearObjects = () => {
  if (!objects) return
  while(objects.children.length > 0) {
    const obj = objects.children[0]
    disposeScene(obj)
    objects.remove(obj)
  }
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

defineExpose({
  scene: () => scene,
  camera: () => camera,
  objects: () => objects,
  clearObjects,
  raycaster: () => raycaster
})
</script>

<template>
  <div class="base-graph-3d w-full h-full relative group">
    <div ref="canvasRef" class="w-full h-full cursor-grab active:cursor-grabbing"></div>
    <slot name="overlay"></slot>
  </div>
</template>

<style scoped>
.base-graph-3d {
  background: radial-gradient(circle at center, rgba(0,0,0,0.1) 0%, transparent 80%);
}
</style>
