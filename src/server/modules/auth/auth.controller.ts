import { lucia } from '@/server/lucia';
import { authedProcedure, eventEmitter, publicProcedure, router } from '@/server/trpc';
import { observable } from '@trpc/server/observable';
import { User } from 'lucia';
import { z } from 'zod';
import { login } from './services/login.service';
import { register } from './services/register.service';

export const authRouter = router({
  currentUser: authedProcedure.query(async ({ ctx }) => {
    return {
      user: ctx.user,
      session: ctx.session,
    };
  }),
  login: authedProcedure
    .input(
      z.object({
        username: z.string(),
        password: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { userId, sessionCookie } = await login({
        username: input.username,
        password: input.password,
      });

      // use `header()` instead of setCookie to avoid TS errors
      ctx.honoContext.header('Set-Cookie', sessionCookie.serialize(), {
        append: true,
      });

      return {
        user: {
          id: userId,
          username: input.username,
        },
      };
    }),
  logout: authedProcedure.query(async ({ ctx, input }) => {
    if (ctx.session) {
      await lucia.invalidateSession(ctx.session.id);
    }

    return {
      success: true,
    };
  }),
  register: publicProcedure
    .input(
      z.object({
        username: z.string(),
        password: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { userId, user, sessionCookie } = await register({
        username: input.username,
        password: input.password,
      });

      eventEmitter.emit('userJoined', user);

      // use `header()` instead of setCookie to avoid TS errors
      ctx.honoContext.header('Set-Cookie', sessionCookie.serialize(), {
        append: true,
      });

      return {
        user: {
          id: userId,
          username: input.username,
        },
      };
    }),
  onUserJoined: publicProcedure.subscription(() => {
    // return an `observable` with a callback which is triggered immediately
    return observable<User>((emit) => {
      const onJoin = (data: User) => {
        emit.next(data);
      };
      // subscribe
      eventEmitter.on('userJoined', onJoin);
      // unsubscribe
      return () => {
        eventEmitter.off('userJoined', onJoin);
      };
    });
  }),
});
