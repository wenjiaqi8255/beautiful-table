#!/bin/bash
# Database Setup Script for Beautiful Table
# This script initializes the D1 database with schema and seed data

set -e  # Exit on error

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo "🔧 Setting up Beautiful Table D1 Database..."
echo ""

# Check if wrangler is available
if ! command -v npx wrangler &> /dev/null; then
    echo "❌ Error: wrangler is not available"
    echo "Please install it with: npm install -D wrangler"
    exit 1
fi

# Parse command line arguments
DB_NAME="beautiful-table-db"
REMOTE=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --remote)
            REMOTE=true
            shift
            ;;
        --local)
            REMOTE=false
            shift
            ;;
        --db-name)
            DB_NAME="$2"
            shift 2
            ;;
        -h|--help)
            echo "Usage: ./setup.sh [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --local     Use local database (default)"
            echo "  --remote    Use remote production database"
            echo "  --db-name   Specify database name (default: beautiful-table-db)"
            echo "  -h, --help  Show this help message"
            exit 0
            ;;
        *)
            echo "❌ Unknown option: $1"
            echo "Use --help to see available options"
            exit 1
            ;;
    esac
done

# Set flags based on remote/local
FLAGS="--local"
if [ "$REMOTE" = true ]; then
    FLAGS="--remote"
    echo "⚠️  WARNING: Operating on REMOTE production database!"
    echo ""
else
    echo "📦 Using local database"
fi

echo ""
echo "📊 Applying schema..."
npx wrangler d1 execute "$DB_NAME" $FLAGS --file="$SCRIPT_DIR/schema.sql"

if [ $? -eq 0 ]; then
    echo "✅ Schema applied successfully"
else
    echo "❌ Failed to apply schema"
    exit 1
fi

echo ""
echo "🌱 Seeding database..."
npx wrangler d1 execute "$DB_NAME" $FLAGS --file="$SCRIPT_DIR/seed.sql" 2>/dev/null

if [ $? -eq 0 ]; then
    echo "✅ Seed data inserted successfully"
else
    echo "⚠️  Seed data already exists or failed to insert (this is okay if re-running)"
fi

echo ""
echo "✨ Database setup complete!"
echo ""
echo "To verify the setup, run:"
echo "  npx wrangler d1 execute $DB_NAME $FLAGS --file=\"$SCRIPT_DIR/test_schema.sql\""
