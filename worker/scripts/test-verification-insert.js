const { neon } = require('@neondatabase/serverless');

const sql = neon(process.env.DATABASE_URL);

async function testInsert() {
  try {
    console.log('Testing verification table insert...\n');

    const testData = {
      id: 'test-id-' + Date.now(),
      identifier: 'test@example.com',
      value: JSON.stringify({
        callbackURL: '/auth/callback',
        codeVerifier: 'test-verifier',
        expiresAt: Date.now() + 3600000,
        state: 'test-state'
      }),
      expiresAt: Math.floor(Date.now() / 1000) + 3600,
      createdAt: Math.floor(Date.now() / 1000),
      updatedAt: Math.floor(Date.now() / 1000),
    };

    console.log('Inserting test data:', JSON.stringify(testData, null, 2));

    const result = await sql`
      INSERT INTO verification (id, identifier, value, "expiresAt", "createdAt", "updatedAt")
      VALUES (${testData.id}, ${testData.identifier}, ${testData.value}, ${testData.expiresAt}, ${testData.createdAt}, ${testData.updatedAt})
      RETURNING *
    `;

    console.log('\n✅ Insert successful!');
    console.log('Result:', result);

  } catch (error) {
    console.error('\n❌ Insert failed!');
    console.error('Error:', error.message);
    console.error('Details:', error);
    process.exit(1);
  }
}

testInsert();
