import { useEffect, useState } from 'react';
import { useSimulationStore } from '../../stores/simulationStore';

export function MissionStats() {
  const {
    missionStats,
    simulationState,
    waypoints,
    pauseMission,
    resumeMission,
    saveMission,
    stopMission,
  } = useSimulationStore();
  const [liveTime, setLiveTime] = useState(0);

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

  const handlePauseResume = () => {
    if (missionStats.isPaused) {
      resumeMission();
    } else {
      pauseMission();
    }
  };

  const handleSaveAndStop = () => {
    stopMission();
    saveMission();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 10);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms}`;
  };

  const formatDistance = (meters: number) => {
    if (meters < 1) {
      return `${(meters * 100).toFixed(0)} cm`;
    }
    return `${meters.toFixed(2)} m`;
  };

  return (
    <div className="mission-stats">
      <h3>
        <span className="icon">📊</span>
        任務統計
        {missionStats.isRecording && <span className="recording-dot">●</span>}
      </h3>

      <div className="stats-grid">
        <div className="stat-item">
          <span className="stat-label">運行時間</span>
          <span className="stat-value time">{formatTime(liveTime)}</span>
        </div>

        <div className="stat-item">
          <span className="stat-label">移動距離</span>
          <span className="stat-value distance">{formatDistance(missionStats.distanceTraveled)}</span>
        </div>

        <div className="stat-item">
          <span className="stat-label">碰撞次數</span>
          <span className={`stat-value collisions ${missionStats.collisionCount > 0 ? 'warning' : ''}`}>
            {missionStats.collisionCount}
          </span>
        </div>

        <div className="stat-item">
          <span className="stat-label">到達路點</span>
          <span className="stat-value waypoints">
            {missionStats.waypointsReached}
            {waypoints.length > 0 && ` / ${waypoints.length}`}
          </span>
        </div>
      </div>

      {(simulationState === 'running' || simulationState === 'paused') && (
        <div className="efficiency-bar">
          <span className="label">效率評分</span>
          <div className="bar">
            <div
              className="fill"
              style={{
                width: `${Math.max(0, 100 - missionStats.collisionCount * 10)}%`
              }}
            />
          </div>
          <span className="score">
            {Math.max(0, 100 - missionStats.collisionCount * 10)}%
          </span>
        </div>
      )}

      {/* Mission Controls */}
      {missionStats.isRecording && (
        <div className="mission-controls">
          <button
            className={`control-btn ${missionStats.isPaused ? 'paused' : ''}`}
            onClick={handlePauseResume}
            title={missionStats.isPaused ? '繼續任務' : '暫停任務'}
          >
            {missionStats.isPaused ? '▶ 繼續' : '⏸ 暫停'}
          </button>
          <button
            className="control-btn save"
            onClick={handleSaveAndStop}
            title="保存並結束任務"
          >
            💾 保存
          </button>
        </div>
      )}

      {/* Paused indicator */}
      {missionStats.isPaused && (
        <div className="paused-indicator">
          ⏸ 任務已暫停
        </div>
      )}

      <style>{`
        .mission-stats {
          background: rgba(0, 20, 40, 0.9);
          border: 1px solid rgba(0, 212, 255, 0.3);
          border-radius: 8px;
          padding: 12px;
          min-width: 200px;
        }

        .mission-stats h3 {
          margin: 0 0 12px 0;
          font-size: 14px;
          color: #00d4ff;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .mission-stats .icon {
          font-size: 16px;
        }

        .recording-dot {
          color: #ff4444;
          animation: blink 1s infinite;
          margin-left: auto;
        }

        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0.3; }
        }

        .stats-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }

        .stat-item {
          background: rgba(0, 212, 255, 0.1);
          border-radius: 4px;
          padding: 8px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .stat-label {
          font-size: 10px;
          color: rgba(255, 255, 255, 0.6);
          text-transform: uppercase;
        }

        .stat-value {
          font-size: 16px;
          font-weight: bold;
          font-family: 'Courier New', monospace;
        }

        .stat-value.time {
          color: #00ff88;
        }

        .stat-value.distance {
          color: #00d4ff;
        }

        .stat-value.collisions {
          color: #00ff88;
        }

        .stat-value.collisions.warning {
          color: #ff8844;
        }

        .stat-value.waypoints {
          color: #aa88ff;
        }

        .efficiency-bar {
          margin-top: 12px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .efficiency-bar .label {
          font-size: 10px;
          color: rgba(255, 255, 255, 0.6);
          white-space: nowrap;
        }

        .efficiency-bar .bar {
          flex: 1;
          height: 6px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 3px;
          overflow: hidden;
        }

        .efficiency-bar .fill {
          height: 100%;
          background: linear-gradient(90deg, #ff4444, #ffaa00, #00ff88);
          transition: width 0.3s;
        }

        .efficiency-bar .score {
          font-size: 12px;
          font-weight: bold;
          color: #00ff88;
          min-width: 40px;
          text-align: right;
        }

        .mission-controls {
          display: flex;
          gap: 8px;
          margin-top: 12px;
        }

        .control-btn {
          flex: 1;
          padding: 8px 12px;
          border: 1px solid rgba(0, 212, 255, 0.3);
          border-radius: 4px;
          background: rgba(0, 212, 255, 0.1);
          color: rgba(255, 255, 255, 0.9);
          font-size: 11px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .control-btn:hover {
          background: rgba(0, 212, 255, 0.2);
          border-color: rgba(0, 212, 255, 0.5);
        }

        .control-btn.paused {
          background: rgba(0, 255, 136, 0.15);
          border-color: rgba(0, 255, 136, 0.5);
          color: #00ff88;
        }

        .control-btn.save {
          background: rgba(255, 170, 0, 0.1);
          border-color: rgba(255, 170, 0, 0.3);
        }

        .control-btn.save:hover {
          background: rgba(255, 170, 0, 0.2);
          border-color: rgba(255, 170, 0, 0.5);
        }

        .paused-indicator {
          margin-top: 8px;
          padding: 6px 10px;
          background: rgba(255, 170, 0, 0.15);
          border: 1px solid rgba(255, 170, 0, 0.3);
          border-radius: 4px;
          color: #ffaa00;
          font-size: 11px;
          text-align: center;
          animation: pauseBlink 1.5s ease-in-out infinite;
        }

        @keyframes pauseBlink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
      `}</style>
    </div>
  );
}
