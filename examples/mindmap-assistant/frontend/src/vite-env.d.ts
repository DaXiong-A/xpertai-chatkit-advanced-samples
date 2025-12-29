/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_XPERTAI_API_URL: string;
  readonly VITE_XPERT_ID: string;
  readonly VITE_CHATKIT_FRAME_URL: string;
  readonly VITE_API_BASE_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
