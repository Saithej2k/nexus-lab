import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

export default defineConfig({
  // A project page is served from a subpath, so the base has to be injected at
  // build time. Defaults to root for local dev and for host-managed deploys.
  base: process.env.VITE_BASE ?? '/',
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(process.cwd(), './src') },
  },
  // Host and port match what hosted preview environments expect; both are
  // harmless locally.
  server: { host: '::', port: 8080 },
})
