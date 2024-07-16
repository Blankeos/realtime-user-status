// ===========================================================================
// Websockets are pretty simple:
// 1. There's an upgrade mechanism from the regular FETCH (GET).
//
// 2. There's then a handling mechanism for the WebSocket.
// ===========================================================================

import { serve } from '@hono/node-server';
import { applyWSSHandler } from '@trpc/server/adapters/ws';
import { WebSocketServer } from 'ws';
import { appRouter } from './_app';

export function attachWebsocketHandler(server: ReturnType<typeof serve>) {
  const wss = new WebSocketServer({ server: server as any });

  const handler = applyWSSHandler({
    wss,
    router: appRouter,
    /** @ts-ignore */
    createContext: () => {},
    // Enable heartbeat messages to keep connection open (disabled by default)
    keepAlive: {
      enabled: true,
      // server ping message interval in milliseconds
      pingMs: 30000,
      // connection is terminated if pong message is not received in this many milliseconds
      pongWaitMs: 5000,
    },
  });

  wss.on('connection', (ws) => {
    console.log(`➕➕ Connection (${wss.clients.size})`);
    ws.once('close', () => {
      console.log(`➖➖ Connection (${wss.clients.size})`);
    });
  });
  console.log('✅ WebSocket Server listening on ws://localhost:3000');
  process.on('SIGTERM', () => {
    console.log('SIGTERM');
    handler.broadcastReconnectNotification();
    wss.close();
  });
}
