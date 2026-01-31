import { useSimulationStore } from '../../stores/simulationStore';
import './StatusBar.css';

export function StatusBar() {
  const { simulationState, cameraMode, robot } = useSimulationStore();

  return (
    <div className="status-bar">
      <div className="status-bar__left">
        <div className="status-bar__item">
          <span className="status-bar__label">MODE</span>
          <span className="status-bar__value">{simulationState.toUpperCase()}</span>
        </div>
        <div className="status-bar__divider" />
        <div className="status-bar__item">
          <span className="status-bar__label">CAM</span>
          <span className="status-bar__value">{cameraMode.toUpperCase()}</span>
        </div>
      </div>

      <div className="status-bar__center">
        <span className="status-bar__title">UNITREE GO2 SIMULATION</span>
      </div>

      <div className="status-bar__right">
        <div className="status-bar__item">
          <span className="status-bar__label">POS</span>
          <span className="status-bar__value status-bar__value--mono">
            X:{robot.position.x.toFixed(1)} Z:{robot.position.z.toFixed(1)}
          </span>
        </div>
        <div className="status-bar__divider" />
        <div className="status-bar__item">
          <span className={`status-bar__indicator ${robot.isLoaded ? 'status-bar__indicator--active' : ''}`} />
          <span className="status-bar__value">{robot.isLoaded ? 'ONLINE' : 'OFFLINE'}</span>
        </div>
      </div>
    </div>
  );
}
