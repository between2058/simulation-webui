import { useRef, useEffect } from 'react';
import type { ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { useSimulationStore } from '../../stores/simulationStore';
import type { ObstacleData } from '../../stores/simulationStore';

// Re-export type for backward compatibility
export type { ObstacleData };

// Default obstacles (kept for backward compatibility)
export const defaultObstacles: ObstacleData[] = [
  { id: 'obs1', position: [3, 0.5, 0], size: [1, 1, 1], type: 'box' },
  { id: 'obs2', position: [-3, 0.5, 2], size: [1.5, 1, 1.5], type: 'box' },
  { id: 'obs3', position: [0, 0.5, -4], size: [2, 1, 0.5], type: 'box' },
  { id: 'obs4', position: [5, 0.75, 3], size: [0.5, 1.5, 0.5], type: 'cylinder' },
  { id: 'obs5', position: [-4, 0.75, -3], size: [0.5, 1.5, 0.5], type: 'cylinder' },
  { id: 'obs6', position: [2, 0.5, 5], size: [3, 1, 0.5], type: 'box' },
  { id: 'obs7', position: [-2, 0.5, -2], size: [0.8, 1, 0.8], type: 'box' },
];

interface ObstacleProps {
  data: ObstacleData;
  isSelected: boolean;
  isEditMode: boolean;
  onSelect: (id: string) => void;
  onBoundsReady?: (id: string, box: THREE.Box3) => void;
}

function Obstacle({ data, isSelected, isEditMode, onSelect, onBoundsReady }: ObstacleProps) {
  const meshRef = useRef<THREE.Mesh>(null);

  useEffect(() => {
    if (meshRef.current && onBoundsReady) {
      const box = new THREE.Box3().setFromObject(meshRef.current);
      onBoundsReady(data.id, box);
    }
  }, [data, onBoundsReady]);

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    if (isEditMode) {
      e.stopPropagation();
      onSelect(data.id);
    }
  };

  const baseColor = data.color || '#1a2a4a';
  const emissiveColor = isSelected ? '#00ff88' : '#00d4ff';
  const emissiveIntensity = isSelected ? 0.3 : 0.05;

  const material = (
    <meshStandardMaterial
      color={isSelected ? '#2a4a6a' : baseColor}
      roughness={0.4}
      metalness={0.6}
      emissive={emissiveColor}
      emissiveIntensity={emissiveIntensity}
    />
  );

  if (data.type === 'cylinder') {
    return (
      <group>
        <mesh
          ref={meshRef}
          position={data.position}
          castShadow
          receiveShadow
          onClick={handleClick}
        >
          <cylinderGeometry args={[data.size[0], data.size[0], data.size[1], 16]} />
          {material}
        </mesh>
        {/* Selection outline */}
        {isSelected && (
          <mesh position={data.position}>
            <cylinderGeometry args={[data.size[0] + 0.05, data.size[0] + 0.05, data.size[1] + 0.05, 16]} />
            <meshBasicMaterial color="#00ff88" wireframe />
          </mesh>
        )}
      </group>
    );
  }

  return (
    <group>
      <mesh
        ref={meshRef}
        position={data.position}
        castShadow
        receiveShadow
        onClick={handleClick}
      >
        <boxGeometry args={data.size} />
        {material}
      </mesh>
      {/* Selection outline */}
      {isSelected && (
        <mesh position={data.position}>
          <boxGeometry args={[data.size[0] + 0.05, data.size[1] + 0.05, data.size[2] + 0.05]} />
          <meshBasicMaterial color="#00ff88" wireframe />
        </mesh>
      )}
    </group>
  );
}

interface ObstaclesProps {
  obstacles?: ObstacleData[];
  onObstaclesReady?: (bounds: Map<string, THREE.Box3>) => void;
}

export function Obstacles({ obstacles: propObstacles, onObstaclesReady }: ObstaclesProps) {
  const {
    obstacles: storeObstacles,
    selectedObstacleId,
    setSelectedObstacleId,
    editorMode
  } = useSimulationStore();

  // Use prop obstacles if provided (backward compatibility), otherwise use store
  const obstacles = propObstacles || storeObstacles;
  const boundsRef = useRef<Map<string, THREE.Box3>>(new Map());
  const isEditMode = editorMode === 'edit';

  const handleBoundsReady = (id: string, box: THREE.Box3) => {
    boundsRef.current.set(id, box);

    if (boundsRef.current.size === obstacles.length && onObstaclesReady) {
      onObstaclesReady(boundsRef.current);
    }
  };

  const handleSelect = (id: string) => {
    setSelectedObstacleId(selectedObstacleId === id ? null : id);
  };

  return (
    <group name="obstacles">
      {obstacles.map((obs: ObstacleData) => (
        <Obstacle
          key={obs.id}
          data={obs}
          isSelected={selectedObstacleId === obs.id}
          isEditMode={isEditMode}
          onSelect={handleSelect}
          onBoundsReady={handleBoundsReady}
        />
      ))}

      {/* Boundary walls */}
      <BoundaryWalls size={20} />
    </group>
  );
}

// Invisible boundary walls
function BoundaryWalls({ size }: { size: number }) {
  const halfSize = size / 2;
  const wallHeight = 2;
  const wallThickness = 0.5;

  return (
    <group name="boundary-walls">
      {/* North wall */}
      <mesh position={[0, wallHeight / 2, -halfSize]} visible={false}>
        <boxGeometry args={[size, wallHeight, wallThickness]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>
      {/* South wall */}
      <mesh position={[0, wallHeight / 2, halfSize]} visible={false}>
        <boxGeometry args={[size, wallHeight, wallThickness]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>
      {/* East wall */}
      <mesh position={[halfSize, wallHeight / 2, 0]} visible={false}>
        <boxGeometry args={[wallThickness, wallHeight, size]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>
      {/* West wall */}
      <mesh position={[-halfSize, wallHeight / 2, 0]} visible={false}>
        <boxGeometry args={[wallThickness, wallHeight, size]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>
    </group>
  );
}

// Get obstacle bounds for collision detection
export function getObstacleBounds(obstacles: ObstacleData[]): THREE.Box3[] {
  return obstacles.map((obs) => {
    const [x, y, z] = obs.position;
    const [sx, sy, sz] = obs.size;

    if (obs.type === 'cylinder') {
      // Approximate cylinder as box
      return new THREE.Box3(
        new THREE.Vector3(x - sx, y - sy / 2, z - sx),
        new THREE.Vector3(x + sx, y + sy / 2, z + sx)
      );
    }

    return new THREE.Box3(
      new THREE.Vector3(x - sx / 2, y - sy / 2, z - sz / 2),
      new THREE.Vector3(x + sx / 2, y + sy / 2, z + sz / 2)
    );
  });
}
