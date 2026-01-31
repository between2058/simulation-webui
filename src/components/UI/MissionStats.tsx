import { useEffect, useState } from 'react';
import { useSimulationStore } from '../../stores/simulationStore';

export function MissionStats() {
  const {
    missionStats,
    simulationState,
    waypoints,
  } = useSimulationStore();
  const [liveTime, setLiveTime] = useState(0);

  // Update live time
  useEffect(() => {
    if (missionStats.isRecording && missionStats.startTime) {
      const interval = setInterval(() => {
        setLiveTime((Date.now() - missionStats.startTime!) / 1000);
      }, 100);
      return () => clearInterval(interval);
    } else {
      setLiveTime(missionStats.timeElapsed);
    }
  }, [missionStats.isRecording, missionStats.startTime, missionStats.timeElapsed]);

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

      {simulationState === 'running' && (
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
      `}</style>
    </div>
  );
}
