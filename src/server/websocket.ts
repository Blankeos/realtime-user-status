// ===========================================================================
// Websockets are pretty simple:
// 1. There's an upgrade mechanism from the regular FETCH (GET).
//
// 2. There's then a handling mechanism for the WebSocket.
// ===========================================================================

import { Hono } from 'hono';
import { createBunWebSocket } from 'hono/bun';
import { createBunWSHandler } from 'trpc-bun-adapter';
import { appRouter } from './_app';
// 1. Upgrade mechanism.
const { upgradeWebSocket } = createBunWebSocket();

/**
 * You can set this with `app.route("/ws", wsRouter)` later on.
 */
const wsRouter = new Hono();

wsRouter.get(
  '/',
  upgradeWebSocket((c) => {
    // This handler doesn't matter because we're not using the `websocket` from `createBunWebsocket`.
    // We'll be using a custom one below.
    return {};
  })
);

// 2. Websocket handling mechanism

/**
 * This is the handler you pass in `Bun.serve` or `export default { websocket }`
 */
const websocket = createBunWSHandler({
  router: appRouter,
  createContext(params) {},
  onError: console.error,
});

export { websocket, wsRouter };

// ---- WS WSS Server ----

// console.log('✅ WebSocket Server listening on ws://localhost:3001');

// // ---- Bun WSS Server ----

// import { applyWSSHandler } from '@trpc/server/adapters/ws';
// import { Hono } from 'hono';
// import { createBunWebSocket } from 'hono/bun';
// // import { createBunWebSocket } from 'hono/bun';
// const { upgradeWebSocket, websocket } = createBunWebSocket();

// // ----

// import ws from "ws";
// import { appRouter } from './_app';

// const wss = new ws.Server({
//   noServer: true
// });
// const handler = applyWSSHandler({
//   wss,
//   router: appRouter,
//   // @ts-ignore
//   createContext,
//   // Enable heartbeat messages to keep connection open (disabled by default)
//   keepAlive: {
//     enabled: true,
//     // server ping message interval in milliseconds
//     pingMs: 30000,
//     // connection is terminated if pong message is not received in this many milliseconds
//     pongWaitMs: 5000,
//   },
// });

// // ----

// const wsRouter = new Hono();

// wsRouter.get(
//   '/',
//   upgradeWebSocket((c) => {

//     return {
//       onOpen(evt, ws) {

//       },
//       onClose(evt, ws) {

//       },
//       onError(evt, ws) {

//       },
//       onMessage(evt, ws) {

//       },
//     }
//     // return createBunWSHandler({
//     //   router: appRouter,
//     //   onError: console.error,
//     // });
//   })
// );
// // const websocket = createBunWSHandler({
// //   router: appRouter,
// //   createContext(opts) {
// //     console.log(opts);
// //   },
// //   onError: console.error,
// //   // createContext(params) {
// //   //   return createContext(params.client, )
// //   // },
// // });

// // export { websocket };

// // })

// // export { websocket, wsRouter };

// //

// /**
// const socket = new WebSocket('ws://localhost:3000/ws');

// // Event handler for when the connection is established
// socket.onopen = function(event) {
//     console.log("OPEN");
//     socket.send('WebSocket is open now.');
// };

// // Event handler for when a message is received from the server
// socket.onmessage = function(event) {
//     console.log('Message from server:', event.data);
// };

// // Event handler for when the connection is closed
// socket.onclose = function(event) {
//     console.log('WebSocket is closed now.');
// };

// // Event handler for when an error occurs
// socket.onerror = function(error) {
//     console.log('WebSocket error:', error);
// };

//  */

// // const websocket = createBunWSHandler({
// //   router: appRouter,
// //   // optional arguments:
// //   createContext: (opts) => {
// //     return createContext(opts.req , )
// //   },
// //   onError: console.error,
// //   allowBatching: true
// // });
// // // Replace 'ws://example.com/socket' with your WebSocket server URL

// // ---- WSS Server ----

// // import ws from 'ws';
// // const wss = new ws.Server({
// //   port: 3001,
// // });

// // const handler = applyWSSHandler({
// //   wss,
// //   router: appRouter,
// //   createContext: (opts) => {
// //     // @ts-ignore
// //     return createContext(opts.req, opts.res);
// //   },
// //   // Enable heartbeat messages to keep connection open (disabled by default)
// //   keepAlive: {
// //     enabled: true,
// //     // server ping message interval in milliseconds
// //     pingMs: 30000,
// //     // connection is terminated if pong message is not received in this many milliseconds
// //     pongWaitMs: 5000,
// //   },
// // });

// // wss.on('connection', (ws) => {
// //   console.log(`➕➕ Connection (${wss.clients.size})`);
// //   ws.once('close', () => {
// //     console.log(`➖➖ Connection (${wss.clients.size})`);
// //   });
// // });

// // console.log('✅ WebSocket Server listening on ws://localhost:3001');
// // process.on('SIGTERM', () => {
// //   console.log('SIGTERM');
// //   handler.broadcastReconnectNotification();
// //   wss.close();
// // });
