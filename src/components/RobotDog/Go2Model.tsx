import { useRef, useEffect, useState } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import * as THREE from 'three';
import { useSimulationStore } from '../../stores/simulationStore';

// Go2 joint structure based on MJCF from mujoco_menagerie
interface Go2Joints {
  FR_hip: THREE.Object3D | null;
  FR_thigh: THREE.Object3D | null;
  FR_calf: THREE.Object3D | null;
  FL_hip: THREE.Object3D | null;
  FL_thigh: THREE.Object3D | null;
  FL_calf: THREE.Object3D | null;
  RR_hip: THREE.Object3D | null;
  RR_thigh: THREE.Object3D | null;
  RR_calf: THREE.Object3D | null;
  RL_hip: THREE.Object3D | null;
  RL_thigh: THREE.Object3D | null;
  RL_calf: THREE.Object3D | null;
}

// Sci-fi materials
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

// Unitree Go2 model from Google DeepMind mujoco_menagerie
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

  // Load OBJ parts from mujoco_menagerie
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
      console.log('Unitree Go2 (mujoco_menagerie) loaded');
    }
  }, [baseParts, setRobotLoaded]);

  // Apply material to meshes
  const applyMaterial = (obj: THREE.Object3D, material: THREE.Material) => {
    obj.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.material = material;
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
  };

  // Walking animation based on MJCF joint axes
  // In MuJoCo: hip_joint and calf_joint use Y axis (axis="0 1 0")
  // Model is rotated 90° around Y, so we animate on Z axis in local space
  useFrame((state) => {
    if (!groupRef.current || simulationState !== 'running') return;

    const time = state.clock.elapsedTime;
    const walkSpeed = 6;

    // From MJCF: home pose has thigh at 0.9 rad, calf at -1.8 rad
    const baseThighAngle = 0.9;
    const baseCalfAngle = -1.8;
    const legAmplitude = 0.4;
    const calfAmplitude = 0.3;

    const joints = jointsRef.current;

    // Diagonal gait: FR/RL move together, FL/RR move together
    // Using Z rotation because model is rotated 90° around Y
    const phase1 = Math.sin(time * walkSpeed);
    const phase2 = Math.sin(time * walkSpeed + Math.PI);

    // Front Right & Rear Left
    if (joints.FR_thigh) joints.FR_thigh.rotation.z = baseThighAngle + phase1 * legAmplitude;
    if (joints.FR_calf) joints.FR_calf.rotation.z = baseCalfAngle + Math.abs(phase1) * calfAmplitude;
    if (joints.RL_thigh) joints.RL_thigh.rotation.z = baseThighAngle + phase1 * legAmplitude;
    if (joints.RL_calf) joints.RL_calf.rotation.z = baseCalfAngle + Math.abs(phase1) * calfAmplitude;

    // Front Left & Rear Right
    if (joints.FL_thigh) joints.FL_thigh.rotation.z = baseThighAngle + phase2 * legAmplitude;
    if (joints.FL_calf) joints.FL_calf.rotation.z = baseCalfAngle + Math.abs(phase2) * calfAmplitude;
    if (joints.RR_thigh) joints.RR_thigh.rotation.z = baseThighAngle + phase2 * legAmplitude;
    if (joints.RR_calf) joints.RR_calf.rotation.z = baseCalfAngle + Math.abs(phase2) * calfAmplitude;
  });

  if (!loaded) return null;

  // Leg positions from MJCF (in MuJoCo coordinates: X forward, Y left, Z up)
  // After 90° Y rotation: X becomes Z, Z becomes -X
  const legPositions = {
    FL: { x: 0.1934, y: 0.0465, thighY: 0.0955, mirror: false },
    FR: { x: 0.1934, y: -0.0465, thighY: -0.0955, mirror: true },
    RL: { x: -0.1934, y: 0.0465, thighY: 0.0955, mirror: false },
    RR: { x: -0.1934, y: -0.0465, thighY: -0.0955, mirror: true },
  };

  return (
    <group ref={groupRef} rotation={[0, Math.PI / 2, 0]}>
      {/* Base/Body - position from MJCF: 0 0 0.445 */}
      <group position={[0, 0.35, 0]}>
        {baseParts.map((part, i) => {
          const clone = part.clone();
          applyMaterial(clone, robotMaterial);
          return <primitive key={`base-${i}`} object={clone} />;
        })}

        {/* Sci-fi eyes */}
        <mesh position={[0.28, 0.05, 0.05]}>
          <sphereGeometry args={[0.015, 16, 16]} />
          <meshStandardMaterial color="#00d4ff" emissive="#00d4ff" emissiveIntensity={3} />
        </mesh>
        <mesh position={[0.28, 0.05, -0.05]}>
          <sphereGeometry args={[0.015, 16, 16]} />
          <meshStandardMaterial color="#00d4ff" emissive="#00d4ff" emissiveIntensity={3} />
        </mesh>

        <pointLight position={[0, 0.1, 0]} intensity={0.3} color="#00d4ff" distance={2} />
      </group>

      {/* Legs */}
      {Object.entries(legPositions).map(([name, leg]) => (
        <group key={name} position={[leg.x, 0.35, leg.y]}>
          {/* Hip */}
          <group ref={(ref) => {
            if (ref) jointsRef.current[`${name}_hip` as keyof Go2Joints] = ref;
          }}>
            {hipParts.map((part, i) => {
              const clone = part.clone();
              applyMaterial(clone, robotMaterial);
              if (leg.mirror) clone.scale.z = -1;
              return <primitive key={`${name}-hip-${i}`} object={clone} />;
            })}

            {/* Thigh */}
            <group
              position={[0, 0, leg.thighY]}
              ref={(ref) => {
                if (ref) jointsRef.current[`${name}_thigh` as keyof Go2Joints] = ref;
              }}
            >
              {(leg.mirror ? thighMirrorParts : thighParts).map((part, i) => {
                const clone = part.clone();
                applyMaterial(clone, robotMaterial);
                return <primitive key={`${name}-thigh-${i}`} object={clone} />;
              })}

              {/* Calf - position from MJCF: 0 0 -0.213 */}
              <group
                position={[0, -0.213, 0]}
                ref={(ref) => {
                  if (ref) jointsRef.current[`${name}_calf` as keyof Go2Joints] = ref;
                }}
              >
                {(leg.mirror ? calfMirrorParts : calfParts).map((part, i) => {
                  const clone = part.clone();
                  applyMaterial(clone, robotMaterial);
                  return <primitive key={`${name}-calf-${i}`} object={clone} />;
                })}

                {/* Foot - position from MJCF: 0 0 -0.213 */}
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
      ))}
    </group>
  );
}

