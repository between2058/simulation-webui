import { useState } from 'react';
import { useSimulationStore } from '../../../stores/simulationStore';
import { MUJOCO_CONFIG, UI_CONFIG } from '../../../config';
import type { RobotInstance } from '../../../stores/simulationStore';

export function SystemTab() {
  const {
    showPiP,
    togglePiP,
    pipRobotId,
    setPipRobotId,
    robots,
    showStats,
    toggleStats,
    simulationSpeed,
    setSimulationSpeed,
    exportScene,
    importScene,
    addRobot,
    removeRobot,
    selectedRobotId,
    setSelectedRobotId,
    setRobotAsLeader,
  } = useSimulationStore();

  const [mujocoStatus, setMujocoStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [mujocoUrl, setMujocoUrl] = useState(MUJOCO_CONFIG.DEFAULT_URL);

  const handleConnect = () => {
    setMujocoStatus('connecting');
    // Simulate connection
    setTimeout(() => {
      setMujocoStatus('connected');
    }, 1500);
  };

  const handleDisconnect = () => {
    setMujocoStatus('disconnected');
  };

  const handleExportScene = () => {
    const json = exportScene();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `scene-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportScene = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          const json = ev.target?.result as string;
          if (importScene(json)) {
            alert('Scene imported successfully!');
          } else {
            alert('Failed to import scene');
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  return (
    <div className="system-tab">
      {/* MuJoCo Backend */}
      <div className="tab-section">
        <div className="section-header">
          <span className="section-title">MUJOCO BACKEND</span>
          <span className={`status-indicator ${mujocoStatus}`}>
            {mujocoStatus.toUpperCase()}
          </span>
        </div>

        <div className="input-group">
          <input
            type="text"
            className="input-field"
            value={mujocoUrl}
            onChange={(e) => setMujocoUrl(e.target.value)}
            placeholder="WebSocket URL"
            disabled={mujocoStatus === 'connected'}
          />
        </div>

        {mujocoStatus !== 'connected' ? (
          <button
            className="action-btn"
            onClick={handleConnect}
            disabled={mujocoStatus === 'connecting'}
          >
            {mujocoStatus === 'connecting' ? 'Connecting...' : 'Connect'}
          </button>
        ) : (
          <button className="action-btn danger" onClick={handleDisconnect}>
            Disconnect
          </button>
        )}

        {mujocoStatus === 'connected' && (
          <div className="hint-text success">
            ✓ Physics simulation active
          </div>
        )}
      </div>

      {/* Robot Fleet */}
      <div className="tab-section">
        <div className="section-header">
          <span className="section-title">ROBOT FLEET</span>
          <span className="section-badge">{robots.length} ROBOTS</span>
        </div>

        <div className="robot-list">
          {robots.map((robot: RobotInstance) => (
            <div
              key={robot.id}
              className={`list-item ${selectedRobotId === robot.id ? 'selected' : ''}`}
              onClick={() => setSelectedRobotId(robot.id)}
            >
              <div className="list-item-info">
                <div
                  className="robot-color-dot"
                  style={{ background: robot.color }}
                />
                <div className="list-item-text">
                  <span className="list-item-title">
                    {robot.name}
                    {robot.isLeader && <span className="leader-badge">LEADER</span>}
                  </span>
                  <span className="list-item-subtitle">
                    ({robot.position.x.toFixed(1)}, {robot.position.z.toFixed(1)})
                  </span>
                </div>
              </div>
              <div className="list-item-actions">
                {!robot.isLeader && (
                  <button
                    className="icon-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      setRobotAsLeader(robot.id);
                    }}
                    title="Set as leader"
                  >
                    👑
                  </button>
                )}
                {robots.length > 1 && (
                  <button
                    className="icon-btn danger"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeRobot(robot.id);
                    }}
                    title="Remove"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        <button
          className="action-btn secondary"
          onClick={() => addRobot()}
          disabled={robots.length >= 8}
        >
          + Add Robot
        </button>

        {robots.length >= 8 && (
          <div className="hint-text warning">Maximum 8 robots</div>
        )}
      </div>

      {/* Picture-in-Picture */}
      <div className="tab-section">
        <div className="section-header">
          <span className="section-title">CAMERA VIEW</span>
        </div>

        <div className="toggle-row">
          <span className="toggle-label">Picture-in-Picture</span>
          <label className="toggle-switch">
            <input type="checkbox" checked={showPiP} onChange={togglePiP} />
            <span className="toggle-slider" />
          </label>
        </div>

        {showPiP && (
          <div className="pip-selector">
            <span className="slider-label">Camera Source</span>
            <select
              className="input-field"
              value={pipRobotId || ''}
              onChange={(e) => setPipRobotId(e.target.value)}
            >
              {robots.map((robot: RobotInstance) => (
                <option key={robot.id} value={robot.id}>
                  {robot.name} Camera
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Simulation Settings */}
      <div className="tab-section">
        <div className="section-header">
          <span className="section-title">SIMULATION</span>
        </div>

        <div className="slider-control">
          <div className="slider-header">
            <span className="slider-label">Speed</span>
            <span className="slider-value">{simulationSpeed.toFixed(1)}x</span>
          </div>
          <div className="slider-track">
            <div
              className="slider-fill"
              style={{ width: `${(simulationSpeed / 3) * 100}%` }}
            />
          </div>
          <input
            type="range"
            className="slider-input"
            min={0.1}
            max={3}
            step={0.1}
            value={simulationSpeed}
            onChange={(e) => setSimulationSpeed(Number(e.target.value))}
          />
        </div>

        <div className="toggle-row">
          <span className="toggle-label">Show Stats Overlay</span>
          <label className="toggle-switch">
            <input type="checkbox" checked={showStats} onChange={toggleStats} />
            <span className="toggle-slider" />
          </label>
        </div>
      </div>

      {/* Scene Import/Export */}
      <div className="tab-section">
        <div className="section-header">
          <span className="section-title">DATA</span>
        </div>

        <div className="button-row">
          <button className="action-btn secondary" onClick={handleExportScene}>
            📤 Export Scene
          </button>
          <button className="action-btn secondary" onClick={handleImportScene}>
            📥 Import Scene
          </button>
        </div>
      </div>

      {/* System Info */}
      <div className="tab-section">
        <div className="section-header">
          <span className="section-title">SYSTEM INFO</span>
        </div>

        <div className="system-info">
          <div className="info-row">
            <span className="info-label">Version</span>
            <span className="info-value">{UI_CONFIG.VERSION}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Renderer</span>
            <span className="info-value">Three.js R168</span>
          </div>
          <div className="info-row">
            <span className="info-label">Physics</span>
            <span className="info-value">
              {mujocoStatus === 'connected' ? 'MuJoCo' : 'Built-in'}
            </span>
          </div>
        </div>
      </div>

      <style>{`
        .status-indicator {
          padding: 2px 8px;
          border-radius: 10px;
          font-size: 9px;
          font-weight: 500;
        }

        .status-indicator.disconnected {
          background: rgba(255, 68, 68, 0.2);
          color: #ff6b6b;
        }

        .status-indicator.connecting {
          background: rgba(255, 170, 0, 0.2);
          color: #ffaa00;
          animation: pulse 1s ease-in-out infinite;
        }

        .status-indicator.connected {
          background: rgba(0, 255, 136, 0.2);
          color: #00ff88;
        }

        .input-group {
          margin-bottom: 12px;
        }

        .hint-text.success {
          color: #00ff88;
        }

        .hint-text.warning {
          color: #ffaa00;
        }

        .robot-list {
          max-height: 180px;
          overflow-y: auto;
          margin-bottom: 12px;
        }

        .robot-color-dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          box-shadow: 0 0 8px currentColor;
        }

        .leader-badge {
          margin-left: 6px;
          padding: 2px 6px;
          background: rgba(255, 230, 109, 0.2);
          color: #ffe66d;
          border-radius: 4px;
          font-size: 8px;
          font-weight: 600;
        }

        .pip-selector {
          margin-top: 12px;
        }

        .pip-selector select {
          margin-top: 6px;
        }

        .system-info {
          background: rgba(0, 20, 40, 0.4);
          border-radius: 6px;
          padding: 12px;
        }

        .info-row {
          display: flex;
          justify-content: space-between;
          padding: 6px 0;
          border-bottom: 1px solid rgba(0, 212, 255, 0.1);
        }

        .info-row:last-child {
          border-bottom: none;
        }

        .info-label {
          font-size: 11px;
          color: rgba(255, 255, 255, 0.5);
        }

        .info-value {
          font-size: 11px;
          color: rgba(255, 255, 255, 0.9);
          font-family: 'JetBrains Mono', monospace;
        }
      `}</style>
    </div>
  );
}
