import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  // O plugin do React transforma JSX; Tailwind processa as classes utilitárias no build.
  plugins: [react(), tailwindcss()],
})
