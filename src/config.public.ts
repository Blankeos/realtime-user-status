/** Only place public configurations here. (Available on the browser) */
export const publicConfig = {
  NODE_ENV: import.meta.env.MODE as 'development' | 'production',
  BASE_ORIGIN: import.meta.env.PUBLIC_ENV__BASE_ORIGIN || 'http://localhost:3000',

  /**
   * Force using ws://localhost:3001/ws in development.
   * Websockets must be a separate server in Vite dev because of HMR.
   */
  WEBSOCKET_ORIGIN: import.meta.env.PUBLIC_ENV__WEBSOCKET_ORIGIN ?? 'ws://localhost:3001',
};
