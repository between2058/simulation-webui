import { Canvas, useThree } from '@react-three/fiber';
import {
  OrbitControls,
  PerspectiveCamera,
  Environment,
  Stats,
  Grid as DreiGrid
} from '@react-three/drei';
import { Suspense, useState, useEffect, useCallback, useRef } from 'react';
import * as THREE from 'three';
import { useSimulationStore } from '../../stores/simulationStore';
import { SceneEnvironment } from './SceneEnvironment';
import { RobotDog } from '../RobotDog/RobotDog';
import { CameraController } from '../Camera/CameraController';
import { Obstacles, defaultObstacles, getObstacleBounds } from './Obstacles';
import { PathVisualization } from './PathVisualization';
import { createPathfindingGrid, findPath, type PathfindingGrid } from '../../utils/pathfinding';
import './SimulationCanvas.css';

function LoadingFallback() {
  return (
    <mesh>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#00d4ff" wireframe />
    </mesh>
  );
}

// Click handler for setting target
interface GroundClickHandlerProps {
  onTargetSet: (position: THREE.Vector3) => void;
}

function GroundClickHandler({ onTargetSet }: GroundClickHandlerProps) {
  const { camera, gl } = useThree();
  const { simulationState } = useSimulationStore();
  const planeRef = useRef(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0));
  const raycaster = useRef(new THREE.Raycaster());

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (simulationState !== 'running') return;

      // Get normalized device coordinates
      const rect = gl.domElement.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      // Set up raycaster
      raycaster.current.setFromCamera(new THREE.Vector2(x, y), camera);

      // Intersect with ground plane
      const intersectPoint = new THREE.Vector3();
      if (raycaster.current.ray.intersectPlane(planeRef.current, intersectPoint)) {
        // Clamp to grid bounds
        const bounds = 9.5;
        intersectPoint.x = Math.max(-bounds, Math.min(bounds, intersectPoint.x));
        intersectPoint.z = Math.max(-bounds, Math.min(bounds, intersectPoint.z));
        intersectPoint.y = 0;

        onTargetSet(intersectPoint);
      }
    };

    gl.domElement.addEventListener('dblclick', handleClick);
    return () => gl.domElement.removeEventListener('dblclick', handleClick);
  }, [camera, gl, onTargetSet, simulationState]);

  return null;
}

interface SceneContentProps {
  targetPosition: THREE.Vector3 | null;
  path: THREE.Vector3[] | null;
  onTargetSet: (position: THREE.Vector3) => void;
}

function SceneContent({ targetPosition, path, onTargetSet }: SceneContentProps) {
  const { showGrid, showStats, cameraMode, controlsEnabled } = useSimulationStore();

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.4} />
      <directionalLight
        position={[10, 20, 10]}
        intensity={1}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={50}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
      />
      <pointLight position={[-10, 10, -10]} intensity={0.5} color="#00d4ff" />

      {/* Environment */}
      <Environment preset="night" />
      <SceneEnvironment />

      {/* Obstacles */}
      <Obstacles obstacles={defaultObstacles} />

      {/* Path Visualization */}
      <PathVisualization path={path} targetPosition={targetPosition} />

      {/* Grid */}
      {showGrid && (
        <DreiGrid
          position={[0, -0.01, 0]}
          args={[100, 100]}
          cellSize={1}
          cellThickness={0.5}
          cellColor="#1a3a5c"
          sectionSize={5}
          sectionThickness={1}
          sectionColor="#00d4ff"
          fadeDistance={50}
          fadeStrength={1}
          followCamera={false}
          infiniteGrid
        />
      )}

      {/* Robot Dog */}
      <Suspense fallback={<LoadingFallback />}>
        <RobotDog targetPosition={targetPosition} path={path} />
      </Suspense>

      {/* Camera Controller */}
      <CameraController />

      {/* Click handler for target */}
      <GroundClickHandler onTargetSet={onTargetSet} />

      {/* Orbit Controls (when in orbit mode) */}
      {cameraMode === 'orbit' && controlsEnabled && (
        <OrbitControls
          makeDefault
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          minDistance={2}
          maxDistance={50}
          maxPolarAngle={Math.PI / 2 - 0.1}
        />
      )}

      {/* Stats */}
      {showStats && <Stats className="stats-panel" />}
    </>
  );
}

export function SimulationCanvas() {
  const [targetPosition, setTargetPosition] = useState<THREE.Vector3 | null>(null);
  const [path, setPath] = useState<THREE.Vector3[] | null>(null);
  const [grid, setGrid] = useState<PathfindingGrid | null>(null);
  const { robot, togglePathfinding } = useSimulationStore();

  // Initialize pathfinding grid
  useEffect(() => {
    const obstacles = getObstacleBounds(defaultObstacles);
    const newGrid = createPathfindingGrid(obstacles, 20, 0.5, 0.4);
    setGrid(newGrid);

    // Enable pathfinding visualization by default
    togglePathfinding();
  }, []);

  // Calculate path when target is set
  const handleTargetSet = useCallback((position: THREE.Vector3) => {
    if (!grid) return;

    const robotPos = robot.position;
    const newPath = findPath(robotPos, position, grid);

    if (newPath) {
      setTargetPosition(position);
      setPath(newPath);
      console.log('Path found with', newPath.length, 'waypoints');
    } else {
      console.log('No path found to target');
      // Still set target to show it's blocked
      setTargetPosition(position);
      setPath(null);
    }
  }, [grid, robot.position]);

  return (
    <div className="simulation-canvas">
      <Canvas
        shadows
        dpr={[1, 2]}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: 'high-performance'
        }}
        camera={{ position: [5, 5, 5], fov: 60 }}
      >
        <color attach="background" args={['#0a0e1a']} />
        <fog attach="fog" args={['#0a0e1a', 20, 80]} />

        <PerspectiveCamera makeDefault position={[8, 6, 8]} fov={60} />

        <Suspense fallback={null}>
          <SceneContent
            targetPosition={targetPosition}
            path={path}
            onTargetSet={handleTargetSet}
          />
        </Suspense>
      </Canvas>

      {/* Overlay Effects */}
      <div className="canvas-overlay">
        <div className="canvas-scanline" />
        <div className="canvas-vignette" />
      </div>

      {/* Instructions overlay */}
      <div className="canvas-instructions">
        Double-click to set target
      </div>
    </div>
  );
}