// Simple fallback model (procedural geometry)
export function Go2ModelSimple() {
  const groupRef = useRef<THREE.Group>(null);
  const jointsRef = useRef<Go2Joints>({
    FR_hip: null, FR_thigh: null, FR_calf: null,
    FL_hip: null, FL_thigh: null, FL_calf: null,
    RR_hip: null, RR_thigh: null, RR_calf: null,
    RL_hip: null, RL_thigh: null, RL_calf: null,
  });
  const { simulationState } = useSimulationStore();

  useFrame((state) => {
    if (!groupRef.current || simulationState !== 'running') return;

    const time = state.clock.elapsedTime;
    const walkSpeed = 6;
    const baseThighAngle = 0.9;
    const baseCalfAngle = -1.8;
    const legAmplitude = 0.4;
    const calfAmplitude = 0.3;

    const joints = jointsRef.current;
    const phase1 = Math.sin(time * walkSpeed);
    const phase2 = Math.sin(time * walkSpeed + Math.PI);

    if (joints.FR_thigh) joints.FR_thigh.rotation.z = baseThighAngle + phase1 * legAmplitude;
    if (joints.FR_calf) joints.FR_calf.rotation.z = baseCalfAngle + Math.abs(phase1) * calfAmplitude;
    if (joints.RL_thigh) joints.RL_thigh.rotation.z = baseThighAngle + phase1 * legAmplitude;
    if (joints.RL_calf) joints.RL_calf.rotation.z = baseCalfAngle + Math.abs(phase1) * calfAmplitude;

    if (joints.FL_thigh) joints.FL_thigh.rotation.z = baseThighAngle + phase2 * legAmplitude;
    if (joints.FL_calf) joints.FL_calf.rotation.z = baseCalfAngle + Math.abs(phase2) * calfAmplitude;
    if (joints.RR_thigh) joints.RR_thigh.rotation.z = baseThighAngle + phase2 * legAmplitude;
    if (joints.RR_calf) joints.RR_calf.rotation.z = baseCalfAngle + Math.abs(phase2) * calfAmplitude;
  });

  const legPositions = {
    FL: [0.15, 0.08],
    FR: [0.15, -0.08],
    RL: [-0.15, 0.08],
    RR: [-0.15, -0.08],
  };

  return (
    <group ref={groupRef} rotation={[0, Math.PI / 2, 0]}>
      {/* Body */}
      <mesh position={[0, 0.35, 0]} castShadow>
        <boxGeometry args={[0.4, 0.12, 0.15]} />
        <meshStandardMaterial color="#1a2a4a" roughness={0.3} metalness={0.8} emissive="#00d4ff" emissiveIntensity={0.05} />
      </mesh>

      {/* Head */}
      <mesh position={[0.25, 0.38, 0]} castShadow>
        <boxGeometry args={[0.12, 0.08, 0.1]} />
        <meshStandardMaterial color="#1a2a4a" roughness={0.3} metalness={0.8} />
      </mesh>

      {/* Eyes */}
      <mesh position={[0.31, 0.39, 0.025]}>
        <sphereGeometry args={[0.012, 16, 16]} />
        <meshStandardMaterial color="#00d4ff" emissive="#00d4ff" emissiveIntensity={3} />
      </mesh>
      <mesh position={[0.31, 0.39, -0.025]}>
        <sphereGeometry args={[0.012, 16, 16]} />
        <meshStandardMaterial color="#00d4ff" emissive="#00d4ff" emissiveIntensity={3} />
      </mesh>

      {/* Legs */}
      {Object.entries(legPositions).map(([name, [x, z]]) => (
        <group key={name} position={[x, 0.35, z]}>
          <group ref={(ref) => { if (ref) jointsRef.current[`${name}_hip` as keyof Go2Joints] = ref; }}>
            <mesh castShadow>
              <boxGeometry args={[0.04, 0.06, 0.04]} />
              <meshStandardMaterial color="#0d1a2d" metalness={0.9} roughness={0.2} />
            </mesh>
            <group position={[0, 0, z > 0 ? 0.04 : -0.04]} ref={(ref) => { if (ref) jointsRef.current[`${name}_thigh` as keyof Go2Joints] = ref; }}>
              <mesh position={[0, -0.08, 0]} castShadow>
                <boxGeometry args={[0.03, 0.16, 0.03]} />
                <meshStandardMaterial color="#1a2a4a" metalness={0.8} roughness={0.3} />
              </mesh>
              <group position={[0, -0.18, 0]} ref={(ref) => { if (ref) jointsRef.current[`${name}_calf` as keyof Go2Joints] = ref; }}>
                <mesh position={[0, -0.08, 0]} castShadow>
                  <boxGeometry args={[0.025, 0.16, 0.025]} />
                  <meshStandardMaterial color="#0d1a2d" metalness={0.9} roughness={0.2} />
                </mesh>
                <mesh position={[0, -0.18, 0]}>
                  <sphereGeometry args={[0.022, 8, 8]} />
                  <meshStandardMaterial color="#00d4ff" emissive="#00d4ff" emissiveIntensity={0.5} />
                </mesh>
              </group>
            </group>
          </group>
        </group>
      ))}

      <pointLight position={[0, 0.5, 0]} intensity={0.3} color="#00d4ff" distance={2} />
    </group>
  );
}
