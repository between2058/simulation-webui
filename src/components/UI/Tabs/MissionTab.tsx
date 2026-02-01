import { useEffect, useState } from 'react';
import { useSimulationStore } from '../../../stores/simulationStore';
import type { WaypointData, MissionRecord, PatrolMode } from '../../../stores/simulationStore';

const PATROL_MODES: { id: PatrolMode; label: string; desc: string }[] = [
  { id: 'single', label: 'SINGLE', desc: 'All robots follow same path' },
  { id: 'distributed', label: 'DISTRIBUTED', desc: 'Split waypoints among robots' },
];

export function MissionTab() {
  const {
    waypoints,
    patrolLoop,
    setPatrolLoop,
    clearWaypoints,
    editorMode,
    setEditorMode,
    simulationState,
    setSimulationState,
    missionStats,
    startMission,
    stopMission,
    pauseMission,
    resumeMission,
    saveMission,
    resetMissionStats,
    setCurrentWaypointIndex,
    missionHistory,
    deleteMission,
    exportMissionReport,
    clearMissionHistory,
    patrolMode,
    setPatrolMode,
    robots,
    distributeWaypoints,
    updateWaypoint,
  } = useSimulationStore();

  const [liveTime, setLiveTime] = useState(0);
  const [showHistory, setShowHistory] = useState(false);

  // Update live time
  useEffect(() => {
    if (missionStats.isRecording && missionStats.startTime && !missionStats.isPaused) {
      const interval = setInterval(() => {
        const elapsed = (Date.now() - missionStats.startTime! - missionStats.pausedTime) / 1000;
        setLiveTime(Math.max(0, elapsed));
      }, 100);
      return () => clearInterval(interval);
    } else if (!missionStats.isRecording) {
      setLiveTime(missionStats.timeElapsed);
    }
  }, [missionStats.isRecording, missionStats.startTime, missionStats.timeElapsed, missionStats.isPaused, missionStats.pausedTime]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartPatrol = () => {
    if (waypoints.length === 0) {
      alert('Please set waypoints first!');
      return;
    }
    if (patrolMode === 'distributed' && robots.length > 1) {
      distributeWaypoints();
    }
    setCurrentWaypointIndex(0);
    resetMissionStats();
    startMission();
    setSimulationState('running');
    setEditorMode('simulate');
  };

  const handleStopPatrol = () => {
    stopMission();
    saveMission();
    setSimulationState('idle');
  };

  const handlePauseResume = () => {
    if (missionStats.isPaused) {
      resumeMission();
    } else {
      pauseMission();
    }
  };

  const handleExport = (format: 'json' | 'csv') => {
    const data = exportMissionReport(format);
    const blob = new Blob([data], { type: format === 'json' ? 'application/json' : 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mission-report-${new Date().toISOString().slice(0, 10)}.${format}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const isRunning = simulationState === 'running' || missionStats.isRecording;

  return (
    <div className="mission-tab">
      {/* Patrol Mode Selection */}
      <div className="tab-section">
        <div className="section-header">
          <span className="section-title">PATROL MODE</span>
        </div>
        <div className="mode-buttons" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
          {PATROL_MODES.map((mode) => (
            <button
              key={mode.id}
              className={`mode-btn ${patrolMode === mode.id ? 'active' : ''}`}
              onClick={() => setPatrolMode(mode.id)}
              disabled={isRunning}
              title={mode.desc}
            >
              {mode.label}
            </button>
          ))}
        </div>
      </div>

      {/* Waypoints */}
      <div className="tab-section">
        <div className="section-header">
          <span className="section-title">WAYPOINTS</span>
          <span className="section-badge">{waypoints.length} POINTS</span>
        </div>

        <div className="button-row">
          <button
            className={`action-btn secondary ${editorMode === 'patrol' ? 'active-edit' : ''}`}
            onClick={() => setEditorMode(editorMode === 'patrol' ? 'simulate' : 'patrol')}
            disabled={isRunning}
          >
            {editorMode === 'patrol' ? '完成編輯' : '編輯路點'}
          </button>
          <button
            className="action-btn danger"
            onClick={clearWaypoints}
            disabled={isRunning || waypoints.length === 0}
          >
            清除
          </button>
        </div>

        {editorMode === 'patrol' && (
          <div className="hint-text">
            💡 Click on the ground to add waypoints
          </div>
        )}

        {/* Waypoint List with Wait Times */}
        {waypoints.length > 0 && (
          <div className="waypoint-list">
            {waypoints.map((wp: WaypointData, index: number) => (
              <div key={wp.id} className="waypoint-item">
                <span className="wp-number">{index + 1}</span>
                <span className="wp-pos">
                  ({wp.position[0].toFixed(1)}, {wp.position[2].toFixed(1)})
                </span>
                <div className="wp-wait">
                  <input
                    type="number"
                    min="0"
                    max="60"
                    value={wp.waitTime || 0}
                    onChange={(e) => updateWaypoint(wp.id, { waitTime: Number(e.target.value) })}
                    disabled={isRunning}
                  />
                  <span>s</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Options */}
        <div className="toggle-row">
          <span className="toggle-label">Loop Patrol</span>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={patrolLoop}
              onChange={(e) => setPatrolLoop(e.target.checked)}
              disabled={isRunning}
            />
            <span className="toggle-slider" />
          </label>
        </div>
      </div>

      {/* Mission Control */}
      <div className="tab-section">
        <div className="section-header">
          <span className="section-title">MISSION CONTROL</span>
          {missionStats.isRecording && (
            <span className="section-badge recording">
              {missionStats.isPaused ? 'PAUSED' : 'RECORDING'}
            </span>
          )}
        </div>

        {!isRunning ? (
          <button
            className="action-btn"
            onClick={handleStartPatrol}
            disabled={waypoints.length === 0}
          >
            ▶ START PATROL
          </button>
        ) : (
          <div className="button-row">
            <button
              className={`action-btn secondary ${missionStats.isPaused ? 'paused' : ''}`}
              onClick={handlePauseResume}
            >
              {missionStats.isPaused ? '▶ RESUME' : '⏸ PAUSE'}
            </button>
            <button className="action-btn danger" onClick={handleStopPatrol}>
              ⏹ STOP
            </button>
          </div>
        )}
      </div>

      {/* Live Stats */}
      <div className="tab-section">
        <div className="section-header">
          <span className="section-title">LIVE STATISTICS</span>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-card-label">TIME</div>
            <div className="stat-card-value">{formatTime(liveTime)}</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-label">DISTANCE</div>
            <div className="stat-card-value">{missionStats.distanceTraveled.toFixed(1)}m</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-label">WAYPOINTS</div>
            <div className="stat-card-value success">
              {missionStats.waypointsReached}/{waypoints.length}
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-card-label">COLLISIONS</div>
            <div className={`stat-card-value ${missionStats.collisionCount > 0 ? 'warning' : ''}`}>
              {missionStats.collisionCount}
            </div>
          </div>
        </div>

        {/* Efficiency Bar */}
        {isRunning && (
          <div style={{ marginTop: 12 }}>
            <div className="slider-header">
              <span className="slider-label">Efficiency</span>
              <span className="slider-value">
                {Math.max(0, 100 - missionStats.collisionCount * 10)}%
              </span>
            </div>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${Math.max(0, 100 - missionStats.collisionCount * 10)}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Mission History */}
      <div className="tab-section">
        <div className="section-header">
          <span className="section-title">MISSION HISTORY</span>
          <button
            className="icon-btn"
            onClick={() => setShowHistory(!showHistory)}
            title={showHistory ? 'Hide' : 'Show'}
          >
            {showHistory ? '▲' : '▼'}
          </button>
        </div>

        {showHistory && (
          <>
            {missionHistory.length === 0 ? (
              <div className="hint-text">No mission records yet</div>
            ) : (
              <>
                <div className="mission-history-list">
                  {missionHistory.slice().reverse().slice(0, 5).map((mission: MissionRecord) => (
                    <div key={mission.id} className="list-item">
                      <div className="list-item-info">
                        <div className={`list-item-icon ${mission.success ? 'success' : 'warning'}`}>
                          {mission.success ? '✓' : '○'}
                        </div>
                        <div className="list-item-text">
                          <span className="list-item-title">{mission.name}</span>
                          <span className="list-item-subtitle">
                            {formatTime(mission.duration)} · {mission.waypointsReached}/{mission.waypointsTotal} WP
                          </span>
                        </div>
                      </div>
                      <button
                        className="icon-btn danger"
                        onClick={() => deleteMission(mission.id)}
                        title="Delete"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>

                <div className="button-row" style={{ marginTop: 12 }}>
                  <button className="action-btn secondary" onClick={() => handleExport('json')}>
                    📄 JSON
                  </button>
                  <button className="action-btn secondary" onClick={() => handleExport('csv')}>
                    📊 CSV
                  </button>
                  <button className="action-btn danger" onClick={clearMissionHistory}>
                    🗑️
                  </button>
                </div>
              </>
            )}
          </>
        )}
      </div>

      <style>{`
        .active-edit {
          background: rgba(0, 255, 136, 0.2) !important;
          border-color: #00ff88 !important;
          color: #00ff88 !important;
        }

        .recording {
          background: rgba(255, 68, 68, 0.2) !important;
          color: #ff6b6b !important;
          animation: recordPulse 1s ease-in-out infinite;
        }

        @keyframes recordPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        .paused {
          background: rgba(0, 255, 136, 0.15) !important;
          border-color: rgba(0, 255, 136, 0.5) !important;
          color: #00ff88 !important;
        }

        .waypoint-list {
          max-height: 120px;
          overflow-y: auto;
          margin: 12px 0;
        }

        .waypoint-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 8px;
          background: rgba(0, 20, 40, 0.5);
          border-radius: 4px;
          margin-bottom: 4px;
          font-size: 11px;
        }

        .wp-number {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #00d4ff;
          color: #000;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: 10px;
        }

        .wp-pos {
          flex: 1;
          color: rgba(255, 255, 255, 0.6);
          font-family: 'JetBrains Mono', monospace;
        }

        .wp-wait {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .wp-wait input {
          width: 40px;
          padding: 4px;
          background: rgba(0, 20, 40, 0.8);
          border: 1px solid rgba(0, 212, 255, 0.3);
          border-radius: 4px;
          color: white;
          font-size: 10px;
          text-align: center;
        }

        .wp-wait span {
          color: rgba(255, 255, 255, 0.4);
          font-size: 10px;
        }

        .mission-history-list {
          max-height: 200px;
          overflow-y: auto;
        }

        .list-item-icon.success {
          background: rgba(0, 255, 136, 0.2);
          color: #00ff88;
        }

        .list-item-icon.warning {
          background: rgba(255, 170, 0, 0.2);
          color: #ffaa00;
        }
      `}</style>
    </div>
  );
}
