import { Panel } from './Panel';
import { Button } from './Button';
import { useSimulationStore } from '../../stores/simulationStore';
import type { FormationMode, PatrolMode } from '../../stores/simulationStore';
import './MultiRobotPanel.css';

const LeaderIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12">
    <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
  </svg>
);

const AddIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const TrashIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12">
    <polyline points="3,6 5,6 21,6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);

const CameraIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
    <circle cx="12" cy="13" r="4" />
  </svg>
);

const formationOptions: { value: FormationMode; label: string; icon: string }[] = [
  { value: 'none', label: 'Free', icon: '○' },
  { value: 'line', label: 'Line', icon: '═' },
  { value: 'wedge', label: 'Wedge', icon: '▽' },
  { value: 'circle', label: 'Circle', icon: '◯' },
  { value: 'spread', label: 'Spread', icon: '✦' },
];

const patrolOptions: { value: PatrolMode; label: string }[] = [
  { value: 'single', label: 'Follow Leader' },
  { value: 'distributed', label: 'Distributed' },
];

export function MultiRobotPanel() {
  const {
    robots,
    selectedRobotId,
    formationMode,
    patrolMode,
    formationSpacing,
    addRobot,
    removeRobot,
    setSelectedRobotId,
    setFormationMode,
    setPatrolMode,
    setFormationSpacing,
    setRobotAsLeader,
    distributeWaypoints,
    showPiP,
    togglePiP,
    setPipRobotId,
    waypoints,
  } = useSimulationStore();

  const handleAddRobot = () => {
    if (robots.length >= 8) {
      console.warn('Maximum 8 robots allowed');
      return;
    }
    addRobot();
  };

  const handleSetPiP = (robotId: string) => {
    setPipRobotId(robotId);
    if (!showPiP) {
      togglePiP();
    }
  };

  return (
    <Panel title="Robot Fleet" position="top-right" className="multi-robot-panel">
      {/* Robot List */}
      <div className="robot-list">
        <div className="robot-list__header">
          <span>Active Robots ({robots.length}/8)</span>
          <Button variant="primary" size="sm" onClick={handleAddRobot} disabled={robots.length >= 8}>
            <AddIcon /> Add
          </Button>
        </div>

        <div className="robot-list__items">
          {robots.map((robot) => (
            <div
              key={robot.id}
              className={`robot-item ${selectedRobotId === robot.id ? 'robot-item--selected' : ''}`}
              onClick={() => setSelectedRobotId(robot.id)}
            >
              <div
                className="robot-item__color"
                style={{ backgroundColor: robot.color }}
              />
              <span className="robot-item__name">
                {robot.name}
                {robot.isLeader && (
                  <span className="robot-item__leader" title="Leader">
                    <LeaderIcon />
                  </span>
                )}
              </span>
              <div className="robot-item__actions">
                <button
                  className="robot-item__action"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSetPiP(robot.id);
                  }}
                  title="View Camera"
                >
                  <CameraIcon />
                </button>
                {!robot.isLeader && (
                  <button
                    className="robot-item__action robot-item__action--leader"
                    onClick={(e) => {
                      e.stopPropagation();
                      setRobotAsLeader(robot.id);
                    }}
                    title="Set as Leader"
                  >
                    <LeaderIcon />
                  </button>
                )}
                {robots.length > 1 && (
                  <button
                    className="robot-item__action robot-item__action--delete"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeRobot(robot.id);
                    }}
                    title="Remove"
                  >
                    <TrashIcon />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Formation Control */}
      <div className="formation-section">
        <div className="section-label">Formation Mode</div>
        <div className="formation-buttons">
          {formationOptions.map((option) => (
            <button
              key={option.value}
              className={`formation-btn ${formationMode === option.value ? 'formation-btn--active' : ''}`}
              onClick={() => setFormationMode(option.value)}
              title={option.label}
            >
              <span className="formation-btn__icon">{option.icon}</span>
              <span className="formation-btn__label">{option.label}</span>
            </button>
          ))}
        </div>

        {formationMode !== 'none' && (
          <div className="formation-spacing">
            <label>Spacing</label>
            <input
              type="range"
              min="1"
              max="4"
              step="0.5"
              value={formationSpacing}
              onChange={(e) => setFormationSpacing(parseFloat(e.target.value))}
            />
            <span>{formationSpacing.toFixed(1)}m</span>
          </div>
        )}
      </div>

      {/* Patrol Mode */}
      <div className="patrol-section">
        <div className="section-label">Patrol Mode</div>
        <div className="patrol-buttons">
          {patrolOptions.map((option) => (
            <button
              key={option.value}
              className={`patrol-btn ${patrolMode === option.value ? 'patrol-btn--active' : ''}`}
              onClick={() => setPatrolMode(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>

        {patrolMode === 'distributed' && waypoints.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={distributeWaypoints}
            className="distribute-btn"
          >
            Distribute {waypoints.length} Waypoints
          </Button>
        )}
      </div>

      {/* Quick Stats */}
      <div className="fleet-stats">
        <div className="fleet-stat">
          <span className="fleet-stat__label">Total Robots</span>
          <span className="fleet-stat__value">{robots.length}</span>
        </div>
        <div className="fleet-stat">
          <span className="fleet-stat__label">Formation</span>
          <span className="fleet-stat__value">{formationMode}</span>
        </div>
        <div className="fleet-stat">
          <span className="fleet-stat__label">Patrol</span>
          <span className="fleet-stat__value">{patrolMode}</span>
        </div>
      </div>
    </Panel>
  );
}
