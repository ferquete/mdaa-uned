import * as THREE from 'three';

/**
 * Crea una textura de texto nítida para usar en Sprites de Three.js.
 */
export const createTextTexture = (text: string) => {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (!context) return null;
  
  const fontSize = 48;
  const paddingX = 60;
  const paddingY = 30;
  
  context.font = `Bold ${fontSize}px "JetBrains Mono", monospace`;
  const textMetrics = context.measureText(text);
  const textWidth = textMetrics.width;
  
  canvas.width = textWidth + (paddingX * 2);
  canvas.height = fontSize + (paddingY * 2);
  
  context.clearRect(0, 0, canvas.width, canvas.height);
  
  // Fondo sólido redondeado
  context.fillStyle = 'rgba(0, 0, 0, 0.85)';
  context.beginPath();
  const radius = 15;
  context.roundRect(0, 0, canvas.width, canvas.height, radius);
  context.fill();
  
  // Borde
  context.lineWidth = 3;
  context.strokeStyle = 'rgba(255, 255, 255, 0.3)';
  context.stroke();
  
  // Texto
  context.font = `Bold ${fontSize}px "JetBrains Mono", monospace`;
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillStyle = '#ffffff';
  context.fillText(text, canvas.width / 2, canvas.height / 2);
  
  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.needsUpdate = true;
  
  return { texture, width: canvas.width, height: canvas.height };
};

/**
 * Crea un grupo que representa un "cable" segmentado y animable entre dos puntos.
 */
export const createCableGroup = (
  start: THREE.Vector3, 
  end: THREE.Vector3, 
  color: number, 
  sourceId: string, 
  targetId: string,
  radius: number = 0.04
) => {
  const group = new THREE.Group();
  const distance = start.distanceTo(end);
  
  const segmentLen = 0.6;
  const gapLen = 0.4;
  const totalLen = segmentLen + gapLen;
  const numSegments = Math.ceil(distance / totalLen) + 1;
  
  for (let i = 0; i < numSegments; i++) {
    const geometry = new THREE.CylinderGeometry(radius, radius, segmentLen, 6);
    const material = new THREE.MeshPhongMaterial({ 
      color: color,
      emissive: color,
      emissiveIntensity: 0.6,
      transparent: true,
      opacity: 0.8
    });
    const mesh = new THREE.Mesh(geometry, material);
    
    mesh.userData = { 
      type: 'cable-segment',
      index: i,
      totalSegments: numSegments,
      segmentLen,
      gapLen,
      distance,
      start: start.clone(),
      end: end.clone()
    };
    
    group.add(mesh);
  }
  
  group.userData = { type: 'cable', sourceId, targetId };
  return group;
};

/**
 * Realiza una limpieza profunda de una escena de Three.js.
 */
export const disposeScene = (scene: THREE.Object3D) => {
  scene.traverse((o: any) => {
    if (o.geometry) o.geometry.dispose();
    if (o.material) {
      if (Array.isArray(o.material)) {
        o.material.forEach((m: any) => {
          if (m && typeof m.dispose === 'function') m.dispose();
        });
      } else if (typeof o.material.dispose === 'function') {
        o.material.dispose();
      }
    }
  });
};
