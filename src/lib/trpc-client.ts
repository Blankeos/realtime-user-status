import { publicConfig } from '@/config.public';
import type { AppRouter } from '@/server/_app';
import { createTRPCClient, createWSClient, httpBatchLink, wsLink } from '@trpc/client';

function getWSClient() {
  if (typeof window === 'undefined') return [];

  const wsClient = createWSClient({
    url: publicConfig.WEBSOCKET_ORIGIN,
    // url: `${publicConfig.NODE_ENV === 'development' ? 'ws://localhost:3001/ws' : publicConfig.WEBSOCKET_ORIGIN}`,
  });

  return [wsLink({ client: wsClient })];
}

/**
 * A regular TRPC Client that can be used in the browser.
 *
 * Not recommended to use in SSR. Use initTRPCSSRClient instead.
 */
export const trpcClient = createTRPCClient<AppRouter>({
  links: [
    // No batching:
    // httpLink({
    // url: `${publicConfig.BASE_ORIGIN}/api`
    // }),

    // With batching:
    httpBatchLink({ url: `${publicConfig.BASE_ORIGIN}/api` }),
  ],
});

export const trpcWSClient = createTRPCClient<AppRouter>({
  links: [...getWSClient()],
});
