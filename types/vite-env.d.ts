/// <reference types="vite/client" />

declare global {
  interface ImportMetaEnv {
  readonly VITE_ROOT_DOMAINS?: string;
  readonly VITE_PREVIEW_DOMAIN?: string;
  readonly VITE_USE_SUBDOMAINS?: string | boolean;
  readonly VITE_PROTOCOL?: string;
}

  interface ImportMeta {
  readonly env: ImportMetaEnv;
  }
}
export {};
