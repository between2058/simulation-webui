import { create } from 'zustand';
import * as THREE from 'three';

export type CameraMode = 'orbit' | 'first-person' | 'follow';
export type SimulationState = 'idle' | 'running' | 'paused';
export type EditorMode = 'simulate' | 'edit' | 'patrol';
export type ObstacleType = 'box' | 'cylinder';
export type TerrainType = 'normal' | 'rough' | 'slippery' | 'slow';
export type FormationMode = 'none' | 'line' | 'wedge' | 'circle' | 'spread';
export type PatrolMode = 'single' | 'distributed';

// Multi-robot state
export interface RobotInstance {
  id: string;
  name: string;
  position: THREE.Vector3;
  rotation: THREE.Euler;
  velocity: THREE.Vector3;
  isLoaded: boolean;
  color: string;
  isLeader: boolean;
  targetWaypointIndex: number;
  assignedWaypoints: string[]; // for distributed patrol
}

interface RobotState {
  position: THREE.Vector3;
  rotation: THREE.Euler;
  velocity: THREE.Vector3;
  isLoaded: boolean;
}

// Imported GLB model
export interface ImportedModel {
  id: string;
  name: string;
  url: string;
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  boundingBox: {
    min: [number, number, number];
    max: [number, number, number];
  };
  enableCollision: boolean;
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
  isPaused: boolean;
  pausedTime: number; // accumulated paused time
}

// Saved mission history record
export interface MissionRecord {
  id: string;
  name: string;
  completedAt: number;
  duration: number; // seconds
  distanceTraveled: number;
  waypointsTotal: number;
  waypointsReached: number;
  collisionCount: number;
  robotCount: number;
  patrolMode: PatrolMode;
  formationMode: FormationMode;
  success: boolean; // all waypoints reached
  averageSpeed: number; // m/s
}

// Terrain zone
export interface TerrainZoneData {
  id: string;
  position: [number, number, number];
  radius: number;
  type: TerrainType;
  speedMultiplier: number; // 0.0 - 1.0
}

// Path recording point
export interface PathPoint {
  position: [number, number, number];
  rotation: number;
  timestamp: number;
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
  selectedWaypointId: string | null;
  addWaypoint: (waypoint: WaypointData) => void;
  removeWaypoint: (id: string) => void;
  updateWaypoint: (id: string, updates: Partial<WaypointData>) => void;
  clearWaypoints: () => void;
  setCurrentWaypointIndex: (index: number) => void;
  setPatrolLoop: (loop: boolean) => void;
  setSelectedWaypointId: (id: string | null) => void;

  // Mission Statistics
  missionStats: MissionStats;
  startMission: () => void;
  stopMission: () => void;
  pauseMission: () => void;
  resumeMission: () => void;
  updateMissionStats: (updates: Partial<MissionStats>) => void;
  resetMissionStats: () => void;
  incrementCollision: () => void;
  incrementWaypointReached: () => void;
  addDistance: (distance: number) => void;

  // Mission History
  missionHistory: MissionRecord[];
  saveMission: (name?: string) => void;
  deleteMission: (id: string) => void;
  clearMissionHistory: () => void;
  exportMissionReport: (format: 'json' | 'csv', missionIds?: string[]) => string;

  // Terrain Zones
  terrainZones: TerrainZoneData[];
  selectedTerrainId: string | null;
  setSelectedTerrainId: (id: string | null) => void;
  addTerrainZone: (zone: TerrainZoneData) => void;
  removeTerrainZone: (id: string) => void;
  clearTerrainZones: () => void;

  // Path Recording
  pathRecording: PathPoint[];
  isRecordingPath: boolean;
  isPlayingPath: boolean;
  playbackIndex: number;
  addPathPoint: (point: PathPoint) => void;
  startPathRecording: () => void;
  stopPathRecording: () => void;
  startPathPlayback: () => void;
  stopPathPlayback: () => void;
  setPlaybackIndex: (index: number) => void;
  clearPathRecording: () => void;

  // Scene Import/Export
  exportScene: () => string;
  importScene: (json: string) => boolean;

