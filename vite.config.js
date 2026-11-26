import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, globalThis.process?.cwd?.() || '.', '')
  const apiTarget = env.VITE_API_URL || 'http://localhost:8080'

  return {
    // O plugin do React transforma JSX; Tailwind processa as classes utilitárias no build.
    plugins: [react(), tailwindcss()],
    server: {
      proxy: {
        '/api': {
          target: apiTarget,
          changeOrigin: true,
        },
        '/actuator': {
          target: apiTarget,
          changeOrigin: true,
        },
      },
    },
  }
})
