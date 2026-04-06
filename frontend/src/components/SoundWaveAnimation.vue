<script setup lang="ts">
/**
 * SoundWaveAnimation.vue
 * Componente que renderiza una animación de ondas de sonido usando Three.js.
 * Ahora utiliza líneas dinámicas en lugar de puntos para una mayor visibilidad
 * y está diseñado para funcionar como un fondo sutil.
 */
import { onMounted, onUnmounted, ref } from 'vue'
import * as THREE from 'three'

const container = ref<HTMLElement | null>(null)
let renderer: THREE.WebGLRenderer
let scene: THREE.Scene
let camera: THREE.PerspectiveCamera
let waves: THREE.Line[] = []
let animationId: number

/**
 * Obtiene el color síncrono para el tema
 */
const getThemeColor = () => {
  const color = getComputedStyle(document.documentElement).getPropertyValue('--color-geist-fg').trim()
  return color || (document.documentElement.classList.contains('dark') ? '#ffffff' : '#000000')
}

/**
 * Inicialización de Three.js con mayor robustez
 */
const init = () => {
  if (!container.value || container.value.clientWidth === 0) return

  scene = new THREE.Scene()
  camera = new THREE.PerspectiveCamera(75, container.value.clientWidth / container.value.clientHeight, 0.1, 1000)
  camera.position.z = 10 // Más cerca para ver mejor las ondas en espacios pequeños

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
  renderer.setPixelRatio(window.devicePixelRatio)
  renderer.setSize(container.value.clientWidth, container.value.clientHeight)
  container.value.appendChild(renderer.domElement)

  const themeColor = new THREE.Color(getThemeColor())
  
  // Crear 8 líneas de ondas con gradiente de profundidad
  const lineCount = 8
  for (let i = 0; i < lineCount; i++) {
    const points: THREE.Vector3[] = []
    const segments = 120
    const width = 45
    
    for (let j = 0; j <= segments; j++) {
      const x = (j / segments) * width - width / 2
      points.push(new THREE.Vector3(x, 0, 0))
    }
    
    const geometry = new THREE.BufferGeometry().setFromPoints(points)
    const material = new THREE.LineBasicMaterial({ 
      color: themeColor, 
      transparent: true, 
      opacity: 0.15 + (i / lineCount) * 0.35,
      linewidth: 2
    })
    
    const line = new THREE.Line(geometry, material)
    line.position.z = i * -2.5
    scene.add(line)
    waves.push(line)
  }

  const animate = (time: number) => {
    animationId = requestAnimationFrame(animate)
    const t = time * 0.0008

    waves.forEach((line, i) => {
      const positions = line.geometry.attributes.position.array as Float32Array
      for (let j = 0; j < positions.length; j += 3) {
        const x = positions[j]
        // Frecuencias combinadas para un efecto de fluido/onda
        const freq = 0.3 + (i * 0.05)
        const amp = 2.5 + (i * 0.4)
        const y = Math.sin(x * freq + t + i) * Math.cos(x * 0.1 + t * 0.5) * amp
        positions[j + 1] = y
      }
      line.geometry.attributes.position.needsUpdate = true
    })

    renderer.render(scene, camera)
  }
  animate(0)
}

const handleResize = () => {
  if (!container.value || !camera || !renderer) return
  camera.aspect = container.value.clientWidth / container.value.clientHeight
  camera.updateProjectionMatrix()
  renderer.setSize(container.value.clientWidth, container.value.clientHeight)
}

onMounted(() => {
  // Pequeño retardo para asegurar que el DOM y estilos estén listos
  setTimeout(() => {
    init()
    window.addEventListener('resize', handleResize)
  }, 50)
  
  const observer = new MutationObserver(() => {
    const newColor = new THREE.Color(getThemeColor())
    waves.forEach(line => (line.material as THREE.LineBasicMaterial).color.set(newColor))
  })
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  cancelAnimationFrame(animationId)
  if (renderer) {
    renderer.dispose()
    renderer.domElement.remove()
  }
})
</script>

<template>
  <div ref="container" class="w-full h-full flex items-center justify-center overflow-hidden"></div>
</template>

<style scoped>
/* Sin máscaras agresivas para asegurar visibilidad inicial */
div {
  transition: opacity 0.5s ease;
}
</style>
