import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Line } from '@react-three/drei';
import { useSimulationStore } from '../../stores/simulationStore';

interface PathVisualizationProps {
  path: THREE.Vector3[] | null;
  targetPosition: THREE.Vector3 | null;
}

export function PathVisualization({ path, targetPosition }: PathVisualizationProps) {
  const { showPathfinding } = useSimulationStore();
  const targetRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);

  // Animate target marker
  useFrame((state) => {
    if (targetRef.current) {
      targetRef.current.position.y = 0.3 + Math.sin(state.clock.elapsedTime * 3) * 0.1;
      targetRef.current.rotation.y = state.clock.elapsedTime * 2;
    }
    if (ringRef.current) {
      ringRef.current.scale.setScalar(1 + Math.sin(state.clock.elapsedTime * 2) * 0.1);
    }
  });

  // Create path points with slight elevation
  const pathPoints = useMemo(() => {
    if (!path || path.length < 2) return null;
    return path.map((p) => new THREE.Vector3(p.x, 0.05, p.z));
  }, [path]);

  if (!showPathfinding) return null;

  return (
    <group name="path-visualization">
      {/* Path line */}
      {pathPoints && (
        <Line
          points={pathPoints}
          color="#00d4ff"
          lineWidth={3}
          dashed
          dashSize={0.2}
          dashScale={2}
          gapSize={0.1}
        />
      )}

      {/* Waypoint markers */}
      {path && path.length > 1 && path.slice(1, -1).map((point, index) => (
        <mesh key={index} position={[point.x, 0.1, point.z]}>
          <sphereGeometry args={[0.08, 8, 8]} />
          <meshStandardMaterial
            color="#00d4ff"
            emissive="#00d4ff"
            emissiveIntensity={0.5}
            transparent
            opacity={0.8}
          />
        </mesh>
      ))}

      {/* Target marker */}
      {targetPosition && (
        <group position={[targetPosition.x, 0, targetPosition.z]}>
          {/* Rotating diamond */}
          <mesh ref={targetRef} position={[0, 0.3, 0]}>
            <octahedronGeometry args={[0.15, 0]} />
            <meshStandardMaterial
              color="#00ff88"
              emissive="#00ff88"
              emissiveIntensity={2}
            />
          </mesh>

          {/* Pulsing ring on ground */}
          <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
            <ringGeometry args={[0.3, 0.4, 32]} />
            <meshStandardMaterial
              color="#00ff88"
              emissive="#00ff88"
              emissiveIntensity={1}
              transparent
              opacity={0.6}
              side={THREE.DoubleSide}
            />
          </mesh>

          {/* Ground circle */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
            <circleGeometry args={[0.5, 32]} />
            <meshStandardMaterial
              color="#00ff88"
              transparent
              opacity={0.2}
            />
          </mesh>
        </group>
      )}
    </group>
  );
}

// Grid visualization for debugging
interface GridVisualizationProps {
  walkable: THREE.Vector3[];
  blocked: THREE.Vector3[];
  cellSize: number;
  visible?: boolean;
}

export function GridVisualization({
  walkable,
  blocked,
  cellSize,
  visible = false,
}: GridVisualizationProps) {
  if (!visible) return null;

  return (
    <group name="grid-visualization">
      {/* Walkable cells */}
      {walkable.map((pos, i) => (
        <mesh
          key={`w-${i}`}
          position={[pos.x, 0.01, pos.z]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <planeGeometry args={[cellSize * 0.9, cellSize * 0.9]} />
          <meshBasicMaterial color="#00ff88" transparent opacity={0.1} />
        </mesh>
      ))}

      {/* Blocked cells */}
      {blocked.map((pos, i) => (
        <mesh
          key={`b-${i}`}
          position={[pos.x, 0.01, pos.z]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <planeGeometry args={[cellSize * 0.9, cellSize * 0.9]} />
          <meshBasicMaterial color="#ff3366" transparent opacity={0.3} />
        </mesh>
      ))}
    </group>
  );
}
