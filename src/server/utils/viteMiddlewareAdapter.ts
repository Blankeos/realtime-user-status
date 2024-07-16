import http from 'http';
import { Connect, ViteDevServer } from 'vite';

async function viteToHonoMiddleware(server: ViteDevServer): Promise<Connect.HandleFunction> {
  return async function (
    req: http.IncomingMessage,
    res: http.ServerResponse,
    next: Connect.NextFunction
  ): Promise<void> {};
}
