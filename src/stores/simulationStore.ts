import { create } from 'zustand';
import * as THREE from 'three';

export type CameraMode = 'orbit' | 'first-person' | 'follow';
export type SimulationState = 'idle' | 'running' | 'paused';
export type EditorMode = 'simulate' | 'edit';
export type ObstacleType = 'box' | 'cylinder';

interface RobotState {
  position: THREE.Vector3;
  rotation: THREE.Euler;
  velocity: THREE.Vector3;
  isLoaded: boolean;
}

export interface ObstacleData {
  id: string;
  position: [number, number, number];
  size: [number, number, number];
  type: ObstacleType;
  color?: string;
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

  // Editor
  editorMode: EditorMode;
  setEditorMode: (mode: EditorMode) => void;
  selectedObstacleId: string | null;
  setSelectedObstacleId: (id: string | null) => void;
  placementType: ObstacleType;
  setPlacementType: (type: ObstacleType) => void;

  // Obstacles
  obstacles: ObstacleData[];
  addObstacle: (obstacle: ObstacleData) => void;
  removeObstacle: (id: string) => void;
  updateObstacle: (id: string, updates: Partial<ObstacleData>) => void;
  resetObstacles: () => void;
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

  // Editor
  editorMode: 'simulate',
  setEditorMode: (mode) => set({ editorMode: mode }),
  selectedObstacleId: null,
  setSelectedObstacleId: (id) => set({ selectedObstacleId: id }),
  placementType: 'box',
  setPlacementType: (type) => set({ placementType: type }),

  // Obstacles - default obstacles
  obstacles: [
    { id: 'obs1', position: [3, 0.5, 0], size: [1, 1, 1], type: 'box' },
    { id: 'obs2', position: [-3, 0.5, 2], size: [1.5, 1, 1.5], type: 'box' },
    { id: 'obs3', position: [0, 0.5, -4], size: [2, 1, 0.5], type: 'box' },
    { id: 'obs4', position: [5, 0.75, 3], size: [0.5, 1.5, 0.5], type: 'cylinder' },
    { id: 'obs5', position: [-4, 0.75, -3], size: [0.5, 1.5, 0.5], type: 'cylinder' },
    { id: 'obs6', position: [2, 0.5, 5], size: [3, 1, 0.5], type: 'box' },
    { id: 'obs7', position: [-2, 0.5, -2], size: [0.8, 1, 0.8], type: 'box' },
  ],
  addObstacle: (obstacle) =>
    set((state) => ({ obstacles: [...state.obstacles, obstacle] })),
  removeObstacle: (id) =>
    set((state) => ({
      obstacles: state.obstacles.filter((o) => o.id !== id),
      selectedObstacleId: state.selectedObstacleId === id ? null : state.selectedObstacleId,
    })),
  updateObstacle: (id, updates) =>
    set((state) => ({
      obstacles: state.obstacles.map((o) =>
        o.id === id ? { ...o, ...updates } : o
      ),
    })),
  resetObstacles: () =>
    set({
      obstacles: [
        { id: 'obs1', position: [3, 0.5, 0], size: [1, 1, 1], type: 'box' },
        { id: 'obs2', position: [-3, 0.5, 2], size: [1.5, 1, 1.5], type: 'box' },
        { id: 'obs3', position: [0, 0.5, -4], size: [2, 1, 0.5], type: 'box' },
        { id: 'obs4', position: [5, 0.75, 3], size: [0.5, 1.5, 0.5], type: 'cylinder' },
        { id: 'obs5', position: [-4, 0.75, -3], size: [0.5, 1.5, 0.5], type: 'cylinder' },
        { id: 'obs6', position: [2, 0.5, 5], size: [3, 1, 0.5], type: 'box' },
        { id: 'obs7', position: [-2, 0.5, -2], size: [0.8, 1, 0.8], type: 'box' },
      ],
      selectedObstacleId: null,
    }),
}));
