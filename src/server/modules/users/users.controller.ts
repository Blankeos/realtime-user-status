import { userDAO } from '@/server/dao/users.dao';
import { UserStatus } from '@/server/db/enums';
import { eventEmitter, protectedProcedure, publicProcedure, router } from '@/server/trpc';
import { observable } from '@trpc/server/observable';
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

  onChangeStatus: publicProcedure.subscription(() => {
    type ChangeStatusPayload = Awaited<ReturnType<typeof userDAO.user.changeStatus>>;

    // return an `observable` with a callback which is triggered immediately
    return observable<ChangeStatusPayload>((emit) => {
      const onAdd = (data: ChangeStatusPayload) => {
        console.log('On add called.....');
        // emit data to client
        emit.next(data);
      };
      console.log('listeners before', eventEmitter.listeners('changeStatus'));
      // trigger `onAdd()` when `add` is triggered in our event emitter
      eventEmitter.on('changeStatus', onAdd);
      console.log('listeners after', eventEmitter.listeners('changeStatus'));
      // unsubscribe function when client disconnects or stops subscribing
      return () => {
        eventEmitter.off('changeStatus', onAdd);
      };
    });
  }),
  changeStatus: protectedProcedure
    .input(
      z.object({
        status: z.nativeEnum(UserStatus),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const updatedUser = await userDAO.user.changeStatus(ctx.user?.id!, input.status);

      const hasListeners = eventEmitter.emit('changeStatus', updatedUser);

      console.log(hasListeners, 'has listeners.');

      return updatedUser;
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
