import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool } from '@neondatabase/serverless';

let db: ReturnType<typeof drizzle>;

export function getDb(databaseUrl: string) {
  if (!db) {
    const client = new Pool({ connectionString: databaseUrl });
    db = drizzle({ client });
  }
  return db;
}

// Get DB with explicit configuration for Better Auth
export function getDbForAuth(databaseUrl: string) {
  return getDb(databaseUrl);
}
