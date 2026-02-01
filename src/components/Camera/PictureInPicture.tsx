import { useRef, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useSimulationStore } from '../../stores/simulationStore';
import type { RobotInstance, ObstacleData } from '../../stores/simulationStore';
import './PictureInPicture.css';

// First-person camera that follows robot head
function FirstPersonCamera() {
  const { camera } = useThree();
  const { robots, pipRobotId } = useSimulationStore();

  useFrame(() => {
    const robot = robots.find((r: RobotInstance) => r.id === pipRobotId);
    if (!robot) return;

    const robotPos = robot.position;

    // Camera at robot head position
    camera.position.set(
      robotPos.x + Math.cos(robot.rotation.y) * 0.35,
      robotPos.y + 0.42,
      robotPos.z - Math.sin(robot.rotation.y) * 0.35
    );

    // Look direction based on robot rotation
    const lookDir = new THREE.Vector3(1, 0, 0);
    lookDir.applyEuler(robot.rotation);
    const lookAt = camera.position.clone().add(lookDir);
    camera.lookAt(lookAt);
  });

  return null;
}

// Simplified scene for PiP (no post-processing for performance)
function PiPScene() {
  const { obstacles } = useSimulationStore();

  return (
    <>
      {/* Basic lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 20, 10]} intensity={0.8} />

      {/* Ground plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[50, 50]} />
        <meshStandardMaterial color="#1a2a4a" />
      </mesh>

      {/* Grid */}
      <gridHelper args={[50, 50, '#1a3a5c', '#0d1a2d']} />

      {/* Obstacles */}
      {obstacles.map((obs: ObstacleData) => (
        <mesh
          key={obs.id}
          position={obs.position}
          castShadow
        >
          {obs.type === 'box' ? (
            <boxGeometry args={obs.size} />
          ) : (
            <cylinderGeometry args={[obs.size[0], obs.size[0], obs.size[1], 16]} />
          )}
          <meshStandardMaterial
            color={obs.color || '#2a4a6a'}
            roughness={0.7}
            metalness={0.3}
          />
        </mesh>
      ))}

      {/* Boundary walls visualization */}
      {[
        { pos: [0, 0.5, 10] as [number, number, number], size: [20, 1, 0.1] as [number, number, number] },
        { pos: [0, 0.5, -10] as [number, number, number], size: [20, 1, 0.1] as [number, number, number] },
        { pos: [10, 0.5, 0] as [number, number, number], size: [0.1, 1, 20] as [number, number, number] },
        { pos: [-10, 0.5, 0] as [number, number, number], size: [0.1, 1, 20] as [number, number, number] },
      ].map((wall, i) => (
        <mesh key={`wall-${i}`} position={wall.pos}>
          <boxGeometry args={wall.size} />
          <meshStandardMaterial color="#ff4444" opacity={0.3} transparent />
        </mesh>
      ))}

      {/* First person camera */}
      <FirstPersonCamera />
    </>
  );
}

interface PictureInPictureProps {
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

export function PictureInPicture({ position = 'bottom-right' }: PictureInPictureProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [customPos, setCustomPos] = useState<{ x: number; y: number } | null>(null);

  const { showPiP, togglePiP, robots, pipRobotId, setPipRobotId } = useSimulationStore();

  const currentRobot = robots.find((r: RobotInstance) => r.id === pipRobotId);

  // Handle dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.pip-controls')) return;
    setIsDragging(true);
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      setOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      setCustomPos({
        x: e.clientX - offset.x,
        y: e.clientY - offset.y,
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, offset]);

  if (!showPiP) return null;

  const positionStyles: React.CSSProperties = customPos
    ? { left: customPos.x, top: customPos.y, right: 'auto', bottom: 'auto' }
    : {};

  return (
    <div
      ref={containerRef}
      className={`pip-container pip-container--${position} ${isDragging ? 'pip-container--dragging' : ''}`}
      style={positionStyles}
      onMouseDown={handleMouseDown}
    >
      {/* Header */}
      <div className="pip-header">
        <div className="pip-title">
          <span className="pip-indicator" />
          {currentRobot?.name || 'Robot'} - FPV
        </div>
        <div className="pip-controls">
          {robots.length > 1 && (
            <select
              value={pipRobotId || ''}
              onChange={(e) => setPipRobotId(e.target.value)}
              className="pip-robot-select"
            >
              {robots.map((robot: RobotInstance) => (
                <option key={robot.id} value={robot.id}>
                  {robot.name}
                </option>
              ))}
            </select>
          )}
          <button className="pip-close" onClick={togglePiP}>
            ✕
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div className="pip-canvas">
        <Canvas
          camera={{ fov: 75, near: 0.1, far: 100 }}
          gl={{ antialias: false, alpha: false }}
          dpr={1}
        >
          <color attach="background" args={['#0a0e1a']} />
          <fog attach="fog" args={['#0a0e1a', 10, 40]} />
          <PiPScene />
        </Canvas>

        {/* Overlay effects */}
        <div className="pip-overlay">
          <div className="pip-scanlines" />
          <div className="pip-vignette" />
        </div>

        {/* HUD elements */}
        <div className="pip-hud">
          <div className="pip-hud-item pip-hud-item--top-left">
            REC
          </div>
          <div className="pip-hud-item pip-hud-item--bottom-left">
            {currentRobot ? `X: ${currentRobot.position.x.toFixed(1)} Z: ${currentRobot.position.z.toFixed(1)}` : ''}
          </div>
          <div className="pip-hud-item pip-hud-item--bottom-right">
            {new Date().toLocaleTimeString()}
          </div>
        </div>

        {/* Crosshair */}
        <div className="pip-crosshair">
          <div className="pip-crosshair-h" />
          <div className="pip-crosshair-v" />
        </div>
      </div>
    </div>
  );
}
