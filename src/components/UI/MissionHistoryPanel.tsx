import { useState } from 'react';
import { useSimulationStore, type MissionRecord } from '../../stores/simulationStore';
import { Panel } from './Panel';
import './MissionHistoryPanel.css';

export function MissionHistoryPanel() {
  const {
    missionHistory,
    deleteMission,
    clearMissionHistory,
    exportMissionReport,
  } = useSimulationStore();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const handleExport = (format: 'json' | 'csv') => {
    const data = exportMissionReport(format, selectedIds.length > 0 ? selectedIds : undefined);
    const blob = new Blob([data], {
      type: format === 'json' ? 'application/json' : 'text/csv'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mission-report-${new Date().toISOString().slice(0, 10)}.${format}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString('zh-TW', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (missionHistory.length === 0) {
    return (
      <Panel title="📋 任務歷史" position="bottom-left">
        <div className="mission-history-panel">
          <div className="empty-state">
            <span className="empty-icon">📭</span>
            <p>尚無任務記錄</p>
            <p className="hint">完成巡邏任務後會自動記錄</p>
          </div>
        </div>
      </Panel>
    );
  }

  return (
    <Panel title="📋 任務歷史" position="bottom-left">
      <div className="mission-history-panel">
        {/* Export Controls */}
        <div className="export-controls">
          <button
            className="export-btn"
            onClick={() => handleExport('json')}
            title="導出 JSON 格式"
          >
            📄 JSON
          </button>
          <button
            className="export-btn"
            onClick={() => handleExport('csv')}
            title="導出 CSV 格式"
          >
            📊 CSV
          </button>
          {missionHistory.length > 0 && (
            <button
              className="clear-btn"
              onClick={clearMissionHistory}
              title="清除所有記錄"
            >
              🗑️
            </button>
          )}
        </div>

        {/* Selection hint */}
        {selectedIds.length > 0 && (
          <div className="selection-hint">
            已選擇 {selectedIds.length} 項
            <button onClick={() => setSelectedIds([])}>取消選擇</button>
          </div>
        )}

        {/* Mission List */}
        <div className="mission-list">
          {missionHistory.slice().reverse().map((mission: MissionRecord) => (
            <div
              key={mission.id}
              className={`mission-item ${selectedIds.includes(mission.id) ? 'selected' : ''} ${mission.success ? 'success' : 'incomplete'}`}
              onClick={() => toggleSelection(mission.id)}
            >
              <div className="mission-header">
                <span className={`status-badge ${mission.success ? 'success' : 'incomplete'}`}>
                  {mission.success ? '✓' : '○'}
                </span>
                <span className="mission-name">{mission.name}</span>
                <button
                  className="delete-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteMission(mission.id);
                  }}
                  title="刪除此記錄"
                >
                  ×
                </button>
              </div>

              <div className="mission-details">
                <div className="detail-row">
                  <span className="detail-label">時間</span>
                  <span className="detail-value">{formatDate(mission.completedAt)}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">耗時</span>
                  <span className="detail-value">{formatDuration(mission.duration)}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">路點</span>
                  <span className="detail-value">
                    {mission.waypointsReached}/{mission.waypointsTotal}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">距離</span>
                  <span className="detail-value">{mission.distanceTraveled.toFixed(1)}m</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">碰撞</span>
                  <span className={`detail-value ${mission.collisionCount > 0 ? 'warning' : ''}`}>
                    {mission.collisionCount}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">機器人</span>
                  <span className="detail-value">{mission.robotCount}</span>
                </div>
              </div>

              <div className="mission-meta">
                <span className="meta-tag">{mission.patrolMode === 'distributed' ? '分散' : '單一'}</span>
                {mission.formationMode !== 'none' && (
                  <span className="meta-tag">{mission.formationMode}</span>
                )}
                <span className="meta-speed">
                  {mission.averageSpeed.toFixed(2)} m/s
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Panel>
  );
}
