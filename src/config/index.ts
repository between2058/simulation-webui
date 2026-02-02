/**
 * Application Configuration
 *
 * Centralized configuration management for the simulation WebUI.
 * Supports environment variables for deployment flexibility.
 */

// MuJoCo Backend Configuration
export const MUJOCO_CONFIG = {
  // WebSocket URL for MuJoCo physics backend
  WS_URL: import.meta.env.VITE_MUJOCO_WS_URL || 'ws://localhost:8765/ws',
  // Default URL shown in UI (without /ws path)
  DEFAULT_URL: import.meta.env.VITE_MUJOCO_URL || 'ws://localhost:8765',
  // Reconnection delay in milliseconds
  RECONNECT_DELAY: Number(import.meta.env.VITE_MUJOCO_RECONNECT_DELAY) || 3000,
};

// Development Server Configuration
export const SERVER_CONFIG = {
  // Host for Vite dev server (0.0.0.0 for network access)
  HOST: import.meta.env.VITE_HOST || 'localhost',
  // Port for Vite dev server
  PORT: Number(import.meta.env.VITE_PORT) || 5173,
};

// Simulation Settings
export const SIMULATION_CONFIG = {
  // Maximum number of robots allowed
  MAX_ROBOTS: Number(import.meta.env.VITE_MAX_ROBOTS) || 8,
  // Default simulation speed
  DEFAULT_SPEED: Number(import.meta.env.VITE_DEFAULT_SPEED) || 1.0,
  // Maximum simulation speed
  MAX_SPEED: Number(import.meta.env.VITE_MAX_SPEED) || 3.0,
};

// UI Configuration
export const UI_CONFIG = {
  // Application version
  VERSION: import.meta.env.VITE_APP_VERSION || '1.0.0',
  // Application title
  TITLE: import.meta.env.VITE_APP_TITLE || 'RoboDog Simulation',
};

// Helper function to build WebSocket URL
export function buildWsUrl(host: string, port: number, path: string = '/ws'): string {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${host}:${port}${path}`;
}

// Helper to get current config summary
export function getConfigSummary() {
  return {
    mujoco: MUJOCO_CONFIG,
    server: SERVER_CONFIG,
    simulation: SIMULATION_CONFIG,
    ui: UI_CONFIG,
  };
}
