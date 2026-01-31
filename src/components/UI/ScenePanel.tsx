import { useRef, useState } from 'react';
import { Panel } from './Panel';
import { Button } from './Button';
import { useSimulationStore } from '../../stores/simulationStore';
import './ScenePanel.css';

const UploadIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17,8 12,3 7,8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </svg>
);

const SceneIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
    <polygon points="12,2 2,7 12,12 22,7" />
    <polyline points="2,17 12,22 22,17" />
    <polyline points="2,12 12,17 22,12" />
  </svg>
);

interface ScenePanelProps {
  onSceneLoad?: (file: File) => void;
}

export function ScenePanel({ onSceneLoad }: ScenePanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const { sceneLoaded, currentScene } = useSimulationStore();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && onSceneLoad) {
      onSceneLoad(file);
    }
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(false);

    const file = event.dataTransfer.files[0];
    if (file && onSceneLoad) {
      onSceneLoad(file);
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const supportedFormats = ['.spz', '.glb', '.gltf', '.usdz'];

  return (
    <Panel title="Scene" position="top-left" className="scene-panel">
      <input
        ref={fileInputRef}
        type="file"
        accept={supportedFormats.join(',')}
        style={{ display: 'none' }}
        onChange={handleFileSelect}
      />

      {/* Drop Zone */}
      <div
        className={`scene-dropzone ${dragOver ? 'scene-dropzone--active' : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
      >
        <div className="scene-dropzone__icon">
          <UploadIcon />
        </div>
        <div className="scene-dropzone__text">
          Drop scene file or click to browse
        </div>
        <div className="scene-dropzone__formats">
          {supportedFormats.join(' · ')}
        </div>
      </div>

      {/* Current Scene Info */}
      <div className="scene-info">
        <div className="scene-info__row">
          <span className="scene-info__label">
            <SceneIcon /> Status
          </span>
          <span className={`scene-info__value ${sceneLoaded ? 'scene-info__value--active' : ''}`}>
            {sceneLoaded ? 'LOADED' : 'NO SCENE'}
          </span>
        </div>
        {currentScene && (
          <div className="scene-info__row">
            <span className="scene-info__label">File</span>
            <span className="scene-info__value scene-info__value--filename">
              {currentScene.split('/').pop()}
            </span>
          </div>
        )}
      </div>

      {/* Sample Scenes */}
      <div className="scene-samples">
        <div className="scene-samples__label">SAMPLE SCENES</div>
        <div className="scene-samples__list">
          <Button variant="ghost" size="sm" disabled>
            Indoor Lab
          </Button>
          <Button variant="ghost" size="sm" disabled>
            Outdoor Park
          </Button>
          <Button variant="ghost" size="sm" disabled>
            Warehouse
          </Button>
        </div>
        <div className="scene-samples__note">
          Sample scenes coming soon
        </div>
      </div>
    </Panel>
  );
}
