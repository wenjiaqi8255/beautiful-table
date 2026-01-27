# Beautiful Table D1 Database

This directory contains the Cloudflare D1 database schema and seed data for the Beautiful Table application.

## Files

- `schema.sql` - Database schema definition (tables and indexes)
- `seed.sql` - Test data for development
- `test_schema.sql` - Verification queries to test database setup
- `setup.sh` - Automated setup script

## Database Schema

### Tables

#### `users`
Stores user account information.

| Column | Type | Constraints | Default |
|--------|------|-------------|---------|
| id | TEXT | PRIMARY KEY | - |
| email | TEXT | UNIQUE, NOT NULL | - |
| credits | INTEGER | NOT NULL | 10 |
| total_purchased | INTEGER | NOT NULL | 0 |
| created_at | TEXT | NOT NULL | datetime('now') |
| last_login | TEXT | NULLABLE | - |

**Indexes:**
- `idx_users_email` on `email`

#### `usage_logs`
Tracks API usage and credit consumption.

| Column | Type | Constraints | Default |
|--------|------|-------------|---------|
| id | INTEGER | PRIMARY KEY, AUTOINCREMENT | - |
| user_id | TEXT | NOT NULL, FK → users(id) | - |
| operation | TEXT | NOT NULL | - |
| credits_used | INTEGER | NOT NULL | - |
| timestamp | TEXT | NOT NULL | datetime('now') |

**Indexes:**
- `idx_usage_logs_user_id` on `user_id`
- `idx_usage_logs_timestamp` on `timestamp`

#### `transactions`
Stores payment and credit purchase history.

| Column | Type | Constraints | Default |
|--------|------|-------------|---------|
| id | TEXT | PRIMARY KEY | - |
| user_id | TEXT | NOT NULL, FK → users(id) | - |
| amount | REAL | NOT NULL | - |
| credits_added | INTEGER | NOT NULL | - |
| payment_id | TEXT | NULLABLE | - |
| status | TEXT | NOT NULL | 'pending' |
| created_at | TEXT | NOT NULL | datetime('now') |

**Indexes:**
- `idx_transactions_user_id` on `user_id`
- `idx_transactions_status` on `status`
- `idx_transactions_created_at` on `created_at`

## Setup Instructions

### Quick Setup (Local)

```bash
cd database
./setup.sh
```

### Manual Setup

```bash
# Apply schema
npx wrangler d1 execute beautiful-table-db --local --file=database/schema.sql

# Seed database
npx wrangler d1 execute beautiful-table-db --local --file=database/seed.sql

# Verify setup
npx wrangler d1 execute beautiful-table-db --local --file=database/test_schema.sql
```

### Production Setup (Remote)

```bash
cd database
./setup.sh --remote
```

**⚠️ WARNING:** The `--remote` flag will modify your production database. Use with caution!

## Wrangler Commands

### Execute SQL directly

```bash
npx wrangler d1 execute beautiful-table-db --local --command="SELECT * FROM users;"
```

### Interactive SQL shell

```bash
npx wrangler d1 execute beautiful-table-db --local --command=""
```

### Query data

```bash
# Local
npx wrangler d1 execute beautiful-table-db --local --command="SELECT COUNT(*) FROM users;"

# Remote
npx wrangler d1 execute beautiful-table-db --remote --command="SELECT COUNT(*) FROM users;"
```

## Testing

To verify the database is correctly set up:

```bash
npx wrangler d1 execute beautiful-table-db --local --file=database/test_schema.sql
```

This will:
1. Check that all tables exist
2. Verify table structures
3. List all indexes
4. Count seed data records

## Seed Data

The seed file includes:
- 3 test users
- 10 usage log entries
- 5 transactions (various statuses)

### Test Users

1. **user-1** (test@example.com) - 10 credits
2. **user-2** (alice@example.com) - 15 credits
3. **user-3** (bob@example.com) - 25 credits

## Database Configuration

The database is configured in `/worker/wrangler.toml`:

```toml
[[d1_databases]]
binding = "DB"
database_name = "beautiful-table-db"
database_id = "your-database-id-here"
```

To create a production database:

```bash
npx wrangler d1 create beautiful-table-db
```

Then update `database_id` in `wrangler.toml`.

## Troubleshooting

### "no such table" error

Run the setup script to create tables:
```bash
cd database && ./setup.sh
```

### Database not found

Create the database first:
```bash
npx wrangler d1 create beautiful-table-db
```

### View logs

```bash
cat ~/Library/Preferences/.wrangler/logs/wrangler-*.log
```
