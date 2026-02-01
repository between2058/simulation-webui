import { useState } from 'react';
import { ControlTab } from './Tabs/ControlTab';
import { MissionTab } from './Tabs/MissionTab';
import { SceneTab } from './Tabs/SceneTab';
import { SystemTab } from './Tabs/SystemTab';
import './MainControlPanel.css';

type TabId = 'control' | 'mission' | 'scene' | 'system';

interface TabConfig {
  id: TabId;
  label: string;
  icon: string;
}

const TABS: TabConfig[] = [
  { id: 'control', label: 'CONTROL', icon: '🎮' },
  { id: 'mission', label: 'MISSION', icon: '🎯' },
  { id: 'scene', label: 'SCENE', icon: '🏗️' },
  { id: 'system', label: 'SYSTEM', icon: '⚙️' },
];

export function MainControlPanel() {
  const [activeTab, setActiveTab] = useState<TabId>('control');

  const renderTabContent = () => {
    switch (activeTab) {
      case 'control':
        return <ControlTab />;
      case 'mission':
        return <MissionTab />;
      case 'scene':
        return <SceneTab />;
      case 'system':
        return <SystemTab />;
      default:
        return null;
    }
  };

  return (
    <div className="main-control-panel">
      {/* Header */}
      <div className="panel-header">
        <div className="panel-logo">
          <span className="logo-icon">🐕</span>
          <span className="logo-text">RoboDog</span>
        </div>
        <div className="panel-status">
          <span className="status-dot active" />
          <span className="status-text">SYSTEM ONLINE</span>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="tab-navigation">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="tab-label">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {renderTabContent()}
      </div>
    </div>
  );
}
