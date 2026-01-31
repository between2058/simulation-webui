import React, { useRef, useEffect, useState, Suspense } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useSimulationStore } from '../../stores/simulationStore';
import { useKeyboardControls } from '../../utils/useKeyboardControls';
import { Go2Model } from './Go2Model';
import { defaultObstacles, getObstacleBounds } from '../Scene/Obstacles';

// Placeholder robot while model loads
function PlaceholderRobot() {
  const groupRef = useRef<THREE.Group>(null);
  const { simulationState } = useSimulationStore();

  useFrame((state) => {
    if (groupRef.current && simulationState === 'running') {
      groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 2) * 0.02;
    }
  });

  return (
    <group ref={groupRef}>
      <mesh position={[0, 0.35, 0]} castShadow>
        <boxGeometry args={[0.6, 0.2, 0.35]} />
        <meshStandardMaterial
          color="#1a2a4a"
          roughness={0.3}
          metalness={0.8}
          emissive="#00d4ff"
          emissiveIntensity={0.1}
        />
      </mesh>
      <mesh position={[0.35, 0.4, 0]} castShadow>
        <boxGeometry args={[0.15, 0.12, 0.2]} />
        <meshStandardMaterial color="#1a2a4a" roughness={0.3} metalness={0.8} />
      </mesh>
      <mesh position={[0.42, 0.42, 0.05]}>
        <sphereGeometry args={[0.02, 16, 16]} />
        <meshStandardMaterial color="#00d4ff" emissive="#00d4ff" emissiveIntensity={2} />
      </mesh>
      <mesh position={[0.42, 0.42, -0.05]}>
        <sphereGeometry args={[0.02, 16, 16]} />
        <meshStandardMaterial color="#00d4ff" emissive="#00d4ff" emissiveIntensity={2} />
      </mesh>
      {[[0.2, 0.08], [0.2, -0.08], [-0.2, 0.08], [-0.2, -0.08]].map(([x, z], i) => (
        <group key={i} position={[x, 0.15, z]}>
          <mesh castShadow>
            <boxGeometry args={[0.06, 0.2, 0.06]} />
            <meshStandardMaterial color="#0d1a2d" metalness={0.9} roughness={0.2} />
          </mesh>
          <mesh position={[0, -0.15, 0]} castShadow>
            <boxGeometry args={[0.04, 0.15, 0.04]} />
            <meshStandardMaterial color="#0d1a2d" metalness={0.9} roughness={0.2} />
          </mesh>
          <mesh position={[0, -0.25, 0]}>
            <sphereGeometry args={[0.03, 8, 8]} />
            <meshStandardMaterial color="#00d4ff" emissive="#00d4ff" emissiveIntensity={0.5} />
          </mesh>
        </group>
      ))}
      <pointLight position={[0, 0.5, 0]} intensity={0.2} color="#00d4ff" distance={2} />
    </group>
  );
}

function LoadingRobot() {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.elapsedTime * 2;
    }
  });

  return (
    <mesh ref={meshRef} position={[0, 0.5, 0]}>
      <octahedronGeometry args={[0.2, 0]} />
      <meshStandardMaterial color="#00d4ff" emissive="#00d4ff" emissiveIntensity={1} wireframe />
    </mesh>
  );
}

function Go2ModelWithFallback() {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return <PlaceholderRobot />;
  }

  return (
    <ErrorBoundary onError={() => setHasError(true)}>
      <Suspense fallback={<LoadingRobot />}>
        <Go2Model />
      </Suspense>
    </ErrorBoundary>
  );
}

class ErrorBoundary extends React.Component<{
  children: React.ReactNode;
  onError: () => void;
}> {
  componentDidCatch() {
    this.props.onError();
  }
  render() {
    return this.props.children;
  }
}

interface RobotDogProps {
  targetPosition?: THREE.Vector3 | null;
  path?: THREE.Vector3[] | null;
}

