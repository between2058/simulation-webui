import React, { useRef, useEffect, useState, Suspense } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useSimulationStore } from '../../stores/simulationStore';
import { useKeyboardControls } from '../../utils/useKeyboardControls';
import { Go2Model } from './Go2Model';

// Placeholder robot while model loads
function PlaceholderRobot() {
  const groupRef = useRef<THREE.Group>(null);
  const { simulationState } = useSimulationStore();

  useFrame((state) => {
    if (groupRef.current && simulationState === 'running') {
      // Idle breathing animation
      groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 2) * 0.02;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Body */}
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

      {/* Head */}
      <mesh position={[0.35, 0.4, 0]} castShadow>
        <boxGeometry args={[0.15, 0.12, 0.2]} />
        <meshStandardMaterial
          color="#1a2a4a"
          roughness={0.3}
          metalness={0.8}
        />
      </mesh>

      {/* Eyes (cameras) */}
      <mesh position={[0.42, 0.42, 0.05]}>
        <sphereGeometry args={[0.02, 16, 16]} />
        <meshStandardMaterial
          color="#00d4ff"
          emissive="#00d4ff"
          emissiveIntensity={2}
        />
      </mesh>
      <mesh position={[0.42, 0.42, -0.05]}>
        <sphereGeometry args={[0.02, 16, 16]} />
        <meshStandardMaterial
          color="#00d4ff"
          emissive="#00d4ff"
          emissiveIntensity={2}
        />
      </mesh>

      {/* Legs */}
      {[
        [0.2, 0.08],    // Front right
        [0.2, -0.08],   // Front left
        [-0.2, 0.08],   // Back right
        [-0.2, -0.08],  // Back left
      ].map(([x, z], i) => (
        <group key={i} position={[x, 0.15, z]}>
          {/* Upper leg */}
          <mesh castShadow>
            <boxGeometry args={[0.06, 0.2, 0.06]} />
            <meshStandardMaterial color="#0d1a2d" metalness={0.9} roughness={0.2} />
          </mesh>
          {/* Lower leg */}
          <mesh position={[0, -0.15, 0]} castShadow>
            <boxGeometry args={[0.04, 0.15, 0.04]} />
            <meshStandardMaterial color="#0d1a2d" metalness={0.9} roughness={0.2} />
          </mesh>
          {/* Foot */}
          <mesh position={[0, -0.25, 0]}>
            <sphereGeometry args={[0.03, 8, 8]} />
            <meshStandardMaterial color="#00d4ff" emissive="#00d4ff" emissiveIntensity={0.5} />
          </mesh>
        </group>
      ))}

      {/* Status light */}
      <pointLight position={[0, 0.5, 0]} intensity={0.2} color="#00d4ff" distance={2} />
    </group>
  );
}

// Loading indicator
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
      <meshStandardMaterial
        color="#00d4ff"
        emissive="#00d4ff"
        emissiveIntensity={1}
        wireframe
      />
    </mesh>
  );
}

// Error boundary fallback
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

// Simple error boundary component
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

export function RobotDog() {
  const groupRef = useRef<THREE.Group>(null);
  const [useDetailedModel] = useState(true);
  const { setRobotLoaded, setRobotPosition, setRobotRotation, simulationState } = useSimulationStore();
  const movement = useKeyboardControls();

  useEffect(() => {
    setRobotLoaded(true);
  }, [setRobotLoaded]);

  // Movement logic
  useFrame((state, delta) => {
    if (!groupRef.current) return;
    if (simulationState !== 'running') return;

    const speed = 2 * delta;
    const rotSpeed = 2 * delta;

    // Apply movement
    if (movement.forward) {
      groupRef.current.position.x += Math.cos(groupRef.current.rotation.y) * speed;
      groupRef.current.position.z -= Math.sin(groupRef.current.rotation.y) * speed;
    }
    if (movement.backward) {
      groupRef.current.position.x -= Math.cos(groupRef.current.rotation.y) * speed;
      groupRef.current.position.z += Math.sin(groupRef.current.rotation.y) * speed;
    }
    if (movement.left) {
      groupRef.current.rotation.y += rotSpeed;
    }
    if (movement.right) {
      groupRef.current.rotation.y -= rotSpeed;
    }

    // Update store
    setRobotPosition(groupRef.current.position.clone());
    setRobotRotation(groupRef.current.rotation.clone());

    // Subtle body sway animation
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
