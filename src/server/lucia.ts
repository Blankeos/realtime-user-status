// ===========================================================================
// Lucia Client (wraps around DB connection as well).
// ===========================================================================

import { PrismaAdapter } from '@lucia-auth/adapter-prisma';
import { Selectable } from 'kysely';
import { Lucia } from 'lucia';
import { prisma } from './db/prisma';
import { User } from './db/types';

const adapter = new PrismaAdapter(prisma.session, prisma.user);

export const lucia = new Lucia(adapter, {
  //   sessionExpiresIn: new TimeSpan(5, "s"),
  sessionCookie: {
    attributes: {
      // set to `true` when using HTTPS
      // secure: privateConfig.NODE_ENV === 'production',
      // TODO Safari is very strict on this on localhost. It will not save cookies
      // If not HTTPs. During `vite preview`, we're technically not on HTTPs
      // For now this is a workaround.
      secure: false,
    },

    /**
     * Why you might want to set this to `false`
     * Note: Lucia refreshes "nearly expired" (less-than-half left until expired)
     * cookies in the middleware. If you call your APIs on the server-side, your
     * browser won't be able to save the new cookie.
     *
     * In a metaframework like Next.js or Svelte, where you sometimes perform
     * `fetch` on your own API on the server-side (getServerSideProps or +page.server.ts),
     * it's possible to not pass the new cookie back to the client (Automatically).
     *
     * If you're determined to set this to `true` for the above usecase.
     * Alternatively: You should make sure to send the Request and Respose back
     * between the browser -> ssr -> api -> ssr -> browser.
     */
    expires: true, // Default: true,
  },
  getUserAttributes: (attributes) => {
    return {
      username: attributes.username,
      createdTimestamp: attributes.createdTimestamp,
      updatedTimestamp: attributes.updatedTimestamp,
      avatarURL: attributes.avatarURL,
      status: attributes.status,
      lastUpdatedStatusTimestamp: attributes.lastUpdatedStatusTimestamp,
    };
  },
});

declare module 'lucia' {
  interface Register {
    Lucia: typeof lucia;
    DatabaseUserAttributes: Selectable<User>;
  }
}
