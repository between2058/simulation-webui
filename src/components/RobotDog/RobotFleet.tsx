import React, { useRef, useEffect, useState, Suspense, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useSimulationStore } from '../../stores/simulationStore';
import type { RobotInstance, FormationMode } from '../../stores/simulationStore';
import { useKeyboardControls } from '../../utils/useKeyboardControls';
import { Go2Model, Go2ModelSimple } from './Go2Model';
import { getObstacleBounds } from '../Scene/Obstacles';

// Loading indicator for robot
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

// Error boundary for model loading
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

function Go2ModelWithFallback({ color }: { color: string }) {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return <Go2ModelSimple accentColor={color} />;
  }

  return (
    <ErrorBoundary onError={() => setHasError(true)}>
      <Suspense fallback={<LoadingRobot />}>
        <Go2Model accentColor={color} />
      </Suspense>
    </ErrorBoundary>
  );
}

// Calculate formation positions relative to leader
function getFormationOffset(
  index: number,
  total: number,
  mode: FormationMode,
  spacing: number,
  leaderRotation: number
): THREE.Vector3 {
  if (index === 0 || mode === 'none') return new THREE.Vector3(0, 0, 0);

  const followerIndex = index - 1;
  let offset = new THREE.Vector3();

  switch (mode) {
    case 'line':
      // Single file behind leader
      offset.set(-spacing * index, 0, 0);
      break;

    case 'wedge':
      // V-formation
      const side = followerIndex % 2 === 0 ? 1 : -1;
      const row = Math.floor(followerIndex / 2) + 1;
      offset.set(-spacing * row, 0, side * spacing * row * 0.7);
      break;

    case 'circle':
      // Circle around leader
      const angle = (followerIndex / (total - 1)) * Math.PI * 2;
      const radius = spacing * 1.5;
      offset.set(Math.cos(angle) * radius, 0, Math.sin(angle) * radius);
      break;

    case 'spread':
      // Spread out in a grid
      const cols = Math.ceil(Math.sqrt(total));
      const col = followerIndex % cols;
      const row2 = Math.floor(followerIndex / cols);
      offset.set(-spacing * (row2 + 1), 0, (col - cols / 2) * spacing);
      break;
  }

  // Rotate offset based on leader's rotation
  offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), leaderRotation);

  return offset;
}

// Individual robot in the fleet
interface FleetRobotProps {
  robot: RobotInstance;
  index: number;
  totalRobots: number;
  leaderPosition: THREE.Vector3;
  leaderRotation: number;
  path: THREE.Vector3[] | null;
  obstacleBounds: THREE.Box3[];
}

