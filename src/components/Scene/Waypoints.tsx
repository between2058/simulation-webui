import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { Line } from '@react-three/drei';
import { useSimulationStore } from '../../stores/simulationStore';
import type { WaypointData } from '../../stores/simulationStore';

interface WaypointMarkerProps {
  waypoint: WaypointData;
  index: number;
  isActive: boolean;
  onClick?: () => void;
}

function WaypointMarker({ waypoint, index, isActive, onClick }: WaypointMarkerProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      // Floating animation
      meshRef.current.position.y = waypoint.position[1] + Math.sin(state.clock.elapsedTime * 2 + index) * 0.1;
    }
    if (ringRef.current) {
      // Rotation animation
      ringRef.current.rotation.z = state.clock.elapsedTime * 2;
    }
  });

  return (
    <group position={[waypoint.position[0], 0, waypoint.position[2]]}>
      {/* Ground circle */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <ringGeometry args={[0.3, 0.4, 32]} />
        <meshBasicMaterial color={isActive ? '#00ff88' : '#00d4ff'} transparent opacity={0.8} />
      </mesh>

      {/* Animated ring */}
      <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <ringGeometry args={[0.5, 0.55, 32]} />
        <meshBasicMaterial color={isActive ? '#00ff88' : '#00d4ff'} transparent opacity={0.5} />
      </mesh>

      {/* Floating marker */}
      <mesh
        ref={meshRef}
        position={[0, 0.5, 0]}
        onClick={(e: ThreeEvent<MouseEvent>) => {
          e.stopPropagation();
          onClick?.();
        }}
      >
        <octahedronGeometry args={[0.15, 0]} />
        <meshStandardMaterial
          color={isActive ? '#00ff88' : '#00d4ff'}
          emissive={isActive ? '#00ff88' : '#00d4ff'}
          emissiveIntensity={isActive ? 1 : 0.5}
        />
      </mesh>

      {/* Index number */}
      <sprite position={[0, 1, 0]} scale={[0.5, 0.5, 1]}>
        <spriteMaterial>
          <canvasTexture
            attach="map"
            image={createNumberTexture(index + 1, isActive)}
          />
        </spriteMaterial>
      </sprite>

      {/* Point light */}
      <pointLight
        position={[0, 0.5, 0]}
        intensity={isActive ? 0.5 : 0.2}
        color={isActive ? '#00ff88' : '#00d4ff'}
        distance={2}
      />
    </group>
  );
}

function createNumberTexture(num: number, isActive: boolean): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;

  // Clear
  ctx.clearRect(0, 0, 64, 64);

  // Circle background
  ctx.beginPath();
  ctx.arc(32, 32, 28, 0, Math.PI * 2);
  ctx.fillStyle = isActive ? 'rgba(0, 255, 136, 0.9)' : 'rgba(0, 212, 255, 0.9)';
  ctx.fill();

  // Number
  ctx.fillStyle = '#000';
  ctx.font = 'bold 32px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(String(num), 32, 32);

  return canvas;
}

export function Waypoints() {
  const {
    waypoints,
    currentWaypointIndex,
    patrolLoop,
    editorMode,
    removeWaypoint
  } = useSimulationStore();

  if (waypoints.length === 0) return null;

  // Create path points for the line
  const pathPoints: [number, number, number][] = waypoints.map((w: WaypointData) =>
    [w.position[0], 0.1, w.position[2]]
  );

  // Add closing point if looping
  if (patrolLoop && waypoints.length > 1) {
    pathPoints.push([waypoints[0].position[0], 0.1, waypoints[0].position[2]]);
  }

  return (
    <group>
      {/* Path line */}
      {pathPoints.length > 1 && (
        <Line
          points={pathPoints}
          color="#00d4ff"
          lineWidth={2}
          dashed
          dashSize={0.3}
          gapSize={0.15}
        />
      )}

      {/* Waypoint markers */}
      {waypoints.map((waypoint: WaypointData, index: number) => (
        <WaypointMarker
          key={waypoint.id}
          waypoint={waypoint}
          index={index}
          isActive={index === currentWaypointIndex}
          onClick={editorMode === 'patrol' ? () => removeWaypoint(waypoint.id) : undefined}
        />
      ))}
    </group>
  );
}
