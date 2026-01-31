import { Header, ControlPanel, StatusBar, ScenePanel } from './components/UI';
import { SimulationCanvas } from './components/Scene';
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
