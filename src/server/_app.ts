/**
 * This a minimal tRPC server
 */
import { authRouter } from './modules/auth/auth.controller';
import { usersRouter } from './modules/users/users.controller';
import { router } from './trpc';

export const appRouter = router({
  auth: authRouter,
  users: usersRouter,
});

// Export type router type signature, this is used by the client.
export type AppRouter = typeof appRouter;
