import { useState } from 'react';
import { useSimulationStore } from '../../../stores/simulationStore';
import type { FormationMode } from '../../../stores/simulationStore';

type GaitMode = 'stand' | 'walk' | 'trot' | 'pace' | 'bound' | 'gallop';

const GAIT_MODES: { id: GaitMode; label: string }[] = [
  { id: 'stand', label: 'STAND' },
  { id: 'trot', label: 'TROT' },
  { id: 'walk', label: 'WALK' },
  { id: 'pace', label: 'PACE' },
  { id: 'bound', label: 'BOUND' },
  { id: 'gallop', label: 'GALLOP' },
];

const FORMATION_MODES: { id: FormationMode; label: string }[] = [
  { id: 'none', label: 'NONE' },
  { id: 'line', label: 'LINE' },
  { id: 'wedge', label: 'WEDGE' },
  { id: 'circle', label: 'CIRCLE' },
  { id: 'spread', label: 'SPREAD' },
];

export function ControlTab() {
  const {
    simulationState,
    setSimulationState,
    robots,
    formationMode,
    setFormationMode,
    formationSpacing,
    setFormationSpacing,
  } = useSimulationStore();

  const [gaitMode, setGaitMode] = useState<GaitMode>('trot');
  const [velocities, setVelocities] = useState({
    forward: 0,
    lateral: 0,
    turn: 0,
  });
  const [bodyAttitude, setBodyAttitude] = useState({
    height: 0.35,
    roll: 0,
    pitch: 0,
    yaw: 0,
  });

  const handleEmergencyStop = () => {
    setSimulationState('idle');
    setVelocities({ forward: 0, lateral: 0, turn: 0 });
  };

  const isActive = simulationState === 'running';

  return (
    <div className="control-tab">
      {/* Mode Toggle */}
      <div className="tab-section">
        <div className="mode-toggle">
          <button
            className={`toggle-btn ${!isActive ? 'active' : ''}`}
            onClick={() => setSimulationState('idle')}
          >
            IN PLACE
          </button>
          <button
            className={`toggle-btn ${isActive ? 'active' : ''}`}
            onClick={() => setSimulationState('running')}
          >
            WORLD
          </button>
        </div>
      </div>

      {/* Gait Mode Selection */}
      <div className="tab-section">
        <div className="mode-buttons">
          {GAIT_MODES.map((mode) => (
            <button
              key={mode.id}
              className={`mode-btn ${gaitMode === mode.id ? 'active' : ''}`}
              onClick={() => setGaitMode(mode.id)}
            >
              {mode.label}
            </button>
          ))}
        </div>
      </div>

      {/* Velocities */}
      <div className="tab-section">
        <div className="section-header">
          <span className="section-title">VELOCITIES</span>
          <span className="section-badge">{isActive ? 'ACTIVE' : 'IDLE'}</span>
        </div>

        <SliderControl
          label="Forward (X)"
          value={velocities.forward}
          min={-2}
          max={2}
          step={0.1}
          unit="m/s"
          onChange={(v) => setVelocities({ ...velocities, forward: v })}
        />

        <SliderControl
          label="Lateral (Y)"
          value={velocities.lateral}
          min={-1}
          max={1}
          step={0.1}
          unit="m/s"
          onChange={(v) => setVelocities({ ...velocities, lateral: v })}
        />

        <SliderControl
          label="Turn (Yaw)"
          value={velocities.turn}
          min={-2}
          max={2}
          step={0.1}
          unit="rad/s"
          onChange={(v) => setVelocities({ ...velocities, turn: v })}
        />

        <button className="emergency-stop" onClick={handleEmergencyStop}>
          EMERGENCY STOP
        </button>
      </div>

      {/* Body Attitude */}
      <div className="tab-section">
        <div className="section-header">
          <span className="section-title">BODY ATTITUDE</span>
        </div>

        <SliderControl
          label="Height"
          value={bodyAttitude.height}
          min={0.15}
          max={0.45}
          step={0.01}
          unit="m"
          onChange={(v) => setBodyAttitude({ ...bodyAttitude, height: v })}
        />

        <SliderControl
          label="Roll"
          value={bodyAttitude.roll}
          min={-30}
          max={30}
          step={1}
          unit="deg"
          onChange={(v) => setBodyAttitude({ ...bodyAttitude, roll: v })}
        />

        <SliderControl
          label="Pitch"
          value={bodyAttitude.pitch}
          min={-30}
          max={30}
          step={1}
          unit="deg"
          onChange={(v) => setBodyAttitude({ ...bodyAttitude, pitch: v })}
        />

        <SliderControl
          label="Yaw"
          value={bodyAttitude.yaw}
          min={-45}
          max={45}
          step={1}
          unit="deg"
          onChange={(v) => setBodyAttitude({ ...bodyAttitude, yaw: v })}
        />
      </div>

      {/* Formation Control (Multi-Robot) */}
      {robots.length > 1 && (
        <div className="tab-section">
          <div className="section-header">
            <span className="section-title">FORMATION</span>
            <span className="section-badge">{robots.length} ROBOTS</span>
          </div>

          <div className="mode-buttons" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
            {FORMATION_MODES.map((mode) => (
              <button
                key={mode.id}
                className={`mode-btn ${formationMode === mode.id ? 'active' : ''}`}
                onClick={() => setFormationMode(mode.id)}
              >
                {mode.label}
              </button>
            ))}
          </div>

          <div style={{ marginTop: 12 }}>
            <SliderControl
              label="Spacing"
              value={formationSpacing}
              min={0.5}
              max={4}
              step={0.1}
              unit="m"
              onChange={setFormationSpacing}
            />
          </div>
        </div>
      )}

      <style>{`
        .mode-toggle {
          display: flex;
          background: rgba(0, 20, 40, 0.6);
          border-radius: 6px;
          padding: 4px;
          border: 1px solid rgba(0, 212, 255, 0.2);
        }

        .toggle-btn {
          flex: 1;
          padding: 10px 16px;
          background: transparent;
          border: none;
          border-radius: 4px;
          color: rgba(255, 255, 255, 0.5);
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 1px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .toggle-btn.active {
          background: linear-gradient(135deg, rgba(0, 212, 255, 0.3), rgba(0, 255, 136, 0.2));
          color: #fff;
        }

        .toggle-btn:hover:not(.active) {
          color: rgba(255, 255, 255, 0.8);
        }
      `}</style>
    </div>
  );
}

interface SliderControlProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  onChange: (value: number) => void;
}

function SliderControl({ label, value, min, max, step, unit, onChange }: SliderControlProps) {
  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div className="slider-control">
      <div className="slider-header">
        <span className="slider-label">{label}</span>
        <span className="slider-value">
          {value.toFixed(step < 1 ? 2 : 0)}{unit}
        </span>
      </div>
      <div className="slider-track">
        <div className="slider-fill" style={{ width: `${percentage}%` }} />
      </div>
      <input
        type="range"
        className="slider-input"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}
