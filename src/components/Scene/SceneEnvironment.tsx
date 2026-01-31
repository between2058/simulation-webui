import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export function SceneEnvironment() {
  const groundRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    // Subtle animation for environment
    if (groundRef.current) {
      const material = groundRef.current.material as THREE.MeshStandardMaterial;
      material.emissiveIntensity = 0.02 + Math.sin(state.clock.elapsedTime * 0.5) * 0.01;
    }
  });

  return (
    <group>
      {/* Ground Plane */}
      <mesh
        ref={groundRef}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.02, 0]}
        receiveShadow
      >
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial
          color="#0d1525"
          roughness={0.8}
          metalness={0.2}
          emissive="#00d4ff"
          emissiveIntensity={0.02}
        />
      </mesh>

      {/* Decorative Elements - Pillars */}
      {[
        [-15, 15],
        [15, 15],
        [-15, -15],
        [15, -15],
      ].map(([x, z], i) => (
        <group key={i} position={[x, 0, z]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.3, 0.4, 8, 8]} />
            <meshStandardMaterial
              color="#111b2e"
              roughness={0.5}
              metalness={0.8}
            />
          </mesh>
          {/* Glowing ring on top */}
          <mesh position={[0, 4, 0]}>
            <torusGeometry args={[0.5, 0.05, 8, 32]} />
            <meshStandardMaterial
              color="#00d4ff"
              emissive="#00d4ff"
              emissiveIntensity={2}
            />
          </mesh>
          {/* Base light */}
          <pointLight
            position={[0, 4.5, 0]}
            intensity={0.3}
            color="#00d4ff"
            distance={10}
          />
        </group>
      ))}

      {/* Central platform marker */}
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[2, 2.2, 64]} />
        <meshBasicMaterial color="#00d4ff" transparent opacity={0.3} />
      </mesh>
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[3, 3.1, 64]} />
        <meshBasicMaterial color="#00d4ff" transparent opacity={0.15} />
      </mesh>
    </group>
  );
}
