import { Header, ControlPanel, StatusBar, ScenePanel, SceneEditor, MissionStats, PatrolControls, PathRecorder } from './components/UI';
import { SimulationCanvas } from './components/Scene';
import { LidarDisplay } from './components/Sensors/LidarSensor';
import './styles/global.css';

function App() {
  const handleSceneLoad = (file: File) => {
    console.log('Loading scene:', file.name);
    // Scene loading will be handled by the 3D canvas
  };

  return (
    <div className="app-container">
      {/* Header */}
      <Header />

      {/* Main Content */}
      <main className="canvas-container">
        {/* 3D Canvas */}
        <SimulationCanvas />

        {/* Scene Panel (Left) */}
        <ScenePanel onSceneLoad={handleSceneLoad} />

        {/* Scene Editor (Bottom Left) */}
        <SceneEditor />

        {/* Patrol Controls (Left Middle) */}
        <div className="patrol-panel">
          <PatrolControls />
          <MissionStats />
          <PathRecorder />
          <LidarDisplay />
        </div>

        {/* Control Panel (Right) */}
        <ControlPanel />

        {/* Grid Background Effect */}
        <div className="grid-bg" />
      </main>

      {/* Status Bar */}
      <StatusBar />
    </div>
  );
}

export default App;
