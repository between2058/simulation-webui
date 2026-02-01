import { useRef, useEffect, useState, Suspense } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { useSimulationStore } from '../../stores/simulationStore';
import type { ImportedModel } from '../../stores/simulationStore';

// Loading placeholder for individual models
function ModelLoadingPlaceholder() {
  return (
    <mesh>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#00d4ff" wireframe opacity={0.5} transparent />
    </mesh>
  );
}

// Individual imported model component
interface ImportedModelMeshProps {
  model: ImportedModel;
  onBoundsComputed?: (bounds: THREE.Box3) => void;
}

function ImportedModelMesh({ model, onBoundsComputed }: ImportedModelMeshProps) {
  const groupRef = useRef<THREE.Group>(null);
  const [gltf, setGltf] = useState<THREE.Group | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { selectedModelId, setSelectedModelId, updateImportedModel } = useSimulationStore();

  useEffect(() => {
    const loader = new GLTFLoader();

    // Setup DRACO decoder for compressed models
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
    loader.setDRACOLoader(dracoLoader);

    setLoading(true);
    setError(null);

    loader.load(
      model.url,
      (gltfData) => {
        const scene = gltfData.scene.clone();

        // Compute bounding box
        const box = new THREE.Box3().setFromObject(scene);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());

        // Center the model
        scene.position.sub(center);

        // Enable shadows
        scene.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });

        setGltf(scene);
        setLoading(false);

        // Report bounds for collision
        if (onBoundsComputed) {
          onBoundsComputed(box);
        }

        // Update store with computed bounding box
        updateImportedModel(model.id, {
          boundingBox: {
            min: [box.min.x, box.min.y, box.min.z],
            max: [box.max.x, box.max.y, box.max.z],
          },
        });

        console.log(`Loaded model ${model.name}: size=${size.x.toFixed(2)}x${size.y.toFixed(2)}x${size.z.toFixed(2)}`);
      },
      undefined,
      (err) => {
        console.error('Error loading GLB:', err);
        setError('Failed to load model');
        setLoading(false);
      }
    );

    return () => {
      dracoLoader.dispose();
    };
  }, [model.url, model.id, model.name, onBoundsComputed, updateImportedModel]);

  const isSelected = selectedModelId === model.id;

  const handleClick = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    setSelectedModelId(model.id);
  };

  if (loading) {
    return (
      <group position={model.position}>
        <ModelLoadingPlaceholder />
      </group>
    );
  }

  if (error || !gltf) {
    return (
      <group position={model.position}>
        <mesh>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="#ff4444" wireframe />
        </mesh>
      </group>
    );
  }

  return (
    <group
      ref={groupRef}
      position={model.position}
      rotation={model.rotation}
      scale={model.scale}
      onClick={handleClick}
    >
      <primitive object={gltf} />

      {/* Selection indicator */}
      {isSelected && (
        <mesh>
          <boxGeometry args={[
            (model.boundingBox.max[0] - model.boundingBox.min[0]) * model.scale[0] + 0.2,
            (model.boundingBox.max[1] - model.boundingBox.min[1]) * model.scale[1] + 0.2,
            (model.boundingBox.max[2] - model.boundingBox.min[2]) * model.scale[2] + 0.2,
          ]} />
          <meshBasicMaterial color="#00d4ff" wireframe opacity={0.5} transparent />
        </mesh>
      )}

      {/* Collision box visualization (when enabled) */}
      {model.enableCollision && (
        <mesh visible={isSelected}>
          <boxGeometry args={[
            (model.boundingBox.max[0] - model.boundingBox.min[0]) * model.scale[0],
            (model.boundingBox.max[1] - model.boundingBox.min[1]) * model.scale[1],
            (model.boundingBox.max[2] - model.boundingBox.min[2]) * model.scale[2],
          ]} />
          <meshBasicMaterial color="#ff6b6b" wireframe opacity={0.3} transparent />
        </mesh>
      )}
    </group>
  );
}

// Container for all imported models
export function ImportedModels() {
  const { importedModels } = useSimulationStore();

  return (
    <group name="imported-models">
      {importedModels.map((model) => (
        <Suspense key={model.id} fallback={<ModelLoadingPlaceholder />}>
          <ImportedModelMesh model={model} />
        </Suspense>
      ))}
    </group>
  );
}

// Get collision bounds for all imported models
export function getImportedModelBounds(models: ImportedModel[]): THREE.Box3[] {
  return models
    .filter((m) => m.enableCollision)
    .map((model) => {
      const min = new THREE.Vector3(
        model.position[0] + model.boundingBox.min[0] * model.scale[0],
        model.position[1] + model.boundingBox.min[1] * model.scale[1],
        model.position[2] + model.boundingBox.min[2] * model.scale[2]
      );
      const max = new THREE.Vector3(
        model.position[0] + model.boundingBox.max[0] * model.scale[0],
        model.position[1] + model.boundingBox.max[1] * model.scale[1],
        model.position[2] + model.boundingBox.max[2] * model.scale[2]
      );
      return new THREE.Box3(min, max);
    });
}
