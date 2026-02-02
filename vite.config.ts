import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react()],
    server: {
      // Host: use 0.0.0.0 to allow network access
      host: env.VITE_HOST || 'localhost',
      // Port: customize via environment variable
      port: Number(env.VITE_PORT) || 5173,
      // Strict port: fail if port is already in use
      strictPort: false,
    },
    preview: {
      // Same settings for preview server
      host: env.VITE_HOST || 'localhost',
      port: Number(env.VITE_PREVIEW_PORT) || 4173,
    },
  }
})
