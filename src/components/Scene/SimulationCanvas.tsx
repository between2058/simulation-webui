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
import { Obstacles, getObstacleBounds } from './Obstacles';
import { PathVisualization } from './PathVisualization';
import { Waypoints } from './Waypoints';
import { TerrainZones } from './TerrainZones';
import { PostProcessing } from './PostProcessing';
import { LidarSensor } from '../Sensors/LidarSensor';
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

// Click handler for setting target, placing obstacles, and adding waypoints
interface GroundClickHandlerProps {
  onTargetSet: (position: THREE.Vector3) => void;
  onPlaceObstacle: (position: THREE.Vector3) => void;
  onAddWaypoint: (position: THREE.Vector3) => void;
}

function GroundClickHandler({ onTargetSet, onPlaceObstacle, onAddWaypoint }: GroundClickHandlerProps) {
  const { camera, gl } = useThree();
  const { simulationState, editorMode } = useSimulationStore();
  const planeRef = useRef(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0));
  const raycaster = useRef(new THREE.Raycaster());

  const getGroundPosition = useCallback((event: MouseEvent): THREE.Vector3 | null => {
    const rect = gl.domElement.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.current.setFromCamera(new THREE.Vector2(x, y), camera);

    const intersectPoint = new THREE.Vector3();
    if (raycaster.current.ray.intersectPlane(planeRef.current, intersectPoint)) {
      const bounds = 9.5;
      intersectPoint.x = Math.max(-bounds, Math.min(bounds, intersectPoint.x));
      intersectPoint.z = Math.max(-bounds, Math.min(bounds, intersectPoint.z));
      intersectPoint.y = 0;
      return intersectPoint;
    }
    return null;
  }, [camera, gl]);

  useEffect(() => {
    // Double-click for target in simulation mode
    const handleDoubleClick = (event: MouseEvent) => {
      if (simulationState !== 'running' || editorMode !== 'simulate') return;
      const position = getGroundPosition(event);
      if (position) {
        onTargetSet(position);
      }
    };

    // Single click for obstacle placement in edit mode or waypoint in patrol mode
    const handleClick = (event: MouseEvent) => {
      const position = getGroundPosition(event);
      if (!position) return;

      if (editorMode === 'edit') {
        onPlaceObstacle(position);
      } else if (editorMode === 'patrol') {
        onAddWaypoint(position);
      }
    };

    gl.domElement.addEventListener('dblclick', handleDoubleClick);
    gl.domElement.addEventListener('click', handleClick);
    return () => {
      gl.domElement.removeEventListener('dblclick', handleDoubleClick);
      gl.domElement.removeEventListener('click', handleClick);
    };
  }, [camera, gl, onTargetSet, onPlaceObstacle, onAddWaypoint, simulationState, editorMode, getGroundPosition]);

  return null;
}

interface SceneContentProps {
  targetPosition: THREE.Vector3 | null;
  path: THREE.Vector3[] | null;
  onTargetSet: (position: THREE.Vector3) => void;
  onPlaceObstacle: (position: THREE.Vector3) => void;
  onAddWaypoint: (position: THREE.Vector3) => void;
}

function SceneContent({ targetPosition, path, onTargetSet, onPlaceObstacle, onAddWaypoint }: SceneContentProps) {
  const { showGrid, showStats, cameraMode, controlsEnabled, showLidar } = useSimulationStore();

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

      {/* Terrain Zones - render under obstacles */}
      <TerrainZones />

      {/* Obstacles - uses store when no props provided */}
      <Obstacles />

      {/* Path Visualization */}
      <PathVisualization path={path} targetPosition={targetPosition} />

      {/* Waypoints */}
      <Waypoints />

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

      {/* LiDAR Sensor */}
      {showLidar && <LidarSensor rayCount={36} maxDistance={5} />}

      {/* Camera Controller */}
      <CameraController />

      {/* Click handler for target, obstacle placement, and waypoints */}
      <GroundClickHandler onTargetSet={onTargetSet} onPlaceObstacle={onPlaceObstacle} onAddWaypoint={onAddWaypoint} />

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

      {/* Post-processing effects */}
      <PostProcessing />

      {/* Stats */}
      {showStats && <Stats className="stats-panel" />}
    </>
  );
}

export function SimulationCanvas() {
  const [targetPosition, setTargetPosition] = useState<THREE.Vector3 | null>(null);
  const [path, setPath] = useState<THREE.Vector3[] | null>(null);
  const [grid, setGrid] = useState<PathfindingGrid | null>(null);
  const {
    robot,
    togglePathfinding,
    obstacles,
    addObstacle,
    placementType,
    editorMode,
    setSelectedObstacleId,
    addWaypoint
  } = useSimulationStore();

  // Initialize pathfinding grid and update when obstacles change
  useEffect(() => {
    const obstacleBounds = getObstacleBounds(obstacles);
    const newGrid = createPathfindingGrid(obstacleBounds, 20, 0.5, 0.4);
    setGrid(newGrid);
  }, [obstacles]);

  // Enable pathfinding visualization on mount
  useEffect(() => {
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

  // Place obstacle in edit mode
  const handlePlaceObstacle = useCallback((position: THREE.Vector3) => {
    if (editorMode !== 'edit') return;

    const newId = `obs_${Date.now()}`;
    const size: [number, number, number] = placementType === 'box'
      ? [1, 1, 1]
      : [0.5, 1.5, 0.5];
    const yPos = placementType === 'box' ? 0.5 : 0.75;

    addObstacle({
      id: newId,
      position: [position.x, yPos, position.z],
      size,
      type: placementType,
    });

    setSelectedObstacleId(newId);
  }, [editorMode, placementType, addObstacle, setSelectedObstacleId]);

  // Add waypoint in patrol mode
  const handleAddWaypoint = useCallback((position: THREE.Vector3) => {
    if (editorMode !== 'patrol') return;

    const newId = `wp_${Date.now()}`;
    addWaypoint({
      id: newId,
      position: [position.x, 0, position.z],
    });
  }, [editorMode, addWaypoint]);

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
            onPlaceObstacle={handlePlaceObstacle}
            onAddWaypoint={handleAddWaypoint}
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
        {editorMode === 'edit'
          ? 'Click to place obstacle • Click obstacle to select'
          : editorMode === 'patrol'
          ? 'Click to add waypoint • Click waypoint to remove'
          : 'Double-click to set target'}
      </div>
    </div>
  );
}
