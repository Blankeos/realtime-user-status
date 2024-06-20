import { userDAO } from '@/server/dao/users.dao';
import { UserStatus } from '@/server/db/enums';
import { protectedProcedure, router } from '@/server/trpc';
import { z } from 'zod';

export const usersRouter = router({
  allUsers: protectedProcedure.query(async ({ ctx }) => {
    const users = await userDAO.user.findAll();

    const currentUserIndex = users.findIndex((user) => user.id === ctx.user?.id);
    if (currentUserIndex) {
      // Put the current user in front.
      return [
        users[currentUserIndex],
        ...users.slice(0, currentUserIndex), // Users before the current user ("Exclusive end" of currentUserIndex)
        ...users.slice(currentUserIndex + 1), // Users after the current user ("Exclusive start" of currentUserIndex because of + 1)
      ];
    }

    return users;
  }),

  changeStatus: protectedProcedure
    .input(
      z.object({
        status: z.nativeEnum(UserStatus),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return await userDAO.user.changeStatus(ctx.user?.id!, input.status);
    }),

  changeAvatarURL: protectedProcedure
    .input(
      z.object({
        url: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return await userDAO.user.updateAvatarUrl(ctx.user?.id!, input.url);
    }),
});
