const { neon } = require('@neondatabase/serverless');

const sql = neon(process.env.DATABASE_URL);

async function createVerificationTable() {
  try {
    console.log('Creating verification table...');

    await sql`
      CREATE TABLE IF NOT EXISTS verification (
        id TEXT PRIMARY KEY,
        identifier TEXT NOT NULL,
        value TEXT NOT NULL,
        "expiresAt" INTEGER NOT NULL,
        "createdAt" INTEGER NOT NULL,
        "updatedAt" INTEGER NOT NULL
      )
    `;

    console.log('✅ Verification table created');

    await sql`
      CREATE INDEX IF NOT EXISTS verification_identifier_idx ON verification(identifier)
    `;

    console.log('✅ Index created');
    console.log('\nDone!');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

createVerificationTable();
