import { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useSimulationStore } from '../../stores/simulationStore';

interface LidarSensorProps {
  rayCount?: number;
  maxDistance?: number;
  fov?: number; // Field of view in degrees
  showRays?: boolean;
  showHitPoints?: boolean;
}

export function LidarSensor({
  rayCount = 36,
  maxDistance = 5,
  fov = 360,
  showRays = true,
  showHitPoints = true,
}: LidarSensorProps) {
  const { scene } = useThree();
  const { robot, simulationState } = useSimulationStore();

  const raysRef = useRef<THREE.Group>(null);
  const hitPointsRef = useRef<THREE.Points>(null);
  const raycaster = useRef(new THREE.Raycaster());

  // Pre-calculate ray directions
  const rayDirections = useMemo(() => {
    const directions: THREE.Vector3[] = [];
    const startAngle = -fov / 2;
    const angleStep = fov / rayCount;

    for (let i = 0; i < rayCount; i++) {
      const angle = THREE.MathUtils.degToRad(startAngle + i * angleStep);
      directions.push(new THREE.Vector3(Math.cos(angle), 0, Math.sin(angle)));
    }
    return directions;
  }, [rayCount, fov]);

  // Create hit points geometry
  const hitPointsGeometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(rayCount * 3);
    const colors = new Float32Array(rayCount * 3);
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    return geometry;
  }, [rayCount]);

  // Create rays geometry
  const raysGeometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(rayCount * 6); // 2 points per ray
    const colors = new Float32Array(rayCount * 6);
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    return geometry;
  }, [rayCount]);

  useFrame(() => {
    if (!raysRef.current || simulationState !== 'running') return;

    const robotPos = robot.position.clone();
    robotPos.y = 0.3; // Sensor height
    const robotRotation = robot.rotation.y;

    // Get obstacle meshes for raycasting
    const obstacleMeshes: THREE.Object3D[] = [];
    scene.traverse((obj) => {
      if (obj.name === 'obstacles') {
        obj.traverse((child) => {
          if (child instanceof THREE.Mesh && child.geometry) {
            obstacleMeshes.push(child);
          }
        });
      }
      // Also include boundary walls
      if (obj.name === 'boundary-walls') {
        obj.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            obstacleMeshes.push(child);
          }
        });
      }
    });

    const hitPositions = hitPointsGeometry.getAttribute('position') as THREE.BufferAttribute;
    const hitColors = hitPointsGeometry.getAttribute('color') as THREE.BufferAttribute;
    const rayPositions = raysGeometry.getAttribute('position') as THREE.BufferAttribute;
    const rayColors = raysGeometry.getAttribute('color') as THREE.BufferAttribute;

    for (let i = 0; i < rayCount; i++) {
      // Rotate direction based on robot rotation
      const direction = rayDirections[i].clone();
      direction.applyAxisAngle(new THREE.Vector3(0, 1, 0), robotRotation);

      raycaster.current.set(robotPos, direction);
      raycaster.current.far = maxDistance;

      const intersects = raycaster.current.intersectObjects(obstacleMeshes, true);

      let hitDistance = maxDistance;
      let hitPoint = robotPos.clone().add(direction.clone().multiplyScalar(maxDistance));
      let hasHit = false;

      if (intersects.length > 0) {
        hitDistance = intersects[0].distance;
        hitPoint = intersects[0].point;
        hasHit = true;
      }

      // Update hit point
      hitPositions.setXYZ(i, hitPoint.x, hitPoint.y, hitPoint.z);

      // Color based on distance (green = far, red = close)
      const normalizedDist = hitDistance / maxDistance;
      if (hasHit) {
        hitColors.setXYZ(i, 1 - normalizedDist, normalizedDist, 0);
      } else {
        hitColors.setXYZ(i, 0, 0.5, 1); // Blue for no hit
      }

      // Update ray line
      rayPositions.setXYZ(i * 2, robotPos.x, robotPos.y, robotPos.z);
      rayPositions.setXYZ(i * 2 + 1, hitPoint.x, hitPoint.y, hitPoint.z);

      if (hasHit) {
        rayColors.setXYZ(i * 2, 0, 1, 1);
        rayColors.setXYZ(i * 2 + 1, 1 - normalizedDist, normalizedDist, 0);
      } else {
        rayColors.setXYZ(i * 2, 0, 0.3, 0.5);
        rayColors.setXYZ(i * 2 + 1, 0, 0.1, 0.3);
      }
    }

    hitPositions.needsUpdate = true;
    hitColors.needsUpdate = true;
    rayPositions.needsUpdate = true;
    rayColors.needsUpdate = true;
  });

  if (simulationState !== 'running') return null;

  return (
    <group ref={raysRef}>
      {/* Ray lines */}
      {showRays && (
        <lineSegments geometry={raysGeometry}>
          <lineBasicMaterial vertexColors transparent opacity={0.4} />
        </lineSegments>
      )}

      {/* Hit points */}
      {showHitPoints && (
        <points ref={hitPointsRef} geometry={hitPointsGeometry}>
          <pointsMaterial
            size={0.1}
            vertexColors
            transparent
            opacity={0.9}
            sizeAttenuation
          />
        </points>
      )}
    </group>
  );
}

