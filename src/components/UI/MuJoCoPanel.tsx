/**
 * MuJoCo Simulation Control Panel
 *
 * Connects to the Python MuJoCo backend for real physics simulation.
 */

import { useState } from 'react';
import { useMuJoCoSimulation } from '../../hooks/useMuJoCoSimulation';

export function MuJoCoPanel() {
  const {
    connected,
    robotState,
    simTime,
    realTimeFactor,
    error,
    connect,
    disconnect,
    startWalking,
    stopWalking,
  } = useMuJoCoSimulation();

  const [walkParams, setWalkParams] = useState({
    frequency: 2.0,
    amplitude: 0.3,
  });

  return (
    <div className="mujoco-panel">
      <h3>
        <span className="icon">⚙️</span>
        MuJoCo 物理
        <span className={`status-dot ${connected ? 'connected' : 'disconnected'}`} />
      </h3>

      {/* Connection Status */}
      <div className="connection-section">
        {!connected ? (
          <button className="connect-btn" onClick={connect}>
            🔌 連接 MuJoCo
          </button>
        ) : (
          <button className="disconnect-btn" onClick={disconnect}>
            ⏏️ 斷開連接
          </button>
        )}

        {error && <div className="error-message">{error}</div>}
      </div>

      {/* Simulation Stats */}
      {connected && robotState && (
        <>
          <div className="stats-section">
            <div className="stat-row">
              <span className="label">模擬時間</span>
              <span className="value">{simTime.toFixed(2)}s</span>
            </div>
            <div className="stat-row">
              <span className="label">即時係數</span>
              <span className="value">{realTimeFactor.toFixed(1)}x</span>
            </div>
            <div className="stat-row">
              <span className="label">位置</span>
              <span className="value">
                ({robotState.base_position[0].toFixed(2)},
                {robotState.base_position[1].toFixed(2)},
                {robotState.base_position[2].toFixed(2)})
              </span>
            </div>
            <div className="stat-row">
              <span className="label">接觸點</span>
              <span className="value">{robotState.contacts.length}</span>
            </div>
          </div>

          {/* Walk Control */}
          <div className="control-section">
            <div className="param-row">
              <label>步頻</label>
              <input
                type="range"
                min="0.5"
                max="4"
                step="0.1"
                value={walkParams.frequency}
                onChange={(e) =>
                  setWalkParams((p) => ({ ...p, frequency: parseFloat(e.target.value) }))
                }
              />
              <span>{walkParams.frequency.toFixed(1)} Hz</span>
            </div>

            <div className="param-row">
              <label>幅度</label>
              <input
                type="range"
                min="0.1"
                max="0.6"
                step="0.05"
                value={walkParams.amplitude}
                onChange={(e) =>
                  setWalkParams((p) => ({ ...p, amplitude: parseFloat(e.target.value) }))
                }
              />
              <span>{walkParams.amplitude.toFixed(2)}</span>
            </div>

            <div className="action-buttons">
              <button
                className="walk-btn"
                onClick={() => startWalking(walkParams)}
              >
                🐕 開始行走
              </button>
              <button className="stop-btn" onClick={stopWalking}>
                ⏹️ 停止
              </button>
            </div>
          </div>

          {/* Joint States */}
          <details className="joints-section">
            <summary>關節狀態 (12 DOF)</summary>
            <div className="joints-grid">
              {Object.entries(robotState.joint_positions).map(([name, pos]) => (
                <div key={name} className="joint-item">
                  <span className="joint-name">{name.replace('_joint', '')}</span>
                  <span className="joint-value">{(pos * 180 / Math.PI).toFixed(1)}°</span>
                </div>
              ))}
            </div>
          </details>
        </>
      )}

      {/* Instructions when not connected */}
      {!connected && !error && (
        <div className="instructions">
          <p>啟動 MuJoCo 後端:</p>
          <code>
            cd backend<br />
            pip install -r requirements.txt<br />
            python mujoco_server.py
          </code>
        </div>
      )}

      <style>{`
        .mujoco-panel {
          background: rgba(0, 20, 40, 0.95);
          border: 1px solid rgba(255, 136, 0, 0.4);
          border-radius: 8px;
          padding: 12px;
          min-width: 220px;
        }

        .mujoco-panel h3 {
          margin: 0 0 12px 0;
          font-size: 14px;
          color: #ff8800;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          margin-left: auto;
        }

        .status-dot.connected {
          background: #00ff88;
          box-shadow: 0 0 8px #00ff88;
        }

        .status-dot.disconnected {
          background: #ff4444;
        }

        .connection-section {
          margin-bottom: 12px;
        }

        .connect-btn, .disconnect-btn {
          width: 100%;
          padding: 10px;
          border: none;
          border-radius: 4px;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .connect-btn {
          background: linear-gradient(135deg, #ff8800, #ffaa00);
          color: #000;
        }

        .connect-btn:hover {
          transform: scale(1.02);
          box-shadow: 0 0 15px rgba(255, 136, 0, 0.5);
        }

        .disconnect-btn {
          background: rgba(255, 136, 0, 0.2);
          border: 1px solid rgba(255, 136, 0, 0.4);
          color: #ff8800;
        }

        .error-message {
          margin-top: 8px;
          padding: 8px;
          background: rgba(255, 68, 68, 0.2);
          border: 1px solid rgba(255, 68, 68, 0.4);
          border-radius: 4px;
          font-size: 11px;
          color: #ff8888;
        }

        .stats-section {
          background: rgba(255, 136, 0, 0.1);
          border-radius: 4px;
          padding: 8px;
          margin-bottom: 12px;
        }

        .stat-row {
          display: flex;
          justify-content: space-between;
          font-size: 11px;
          padding: 2px 0;
        }

        .stat-row .label {
          color: rgba(255, 255, 255, 0.6);
        }

        .stat-row .value {
          color: #ff8800;
          font-family: 'Courier New', monospace;
        }

        .control-section {
          margin-bottom: 12px;
        }

        .param-row {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;
          font-size: 11px;
        }

        .param-row label {
          width: 40px;
          color: rgba(255, 255, 255, 0.6);
        }

        .param-row input[type="range"] {
          flex: 1;
          accent-color: #ff8800;
        }

        .param-row span {
          width: 50px;
          text-align: right;
          font-family: 'Courier New', monospace;
          color: #ff8800;
        }

        .action-buttons {
          display: flex;
          gap: 8px;
        }

        .action-buttons button {
          flex: 1;
          padding: 8px;
          border: none;
          border-radius: 4px;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .walk-btn {
          background: linear-gradient(135deg, #00d4ff, #00ff88);
          color: #000;
        }

        .stop-btn {
          background: rgba(255, 68, 68, 0.2);
          border: 1px solid rgba(255, 68, 68, 0.4);
          color: #ff8888;
        }

        .joints-section {
          font-size: 11px;
        }

        .joints-section summary {
          cursor: pointer;
          color: rgba(255, 255, 255, 0.6);
          padding: 4px 0;
        }

        .joints-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 4px;
          margin-top: 8px;
        }

        .joint-item {
          display: flex;
          justify-content: space-between;
          padding: 2px 4px;
          background: rgba(255, 136, 0, 0.1);
          border-radius: 2px;
        }

        .joint-name {
          color: rgba(255, 255, 255, 0.5);
          font-size: 9px;
        }

        .joint-value {
          color: #ff8800;
          font-family: 'Courier New', monospace;
        }

        .instructions {
          font-size: 11px;
          color: rgba(255, 255, 255, 0.6);
        }

        .instructions code {
          display: block;
          margin-top: 8px;
          padding: 8px;
          background: rgba(0, 0, 0, 0.3);
          border-radius: 4px;
          font-family: 'Courier New', monospace;
          font-size: 10px;
          color: #ff8800;
        }
      `}</style>
    </div>
  );
}
