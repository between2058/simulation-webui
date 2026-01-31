import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useSimulationStore } from '../../stores/simulationStore';
import type { TerrainZoneData } from '../../stores/simulationStore';

const TERRAIN_COLORS: Record<string, string> = {
  normal: '#1a3a5c',
  rough: '#5c3a1a',
  slippery: '#1a5c5c',
  slow: '#5c1a3a',
};

const TERRAIN_LABELS: Record<string, string> = {
  normal: '一般',
  rough: '粗糙',
  slippery: '濕滑',
  slow: '泥濘',
};

interface TerrainZoneProps {
  zone: TerrainZoneData;
  isSelected: boolean;
  onSelect?: (id: string) => void;
}

function TerrainZone({ zone, isSelected, onSelect }: TerrainZoneProps) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current && isSelected) {
      const material = meshRef.current.material as THREE.MeshStandardMaterial;
      material.opacity = 0.3 + Math.sin(state.clock.elapsedTime * 3) * 0.1;
    }
  });

  return (
    <group position={[zone.position[0], 0.01, zone.position[2]]}>
      <mesh
        ref={meshRef}
        rotation={[-Math.PI / 2, 0, 0]}
        onClick={(e) => {
          e.stopPropagation();
          onSelect?.(zone.id);
        }}
      >
        <circleGeometry args={[zone.radius, 32]} />
        <meshStandardMaterial
          color={TERRAIN_COLORS[zone.type]}
          transparent
          opacity={isSelected ? 0.4 : 0.3}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Border ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <ringGeometry args={[zone.radius - 0.05, zone.radius, 32]} />
        <meshBasicMaterial
          color={isSelected ? '#00d4ff' : TERRAIN_COLORS[zone.type]}
          transparent
          opacity={0.8}
        />
      </mesh>

      {/* Label */}
      <sprite position={[0, 0.5, 0]} scale={[1.5, 0.5, 1]}>
        <spriteMaterial>
          <canvasTexture
            attach="map"
            image={createTerrainLabel(zone.type, zone.speedMultiplier)}
          />
        </spriteMaterial>
      </sprite>
    </group>
  );
}

function createTerrainLabel(type: string, speedMultiplier: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = 150;
  canvas.height = 50;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, 150, 50);

  // Background
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.roundRect(0, 0, 150, 50, 8);
  ctx.fill();

  // Text
  ctx.fillStyle = TERRAIN_COLORS[type];
  ctx.font = 'bold 16px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(TERRAIN_LABELS[type] || type, 75, 18);

  ctx.fillStyle = '#ffffff';
  ctx.font = '14px Arial';
  ctx.fillText(`速度: ${(speedMultiplier * 100).toFixed(0)}%`, 75, 38);

  return canvas;
}

export function TerrainZones() {
  const {
    terrainZones,
    selectedTerrainId,
    setSelectedTerrainId,
    editorMode,
  } = useSimulationStore();

  if (terrainZones.length === 0) return null;

  return (
    <group>
      {terrainZones.map((zone: TerrainZoneData) => (
        <TerrainZone
          key={zone.id}
          zone={zone}
          isSelected={selectedTerrainId === zone.id}
          onSelect={editorMode === 'edit' ? setSelectedTerrainId : undefined}
        />
      ))}
    </group>
  );
}

// Utility function to check which terrain zone the robot is in
export function getTerrainAtPosition(
  position: THREE.Vector3,
  terrainZones: TerrainZoneData[]
): TerrainZoneData | null {
  for (const zone of terrainZones) {
    const dx = position.x - zone.position[0];
    const dz = position.z - zone.position[2];
    const distance = Math.sqrt(dx * dx + dz * dz);
    if (distance < zone.radius) {
      return zone;
    }
  }
  return null;
}
