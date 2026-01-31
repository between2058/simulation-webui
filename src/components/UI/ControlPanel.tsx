import { Panel } from './Panel';
import { Button } from './Button';
import { useSimulationStore } from '../../stores/simulationStore';
import type { CameraMode } from '../../stores/simulationStore';
import './ControlPanel.css';

// Icons as simple SVG components
const PlayIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
    <path d="M8 5v14l11-7z" />
  </svg>
);

const PauseIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
  </svg>
);

const StopIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
    <path d="M6 6h12v12H6z" />
  </svg>
);

const CameraIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
    <path d="M23 7l-7 5 7 5V7z" />
    <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
  </svg>
);

const EyeIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const GridIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    <line x1="3" y1="9" x2="21" y2="9" />
    <line x1="3" y1="15" x2="21" y2="15" />
    <line x1="9" y1="3" x2="9" y2="21" />
    <line x1="15" y1="3" x2="15" y2="21" />
  </svg>
);

export function ControlPanel() {
  const {
    simulationState,
    setSimulationState,
    cameraMode,
    setCameraMode,
    showGrid,
    toggleGrid,
    showStats,
    toggleStats,
    robot,
  } = useSimulationStore();

  const cameraOptions: { mode: CameraMode; label: string }[] = [
    { mode: 'orbit', label: 'ORBIT' },
    { mode: 'first-person', label: 'FPV' },
    { mode: 'follow', label: 'FOLLOW' },
  ];

  return (
    <Panel title="Control Panel" position="top-right" className="control-panel">
      {/* Simulation Controls */}
      <div className="control-section">
        <div className="control-section__label">SIMULATION</div>
        <div className="control-section__buttons">
          <Button
            variant={simulationState === 'running' ? 'primary' : 'ghost'}
            size="sm"
            icon={<PlayIcon />}
            onClick={() => setSimulationState('running')}
            active={simulationState === 'running'}
          >
            Run
          </Button>
          <Button
            variant={simulationState === 'paused' ? 'primary' : 'ghost'}
            size="sm"
            icon={<PauseIcon />}
            onClick={() => setSimulationState('paused')}
            active={simulationState === 'paused'}
          >
            Pause
          </Button>
          <Button
            variant="ghost"
            size="sm"
            icon={<StopIcon />}
            onClick={() => setSimulationState('idle')}
          >
            Reset
          </Button>
        </div>
      </div>

      {/* Camera Controls */}
      <div className="control-section">
        <div className="control-section__label">
          <CameraIcon /> CAMERA VIEW
        </div>
        <div className="control-section__buttons">
          {cameraOptions.map(({ mode, label }) => (
            <Button
              key={mode}
              variant={cameraMode === mode ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setCameraMode(mode)}
              active={cameraMode === mode}
            >
              {label}
            </Button>
          ))}
        </div>
      </div>

      {/* Display Options */}
      <div className="control-section">
        <div className="control-section__label">
          <EyeIcon /> DISPLAY
        </div>
        <div className="control-section__buttons">
          <Button
            variant={showGrid ? 'primary' : 'ghost'}
            size="sm"
            icon={<GridIcon />}
            onClick={toggleGrid}
            active={showGrid}
          >
            Grid
          </Button>
          <Button
            variant={showStats ? 'primary' : 'ghost'}
            size="sm"
            onClick={toggleStats}
            active={showStats}
          >
            Stats
          </Button>
        </div>
      </div>

      {/* Robot Status */}
      <div className="control-section">
        <div className="control-section__label">ROBOT STATUS</div>
        <div className="status-grid">
          <div className="status-item">
            <span className="status-item__label">Status</span>
            <span className={`status-item__value status-item__value--${robot.isLoaded ? 'active' : 'inactive'}`}>
              {robot.isLoaded ? 'READY' : 'LOADING'}
            </span>
          </div>
          <div className="status-item">
            <span className="status-item__label">Position</span>
            <span className="status-item__value status-item__value--mono">
              {robot.position.x.toFixed(2)}, {robot.position.z.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Controls Help */}
      <div className="control-section control-section--help">
        <div className="control-section__label">CONTROLS</div>
        <div className="help-text">
          <kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> Move robot
          <br />
          <span className="help-text__note">Start simulation to control</span>
        </div>
      </div>
    </Panel>
  );
}
