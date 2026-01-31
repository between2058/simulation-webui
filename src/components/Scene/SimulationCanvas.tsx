import { Canvas } from '@react-three/fiber';
import {
  OrbitControls,
  PerspectiveCamera,
  Environment,
  Stats,
  Grid as DreiGrid
} from '@react-three/drei';
import { Suspense } from 'react';
import { useSimulationStore } from '../../stores/simulationStore';
import { SceneEnvironment } from './SceneEnvironment';
import { RobotDog } from '../RobotDog/RobotDog';
import { CameraController } from '../Camera/CameraController';
import './SimulationCanvas.css';

function LoadingFallback() {
  return (
    <mesh>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#00d4ff" wireframe />
    </mesh>
  );
}

function SceneContent() {
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
        <RobotDog />
      </Suspense>

      {/* Camera Controller */}
      <CameraController />

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
          <SceneContent />
        </Suspense>
      </Canvas>

      {/* Overlay Effects */}
      <div className="canvas-overlay">
        <div className="canvas-scanline" />
        <div className="canvas-vignette" />
      </div>
    </div>
  );
}
