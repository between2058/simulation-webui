import type { ReactNode } from 'react';
import { Panel } from './Panel';
import { Button } from './Button';
import { useSimulationStore } from '../../stores/simulationStore';
import type { ObstacleType, ObstacleData } from '../../stores/simulationStore';
import './SceneEditor.css';

// Icons
const BoxIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
    <rect x="3" y="3" width="18" height="18" rx="2" />
  </svg>
);

const CylinderIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
    <ellipse cx="12" cy="5" rx="8" ry="3" />
    <path d="M4 5v14c0 1.66 3.58 3 8 3s8-1.34 8-3V5" />
  </svg>
);

const TrashIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);

const ResetIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
    <path d="M3 3v5h5" />
  </svg>
);

const EditIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

const SimulateIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
    <polygon points="5 3 19 12 5 21 5 3" />
  </svg>
);

export function SceneEditor() {
  const {
    editorMode,
    setEditorMode,
    placementType,
    setPlacementType,
    selectedObstacleId,
    setSelectedObstacleId,
    obstacles,
    removeObstacle,
    resetObstacles,
    setSimulationState,
  } = useSimulationStore();

  const obstacleTypes: { type: ObstacleType; label: string; icon: ReactNode }[] = [
    { type: 'box', label: 'Box', icon: <BoxIcon /> },
    { type: 'cylinder', label: 'Cylinder', icon: <CylinderIcon /> },
  ];

  const handleModeSwitch = (mode: 'simulate' | 'edit') => {
    setEditorMode(mode);
    if (mode === 'edit') {
      setSimulationState('paused');
    }
    setSelectedObstacleId(null);
  };

  const selectedObstacle = obstacles.find((o: ObstacleData) => o.id === selectedObstacleId);

  return (
    <Panel title="Scene Editor" position="bottom-left" className="scene-editor">
      {/* Mode Toggle */}
      <div className="control-section">
        <div className="control-section__label">MODE</div>
        <div className="control-section__buttons">
          <Button
            variant={editorMode === 'simulate' ? 'primary' : 'ghost'}
            size="sm"
            icon={<SimulateIcon />}
            onClick={() => handleModeSwitch('simulate')}
            active={editorMode === 'simulate'}
          >
            Simulate
          </Button>
          <Button
            variant={editorMode === 'edit' ? 'primary' : 'ghost'}
            size="sm"
            icon={<EditIcon />}
            onClick={() => handleModeSwitch('edit')}
            active={editorMode === 'edit'}
          >
            Edit
          </Button>
        </div>
      </div>

      {/* Edit Mode Controls */}
      {editorMode === 'edit' && (
        <>
          {/* Placement Type */}
          <div className="control-section">
            <div className="control-section__label">PLACE OBSTACLE</div>
            <div className="control-section__buttons">
              {obstacleTypes.map(({ type, label, icon }) => (
                <Button
                  key={type}
                  variant={placementType === type ? 'primary' : 'ghost'}
                  size="sm"
                  icon={icon}
                  onClick={() => setPlacementType(type)}
                  active={placementType === type}
                >
                  {label}
                </Button>
              ))}
            </div>
            <div className="help-text help-text--small">
              Click on ground to place
            </div>
          </div>

          {/* Obstacle List */}
          <div className="control-section">
            <div className="control-section__label">
              OBSTACLES ({obstacles.length})
            </div>
            <div className="obstacle-list">
              {obstacles.map((obs: ObstacleData) => (
                <div
                  key={obs.id}
                  className={`obstacle-item ${selectedObstacleId === obs.id ? 'obstacle-item--selected' : ''}`}
                  onClick={() => setSelectedObstacleId(obs.id)}
                >
                  <span className="obstacle-item__icon">
                    {obs.type === 'box' ? <BoxIcon /> : <CylinderIcon />}
                  </span>
                  <span className="obstacle-item__name">{obs.id}</span>
                  <span className="obstacle-item__pos">
                    ({obs.position[0].toFixed(1)}, {obs.position[2].toFixed(1)})
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Selected Obstacle Actions */}
          {selectedObstacle && (
            <div className="control-section">
              <div className="control-section__label">SELECTED: {selectedObstacle.id}</div>
              <div className="selected-info">
                <div className="info-row">
                  <span>Type:</span>
                  <span>{selectedObstacle.type}</span>
                </div>
                <div className="info-row">
                  <span>Position:</span>
                  <span>
                    {selectedObstacle.position[0].toFixed(2)}, {selectedObstacle.position[2].toFixed(2)}
                  </span>
                </div>
                <div className="info-row">
                  <span>Size:</span>
                  <span>
                    {selectedObstacle.size[0].toFixed(1)} × {selectedObstacle.size[1].toFixed(1)} × {selectedObstacle.size[2].toFixed(1)}
                  </span>
                </div>
              </div>
              <Button
                variant="danger"
                size="sm"
                icon={<TrashIcon />}
                onClick={() => removeObstacle(selectedObstacle.id)}
                fullWidth
              >
                Delete Obstacle
              </Button>
            </div>
          )}

          {/* Reset */}
          <div className="control-section">
            <Button
              variant="ghost"
              size="sm"
              icon={<ResetIcon />}
              onClick={resetObstacles}
              fullWidth
            >
              Reset to Default
            </Button>
          </div>
        </>
      )}

      {/* Simulate Mode Info */}
      {editorMode === 'simulate' && (
        <div className="control-section">
          <div className="help-text">
            Switch to <strong>Edit</strong> mode to add or remove obstacles.
          </div>
        </div>
      )}
    </Panel>
  );
}
