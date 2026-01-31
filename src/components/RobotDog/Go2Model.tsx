import { useRef, useEffect, useState } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import * as THREE from 'three';
import { useSimulationStore } from '../../stores/simulationStore';

// Go2 joint structure based on MJCF
interface Go2Joints {
  // Front Right (FR)
  FR_hip: THREE.Object3D | null;
  FR_thigh: THREE.Object3D | null;
  FR_calf: THREE.Object3D | null;
  // Front Left (FL)
  FL_hip: THREE.Object3D | null;
  FL_thigh: THREE.Object3D | null;
  FL_calf: THREE.Object3D | null;
  // Rear Right (RR)
  RR_hip: THREE.Object3D | null;
  RR_thigh: THREE.Object3D | null;
  RR_calf: THREE.Object3D | null;
  // Rear Left (RL)
  RL_hip: THREE.Object3D | null;
  RL_thigh: THREE.Object3D | null;
  RL_calf: THREE.Object3D | null;
}

// Material for the robot
const robotMaterial = new THREE.MeshStandardMaterial({
  color: '#1a2a4a',
  roughness: 0.3,
  metalness: 0.8,
  envMapIntensity: 1,
});

const accentMaterial = new THREE.MeshStandardMaterial({
  color: '#00d4ff',
  emissive: '#00d4ff',
  emissiveIntensity: 0.5,
  roughness: 0.2,
  metalness: 0.9,
});

