import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useSimulationStore } from '../../stores/simulationStore';

export function CameraController() {
  const { camera } = useThree();
  const { cameraMode, robots, selectedRobotId } = useSimulationStore();
  const targetPosition = useRef(new THREE.Vector3());
  const targetLookAt = useRef(new THREE.Vector3());

  useFrame(() => {
    if (cameraMode === 'orbit') {
      // Orbit mode is handled by OrbitControls
      return;
    }

    // Get the robot to follow (selected or leader)
    const targetRobot = robots.find((r) => r.id === selectedRobotId)
      || robots.find((r) => r.isLeader)
      || robots[0];

    if (!targetRobot) return;

    const robotPos = targetRobot.position;

    if (cameraMode === 'first-person') {
      // First person - camera at robot head position, looking forward
      const headOffset = new THREE.Vector3(0.35, 0.42, 0);
      headOffset.applyEuler(targetRobot.rotation);

      targetPosition.current.set(
        robotPos.x + headOffset.x,
        robotPos.y + headOffset.y,
        robotPos.z + headOffset.z
      );

      // Look direction based on robot rotation
      const lookDir = new THREE.Vector3(1, 0, 0);
      lookDir.applyEuler(targetRobot.rotation);
      targetLookAt.current.copy(targetPosition.current).add(lookDir);
    } else if (cameraMode === 'follow') {
      // Follow mode - camera behind and above robot
      const offset = new THREE.Vector3(-3, 2, 0);
      offset.applyEuler(targetRobot.rotation);
      targetPosition.current.copy(robotPos).add(offset);
      targetLookAt.current.copy(robotPos);
      targetLookAt.current.y += 0.3;
    }

    // Smooth camera movement
    camera.position.lerp(targetPosition.current, 0.1);

    const currentLookAt = new THREE.Vector3();
    camera.getWorldDirection(currentLookAt);
    currentLookAt.add(camera.position);
    currentLookAt.lerp(targetLookAt.current, 0.1);
    camera.lookAt(targetLookAt.current);
  });

  return null;
}
