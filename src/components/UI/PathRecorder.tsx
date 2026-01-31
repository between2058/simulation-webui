import { useEffect, useState, useCallback } from 'react';
import { useSimulationStore } from '../../stores/simulationStore';

export function PathRecorder() {
  const {
    robot,
    simulationState,
    pathRecording,
    isRecordingPath,
    isPlayingPath,
    startPathRecording,
    stopPathRecording,
    startPathPlayback,
    stopPathPlayback,
    clearPathRecording,
  } = useSimulationStore();

  const [recordingTime, setRecordingTime] = useState(0);

  // Update recording time
  useEffect(() => {
    if (isRecordingPath) {
      const interval = setInterval(() => {
        setRecordingTime((t) => t + 0.1);
      }, 100);
      return () => clearInterval(interval);
    } else {
      setRecordingTime(0);
    }
  }, [isRecordingPath]);

  // Record robot position periodically while recording
  const recordPosition = useCallback(() => {
    if (!isRecordingPath || simulationState !== 'running') return;

    useSimulationStore.getState().addPathPoint({
      position: [robot.position.x, robot.position.y, robot.position.z],
      rotation: robot.rotation.y,
      timestamp: Date.now(),
    });
  }, [isRecordingPath, simulationState, robot.position, robot.rotation]);

  useEffect(() => {
    if (isRecordingPath && simulationState === 'running') {
      const interval = setInterval(recordPosition, 100); // Record at 10Hz
      return () => clearInterval(interval);
    }
  }, [isRecordingPath, simulationState, recordPosition]);

  const handleStartRecording = () => {
    clearPathRecording();
    startPathRecording();
  };

  const handleExportPath = () => {
    const data = {
      version: '1.0',
      type: 'path_recording',
      points: pathRecording,
      metadata: {
        duration: pathRecording.length > 0
          ? (pathRecording[pathRecording.length - 1].timestamp - pathRecording[0].timestamp) / 1000
          : 0,
        pointCount: pathRecording.length,
      },
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `path-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportPath = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          try {
            const data = JSON.parse(ev.target?.result as string);
            if (data.type === 'path_recording' && data.points) {
              clearPathRecording();
              data.points.forEach((point: { position: [number, number, number]; rotation: number; timestamp: number }) => {
                useSimulationStore.getState().addPathPoint(point);
              });
              alert(`已載入 ${data.points.length} 個路徑點！`);
            } else {
              alert('無效的路徑檔案格式');
            }
          } catch {
            alert('檔案解析失敗');
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 10);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms}`;
  };

  return (
    <div className="path-recorder">
      <h3>
        <span className="icon">🎬</span>
        路徑錄製
      </h3>

      <div className="status-bar">
        {isRecordingPath && (
          <div className="recording-status">
            <span className="recording-dot">●</span>
            錄製中 {formatTime(recordingTime)}
          </div>
        )}
        {isPlayingPath && (
          <div className="playback-status">
            <span className="playback-icon">▶</span>
            回放中
          </div>
        )}
        {!isRecordingPath && !isPlayingPath && pathRecording.length > 0 && (
          <div className="ready-status">
            已錄製 {pathRecording.length} 點
          </div>
        )}
      </div>

      <div className="control-buttons">
        {!isRecordingPath && !isPlayingPath ? (
          <>
            <button className="record-btn" onClick={handleStartRecording}>
              ⏺ 開始錄製
            </button>
            {pathRecording.length > 0 && (
              <button className="play-btn" onClick={startPathPlayback}>
                ▶ 回放
              </button>
            )}
          </>
        ) : (
          <button
            className="stop-btn"
            onClick={isRecordingPath ? stopPathRecording : stopPathPlayback}
          >
            ⏹ 停止{isRecordingPath ? '錄製' : '回放'}
          </button>
        )}
      </div>

      {pathRecording.length > 0 && !isRecordingPath && !isPlayingPath && (
        <div className="path-actions">
          <button onClick={handleExportPath}>📤 匯出</button>
          <button onClick={handleImportPath}>📥 匯入</button>
          <button onClick={clearPathRecording} className="clear-btn">🗑️ 清除</button>
        </div>
      )}

      {pathRecording.length === 0 && !isRecordingPath && (
        <div className="empty-hint">
          <button onClick={handleImportPath} className="import-only-btn">
            📥 匯入路徑
          </button>
        </div>
      )}

      <style>{`
        .path-recorder {
          background: rgba(0, 20, 40, 0.9);
          border: 1px solid rgba(0, 212, 255, 0.3);
          border-radius: 8px;
          padding: 12px;
          min-width: 200px;
        }

        .path-recorder h3 {
          margin: 0 0 12px 0;
          font-size: 14px;
          color: #00d4ff;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .status-bar {
          min-height: 24px;
          margin-bottom: 12px;
        }

        .recording-status {
          color: #ff4444;
          font-size: 12px;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .recording-dot {
          animation: blink 1s infinite;
        }

        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0.3; }
        }

        .playback-status {
          color: #00ff88;
          font-size: 12px;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .playback-icon {
          animation: pulse 1s infinite;
        }

        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.2); }
        }

        .ready-status {
          color: rgba(255, 255, 255, 0.6);
          font-size: 12px;
        }

        .control-buttons {
          display: flex;
          gap: 8px;
          margin-bottom: 12px;
        }

        .control-buttons button {
          flex: 1;
          padding: 8px 12px;
          border: none;
          border-radius: 4px;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .record-btn {
          background: linear-gradient(135deg, #ff4444, #ff8844);
          color: #fff;
        }

        .record-btn:hover {
          transform: scale(1.02);
          box-shadow: 0 0 15px rgba(255, 68, 68, 0.5);
        }

        .play-btn {
          background: linear-gradient(135deg, #00d4ff, #00ff88);
          color: #000;
        }

        .play-btn:hover {
          transform: scale(1.02);
          box-shadow: 0 0 15px rgba(0, 212, 255, 0.5);
        }

        .stop-btn {
          background: linear-gradient(135deg, #666, #888);
          color: #fff;
        }

        .stop-btn:hover {
          transform: scale(1.02);
        }

        .path-actions {
          display: flex;
          gap: 4px;
        }

        .path-actions button {
          flex: 1;
          padding: 6px 8px;
          background: rgba(0, 212, 255, 0.1);
          border: 1px solid rgba(0, 212, 255, 0.3);
          border-radius: 4px;
          color: #fff;
          font-size: 11px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .path-actions button:hover {
          background: rgba(0, 212, 255, 0.2);
        }

        .path-actions .clear-btn {
          background: rgba(255, 68, 68, 0.1);
          border-color: rgba(255, 68, 68, 0.3);
          color: #ff8888;
        }

        .path-actions .clear-btn:hover {
          background: rgba(255, 68, 68, 0.2);
        }

        .empty-hint {
          text-align: center;
        }

        .import-only-btn {
          padding: 8px 16px;
          background: rgba(0, 212, 255, 0.1);
          border: 1px solid rgba(0, 212, 255, 0.3);
          border-radius: 4px;
          color: #00d4ff;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .import-only-btn:hover {
          background: rgba(0, 212, 255, 0.2);
        }
      `}</style>
    </div>
  );
}
