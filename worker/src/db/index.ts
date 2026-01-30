import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';

let db: ReturnType<typeof drizzle>;

export function getDb(databaseUrl: string) {
  if (!db) {
    const sql = neon(databaseUrl);
    db = drizzle({ client: sql });
  }
  return db;
}

// Get DB with explicit configuration for Better Auth
export function getDbForAuth(databaseUrl: string) {
  return getDb(databaseUrl);
}