export function Go2Model() {
  const groupRef = useRef<THREE.Group>(null);
  const jointsRef = useRef<Go2Joints>({
    FR_hip: null, FR_thigh: null, FR_calf: null,
    FL_hip: null, FL_thigh: null, FL_calf: null,
    RR_hip: null, RR_thigh: null, RR_calf: null,
    RL_hip: null, RL_thigh: null, RL_calf: null,
  });
  const [loaded, setLoaded] = useState(false);
  const { simulationState, setRobotLoaded } = useSimulationStore();

  // Load OBJ parts
  const baseParts = [
    useLoader(OBJLoader, '/models/go2/assets/base_0.obj'),
    useLoader(OBJLoader, '/models/go2/assets/base_1.obj'),
    useLoader(OBJLoader, '/models/go2/assets/base_2.obj'),
    useLoader(OBJLoader, '/models/go2/assets/base_3.obj'),
    useLoader(OBJLoader, '/models/go2/assets/base_4.obj'),
  ];

  const hipParts = [
    useLoader(OBJLoader, '/models/go2/assets/hip_0.obj'),
    useLoader(OBJLoader, '/models/go2/assets/hip_1.obj'),
  ];

  const thighParts = [
    useLoader(OBJLoader, '/models/go2/assets/thigh_0.obj'),
    useLoader(OBJLoader, '/models/go2/assets/thigh_1.obj'),
  ];

  const thighMirrorParts = [
    useLoader(OBJLoader, '/models/go2/assets/thigh_mirror_0.obj'),
    useLoader(OBJLoader, '/models/go2/assets/thigh_mirror_1.obj'),
  ];

  const calfParts = [
    useLoader(OBJLoader, '/models/go2/assets/calf_0.obj'),
    useLoader(OBJLoader, '/models/go2/assets/calf_1.obj'),
  ];

  const calfMirrorParts = [
    useLoader(OBJLoader, '/models/go2/assets/calf_mirror_0.obj'),
    useLoader(OBJLoader, '/models/go2/assets/calf_mirror_1.obj'),
  ];

  const footObj = useLoader(OBJLoader, '/models/go2/assets/foot.obj');

  useEffect(() => {
    if (baseParts.length > 0) {
      setLoaded(true);
      setRobotLoaded(true);
    }
  }, [baseParts, setRobotLoaded]);

  // Apply material to all meshes in an object
  const applyMaterial = (obj: THREE.Object3D, material: THREE.Material) => {
    obj.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.material = material;
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
  };

  // Walking animation
  useFrame((state) => {
    if (!groupRef.current || simulationState !== 'running') return;

    const time = state.clock.elapsedTime;
    const walkSpeed = 4;
    const legAmplitude = 0.3;

    // Animate legs with walking gait
    const joints = jointsRef.current;

    // Diagonal gait - FR/RL move together, FL/RR move together
    if (joints.FR_thigh) {
      joints.FR_thigh.rotation.x = Math.sin(time * walkSpeed) * legAmplitude;
    }
    if (joints.RL_thigh) {
      joints.RL_thigh.rotation.x = Math.sin(time * walkSpeed) * legAmplitude;
    }
    if (joints.FL_thigh) {
      joints.FL_thigh.rotation.x = Math.sin(time * walkSpeed + Math.PI) * legAmplitude;
    }
    if (joints.RR_thigh) {
      joints.RR_thigh.rotation.x = Math.sin(time * walkSpeed + Math.PI) * legAmplitude;
    }

    // Calf movement
    if (joints.FR_calf) {
      joints.FR_calf.rotation.x = Math.max(0, Math.sin(time * walkSpeed) * legAmplitude * 0.5);
    }
    if (joints.RL_calf) {
      joints.RL_calf.rotation.x = Math.max(0, Math.sin(time * walkSpeed) * legAmplitude * 0.5);
    }
    if (joints.FL_calf) {
      joints.FL_calf.rotation.x = Math.max(0, Math.sin(time * walkSpeed + Math.PI) * legAmplitude * 0.5);
    }
    if (joints.RR_calf) {
      joints.RR_calf.rotation.x = Math.max(0, Math.sin(time * walkSpeed + Math.PI) * legAmplitude * 0.5);
    }
  });

  if (!loaded) return null;

  // Leg positions based on Go2 dimensions
  const legPositions = {
    FR: [0.1934, 0, -0.0465],   // Front Right
    FL: [0.1934, 0, 0.0465],    // Front Left
    RR: [-0.1934, 0, -0.0465],  // Rear Right
    RL: [-0.1934, 0, 0.0465],   // Rear Left
  };

  const thighOffset = [0, -0.04, 0];
  const calfOffset = [0, -0.213, 0];

  return (
    <group ref={groupRef} scale={[1, 1, 1]} rotation={[0, Math.PI / 2, 0]}>
      {/* Base/Body */}
      <group position={[0, 0.35, 0]}>
        {baseParts.map((part, i) => {
          const clone = part.clone();
          applyMaterial(clone, robotMaterial);
          return <primitive key={`base-${i}`} object={clone} />;
        })}

        {/* Eyes - accent lights */}
        <mesh position={[0.28, 0.05, 0.05]}>
          <sphereGeometry args={[0.015, 16, 16]} />
          <meshStandardMaterial
            color="#00d4ff"
            emissive="#00d4ff"
            emissiveIntensity={3}
          />
        </mesh>
        <mesh position={[0.28, 0.05, -0.05]}>
          <sphereGeometry args={[0.015, 16, 16]} />
          <meshStandardMaterial
            color="#00d4ff"
            emissive="#00d4ff"
            emissiveIntensity={3}
          />
        </mesh>

        {/* Status light on back */}
        <pointLight position={[0, 0.1, 0]} intensity={0.3} color="#00d4ff" distance={2} />
      </group>

      {/* Legs */}
      {Object.entries(legPositions).map(([name, pos]) => {
        const isRightSide = name.endsWith('R');

        return (
          <group
            key={name}
            position={[pos[0], 0.35 + pos[1], isRightSide ? -Math.abs(pos[2]) : Math.abs(pos[2])]}
          >
            {/* Hip */}
            <group ref={(ref) => {
              if (ref) jointsRef.current[`${name}_hip` as keyof Go2Joints] = ref;
            }}>
              {hipParts.map((part, i) => {
                const clone = part.clone();
                applyMaterial(clone, robotMaterial);
                if (isRightSide) clone.scale.z = -1;
                return <primitive key={`${name}-hip-${i}`} object={clone} />;
              })}

              {/* Thigh */}
              <group
                position={[0, thighOffset[1], isRightSide ? -0.0955 : 0.0955]}
                ref={(ref) => {
                  if (ref) jointsRef.current[`${name}_thigh` as keyof Go2Joints] = ref;
                }}
              >
                {(isRightSide ? thighParts : thighMirrorParts).map((part, i) => {
                  const clone = part.clone();
                  applyMaterial(clone, robotMaterial);
                  return <primitive key={`${name}-thigh-${i}`} object={clone} />;
                })}

                {/* Calf */}
                <group
                  position={[0, calfOffset[1], 0]}
                  ref={(ref) => {
                    if (ref) jointsRef.current[`${name}_calf` as keyof Go2Joints] = ref;
                  }}
                >
                  {(isRightSide ? calfParts : calfMirrorParts).map((part, i) => {
                    const clone = part.clone();
                    applyMaterial(clone, robotMaterial);
                    return <primitive key={`${name}-calf-${i}`} object={clone} />;
                  })}

                  {/* Foot */}
                  <group position={[0, -0.213, 0]}>
                    {(() => {
                      const clone = footObj.clone();
                      applyMaterial(clone, accentMaterial);
                      return <primitive object={clone} />;
                    })()}
                  </group>
                </group>
              </group>
            </group>
          </group>
        );
      })}
    </group>
  );
}
