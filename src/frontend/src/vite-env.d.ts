/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ENVIO_GRAPHQL_URL?: string;
  readonly VITE_MONAD_RPC_URL?: string;
  readonly VITE_PIMLICO_API_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