  // Imported GLB Models
  importedModels: ImportedModel[];
  selectedModelId: string | null;
  addImportedModel: (model: ImportedModel) => void;
  removeImportedModel: (id: string) => void;
  updateImportedModel: (id: string, updates: Partial<ImportedModel>) => void;
  setSelectedModelId: (id: string | null) => void;
  clearImportedModels: () => void;

  // Multi-Robot
  robots: RobotInstance[];
  selectedRobotId: string | null;
  formationMode: FormationMode;
  patrolMode: PatrolMode;
  formationSpacing: number;
  addRobot: (robot?: Partial<RobotInstance>) => string;
  removeRobot: (id: string) => void;
  updateRobot: (id: string, updates: Partial<RobotInstance>) => void;
  setSelectedRobotId: (id: string | null) => void;
  setFormationMode: (mode: FormationMode) => void;
  setPatrolMode: (mode: PatrolMode) => void;
  setFormationSpacing: (spacing: number) => void;
  setRobotAsLeader: (id: string) => void;
  getRobotById: (id: string) => RobotInstance | undefined;
  distributeWaypoints: () => void;

  // Picture-in-Picture
  showPiP: boolean;
  togglePiP: () => void;
  pipRobotId: string | null;
  setPipRobotId: (id: string | null) => void;
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
  selectedWaypointId: null,
  addWaypoint: (waypoint) =>
    set((state) => ({ waypoints: [...state.waypoints, waypoint] })),
  removeWaypoint: (id) =>
    set((state) => ({
      waypoints: state.waypoints.filter((w) => w.id !== id),
      currentWaypointIndex: Math.min(state.currentWaypointIndex, Math.max(0, state.waypoints.length - 2)),
      selectedWaypointId: state.selectedWaypointId === id ? null : state.selectedWaypointId,
    })),
  updateWaypoint: (id, updates) =>
    set((state) => ({
      waypoints: state.waypoints.map((w) =>
        w.id === id ? { ...w, ...updates } : w
      ),
    })),
  clearWaypoints: () => set({ waypoints: [], currentWaypointIndex: 0, selectedWaypointId: null }),
  setCurrentWaypointIndex: (index) => set({ currentWaypointIndex: index }),
  setPatrolLoop: (loop) => set({ patrolLoop: loop }),
  setSelectedWaypointId: (id) => set({ selectedWaypointId: id }),