function FleetRobot({
  robot,
  index,
  totalRobots,
  leaderPosition,
  leaderRotation,
  path,
  obstacleBounds,
}: FleetRobotProps) {
  const groupRef = useRef<THREE.Group>(null);
  const [currentWaypointIndex, setCurrentWaypointIndex] = useState(0);
  const {
    updateRobot,
    simulationState,
    formationMode,
    formationSpacing,
    patrolMode,
    waypoints,
  } = useSimulationStore();

  const robotRadius = 0.4;

  // Reset waypoint when path changes
  useEffect(() => {
    setCurrentWaypointIndex(0);
  }, [path]);

  // Initialize position
  useEffect(() => {
    if (groupRef.current) {
      groupRef.current.position.copy(robot.position);
      groupRef.current.rotation.copy(robot.rotation);
    }
    updateRobot(robot.id, { isLoaded: true });
  }, [robot.id, updateRobot]);

  // Check collision
  const checkCollision = (newPos: THREE.Vector3): boolean => {
    const robotBox = new THREE.Box3(
      new THREE.Vector3(newPos.x - robotRadius, 0, newPos.z - robotRadius),
      new THREE.Vector3(newPos.x + robotRadius, 0.8, newPos.z + robotRadius)
    );

    for (const obstacle of obstacleBounds) {
      if (robotBox.intersectsBox(obstacle)) {
        return true;
      }
    }

    const bounds = 9.5;
    if (Math.abs(newPos.x) > bounds || Math.abs(newPos.z) > bounds) {
      return true;
    }

    return false;
  };

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    if (simulationState !== 'running') return;

    const speed = 1.5 * delta;
    const rotSpeed = 2 * delta;
    const currentPos = groupRef.current.position.clone();

    let targetPosition: THREE.Vector3;
    let targetRotation: number = leaderRotation;

    if (robot.isLeader) {
      // Leader follows path
      if (path && path.length > 0 && currentWaypointIndex < path.length) {
        const targetWaypoint = path[currentWaypointIndex];
        const direction = new THREE.Vector3()
          .subVectors(targetWaypoint, currentPos)
          .setY(0);

        const distance = direction.length();

        if (distance < 0.2) {
          setCurrentWaypointIndex((prev) => prev + 1);
        } else {
          direction.normalize();
          targetRotation = Math.atan2(-direction.z, direction.x);

          let currentAngle = groupRef.current.rotation.y;
          while (targetRotation - currentAngle > Math.PI) currentAngle += Math.PI * 2;
          while (targetRotation - currentAngle < -Math.PI) currentAngle -= Math.PI * 2;

          const angleDiff = targetRotation - currentAngle;
          const rotAmount = Math.sign(angleDiff) * Math.min(Math.abs(angleDiff), rotSpeed * 3);
          groupRef.current.rotation.y += rotAmount;

          if (Math.abs(angleDiff) < Math.PI / 4) {
            const newPos = currentPos.clone();
            newPos.x += direction.x * speed;
            newPos.z += direction.z * speed;

            if (!checkCollision(newPos)) {
              groupRef.current.position.x = newPos.x;
              groupRef.current.position.z = newPos.z;
            }
          }
        }
      }
      // Patrol mode for leader
      else if (patrolMode === 'single' && waypoints.length > 0) {
        const wpIndex = robot.targetWaypointIndex % waypoints.length;
        const targetWp = waypoints[wpIndex];
        const targetVec = new THREE.Vector3(targetWp.position[0], 0, targetWp.position[2]);
        const direction = new THREE.Vector3().subVectors(targetVec, currentPos).setY(0);
        const distance = direction.length();

        if (distance < 0.3) {
          updateRobot(robot.id, { targetWaypointIndex: wpIndex + 1 });
        } else {
          direction.normalize();
          targetRotation = Math.atan2(-direction.z, direction.x);

          let currentAngle = groupRef.current.rotation.y;
          while (targetRotation - currentAngle > Math.PI) currentAngle += Math.PI * 2;
          while (targetRotation - currentAngle < -Math.PI) currentAngle -= Math.PI * 2;

          const angleDiff = targetRotation - currentAngle;
          const rotAmount = Math.sign(angleDiff) * Math.min(Math.abs(angleDiff), rotSpeed * 3);
          groupRef.current.rotation.y += rotAmount;

          if (Math.abs(angleDiff) < Math.PI / 4) {
            const newPos = currentPos.clone();
            newPos.x += direction.x * speed;
            newPos.z += direction.z * speed;

            if (!checkCollision(newPos)) {
              groupRef.current.position.x = newPos.x;
              groupRef.current.position.z = newPos.z;
            }
          }
        }
      }
    } else {
      // Follower behavior
      if (patrolMode === 'distributed' && robot.assignedWaypoints.length > 0) {
        // Distributed patrol - each robot follows its own waypoints
        const wpId = robot.assignedWaypoints[robot.targetWaypointIndex % robot.assignedWaypoints.length];
        const targetWp = waypoints.find((w) => w.id === wpId);

        if (targetWp) {
          const targetVec = new THREE.Vector3(targetWp.position[0], 0, targetWp.position[2]);
          const direction = new THREE.Vector3().subVectors(targetVec, currentPos).setY(0);
          const distance = direction.length();

          if (distance < 0.3) {
            updateRobot(robot.id, {
              targetWaypointIndex: (robot.targetWaypointIndex + 1) % robot.assignedWaypoints.length,
            });
          } else {
            direction.normalize();
            targetRotation = Math.atan2(-direction.z, direction.x);

            let currentAngle = groupRef.current.rotation.y;
            while (targetRotation - currentAngle > Math.PI) currentAngle += Math.PI * 2;
            while (targetRotation - currentAngle < -Math.PI) currentAngle -= Math.PI * 2;

            const angleDiff = targetRotation - currentAngle;
            const rotAmount = Math.sign(angleDiff) * Math.min(Math.abs(angleDiff), rotSpeed * 3);
            groupRef.current.rotation.y += rotAmount;

            if (Math.abs(angleDiff) < Math.PI / 4) {
              const newPos = currentPos.clone();
              newPos.x += direction.x * speed;
              newPos.z += direction.z * speed;

              if (!checkCollision(newPos)) {
                groupRef.current.position.x = newPos.x;
                groupRef.current.position.z = newPos.z;
              }
            }
          }
        }
      } else {
        // Formation following - follow leader with offset
        const formationOffset = getFormationOffset(
          index,
          totalRobots,
          formationMode,
          formationSpacing,
          leaderRotation
        );
        targetPosition = leaderPosition.clone().add(formationOffset);

        const direction = new THREE.Vector3()
          .subVectors(targetPosition, currentPos)
          .setY(0);
        const distance = direction.length();

        if (distance > 0.2) {
          direction.normalize();
          targetRotation = Math.atan2(-direction.z, direction.x);

          let currentAngle = groupRef.current.rotation.y;
          while (targetRotation - currentAngle > Math.PI) currentAngle += Math.PI * 2;
          while (targetRotation - currentAngle < -Math.PI) currentAngle -= Math.PI * 2;

          const angleDiff = targetRotation - currentAngle;
          const rotAmount = Math.sign(angleDiff) * Math.min(Math.abs(angleDiff), rotSpeed * 3);
          groupRef.current.rotation.y += rotAmount;

          // Move faster to catch up if too far
          const catchUpSpeed = Math.min(distance * 0.5, speed * 2);

          if (Math.abs(angleDiff) < Math.PI / 3) {
            const newPos = currentPos.clone();
            newPos.x += direction.x * catchUpSpeed;
            newPos.z += direction.z * catchUpSpeed;

            if (!checkCollision(newPos)) {
              groupRef.current.position.x = newPos.x;
              groupRef.current.position.z = newPos.z;
            }
          }
        }
      }
    }

    // Update store with new position/rotation
    updateRobot(robot.id, {
      position: groupRef.current.position.clone(),
      rotation: groupRef.current.rotation.clone(),
    });

    // Body animation
    const sway = Math.sin(state.clock.elapsedTime * 3 + index) * 0.003;
    groupRef.current.position.y = sway;
  });

  return (
    <group ref={groupRef} position={[robot.position.x, robot.position.y, robot.position.z]}>
      <Suspense fallback={<LoadingRobot />}>
        <Go2ModelWithFallback color={robot.color} />
      </Suspense>

      {/* Robot indicator light */}
      <pointLight position={[0, 0.5, 0]} intensity={0.3} color={robot.color} distance={2} />

      {/* Leader indicator */}
      {robot.isLeader && (
        <mesh position={[0, 0.8, 0]}>
          <coneGeometry args={[0.05, 0.1, 4]} />
          <meshStandardMaterial color="#ffe66d" emissive="#ffe66d" emissiveIntensity={2} />
        </mesh>
      )}
    </group>
  );
}

