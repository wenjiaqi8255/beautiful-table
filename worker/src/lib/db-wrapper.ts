import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import type { NeonDatabase } from 'drizzle-orm/neon-http';
import * as schema from '../db/schema';

let dbForAuth: NeonDatabase<typeof schema> | null = null;

/**
 * Get a database instance configured for Better Auth with JSON serialization support.
 *
 * The neon-http driver requires JSON values to be pre-serialized as strings,
 * but Better Auth passes JavaScript objects directly. This wrapper creates
 * a custom database instance that intercepts insert operations on the
 * verification table and serializes objects to JSON strings.
 */
export function getDbForAuth(databaseUrl: string) {
  if (!dbForAuth) {
    const sql = neon(databaseUrl);
    const db = drizzle({ client: sql, schema });

    // Create a proxy that intercepts method calls
    dbForAuth = new Proxy(db, {
      get(target, prop) {
        const value = (target as any)[prop];

        // Intercept insert operations
        if (prop === 'insert' && typeof value === 'function') {
          return (...args: any[]) => {
            const table = args[0];
            const data = args[1];

            // Check if inserting into verification table with object value
            if (table === schema.verification && data && typeof data === 'object') {
              // Clone the data to avoid mutation
              const modifiedData = { ...data };

              // Serialize value field if it's an object
              if ('value' in modifiedData && typeof modifiedData.value === 'object' && modifiedData.value !== null) {
                modifiedData.value = JSON.stringify(modifiedData.value);
                console.log('[DB Wrapper] Serialized verification.value to JSON');
              }

              // Call original insert with modified data
              return value.call(target, table, modifiedData);
            }

            // Call original insert for other cases
            return value.apply(target, args);
          };
        }

        // Return all other properties/methods as-is
        return value;
      }
    }) as NeonDatabase<typeof schema>;
  }

  return dbForAuth;
}
