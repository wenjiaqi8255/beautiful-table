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
    console.log('[DB Wrapper] Initializing database wrapper...');
    const sql = neon(databaseUrl);
    const db = drizzle({ client: sql, schema });

    // Create a proxy that intercepts method calls
    dbForAuth = new Proxy(db, {
      get(target, prop) {
        const value = (target as any)[prop];

        // Intercept insert operations
        if (prop === 'insert' && typeof value === 'function') {
          return (...args: any[]) => {
            console.log('[DB Wrapper] Intercepted .insert() call');
            console.log('[DB Wrapper] Args count:', args.length);
            console.log('[DB Wrapper] First arg type:', typeof args[0]);

            const table = args[0];
            console.log('[DB Wrapper] Table:', table?.tableName || table);

            // Check if this is a chained insert (db.insert(table).values(data))
            if (args.length === 1 && typeof args[0] === 'object' && args[0] !== null) {
              console.log('[DB Wrapper] Returning insert builder (chained call)');
              // This is a chained call, return the original result
              return value.apply(target, args);
            }

            const data = args[1];
            console.log('[DB Wrapper] Data:', data);

            // Check if inserting into verification table with object value
            if (table === schema.verification && data && typeof data === 'object') {
              console.log('[DB Wrapper] Inserting into verification table');

              // Clone the data to avoid mutation
              const modifiedData = { ...data };

              // Serialize value field if it's an object
              if ('value' in modifiedData && typeof modifiedData.value === 'object' && modifiedData.value !== null) {
                console.log('[DB Wrapper] Original value type:', typeof modifiedData.value);
                console.log('[DB Wrapper] Original value:', JSON.stringify(modifiedData.value));
                modifiedData.value = JSON.stringify(modifiedData.value);
                console.log('[DB Wrapper] Serialized verification.value to JSON string');
              }

              console.log('[DB Wrapper] Calling original insert with modified data');
              try {
                const result = value.call(target, table, modifiedData);
                console.log('[DB Wrapper] Insert succeeded');
                return result;
              } catch (error) {
                console.error('[DB Wrapper] Insert failed:', error);
                throw error;
              }
            }

            // Call original insert for other cases
            console.log('[DB Wrapper] Calling original insert (no modification)');
            return value.apply(target, args);
          };
        }

        // Log all property access for debugging
        if (typeof prop === 'string' && ['query', 'select', 'update', 'delete'].includes(prop)) {
          console.log(`[DB Wrapper] Accessing .${prop} method`);
        }

        // Return all other properties/methods as-is
        return value;
      }
    }) as NeonDatabase<typeof schema>;

    console.log('[DB Wrapper] Database wrapper initialized successfully');
  }

  return dbForAuth;
}