export function RobotDog({ path }: RobotDogProps) {
  const groupRef = useRef<THREE.Group>(null);
  const [useDetailedModel] = useState(true);
  const [currentWaypointIndex, setCurrentWaypointIndex] = useState(0);
  const obstaclesRef = useRef<THREE.Box3[]>(getObstacleBounds(defaultObstacles));
  const { setRobotLoaded, setRobotPosition, setRobotRotation, simulationState } = useSimulationStore();
  const movement = useKeyboardControls();

  // Robot collision box dimensions
  const robotRadius = 0.4;

  useEffect(() => {
    setRobotLoaded(true);
  }, [setRobotLoaded]);

  // Reset waypoint when path changes
  useEffect(() => {
    setCurrentWaypointIndex(0);
  }, [path]);

  // Check collision with obstacles
  const checkCollision = (newPos: THREE.Vector3): boolean => {
    const robotBox = new THREE.Box3(
      new THREE.Vector3(newPos.x - robotRadius, 0, newPos.z - robotRadius),
      new THREE.Vector3(newPos.x + robotRadius, 0.8, newPos.z + robotRadius)
    );

    for (const obstacle of obstaclesRef.current) {
      if (robotBox.intersectsBox(obstacle)) {
        return true;
      }
    }

    // Boundary check
    const bounds = 9.5;
    if (Math.abs(newPos.x) > bounds || Math.abs(newPos.z) > bounds) {
      return true;
    }

    return false;
  };

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    if (simulationState !== 'running') return;

    const speed = 2 * delta;
    const rotSpeed = 2 * delta;
    const autoSpeed = 1.5 * delta;

    const currentPos = groupRef.current.position.clone();

    // Manual keyboard control
    if (movement.forward || movement.backward || movement.left || movement.right) {
      if (movement.left) {
        groupRef.current.rotation.y += rotSpeed;
      }
      if (movement.right) {
        groupRef.current.rotation.y -= rotSpeed;
      }

      if (movement.forward) {
        const newPos = currentPos.clone();
        newPos.x += Math.cos(groupRef.current.rotation.y) * speed;
        newPos.z -= Math.sin(groupRef.current.rotation.y) * speed;

        if (!checkCollision(newPos)) {
          groupRef.current.position.x = newPos.x;
          groupRef.current.position.z = newPos.z;
        }
      }
      if (movement.backward) {
        const newPos = currentPos.clone();
        newPos.x -= Math.cos(groupRef.current.rotation.y) * speed;
        newPos.z += Math.sin(groupRef.current.rotation.y) * speed;

        if (!checkCollision(newPos)) {
          groupRef.current.position.x = newPos.x;
          groupRef.current.position.z = newPos.z;
        }
      }
    }
    // Automatic pathfinding movement
    else if (path && path.length > 0 && currentWaypointIndex < path.length) {
      const targetWaypoint = path[currentWaypointIndex];
      const direction = new THREE.Vector3()
        .subVectors(targetWaypoint, currentPos)
        .setY(0);

      const distance = direction.length();

      if (distance < 0.2) {
        // Reached waypoint, move to next
        setCurrentWaypointIndex((prev) => prev + 1);
      } else {
        // Move towards waypoint
        direction.normalize();

        // Rotate towards target
        const targetAngle = Math.atan2(-direction.z, direction.x);
        let currentAngle = groupRef.current.rotation.y;

        // Normalize angles
        while (targetAngle - currentAngle > Math.PI) currentAngle += Math.PI * 2;
        while (targetAngle - currentAngle < -Math.PI) currentAngle -= Math.PI * 2;

        // Smooth rotation
        const angleDiff = targetAngle - currentAngle;
        const rotAmount = Math.sign(angleDiff) * Math.min(Math.abs(angleDiff), rotSpeed * 3);
        groupRef.current.rotation.y += rotAmount;

        // Move forward if facing roughly the right direction
        if (Math.abs(angleDiff) < Math.PI / 4) {
          const newPos = currentPos.clone();
          newPos.x += direction.x * autoSpeed;
          newPos.z += direction.z * autoSpeed;

          if (!checkCollision(newPos)) {
            groupRef.current.position.x = newPos.x;
            groupRef.current.position.z = newPos.z;
            }
        }
      }
    }

    // Update store
    setRobotPosition(groupRef.current.position.clone());
    setRobotRotation(groupRef.current.rotation.clone());

    // Body animation
    const sway = Math.sin(state.clock.elapsedTime * 3) * 0.003;
    groupRef.current.position.y = sway;
  });

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      {useDetailedModel ? (
        <Suspense fallback={<LoadingRobot />}>
          <Go2ModelWithFallback />
        </Suspense>
      ) : (
        <PlaceholderRobot />
      )}
    </group>
  );
}
