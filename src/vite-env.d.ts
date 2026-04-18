/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_N8N_BASE_URL: string;
  readonly VITE_N8N_SHARED_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
