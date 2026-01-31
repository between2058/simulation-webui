import { create } from 'zustand';
import * as THREE from 'three';

export type CameraMode = 'orbit' | 'first-person' | 'follow';
export type SimulationState = 'idle' | 'running' | 'paused';

interface RobotState {
  position: THREE.Vector3;
  rotation: THREE.Euler;
  velocity: THREE.Vector3;
  isLoaded: boolean;
}

interface SimulationStore {
  // Camera
  cameraMode: CameraMode;
  setCameraMode: (mode: CameraMode) => void;

  // Simulation
  simulationState: SimulationState;
  setSimulationState: (state: SimulationState) => void;
  simulationSpeed: number;
  setSimulationSpeed: (speed: number) => void;

  // Robot
  robot: RobotState;
  setRobotPosition: (position: THREE.Vector3) => void;
  setRobotRotation: (rotation: THREE.Euler) => void;
  setRobotLoaded: (loaded: boolean) => void;

  // Scene
  sceneLoaded: boolean;
  setSceneLoaded: (loaded: boolean) => void;
  currentScene: string | null;
  setCurrentScene: (scene: string | null) => void;

  // UI
  showGrid: boolean;
  toggleGrid: () => void;
  showStats: boolean;
  toggleStats: () => void;
  showPathfinding: boolean;
  togglePathfinding: () => void;

  // Controls
  controlsEnabled: boolean;
  setControlsEnabled: (enabled: boolean) => void;
}

export const useSimulationStore = create<SimulationStore>((set) => ({
  // Camera
  cameraMode: 'orbit',
  setCameraMode: (mode) => set({ cameraMode: mode }),

  // Simulation
  simulationState: 'idle',
  setSimulationState: (state) => set({ simulationState: state }),
  simulationSpeed: 1,
  setSimulationSpeed: (speed) => set({ simulationSpeed: speed }),

  // Robot
  robot: {
    position: new THREE.Vector3(0, 0, 0),
    rotation: new THREE.Euler(0, 0, 0),
    velocity: new THREE.Vector3(0, 0, 0),
    isLoaded: false,
  },
  setRobotPosition: (position) =>
    set((state) => ({ robot: { ...state.robot, position } })),
  setRobotRotation: (rotation) =>
    set((state) => ({ robot: { ...state.robot, rotation } })),
  setRobotLoaded: (loaded) =>
    set((state) => ({ robot: { ...state.robot, isLoaded: loaded } })),

  // Scene
  sceneLoaded: false,
  setSceneLoaded: (loaded) => set({ sceneLoaded: loaded }),
  currentScene: null,
  setCurrentScene: (scene) => set({ currentScene: scene }),

  // UI
  showGrid: true,
  toggleGrid: () => set((state) => ({ showGrid: !state.showGrid })),
  showStats: true,
  toggleStats: () => set((state) => ({ showStats: !state.showStats })),
  showPathfinding: false,
  togglePathfinding: () => set((state) => ({ showPathfinding: !state.showPathfinding })),

  // Controls
  controlsEnabled: true,
  setControlsEnabled: (enabled) => set({ controlsEnabled: enabled }),
}));
