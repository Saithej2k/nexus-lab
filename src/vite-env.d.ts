/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Optional server route that returns an Analysis-shaped JSON document. */
  readonly VITE_NEXUS_ANALYSIS_ENDPOINT?: string
  /** Set for single-file builds so routing does not depend on the hosting path. */
  readonly VITE_HASH_ROUTER?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
