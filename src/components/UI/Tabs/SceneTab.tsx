import { useCallback, useState } from 'react';
import { useSimulationStore } from '../../../stores/simulationStore';
import type { ImportedModel } from '../../../stores/simulationStore';

const PRESET_SCENES = [
  { id: 'warehouse', name: 'Warehouse', icon: '🏭' },
  { id: 'office', name: 'Office', icon: '🏢' },
  { id: 'outdoor', name: 'Outdoor', icon: '🌳' },
  { id: 'factory', name: 'Factory', icon: '⚙️' },
];

export function SceneTab() {
  const {
    currentScene,
    setCurrentScene,
    obstacles,
    resetObstacles,
    editorMode,
    setEditorMode,
    importedModels,
    addImportedModel,
    removeImportedModel,
    selectedModelId,
    setSelectedModelId,
    showGrid,
    toggleGrid,
    showLidar,
    toggleLidar,
  } = useSimulationStore();

  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    const glbFiles = files.filter(
      (f) => f.name.endsWith('.glb') || f.name.endsWith('.gltf')
    );

    if (glbFiles.length === 0) {
      alert('Please drop GLB or GLTF files');
      return;
    }

    glbFiles.forEach((file) => {
      setIsLoading(true);
      const url = URL.createObjectURL(file);
      const model: ImportedModel = {
        id: `model_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: file.name.replace(/\.(glb|gltf)$/i, ''),
        url,
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
        boundingBox: { min: [-1, 0, -1], max: [1, 2, 1] },
        enableCollision: true,
      };
      addImportedModel(model);
      setTimeout(() => setIsLoading(false), 500);
    });
  }, [addImportedModel]);

  const handleFileInput = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.glb,.gltf';
    input.multiple = true;
    input.onchange = (e) => {
      const files = Array.from((e.target as HTMLInputElement).files || []);
      files.forEach((file) => {
        const url = URL.createObjectURL(file);
        const model: ImportedModel = {
          id: `model_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: file.name.replace(/\.(glb|gltf)$/i, ''),
          url,
          position: [0, 0, 0],
          rotation: [0, 0, 0],
          scale: [1, 1, 1],
          boundingBox: { min: [-1, 0, -1], max: [1, 2, 1] },
          enableCollision: true,
        };
        addImportedModel(model);
      });
    };
    input.click();
  };

  return (
    <div className="scene-tab">
      {/* Scene Selection */}
      <div className="tab-section">
        <div className="section-header">
          <span className="section-title">SCENE PRESET</span>
        </div>

        <div className="scene-grid">
          {PRESET_SCENES.map((scene) => (
            <button
              key={scene.id}
              className={`scene-card ${currentScene === scene.id ? 'active' : ''}`}
              onClick={() => setCurrentScene(scene.id)}
            >
              <span className="scene-icon">{scene.icon}</span>
              <span className="scene-name">{scene.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* GLB Model Upload */}
      <div className="tab-section">
        <div className="section-header">
          <span className="section-title">3D MODELS</span>
          <span className="section-badge">{importedModels.length} LOADED</span>
        </div>

        <div
          className={`drop-zone ${isDragging ? 'dragging' : ''} ${isLoading ? 'loading' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleFileInput}
        >
          {isLoading ? (
            <div className="loading-spinner" />
          ) : (
            <>
              <span className="drop-icon">📦</span>
              <span className="drop-text">Drop GLB/GLTF files here</span>
              <span className="drop-hint">or click to browse</span>
            </>
          )}
        </div>

        {/* Model List */}
        {importedModels.length > 0 && (
          <div className="model-list">
            {importedModels.map((model: ImportedModel) => (
              <div
                key={model.id}
                className={`list-item ${selectedModelId === model.id ? 'selected' : ''}`}
                onClick={() => setSelectedModelId(model.id)}
              >
                <div className="list-item-info">
                  <div className="list-item-icon">📦</div>
                  <div className="list-item-text">
                    <span className="list-item-title">{model.name}</span>
                    <span className="list-item-subtitle">
                      Scale: {model.scale[0].toFixed(1)}x
                    </span>
                  </div>
                </div>
                <button
                  className="icon-btn danger"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeImportedModel(model.id);
                  }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Obstacles Editor */}
      <div className="tab-section">
        <div className="section-header">
          <span className="section-title">OBSTACLES</span>
          <span className="section-badge">{obstacles.length} OBJECTS</span>
        </div>

        <div className="button-row">
          <button
            className={`action-btn secondary ${editorMode === 'edit' ? 'active-edit' : ''}`}
            onClick={() => setEditorMode(editorMode === 'edit' ? 'simulate' : 'edit')}
          >
            {editorMode === 'edit' ? '完成編輯' : '編輯障礙物'}
          </button>
          <button className="action-btn danger" onClick={resetObstacles}>
            重置
          </button>
        </div>

        {editorMode === 'edit' && (
          <div className="hint-text">
            💡 Click to place obstacles, click existing to remove
          </div>
        )}
      </div>

      {/* Display Options */}
      <div className="tab-section">
        <div className="section-header">
          <span className="section-title">DISPLAY OPTIONS</span>
        </div>

        <div className="toggle-row">
          <span className="toggle-label">Show Grid</span>
          <label className="toggle-switch">
            <input type="checkbox" checked={showGrid} onChange={toggleGrid} />
            <span className="toggle-slider" />
          </label>
        </div>

        <div className="toggle-row">
          <span className="toggle-label">Show LiDAR</span>
          <label className="toggle-switch">
            <input type="checkbox" checked={showLidar} onChange={toggleLidar} />
            <span className="toggle-slider" />
          </label>
        </div>
      </div>

      <style>{`
        .scene-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 8px;
        }

        .scene-card {
          padding: 16px 12px;
          background: rgba(0, 20, 40, 0.6);
          border: 1px solid rgba(0, 212, 255, 0.2);
          border-radius: 8px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .scene-card:hover {
          border-color: rgba(0, 212, 255, 0.4);
          background: rgba(0, 212, 255, 0.1);
        }

        .scene-card.active {
          border-color: #00d4ff;
          background: rgba(0, 212, 255, 0.15);
          box-shadow: 0 0 15px rgba(0, 212, 255, 0.2);
        }

        .scene-icon {
          font-size: 28px;
        }

        .scene-name {
          font-size: 11px;
          font-weight: 500;
          color: rgba(255, 255, 255, 0.8);
        }

        .drop-zone {
          padding: 24px;
          border: 2px dashed rgba(0, 212, 255, 0.3);
          border-radius: 8px;
          background: rgba(0, 20, 40, 0.4);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
          margin-bottom: 12px;
        }

        .drop-zone:hover {
          border-color: rgba(0, 212, 255, 0.5);
          background: rgba(0, 212, 255, 0.05);
        }

        .drop-zone.dragging {
          border-color: #00ff88;
          background: rgba(0, 255, 136, 0.1);
          border-style: solid;
        }

        .drop-zone.loading {
          pointer-events: none;
        }

        .drop-icon {
          font-size: 32px;
          opacity: 0.8;
        }

        .drop-text {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.7);
        }

        .drop-hint {
          font-size: 10px;
          color: rgba(255, 255, 255, 0.4);
        }

        .loading-spinner {
          width: 32px;
          height: 32px;
          border: 3px solid rgba(0, 212, 255, 0.2);
          border-top-color: #00d4ff;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .model-list {
          max-height: 150px;
          overflow-y: auto;
        }

        .active-edit {
          background: rgba(0, 255, 136, 0.2) !important;
          border-color: #00ff88 !important;
          color: #00ff88 !important;
        }
      `}</style>
    </div>
  );
}
