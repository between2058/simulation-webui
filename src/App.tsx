import { Header, ControlPanel, StatusBar, ScenePanel, SceneEditor, MissionStats, PatrolControls, PathRecorder, MuJoCoPanel, ModelUploadPanel, MultiRobotPanel } from './components/UI';
import { SimulationCanvas } from './components/Scene';
import { LidarDisplay } from './components/Sensors/LidarSensor';
import { PictureInPicture } from './components/Camera/PictureInPicture';
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

        {/* Left Panel Stack - Scene & Models */}
        <div className="left-panel-stack">
          <ScenePanel onSceneLoad={handleSceneLoad} />
          <ModelUploadPanel />
        </div>

        {/* Scene Editor (Bottom Left) */}
        <SceneEditor />

        {/* Patrol Controls (Left Middle) */}
        <div className="patrol-panel">
          <PatrolControls />
          <MissionStats />
          <PathRecorder />
          <LidarDisplay />
        </div>

        {/* Right Panel Stack - Controls & Robots */}
        <div className="right-panel-stack">
          <ControlPanel />
          <MultiRobotPanel />
          <MuJoCoPanel />
        </div>

        {/* Picture-in-Picture Camera View */}
        <PictureInPicture position="top-left" />

        {/* Grid Background Effect */}
        <div className="grid-bg" />
      </main>

      {/* Status Bar */}
      <StatusBar />
    </div>
  );
}

export default App;
