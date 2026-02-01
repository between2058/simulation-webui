import { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

// Generate procedural concrete/floor texture
function generateFloorTexture(size: number = 512): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // Base color - industrial concrete
  ctx.fillStyle = '#2a3040';
  ctx.fillRect(0, 0, size, size);

  // Add noise/grain
  const imageData = ctx.getImageData(0, 0, size, size);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    const noise = (Math.random() - 0.5) * 20;
    data[i] = Math.min(255, Math.max(0, data[i] + noise));
    data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
    data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise));
  }

  ctx.putImageData(imageData, 0, 0);

  // Add tile lines
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
  ctx.lineWidth = 2;

  const tileSize = size / 4;
  for (let x = 0; x <= size; x += tileSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, size);
    ctx.stroke();
  }
  for (let y = 0; y <= size; y += tileSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(size, y);
    ctx.stroke();
  }

  // Add some stains/marks
  ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
  for (let i = 0; i < 20; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const r = Math.random() * 30 + 10;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  return canvas;
}

function generateNormalMap(size: number = 512): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // Base normal (pointing up)
  ctx.fillStyle = 'rgb(128, 128, 255)';
  ctx.fillRect(0, 0, size, size);

  // Add subtle variations
  const imageData = ctx.getImageData(0, 0, size, size);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    const noise = (Math.random() - 0.5) * 10;
    data[i] = Math.min(255, Math.max(0, 128 + noise));
    data[i + 1] = Math.min(255, Math.max(0, 128 + noise));
  }

  ctx.putImageData(imageData, 0, 0);

  return canvas;
}

function generateRoughnessMap(size: number = 512): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // Base roughness
  ctx.fillStyle = 'rgb(180, 180, 180)';
  ctx.fillRect(0, 0, size, size);

  // Add variations
  const imageData = ctx.getImageData(0, 0, size, size);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    const noise = (Math.random() - 0.5) * 60;
    const value = Math.min(255, Math.max(0, 180 + noise));
    data[i] = value;
    data[i + 1] = value;
    data[i + 2] = value;
  }

  ctx.putImageData(imageData, 0, 0);

  return canvas;
}

export function RealisticGround() {
  const meshRef = useRef<THREE.Mesh>(null);

  const textures = useMemo(() => {
    const colorMap = new THREE.CanvasTexture(generateFloorTexture());
    colorMap.wrapS = colorMap.wrapT = THREE.RepeatWrapping;
    colorMap.repeat.set(10, 10);

    const normalMap = new THREE.CanvasTexture(generateNormalMap());
    normalMap.wrapS = normalMap.wrapT = THREE.RepeatWrapping;
    normalMap.repeat.set(10, 10);

    const roughnessMap = new THREE.CanvasTexture(generateRoughnessMap());
    roughnessMap.wrapS = roughnessMap.wrapT = THREE.RepeatWrapping;
    roughnessMap.repeat.set(10, 10);

    return { colorMap, normalMap, roughnessMap };
  }, []);

  return (
    <mesh
      ref={meshRef}
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, -0.01, 0]}
      receiveShadow
    >
      <planeGeometry args={[50, 50, 100, 100]} />
      <meshStandardMaterial
        map={textures.colorMap}
        normalMap={textures.normalMap}
        normalScale={new THREE.Vector2(0.3, 0.3)}
        roughnessMap={textures.roughnessMap}
        roughness={0.8}
        metalness={0.1}
        envMapIntensity={0.5}
      />
    </mesh>
  );
}

// Grid overlay with glow effect
export function GridOverlay() {
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.time.value = state.clock.elapsedTime;
    }
  });

  const gridShader = useMemo(() => ({
    uniforms: {
      time: { value: 0 },
      gridColor: { value: new THREE.Color('#00d4ff') },
      gridSize: { value: 1.0 },
      lineWidth: { value: 0.02 },
    },
    vertexShader: `
      varying vec2 vUv;
      varying vec3 vPosition;
      void main() {
        vUv = uv;
        vPosition = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float time;
      uniform vec3 gridColor;
      uniform float gridSize;
      uniform float lineWidth;
      varying vec2 vUv;
      varying vec3 vPosition;

      void main() {
        vec2 grid = abs(fract(vPosition.xz / gridSize - 0.5) - 0.5) / fwidth(vPosition.xz / gridSize);
        float line = min(grid.x, grid.y);
        float gridAlpha = 1.0 - min(line, 1.0);

        // Fade with distance
        float dist = length(vPosition.xz);
        float fade = 1.0 - smoothstep(5.0, 25.0, dist);

        // Pulse effect
        float pulse = 0.5 + 0.5 * sin(time * 0.5);

        vec3 color = gridColor * (0.3 + 0.2 * pulse);
        float alpha = gridAlpha * lineWidth * fade * 0.5;

        gl_FragColor = vec4(color, alpha);
      }
    `,
  }), []);

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.001, 0]}>
      <planeGeometry args={[50, 50, 1, 1]} />
      <shaderMaterial
        ref={materialRef}
        {...gridShader}
        transparent
        depthWrite={false}
      />
    </mesh>
  );
}
