-- Test SQL to verify database schema exists
-- This test should FAIL initially (RED phase)

-- Test 1: Check if users table exists
SELECT name FROM sqlite_master WHERE type='table' AND name='users';

-- Test 2: Check if usage_logs table exists
SELECT name FROM sqlite_master WHERE type='table' AND name='usage_logs';

-- Test 3: Check if transactions table exists
SELECT name FROM sqlite_master WHERE type='table' AND name='transactions';

-- Test 4: Check users table structure
PRAGMA table_info(users);

-- Test 5: Check usage_logs table structure
PRAGMA table_info(usage_logs);

-- Test 6: Check transactions table structure
PRAGMA table_info(transactions);

-- Test 7: Check indexes on users table
SELECT name FROM sqlite_master WHERE type='index' AND tbl_name='users';

-- Test 8: Check indexes on usage_logs table
SELECT name FROM sqlite_master WHERE type='index' AND tbl_name='usage_logs';

-- Test 9: Check indexes on transactions table
SELECT name FROM sqlite_master WHERE type='index' AND tbl_name='transactions';

-- Test 10: Try to query seed data (should return rows after seeding)
SELECT COUNT(*) as user_count FROM users;
SELECT COUNT(*) as log_count FROM usage_logs;
SELECT COUNT(*) as transaction_count FROM transactions;
