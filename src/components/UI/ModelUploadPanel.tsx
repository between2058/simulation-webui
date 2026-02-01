import { useRef, useState, useCallback } from 'react';
import { Panel } from './Panel';
import { Button } from './Button';
import { useSimulationStore } from '../../stores/simulationStore';
import type { ImportedModel } from '../../stores/simulationStore';
import './ModelUploadPanel.css';

const UploadIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17,8 12,3 7,8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </svg>
);

const CubeIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
    <polyline points="3.27,6.96 12,12.01 20.73,6.96" />
    <line x1="12" y1="22.08" x2="12" y2="12" />
  </svg>
);

const TrashIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12">
    <polyline points="3,6 5,6 21,6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);

const CollisionIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12">
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="M3 9h18M9 21V9" />
  </svg>
);

export function ModelUploadPanel() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);

  const {
    importedModels,
    selectedModelId,
    addImportedModel,
    removeImportedModel,
    updateImportedModel,
    setSelectedModelId,
    clearImportedModels,
  } = useSimulationStore();

  const handleFileLoad = useCallback((file: File) => {
    if (!file.name.match(/\.(glb|gltf)$/i)) {
      console.warn('Unsupported file format. Please use GLB or GLTF.');
      return;
    }

    setUploading(true);

    // Create object URL for the file
    const url = URL.createObjectURL(file);
    const id = `model_${Date.now()}`;

    const newModel: ImportedModel = {
      id,
      name: file.name.replace(/\.(glb|gltf)$/i, ''),
      url,
      position: [0, 0, 0],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
      boundingBox: {
        min: [-0.5, 0, -0.5],
        max: [0.5, 1, 0.5],
      },
      enableCollision: true,
    };

    addImportedModel(newModel);
    setSelectedModelId(id);
    setUploading(false);

    console.log(`Added model: ${file.name}`);
  }, [addImportedModel, setSelectedModelId]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileLoad(file);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(false);

    const file = event.dataTransfer.files[0];
    if (file) {
      handleFileLoad(file);
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const selectedModel = importedModels.find((m) => m.id === selectedModelId);

  const handlePositionChange = (axis: 'x' | 'y' | 'z', value: number) => {
    if (!selectedModelId) return;
    const model = importedModels.find((m) => m.id === selectedModelId);
    if (!model) return;

    const newPosition: [number, number, number] = [...model.position];
    const idx = axis === 'x' ? 0 : axis === 'y' ? 1 : 2;
    newPosition[idx] = value;
    updateImportedModel(selectedModelId, { position: newPosition });
  };

  const handleScaleChange = (value: number) => {
    if (!selectedModelId) return;
    updateImportedModel(selectedModelId, { scale: [value, value, value] });
  };

  const handleRotationChange = (value: number) => {
    if (!selectedModelId) return;
    const model = importedModels.find((m) => m.id === selectedModelId);
    if (!model) return;
    updateImportedModel(selectedModelId, {
      rotation: [model.rotation[0], value * (Math.PI / 180), model.rotation[2]],
    });
  };

  const toggleCollision = () => {
    if (!selectedModelId) return;
    const model = importedModels.find((m) => m.id === selectedModelId);
    if (!model) return;
    updateImportedModel(selectedModelId, { enableCollision: !model.enableCollision });
  };

  return (
    <Panel title="3D Models" position="bottom-left" className="model-upload-panel">
      <input
        ref={fileInputRef}
        type="file"
        accept=".glb,.gltf"
        style={{ display: 'none' }}
        onChange={handleFileSelect}
      />

      {/* Drop Zone */}
      <div
        className={`model-dropzone ${dragOver ? 'model-dropzone--active' : ''} ${uploading ? 'model-dropzone--uploading' : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
      >
        <div className="model-dropzone__icon">
          <UploadIcon />
        </div>
        <div className="model-dropzone__text">
          {uploading ? 'Loading...' : 'Drop GLB/GLTF or click'}
        </div>
      </div>

      {/* Model List */}
      {importedModels.length > 0 && (
        <div className="model-list">
          <div className="model-list__header">
            <span>Imported Models ({importedModels.length})</span>
            <Button variant="ghost" size="sm" onClick={clearImportedModels}>
              Clear All
            </Button>
          </div>
          <div className="model-list__items">
            {importedModels.map((model) => (
              <div
                key={model.id}
                className={`model-item ${selectedModelId === model.id ? 'model-item--selected' : ''}`}
                onClick={() => setSelectedModelId(model.id)}
              >
                <CubeIcon />
                <span className="model-item__name">{model.name}</span>
                <button
                  className="model-item__delete"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeImportedModel(model.id);
                  }}
                >
                  <TrashIcon />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Selected Model Controls */}
      {selectedModel && (
        <div className="model-controls">
          <div className="model-controls__header">
            <CubeIcon />
            <span>{selectedModel.name}</span>
          </div>

          {/* Position */}
          <div className="model-controls__section">
            <label>Position</label>
            <div className="model-controls__row">
              <div className="model-controls__input">
                <span>X</span>
                <input
                  type="number"
                  step="0.5"
                  value={selectedModel.position[0].toFixed(1)}
                  onChange={(e) => handlePositionChange('x', parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="model-controls__input">
                <span>Y</span>
                <input
                  type="number"
                  step="0.1"
                  value={selectedModel.position[1].toFixed(1)}
                  onChange={(e) => handlePositionChange('y', parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="model-controls__input">
                <span>Z</span>
                <input
                  type="number"
                  step="0.5"
                  value={selectedModel.position[2].toFixed(1)}
                  onChange={(e) => handlePositionChange('z', parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>
          </div>

          {/* Scale & Rotation */}
          <div className="model-controls__section">
            <div className="model-controls__row">
              <div className="model-controls__slider">
                <label>Scale</label>
                <input
                  type="range"
                  min="0.1"
                  max="5"
                  step="0.1"
                  value={selectedModel.scale[0]}
                  onChange={(e) => handleScaleChange(parseFloat(e.target.value))}
                />
                <span>{selectedModel.scale[0].toFixed(1)}x</span>
              </div>
            </div>
            <div className="model-controls__row">
              <div className="model-controls__slider">
                <label>Rotation</label>
                <input
                  type="range"
                  min="0"
                  max="360"
                  step="15"
                  value={(selectedModel.rotation[1] * 180) / Math.PI}
                  onChange={(e) => handleRotationChange(parseFloat(e.target.value))}
                />
                <span>{Math.round((selectedModel.rotation[1] * 180) / Math.PI)}°</span>
              </div>
            </div>
          </div>

          {/* Collision Toggle */}
          <div className="model-controls__section">
            <Button
              variant={selectedModel.enableCollision ? 'primary' : 'ghost'}
              size="sm"
              onClick={toggleCollision}
            >
              <CollisionIcon />
              Collision: {selectedModel.enableCollision ? 'ON' : 'OFF'}
            </Button>
          </div>
        </div>
      )}
    </Panel>
  );
}
