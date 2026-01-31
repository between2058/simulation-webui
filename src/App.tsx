import { Header, ControlPanel, StatusBar } from './components/UI';
import { SimulationCanvas } from './components/Scene';
import './styles/global.css';

function App() {
  return (
    <div className="app-container">
      {/* Header */}
      <Header />

      {/* Main Content */}
      <main className="canvas-container">
        {/* 3D Canvas */}
        <SimulationCanvas />

        {/* Control Panel Overlay */}
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
