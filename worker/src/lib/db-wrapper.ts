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

    // Track which table we're inserting into
    let currentInsertTable: any = null;

    // Create a proxy that intercepts method calls
    dbForAuth = new Proxy(db, {
      get(target, prop) {
        const value = (target as any)[prop];

        // Intercept insert operations
        if (prop === 'insert' && typeof value === 'function') {
          return (...args: any[]) => {
            console.log('[DB Wrapper] Intercepted .insert() call');
            const table = args[0];
            currentInsertTable = table;
            console.log('[DB Wrapper] Table:', table?.tableName || table);

            // Get the insert builder (chained call)
            const builder = value.apply(target, args);

            // Return a proxied builder that intercepts .values()
            return new Proxy(builder, {
              get(builderTarget, builderProp) {
                const builderValue = (builderTarget as any)[builderProp];

                // Intercept .values() call
                if (builderProp === 'values' && typeof builderValue === 'function') {
                  return (...valuesArgs: any[]) => {
                    const data = valuesArgs[0];
                    console.log('[DB Wrapper] Intercepted .values() call');
                    console.log('[DB Wrapper] Data:', data);

                    // Check if inserting into verification table with object value
                    if (currentInsertTable === schema.verification && data && typeof data === 'object') {
                      console.log('[DB Wrapper] Inserting into verification table');

                      // Clone the data to avoid mutation
                      const modifiedData = { ...data };

                      // Serialize value field if it's an object
                      if ('value' in modifiedData && typeof modifiedData.value === 'object' && modifiedData.value !== null) {
                        console.log('[DB Wrapper] Original value type:', typeof modifiedData.value);
                        console.log('[DB Wrapper] Original value:', JSON.stringify(modifiedData.value).substring(0, 100));
                        modifiedData.value = JSON.stringify(modifiedData.value);
                        console.log('[DB Wrapper] ✅ Serialized verification.value to JSON string');
                      }

                      console.log('[DB Wrapper] Calling original .values() with modified data');
                      try {
                        const result = builderValue.call(builderTarget, modifiedData);
                        console.log('[DB Wrapper] ✅ Insert succeeded');
                        // Reset table tracking
                        currentInsertTable = null;
                        return result;
                      } catch (error) {
                        console.error('[DB Wrapper] ❌ Insert failed:', error);
                        // Reset table tracking
                        currentInsertTable = null;
                        throw error;
                      }
                    }

                    // Call original values for other cases
                    console.log('[DB Wrapper] Calling original .values() (no modification)');
                    // Reset table tracking
                    currentInsertTable = null;
                    return builderValue.apply(builderTarget, valuesArgs);
                  };
                }

                // Return all other builder methods as-is
                return builderValue;
              }
            });
          };
        }

        // Return all other properties/methods as-is
        return value;
      }
    }) as NeonDatabase<typeof schema>;

    console.log('[DB Wrapper] Database wrapper initialized successfully');
  }

  return dbForAuth;
}
