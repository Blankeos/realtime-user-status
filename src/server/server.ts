//
// How to serve Vike (SSR middleware) via a Hono server.
// https://github.com/phonzammi/vike-hono-example/blob/main/server/index.ts
import { privateConfig } from '@/config.private';
import { trpcServer } from '@hono/trpc-server';
import { Hono } from 'hono';
import { serveStatic } from 'hono/bun';

import { renderPage } from 'vike/server';
import type { ViteDevServer } from 'vite';
import { appRouter } from './_app';
import { createContext } from './context';
import { connectToWeb } from './utils/connect-to-web';
import { websocket, wsRouter } from './websocket';

const app = new Hono();

// Health checks
app.get('/up', async (c) => {
  return c.newResponse('🟢 UP', { status: 200 });
});

// For the Backend APIs
app.use(
  '/api/*',
  trpcServer({
    router: appRouter,
    createContext(opts, c) {
      return createContext(c);
    },
  })
);

// In prod, use the attached websocket.
app.route('/ws', wsRouter);

if (privateConfig.NODE_ENV === 'production') {
  // In prod, serve static files.
  app.use(
    '/*',
    serveStatic({
      root: `./dist/client/`,
    })
  );
}
// In development, attach the vite middleware.
else {
  console.log('In development');
  let vite: ViteDevServer;
  const { createServer } = await import('vite');
  vite = await createServer({
    server: { middlewareMode: true },
    appType: 'custom',
    base: '/',
  });

  app.use(async (c, next) => {
    const handler = connectToWeb(vite.middlewares);

    const response = await handler(c.req.raw);

    if (response) {
      return response;
    }
    // If not handled by Vike, continue to next middleware
    await next();
  });
}

// For the Frontend + SSR
app.get('*', async (c, next) => {
  const pageContextInit = {
    urlOriginal: c.req.url,
    request: c.req,
    response: c.res,
  };
  const pageContext = await renderPage(pageContextInit);
  const { httpResponse } = pageContext;
  if (!httpResponse) {
    return next();
  } else {
    const { body, statusCode, headers } = httpResponse;
    headers.forEach(([name, value]) => c.header(name, value));
    c.status(statusCode);

    return c.body(body);
  }
});

// Returning errors.
app.onError((_, c) => {
  const errorMessage = 'Error: ' + c.error?.message || 'Something went wrong';
  console.log(errorMessage);
  return c.json(
    {
      error: {
        message: errorMessage,
      },
    },
    500
  );
});

const server = Bun.serve({
  fetch: app.fetch,
  port: privateConfig.PORT,
  websocket: websocket,
});

// if (privateConfig.NODE_ENV === 'production') {
//   const server = Bun.serve({
//     fetch: app.fetch,
//     port: privateConfig.PORT,
//     websocket: websocket,
//   });
//   console.log(`Running at ${server.url}`);
// }

// export default {
//   fetch: app.fetch,
//   port: privateConfig.PORT,
//   websocket: privateConfig.NODE_ENV === 'production' ? websocket : undefined,
// } as Serve;
