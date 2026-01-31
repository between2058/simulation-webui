import { useSimulationStore } from '../../stores/simulationStore';

export function PatrolControls() {
  const {
    editorMode,
    setEditorMode,
    waypoints,
    patrolLoop,
    setPatrolLoop,
    clearWaypoints,
    simulationState,
    setSimulationState,
    startMission,
    stopMission,
    resetMissionStats,
    setCurrentWaypointIndex,
    exportScene,
    importScene,
  } = useSimulationStore();

  const handleExport = () => {
    const json = exportScene();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `scene-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
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
            alert('場景匯入成功！');
          } else {
            alert('場景匯入失敗，請檢查檔案格式');
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const handleStartPatrol = () => {
    if (waypoints.length === 0) {
      alert('請先設定巡邏路點！');
      return;
    }
    setCurrentWaypointIndex(0);
    resetMissionStats();
    startMission();
    setSimulationState('running');
    setEditorMode('simulate');
  };

  const handleStopPatrol = () => {
    stopMission();
    setSimulationState('idle');
  };

  return (
    <div className="patrol-controls">
      <h3>
        <span className="icon">🗺️</span>
        巡邏控制
      </h3>

      <div className="mode-buttons">
        <button
          className={editorMode === 'simulate' ? 'active' : ''}
          onClick={() => setEditorMode('simulate')}
        >
          模擬
        </button>
        <button
          className={editorMode === 'edit' ? 'active' : ''}
          onClick={() => setEditorMode('edit')}
        >
          編輯障礙
        </button>
        <button
          className={editorMode === 'patrol' ? 'active' : ''}
          onClick={() => setEditorMode('patrol')}
        >
          設定路點
        </button>
      </div>

      {editorMode === 'patrol' && (
        <div className="patrol-hint">
          💡 點擊地面設定巡邏路點，點擊路點可刪除
        </div>
      )}

      <div className="waypoint-info">
        <span>已設定 {waypoints.length} 個路點</span>
        {waypoints.length > 0 && (
          <button className="clear-btn" onClick={clearWaypoints}>
            清除全部
          </button>
        )}
      </div>

      <div className="options">
        <label className="checkbox">
          <input
            type="checkbox"
            checked={patrolLoop}
            onChange={(e) => setPatrolLoop(e.target.checked)}
          />
          <span>循環巡邏</span>
        </label>
      </div>

      <div className="action-buttons">
        {simulationState !== 'running' ? (
          <button className="start-btn" onClick={handleStartPatrol}>
            ▶ 開始巡邏
          </button>
        ) : (
          <button className="stop-btn" onClick={handleStopPatrol}>
            ⏹ 停止巡邏
          </button>
        )}
      </div>

      <div className="scene-buttons">
        <button onClick={handleExport} title="匯出場景">
          📤 匯出
        </button>
        <button onClick={handleImport} title="匯入場景">
          📥 匯入
        </button>
      </div>

      <style>{`
        .patrol-controls {
          background: rgba(0, 20, 40, 0.9);
          border: 1px solid rgba(0, 212, 255, 0.3);
          border-radius: 8px;
          padding: 12px;
          min-width: 200px;
        }

        .patrol-controls h3 {
          margin: 0 0 12px 0;
          font-size: 14px;
          color: #00d4ff;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .mode-buttons {
          display: flex;
          gap: 4px;
          margin-bottom: 12px;
        }

        .mode-buttons button {
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

        .mode-buttons button:hover {
          background: rgba(0, 212, 255, 0.2);
        }

        .mode-buttons button.active {
          background: rgba(0, 212, 255, 0.4);
          border-color: #00d4ff;
        }

        .patrol-hint {
          background: rgba(255, 200, 0, 0.1);
          border: 1px solid rgba(255, 200, 0, 0.3);
          border-radius: 4px;
          padding: 8px;
          font-size: 11px;
          color: #ffc800;
          margin-bottom: 12px;
        }

        .waypoint-info {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px;
          background: rgba(0, 212, 255, 0.1);
          border-radius: 4px;
          font-size: 12px;
          margin-bottom: 12px;
        }

        .clear-btn {
          padding: 4px 8px;
          background: rgba(255, 68, 68, 0.2);
          border: 1px solid rgba(255, 68, 68, 0.5);
          border-radius: 4px;
          color: #ff4444;
          font-size: 10px;
          cursor: pointer;
        }

        .clear-btn:hover {
          background: rgba(255, 68, 68, 0.3);
        }

        .options {
          margin-bottom: 12px;
        }

        .checkbox {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          cursor: pointer;
        }

        .checkbox input {
          accent-color: #00d4ff;
        }

        .action-buttons {
          margin-bottom: 12px;
        }

        .start-btn, .stop-btn {
          width: 100%;
          padding: 10px;
          border: none;
          border-radius: 4px;
          font-size: 14px;
          font-weight: bold;
          cursor: pointer;
          transition: all 0.2s;
        }

        .start-btn {
          background: linear-gradient(135deg, #00d4ff, #00ff88);
          color: #000;
        }

        .start-btn:hover {
          transform: scale(1.02);
          box-shadow: 0 0 20px rgba(0, 212, 255, 0.5);
        }

        .stop-btn {
          background: linear-gradient(135deg, #ff4444, #ff8844);
          color: #fff;
        }

        .stop-btn:hover {
          transform: scale(1.02);
          box-shadow: 0 0 20px rgba(255, 68, 68, 0.5);
        }

        .scene-buttons {
          display: flex;
          gap: 8px;
        }

        .scene-buttons button {
          flex: 1;
          padding: 8px;
          background: rgba(0, 212, 255, 0.1);
          border: 1px solid rgba(0, 212, 255, 0.3);
          border-radius: 4px;
          color: #fff;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .scene-buttons button:hover {
          background: rgba(0, 212, 255, 0.2);
        }
      `}</style>
    </div>
  );
}
