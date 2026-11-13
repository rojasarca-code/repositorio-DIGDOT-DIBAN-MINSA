  base: process.env.VITE_BASE || '/digdot-diban-supervision/',
  // Compatible con celulares y tablets de hace varios años (iOS 13+, Android 7+).
  build: { target: 'es2019' },
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
// La ruta base depende del nombre del repositorio de GitHub Pages; el workflow
// la entrega en VITE_BASE (p. ej. "/repositorio-DIGDOT-DIBAN-MINSA/").
export default defineConfig({
  plugins: [react()],
  base: process.env.VITE_BASE || '/digdot-diban-supervision/',
  // Compatible con celulares y tablets de hace varios años (iOS 13+, Android 7+).
  build: { target: 'es2019' },
})
