import { db } from '@/server/db/kysely';
import { UserStatus } from '../db/enums';

export const userDAO = {
  user: {
    findAll: async () => {
      const users = await db
        .selectFrom('User')
        .select([
          'User.id',
          'status',
          'username',
          'avatarURL',
          'lastUpdatedStatusTimestamp',
          'createdTimestamp',
          'updatedTimestamp',
        ])
        .execute();

      return users ?? [];
    },

    changeStatus: async (userId: string, newStatus: UserStatus) => {
      const result = await db
        .updateTable('User')
        .set({ status: newStatus, lastUpdatedStatusTimestamp: new Date().toISOString() })
        .where('id', '=', userId)
        .returning([
          'id',
          'status',
          'username',
          'avatarURL',
          'lastUpdatedStatusTimestamp',
          'createdTimestamp',
          'updatedTimestamp',
        ])
        .executeTakeFirst();

      return result;
    },

    updateAvatarUrl: async (userId: string, newAvatarUrl: string) => {
      const result = await db
        .updateTable('User')
        .set({ avatarURL: newAvatarUrl })
        .where('id', '=', userId)
        .returning([
          'id',
          'status',
          'username',
          'avatarURL',
          'lastUpdatedStatusTimestamp',
          'createdTimestamp',
          'updatedTimestamp',
        ])
        .execute();

      return result;
    },
  },
};
