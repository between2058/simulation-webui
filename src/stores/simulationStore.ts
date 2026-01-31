import { create } from 'zustand';
import * as THREE from 'three';

export type CameraMode = 'orbit' | 'first-person' | 'follow';
export type SimulationState = 'idle' | 'running' | 'paused';
export type EditorMode = 'simulate' | 'edit' | 'patrol';
export type ObstacleType = 'box' | 'cylinder';
export type TerrainType = 'normal' | 'rough' | 'slippery' | 'slow';

interface RobotState {
  position: THREE.Vector3;
  rotation: THREE.Euler;
  velocity: THREE.Vector3;
  isLoaded: boolean;
}

// Waypoint for patrol mode
export interface WaypointData {
  id: string;
  position: [number, number, number];
  waitTime?: number; // seconds to wait at waypoint
}

// Mission statistics
export interface MissionStats {
  distanceTraveled: number;
  timeElapsed: number;
  collisionCount: number;
  waypointsReached: number;
  startTime: number | null;
  isRecording: boolean;
}

// Terrain zone
export interface TerrainZoneData {
  id: string;
  position: [number, number, number];
  radius: number;
  type: TerrainType;
  speedMultiplier: number; // 0.0 - 1.0
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
  showLidar: boolean;
  toggleLidar: () => void;

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

  // Patrol / Waypoints
  waypoints: WaypointData[];
  currentWaypointIndex: number;
  patrolLoop: boolean;
  addWaypoint: (waypoint: WaypointData) => void;
  removeWaypoint: (id: string) => void;
  clearWaypoints: () => void;
  setCurrentWaypointIndex: (index: number) => void;
  setPatrolLoop: (loop: boolean) => void;

  // Mission Statistics
  missionStats: MissionStats;
  startMission: () => void;
  stopMission: () => void;
  updateMissionStats: (updates: Partial<MissionStats>) => void;
  resetMissionStats: () => void;
  incrementCollision: () => void;
  incrementWaypointReached: () => void;
  addDistance: (distance: number) => void;

  // Terrain Zones
  terrainZones: TerrainZoneData[];
  selectedTerrainId: string | null;
  setSelectedTerrainId: (id: string | null) => void;
  addTerrainZone: (zone: TerrainZoneData) => void;
  removeTerrainZone: (id: string) => void;
  clearTerrainZones: () => void;

  // Scene Import/Export
  exportScene: () => string;
  importScene: (json: string) => boolean;
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
  showLidar: true,
  toggleLidar: () => set((state) => ({ showLidar: !state.showLidar })),

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

  // Patrol / Waypoints
  waypoints: [],
  currentWaypointIndex: 0,
  patrolLoop: true,
  addWaypoint: (waypoint) =>
    set((state) => ({ waypoints: [...state.waypoints, waypoint] })),
  removeWaypoint: (id) =>
    set((state) => ({
      waypoints: state.waypoints.filter((w) => w.id !== id),
      currentWaypointIndex: Math.min(state.currentWaypointIndex, Math.max(0, state.waypoints.length - 2)),
    })),
  clearWaypoints: () => set({ waypoints: [], currentWaypointIndex: 0 }),
  setCurrentWaypointIndex: (index) => set({ currentWaypointIndex: index }),
  setPatrolLoop: (loop) => set({ patrolLoop: loop }),

  // Mission Statistics
  missionStats: {
    distanceTraveled: 0,
    timeElapsed: 0,
    collisionCount: 0,
    waypointsReached: 0,
    startTime: null,
    isRecording: false,
  },
  startMission: () =>
    set((state) => ({
      missionStats: {
        ...state.missionStats,
        startTime: Date.now(),
        isRecording: true,
      },
    })),
  stopMission: () =>
    set((state) => ({
      missionStats: {
        ...state.missionStats,
        isRecording: false,
        timeElapsed: state.missionStats.startTime
          ? (Date.now() - state.missionStats.startTime) / 1000
          : state.missionStats.timeElapsed,
      },
    })),
  updateMissionStats: (updates) =>
    set((state) => ({
      missionStats: { ...state.missionStats, ...updates },
    })),
  resetMissionStats: () =>
    set({
      missionStats: {
        distanceTraveled: 0,
        timeElapsed: 0,
        collisionCount: 0,
        waypointsReached: 0,
        startTime: null,
        isRecording: false,
      },
    }),
  incrementCollision: () =>
    set((state) => ({
      missionStats: {
        ...state.missionStats,
        collisionCount: state.missionStats.collisionCount + 1,
      },
    })),
  incrementWaypointReached: () =>
    set((state) => ({
      missionStats: {
        ...state.missionStats,
        waypointsReached: state.missionStats.waypointsReached + 1,
      },
    })),
  addDistance: (distance) =>
    set((state) => ({
      missionStats: {
        ...state.missionStats,
        distanceTraveled: state.missionStats.distanceTraveled + distance,
      },
    })),

  // Terrain Zones - default zones for demo
  terrainZones: [
    { id: 'terrain1', position: [4, 0, 4], radius: 2, type: 'rough' as TerrainType, speedMultiplier: 0.6 },
    { id: 'terrain2', position: [-4, 0, -4], radius: 1.5, type: 'slippery' as TerrainType, speedMultiplier: 1.3 },
    { id: 'terrain3', position: [0, 0, 6], radius: 2.5, type: 'slow' as TerrainType, speedMultiplier: 0.4 },
  ],
  selectedTerrainId: null,
  setSelectedTerrainId: (id) => set({ selectedTerrainId: id }),
  addTerrainZone: (zone) =>
    set((state) => ({ terrainZones: [...state.terrainZones, zone] })),
  removeTerrainZone: (id) =>
    set((state) => ({
      terrainZones: state.terrainZones.filter((z) => z.id !== id),
      selectedTerrainId: state.selectedTerrainId === id ? null : state.selectedTerrainId,
    })),
  clearTerrainZones: () => set({ terrainZones: [], selectedTerrainId: null }),

  // Scene Import/Export
  exportScene: (): string => {
    const currentState = useSimulationStore.getState() as SimulationStore;
    const sceneData: { version: string; obstacles: ObstacleData[]; waypoints: WaypointData[]; patrolLoop: boolean; terrainZones: TerrainZoneData[] } = {
      version: '1.0',
      obstacles: currentState.obstacles,
      waypoints: currentState.waypoints,
      patrolLoop: currentState.patrolLoop,
      terrainZones: currentState.terrainZones,
    };
    return JSON.stringify(sceneData, null, 2);
  },
  importScene: (json) => {
    try {
      const data = JSON.parse(json);
      if (data.version && data.obstacles) {
        set({
          obstacles: data.obstacles || [],
          waypoints: data.waypoints || [],
          patrolLoop: data.patrolLoop ?? true,
          terrainZones: data.terrainZones || [],
          currentWaypointIndex: 0,
        });
        return true;
      }
      return false;
    } catch {
      return false;
    }
  },
}));
