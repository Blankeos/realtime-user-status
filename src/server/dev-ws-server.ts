/**
 * A Bun WebSocket server for development ONLY.
 *
 * Motivation: Since we're using Vite for the backend as well (@hono/vite-dev-server),
 * it conflicts with HMR (which also runs on websockets). Current workaround
 * is to run a separate websocket server during development.
 */

import { Hono } from 'hono';
import { websocket, wsRouter } from './websocket';

const app = new Hono();

app.route('/ws', wsRouter);

Bun.serve({
  fetch: app.fetch,
  port: 3001,
  websocket: websocket,
});
