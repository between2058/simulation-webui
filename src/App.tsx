import { StatusBar, MainControlPanel } from './components/UI';
import { SimulationCanvas } from './components/Scene';
import { PictureInPicture } from './components/Camera/PictureInPicture';
import './styles/global.css';

function App() {
  return (
    <div className="app-container">
      {/* Main Control Panel (Left Side - Tabbed Interface) */}
      <MainControlPanel />

      {/* Main Content - 3D Canvas Area */}
      <main className="canvas-area">
        {/* 3D Canvas */}
        <SimulationCanvas />

        {/* Picture-in-Picture Camera View */}
        <PictureInPicture position="top-right" />

        {/* Viewport Info */}
        <div className="viewport-info">
          <span className="viewport-label">GO2 (QUADRUPED)</span>
          <div className="viewport-actions">
            <button className="viewport-btn">SHOW FRAMES</button>
            <button className="viewport-btn">FOLLOW ROBOT</button>
            <button className="viewport-btn">ADD OBSTACLE</button>
            <button className="viewport-btn">CLEAR</button>
          </div>
        </div>

        {/* Axis Indicator */}
        <div className="axis-indicator">
          <div className="axis-dot x" />
          <div className="axis-dot y" />
          <div className="axis-dot z" />
        </div>
      </main>

      {/* Status Bar */}
      <StatusBar />
    </div>
  );
}

export default App;