  // Mission Statistics
  missionStats: {
    distanceTraveled: 0,
    timeElapsed: 0,
    collisionCount: 0,
    waypointsReached: 0,
    startTime: null,
    isRecording: false,
    isPaused: false,
    pausedTime: 0,
  },
  startMission: () =>
    set((state) => ({
      missionStats: {
        ...state.missionStats,
        startTime: Date.now(),
        isRecording: true,
        isPaused: false,
        pausedTime: 0,
        distanceTraveled: 0,
        collisionCount: 0,
        waypointsReached: 0,
        timeElapsed: 0,
      },
    })),
  stopMission: () =>
    set((state) => {
      const now = Date.now();
      const elapsed = state.missionStats.startTime
        ? (now - state.missionStats.startTime - state.missionStats.pausedTime) / 1000
        : state.missionStats.timeElapsed;
      return {
        missionStats: {
          ...state.missionStats,
          isRecording: false,
          isPaused: false,
          timeElapsed: elapsed,
        },
      };
    }),
  pauseMission: () =>
    set((state) => ({
      missionStats: {
        ...state.missionStats,
        isPaused: true,
        // Store the pause start time in pausedTime temporarily
        pausedTime: state.missionStats.pausedTime - Date.now(),
      },
      simulationState: 'paused',
    })),
  resumeMission: () =>
    set((state) => ({
      missionStats: {
        ...state.missionStats,
        isPaused: false,
        // Add the paused duration
        pausedTime: state.missionStats.pausedTime + Date.now(),
      },
      simulationState: 'running',
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
        isPaused: false,
        pausedTime: 0,
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

  // Mission History
  missionHistory: [],
  saveMission: (name) =>
    set((state) => {
      const { missionStats, waypoints, robots, patrolMode, formationMode } = state;
      const duration = missionStats.timeElapsed;
      const record: MissionRecord = {
        id: `mission_${Date.now()}`,
        name: name || `Mission ${state.missionHistory.length + 1}`,
        completedAt: Date.now(),
        duration,
        distanceTraveled: missionStats.distanceTraveled,
        waypointsTotal: waypoints.length,
        waypointsReached: missionStats.waypointsReached,
        collisionCount: missionStats.collisionCount,
        robotCount: robots.length,
        patrolMode,
        formationMode,
        success: missionStats.waypointsReached >= waypoints.length,
        averageSpeed: duration > 0 ? missionStats.distanceTraveled / duration : 0,
      };
      return { missionHistory: [...state.missionHistory, record] };
    }),
  deleteMission: (id) =>
    set((state) => ({
      missionHistory: state.missionHistory.filter((m) => m.id !== id),
    })),
  clearMissionHistory: () => set({ missionHistory: [] }),
  exportMissionReport: (format, missionIds): string => {
    const state = useSimulationStore.getState();
    const missions = missionIds
      ? state.missionHistory.filter((m: MissionRecord) => missionIds.includes(m.id))
      : state.missionHistory;

    if (format === 'json') {
      return JSON.stringify({
        exportedAt: new Date().toISOString(),
        totalMissions: missions.length,
        missions: missions.map((m: MissionRecord) => ({
          ...m,
          completedAt: new Date(m.completedAt).toISOString(),
        })),
      }, null, 2);
    }

    // CSV format
    const headers = [
      'Name', 'Completed At', 'Duration (s)', 'Distance (m)',
      'Waypoints Reached', 'Waypoints Total', 'Collisions',
      'Robot Count', 'Patrol Mode', 'Formation', 'Success', 'Avg Speed (m/s)'
    ];
    const rows = missions.map((m: MissionRecord) => [
      m.name,
      new Date(m.completedAt).toISOString(),
      m.duration.toFixed(2),
      m.distanceTraveled.toFixed(2),
      m.waypointsReached,
      m.waypointsTotal,
      m.collisionCount,
      m.robotCount,
      m.patrolMode,
      m.formationMode,
      m.success ? 'Yes' : 'No',
      m.averageSpeed.toFixed(3),
    ]);
    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  },

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

  // Path Recording
  pathRecording: [],
  isRecordingPath: false,
  isPlayingPath: false,
  playbackIndex: 0,
  addPathPoint: (point) =>
    set((state) => ({ pathRecording: [...state.pathRecording, point] })),
  startPathRecording: () => set({ isRecordingPath: true, isPlayingPath: false }),
  stopPathRecording: () => set({ isRecordingPath: false }),
  startPathPlayback: () => set({ isPlayingPath: true, isRecordingPath: false, playbackIndex: 0 }),
  stopPathPlayback: () => set({ isPlayingPath: false }),
  setPlaybackIndex: (index) => set({ playbackIndex: index }),
  clearPathRecording: () => set({ pathRecording: [], playbackIndex: 0 }),

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

  // Imported GLB Models
  importedModels: [],
  selectedModelId: null,
  addImportedModel: (model) =>
    set((state) => ({ importedModels: [...state.importedModels, model] })),
  removeImportedModel: (id) =>
    set((state) => ({
      importedModels: state.importedModels.filter((m) => m.id !== id),
      selectedModelId: state.selectedModelId === id ? null : state.selectedModelId,
    })),
  updateImportedModel: (id, updates) =>
    set((state) => ({
      importedModels: state.importedModels.map((m) =>
        m.id === id ? { ...m, ...updates } : m
      ),
    })),
  setSelectedModelId: (id) => set({ selectedModelId: id }),
  clearImportedModels: () => set({ importedModels: [], selectedModelId: null }),

  // Multi-Robot - default with one robot
  robots: [
    {
      id: 'robot_1',
      name: 'Alpha',
      position: new THREE.Vector3(0, 0, 0),
      rotation: new THREE.Euler(0, 0, 0),
      velocity: new THREE.Vector3(0, 0, 0),
      isLoaded: false,
      color: '#00d4ff',
      isLeader: true,
      targetWaypointIndex: 0,
      assignedWaypoints: [],
    },
  ],
  selectedRobotId: 'robot_1',
  formationMode: 'none' as FormationMode,
  patrolMode: 'single' as PatrolMode,
  formationSpacing: 1.5,
  addRobot: (robotData) => {
    const id = `robot_${Date.now()}`;
    const robotColors = ['#00d4ff', '#ff6b6b', '#4ecdc4', '#ffe66d', '#95e1d3', '#f38181'];
    let newRobotId = id;
    set((state) => {
      const colorIndex = state.robots.length % robotColors.length;
      const existingNames = state.robots.map((r) => r.name);
      const greekLetters = ['Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon', 'Zeta', 'Eta', 'Theta'];
      let name = greekLetters[state.robots.length % greekLetters.length];
      let counter = 2;
      while (existingNames.includes(name)) {
        name = `${greekLetters[state.robots.length % greekLetters.length]}-${counter}`;
        counter++;
      }

      // Calculate spawn position based on existing robots
      const spawnOffset = state.robots.length * 1.5;
      const newRobot: RobotInstance = {
        id,
        name,
        position: new THREE.Vector3(spawnOffset, 0, 0),
        rotation: new THREE.Euler(0, 0, 0),
        velocity: new THREE.Vector3(0, 0, 0),
        isLoaded: false,
        color: robotColors[colorIndex],
        isLeader: state.robots.length === 0,
        targetWaypointIndex: 0,
        assignedWaypoints: [],
        ...robotData,
      };
      return { robots: [...state.robots, newRobot] };
    });
    return newRobotId;
  },
  removeRobot: (id) =>
    set((state) => {
      const filtered = state.robots.filter((r) => r.id !== id);
      // If removing leader, assign new leader
      if (filtered.length > 0 && state.robots.find((r) => r.id === id)?.isLeader) {
        filtered[0].isLeader = true;
      }
      return {
        robots: filtered,
        selectedRobotId: state.selectedRobotId === id ? (filtered[0]?.id || null) : state.selectedRobotId,
        pipRobotId: state.pipRobotId === id ? (filtered[0]?.id || null) : state.pipRobotId,
      };
    }),
  updateRobot: (id, updates) =>
    set((state) => ({
      robots: state.robots.map((r) => {
        if (r.id === id) {
          const updated = { ...r };
          if (updates.position) updated.position = updates.position;
          if (updates.rotation) updated.rotation = updates.rotation;
          if (updates.velocity) updated.velocity = updates.velocity;
          if (updates.isLoaded !== undefined) updated.isLoaded = updates.isLoaded;
          if (updates.color) updated.color = updates.color;
          if (updates.name) updated.name = updates.name;
          if (updates.isLeader !== undefined) updated.isLeader = updates.isLeader;
          if (updates.targetWaypointIndex !== undefined) updated.targetWaypointIndex = updates.targetWaypointIndex;
          if (updates.assignedWaypoints) updated.assignedWaypoints = updates.assignedWaypoints;
          return updated;
        }
        return r;
      }),
    })),
  setSelectedRobotId: (id) => set({ selectedRobotId: id }),
  setFormationMode: (mode) => set({ formationMode: mode }),
  setPatrolMode: (mode) => set({ patrolMode: mode }),
  setFormationSpacing: (spacing) => set({ formationSpacing: spacing }),
  setRobotAsLeader: (id) =>
    set((state) => ({
      robots: state.robots.map((r) => ({
        ...r,
        isLeader: r.id === id,
      })),
    })),
  getRobotById: (id): RobotInstance | undefined => {
    const state = useSimulationStore.getState();
    return state.robots.find((r: RobotInstance) => r.id === id);
  },
  distributeWaypoints: () =>
    set((state) => {
      const { robots, waypoints } = state;
      if (robots.length === 0 || waypoints.length === 0) return state;

      // Distribute waypoints evenly among robots
      const waypointsPerRobot = Math.ceil(waypoints.length / robots.length);
      const updatedRobots = robots.map((robot, index) => {
        const startIdx = index * waypointsPerRobot;
        const endIdx = Math.min(startIdx + waypointsPerRobot, waypoints.length);
        const assigned = waypoints.slice(startIdx, endIdx).map((w) => w.id);
        return {
          ...robot,
          assignedWaypoints: assigned,
          targetWaypointIndex: 0,
        };
      });

      return { robots: updatedRobots };
    }),

  // Picture-in-Picture
  showPiP: false,
  togglePiP: () => set((state) => ({ showPiP: !state.showPiP })),
  pipRobotId: 'robot_1',
  setPipRobotId: (id) => set({ pipRobotId: id }),
}));
