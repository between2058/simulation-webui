/// <reference types="vite/client" />

interface ImportMetaEnv {
  // Server Configuration
  readonly VITE_HOST: string;
  readonly VITE_PORT: string;
  readonly VITE_PREVIEW_PORT: string;

  // MuJoCo Backend Configuration
  readonly VITE_MUJOCO_WS_URL: string;
  readonly VITE_MUJOCO_URL: string;
  readonly VITE_MUJOCO_RECONNECT_DELAY: string;

  // Simulation Settings
  readonly VITE_MAX_ROBOTS: string;
  readonly VITE_DEFAULT_SPEED: string;
  readonly VITE_MAX_SPEED: string;

  // Application Settings
  readonly VITE_APP_VERSION: string;
  readonly VITE_APP_TITLE: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