// Main fleet controller
interface RobotFleetProps {
  path?: THREE.Vector3[] | null;
}

export function RobotFleet({ path }: RobotFleetProps) {
  const { robots, obstacles, simulationState, setRobotPosition, setRobotRotation } = useSimulationStore();
  const movement = useKeyboardControls();

  const obstacleBounds = useMemo(() => getObstacleBounds(obstacles), [obstacles]);

  // Find leader
  const leader = robots.find((r) => r.isLeader) || robots[0];
  const leaderPosition = leader?.position || new THREE.Vector3();
  const leaderRotation = leader?.rotation.y || 0;

  // Handle keyboard controls for leader
  const groupRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (simulationState !== 'running') return;
    if (!leader) return;

    const speed = 2 * delta;
    const rotSpeed = 2 * delta;

    if (movement.forward || movement.backward || movement.left || movement.right) {
      const leaderRobot = robots.find((r) => r.isLeader);
      if (!leaderRobot) return;

      let newRotation = leaderRobot.rotation.y;
      const newPos = leaderRobot.position.clone();

      if (movement.left) {
        newRotation += rotSpeed;
      }
      if (movement.right) {
        newRotation -= rotSpeed;
      }

      if (movement.forward) {
        newPos.x += Math.cos(newRotation) * speed;
        newPos.z -= Math.sin(newRotation) * speed;
      }
      if (movement.backward) {
        newPos.x -= Math.cos(newRotation) * speed;
        newPos.z += Math.sin(newRotation) * speed;
      }

      // Collision check
      const robotBox = new THREE.Box3(
        new THREE.Vector3(newPos.x - 0.4, 0, newPos.z - 0.4),
        new THREE.Vector3(newPos.x + 0.4, 0.8, newPos.z + 0.4)
      );

      let hasCollision = false;
      for (const obstacle of obstacleBounds) {
        if (robotBox.intersectsBox(obstacle)) {
          hasCollision = true;
          break;
        }
      }

      const bounds = 9.5;
      if (Math.abs(newPos.x) > bounds || Math.abs(newPos.z) > bounds) {
        hasCollision = true;
      }

      if (!hasCollision) {
        setRobotPosition(newPos);
        setRobotRotation(new THREE.Euler(0, newRotation, 0));
      }
    }
  });

  return (
    <group ref={groupRef}>
      {robots.map((robot, index) => (
        <FleetRobot
          key={robot.id}
          robot={robot}
          index={index}
          totalRobots={robots.length}
          leaderPosition={leaderPosition}
          leaderRotation={leaderRotation}
          path={path || null}
          obstacleBounds={obstacleBounds}
        />
      ))}
    </group>
  );
}
