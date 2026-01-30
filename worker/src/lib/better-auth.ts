import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { getDbForAuth } from './db-wrapper';
import * as schema from '../db/schema';

export function createAuth(env: any) {
  const db = getDbForAuth(env.DATABASE_URL);

  return betterAuth({
    baseURL: env.APP_URL,
    database: drizzleAdapter(db, {
      provider: 'pg',
      schema: {
        user: schema.user,
        session: schema.session,
        account: schema.account,
        verification: schema.verification,
      },
    }),
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false,
    },
    socialProviders: {
      google: {
        clientId: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
        redirectURI: `${env.APP_URL}/api/auth/callback/google`,
      },
    },
    session: {
      expiresIn: 60 * 60 * 24 * 7, // 7 days
      updateAge: 60 * 60 * 24, // 1 day
    },
    advanced: {
      // Add better error logging for debugging
      onRequestError: (error) => {
        console.error('[Better Auth] Request Error:', error);
        throw error;
      },
      onResponseError: (error) => {
        console.error('[Better Auth] Response Error:', error);
        throw error;
      },
    },
  });
}
