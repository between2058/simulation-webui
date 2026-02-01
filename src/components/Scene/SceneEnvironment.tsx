import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { RealisticGround, GridOverlay } from './RealisticGround';

export function SceneEnvironment() {
  const pillarRefs = useRef<THREE.Mesh[]>([]);

  // Create procedural metal texture for pillars
  const metalTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;

    // Base color
    ctx.fillStyle = '#1a2535';
    ctx.fillRect(0, 0, 256, 256);

    // Add scratches
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    for (let i = 0; i < 50; i++) {
      ctx.beginPath();
      ctx.moveTo(Math.random() * 256, Math.random() * 256);
      ctx.lineTo(Math.random() * 256, Math.random() * 256);
      ctx.stroke();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    return texture;
  }, []);

  useFrame((state) => {
    // Animate pillar glow
    pillarRefs.current.forEach((mesh, i) => {
      if (mesh) {
        const material = mesh.material as THREE.MeshStandardMaterial;
        const phase = state.clock.elapsedTime * 0.5 + i * Math.PI / 2;
        material.emissiveIntensity = 1.5 + Math.sin(phase) * 0.5;
      }
    });
  });

  const pillarPositions: [number, number][] = [
    [-15, 15],
    [15, 15],
    [-15, -15],
    [15, -15],
    [-8, 12],
    [8, 12],
    [-8, -12],
    [8, -12],
  ];

  return (
    <group>
      {/* Realistic Ground */}
      <RealisticGround />
      <GridOverlay />

      {/* Decorative Elements - Industrial Pillars */}
      {pillarPositions.map(([x, z], i) => (
        <group key={i} position={[x, 0, z]}>
          {/* Main pillar */}
          <mesh castShadow receiveShadow>
            <cylinderGeometry args={[0.25, 0.35, 6, 16]} />
            <meshStandardMaterial
              map={metalTexture}
              color="#1a2535"
              roughness={0.4}
              metalness={0.9}
            />
          </mesh>

          {/* Pillar base */}
          <mesh position={[0, 0.1, 0]} castShadow>
            <cylinderGeometry args={[0.5, 0.6, 0.2, 16]} />
            <meshStandardMaterial
              color="#111825"
              roughness={0.6}
              metalness={0.8}
            />
          </mesh>

          {/* Glowing ring */}
          <mesh
            ref={(el) => { if (el) pillarRefs.current[i] = el; }}
            position={[0, 3, 0]}
          >
            <torusGeometry args={[0.4, 0.03, 8, 32]} />
            <meshStandardMaterial
              color="#00d4ff"
              emissive="#00d4ff"
              emissiveIntensity={2}
              toneMapped={false}
            />
          </mesh>

          {/* Top cap */}
          <mesh position={[0, 3, 0]} castShadow>
            <cylinderGeometry args={[0.3, 0.25, 0.1, 16]} />
            <meshStandardMaterial
              color="#0a1020"
              roughness={0.3}
              metalness={0.95}
            />
          </mesh>

          {/* Light source */}
          <pointLight
            position={[0, 3.2, 0]}
            intensity={0.5}
            color="#00d4ff"
            distance={8}
            decay={2}
            castShadow
            shadow-mapSize={256}
          />
        </group>
      ))}

      {/* Central platform */}
      <group position={[0, 0.02, 0]}>
        {/* Outer ring */}
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[2.8, 3, 64]} />
          <meshStandardMaterial
            color="#00d4ff"
            emissive="#00d4ff"
            emissiveIntensity={0.3}
            transparent
            opacity={0.5}
            side={THREE.DoubleSide}
          />
        </mesh>

        {/* Inner ring */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
          <ringGeometry args={[1.8, 2, 64]} />
          <meshStandardMaterial
            color="#00d4ff"
            emissive="#00d4ff"
            emissiveIntensity={0.2}
            transparent
            opacity={0.3}
            side={THREE.DoubleSide}
          />
        </mesh>

        {/* Direction markers */}
        {[0, 90, 180, 270].map((angle, i) => (
          <mesh
            key={i}
            rotation={[-Math.PI / 2, 0, THREE.MathUtils.degToRad(angle)]}
            position={[
              Math.cos(THREE.MathUtils.degToRad(angle)) * 2.4,
              0.02,
              Math.sin(THREE.MathUtils.degToRad(angle)) * 2.4
            ]}
          >
            <planeGeometry args={[0.3, 0.1]} />
            <meshStandardMaterial
              color="#00d4ff"
              emissive="#00d4ff"
              emissiveIntensity={0.5}
              transparent
              opacity={0.7}
              side={THREE.DoubleSide}
            />
          </mesh>
        ))}
      </group>

      {/* Ambient fill lights */}
      <pointLight position={[0, 10, 0]} intensity={0.2} color="#ffffff" />
      <pointLight position={[-20, 5, -20]} intensity={0.1} color="#0066ff" distance={30} />
      <pointLight position={[20, 5, 20]} intensity={0.1} color="#00ffaa" distance={30} />
    </group>
  );
}
