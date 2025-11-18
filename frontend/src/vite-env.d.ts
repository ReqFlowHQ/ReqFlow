/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_API_BASE_URL?: string;
  // add other env vars here if you use more
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