// Radar-style 2D display component
export function LidarDisplay() {
  const { robot, simulationState, obstacles } = useSimulationStore();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const maxDistance = 5;

  useFrame(() => {
    if (!canvasRef.current || simulationState !== 'running') return;

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    const size = 150;
    const center = size / 2;
    const scale = (size / 2 - 10) / maxDistance;

    // Clear
    ctx.fillStyle = 'rgba(0, 20, 40, 0.9)';
    ctx.fillRect(0, 0, size, size);

    // Draw grid circles
    ctx.strokeStyle = 'rgba(0, 212, 255, 0.2)';
    ctx.lineWidth = 1;
    for (let r = 1; r <= 5; r++) {
      ctx.beginPath();
      ctx.arc(center, center, r * scale, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Draw cross
    ctx.beginPath();
    ctx.moveTo(center, 10);
    ctx.lineTo(center, size - 10);
    ctx.moveTo(10, center);
    ctx.lineTo(size - 10, center);
    ctx.stroke();

    // Draw robot
    ctx.fillStyle = '#00d4ff';
    ctx.beginPath();
    ctx.arc(center, center, 5, 0, Math.PI * 2);
    ctx.fill();

    // Draw obstacles (simplified - just based on positions)
    ctx.fillStyle = 'rgba(255, 100, 100, 0.8)';
    obstacles.forEach((obs) => {
      const dx = obs.position[0] - robot.position.x;
      const dz = obs.position[2] - robot.position.z;
      const dist = Math.sqrt(dx * dx + dz * dz);

      if (dist < maxDistance) {
        // Rotate based on robot rotation
        const angle = Math.atan2(dz, dx) - robot.rotation.y;
        const screenX = center + Math.cos(angle) * dist * scale;
        const screenY = center + Math.sin(angle) * dist * scale;

        ctx.beginPath();
        ctx.arc(screenX, screenY, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // Direction indicator
    ctx.strokeStyle = '#00ff88';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(center, center);
    ctx.lineTo(center, center - 20);
    ctx.stroke();
  });

  return (
    <div className="lidar-display">
      <div className="lidar-display__header">
        <span className="icon">📡</span>
        LiDAR
      </div>
      <canvas
        ref={canvasRef}
        width={150}
        height={150}
        style={{ borderRadius: '4px' }}
      />
      <style>{`
        .lidar-display {
          background: rgba(0, 20, 40, 0.9);
          border: 1px solid rgba(0, 212, 255, 0.3);
          border-radius: 8px;
          padding: 8px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
        }

        .lidar-display__header {
          font-size: 12px;
          color: #00d4ff;
          display: flex;
          align-items: center;
          gap: 4px;
          width: 100%;
        }

        .lidar-display__header .icon {
          font-size: 14px;
        }
      `}</style>
    </div>
  );
}
