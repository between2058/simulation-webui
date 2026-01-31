import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useSimulationStore } from '../../stores/simulationStore';

export function CameraController() {
  const { camera } = useThree();
  const { cameraMode, robot } = useSimulationStore();
  const targetPosition = useRef(new THREE.Vector3());
  const targetLookAt = useRef(new THREE.Vector3());

  useFrame(() => {
    if (cameraMode === 'orbit') {
      // Orbit mode is handled by OrbitControls
      return;
    }

    const robotPos = robot.position;

    if (cameraMode === 'first-person') {
      // First person - camera at robot head position, looking forward
      targetPosition.current.set(
        robotPos.x + 0.35, // Head position
        robotPos.y + 0.42,
        robotPos.z
      );

      // Look direction based on robot rotation
      const lookDir = new THREE.Vector3(1, 0, 0);
      lookDir.applyEuler(robot.rotation);
      targetLookAt.current.copy(targetPosition.current).add(lookDir);
    } else if (cameraMode === 'follow') {
      // Follow mode - camera behind and above robot
      const offset = new THREE.Vector3(-3, 2, 0);
      offset.applyEuler(robot.rotation);
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
