import { BrowserRouter, HashRouter, Route, Routes } from 'react-router-dom'
import { NexusProvider } from '@/hooks/useNexus'
import { AppShell } from '@/components/nexus/AppShell'
import { NotFound } from '@/pages/NotFound'

/**
 * Path routing is correct for a normal deployment. A single-file build (one HTML
 * document served from an arbitrary path) opts into hash routing instead, so the
 * app still resolves its own route wherever it is hosted.
 */
const Router = import.meta.env.VITE_HASH_ROUTER ? HashRouter : BrowserRouter

export default function App() {
  return (
    <Router>
      <NexusProvider>
        <Routes>
          <Route path="/" element={<AppShell />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </NexusProvider>
    </Router>
  )
}
