import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  // A project page is served from a subpath, so the base has to be injected at
  // build time. Defaults to root for local dev and for host-managed deploys.
  base: process.env.VITE_BASE ?? '/',
  plugins: [react()],
  resolve: {
    // Resolved from this file, not the working directory — a host that invokes
    // the build from anywhere else would otherwise fail to resolve '@'.
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  // Host and port match what hosted preview environments expect; both are
  // harmless locally.
  server: { host: '::', port: 8080 },
})
