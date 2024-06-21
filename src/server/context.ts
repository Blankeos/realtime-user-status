import { CreateWSSContextFnOptions } from '@trpc/server/adapters/ws';
import { Context } from 'hono';
import { Session, User } from 'lucia';

export const createContext = async (c: Context) => {
  return {
    honoContext: c,
    user: null as User | null,
    session: null as Session | null,
  };
};

export const createWSContext = async (opts: CreateWSSContextFnOptions) => {
  return {
    honoContext: opts,
    user: null as User | null,
    session: null as Session | null,
  };
};
