import { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { useSimulationStore } from '../../stores/simulationStore';

interface GaussianSplatSceneProps {
  url?: string;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
}

export function GaussianSplatScene({
  url,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
}: GaussianSplatSceneProps) {
  const groupRef = useRef<THREE.Group>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [splatData, setSplatData] = useState<ArrayBuffer | null>(null);
  const { setSceneLoaded, setCurrentScene } = useSimulationStore();

  useEffect(() => {
    if (!url) return;

    setLoading(true);
    setError(null);

    fetch(url)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Failed to load SPZ file: ${response.statusText}`);
        }
        return response.arrayBuffer();
      })
      .then((data) => {
        setSplatData(data);
        setSceneLoaded(true);
        setCurrentScene(url);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [url, setSceneLoaded, setCurrentScene]);

  // For now, render a placeholder visualization
  // Full Gaussian Splatting requires WebGL2 shader implementation
  if (loading) {
    return (
      <group position={position}>
        <mesh>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="#00d4ff" wireframe />
        </mesh>
      </group>
    );
  }

  if (error) {
    console.warn('SPZ Load Error:', error);
    return null;
  }

  // Placeholder: Show point cloud representation
  // Real implementation would use custom shaders for Gaussian Splatting
  return (
    <group ref={groupRef} position={position} rotation={rotation} scale={[scale, scale, scale]}>
      {splatData && (
        <mesh>
          <sphereGeometry args={[5, 32, 32]} />
          <meshStandardMaterial
            color="#111b2e"
            transparent
            opacity={0.3}
            side={THREE.BackSide}
          />
        </mesh>
      )}
    </group>
  );
}

// Scene file loader component with UI
export function SceneLoader() {
  const [sceneUrl, setSceneUrl] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setSceneUrl(url);
    }
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept=".spz,.glb,.gltf"
        style={{ display: 'none' }}
        onChange={handleFileSelect}
      />
      {sceneUrl && <GaussianSplatScene url={sceneUrl} />}
    </>
  );
}
