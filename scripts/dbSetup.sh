#!/bin/bash
# Database setup script for MCP Loan Management System

echo "🚀 Setting up database for MCP Loan Management System..."

# Check if sqlcmd is available
if ! command -v sqlcmd &> /dev/null; then
    echo "❌ Error: sqlcmd is not installed or not in the PATH"
    echo "Please install SQL Server Command Line Tools and try again."
    exit 1
fi

# Get the absolute path to the script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
SCHEMA_FILE="$PROJECT_ROOT/database/createSchema.sql"

echo "📁 Using schema file: $SCHEMA_FILE"

# Check if schema file exists
if [ ! -f "$SCHEMA_FILE" ]; then
    echo "❌ Error: Schema file not found at $SCHEMA_FILE"
    exit 1
fi

echo "🔧 Creating database using SQL Server LocalDB..."

# Run the SQL script with sqlcmd
sqlcmd -S "(localdb)\MSSQLLocalDB" -i "$SCHEMA_FILE" -E

# Check the exit code
if [ $? -eq 0 ]; then
    echo "✅ Database schema created successfully!"
else
    echo "❌ Error creating database schema"
    exit 1
fi

echo "🔄 Setting up initial data..."

# Run the Node.js migration script
node "$SCRIPT_DIR/migrateJsonToDb.js"

# Check the exit code
if [ $? -eq 0 ]; then
    echo "✅ Data migration completed successfully!"
else
    echo "❌ Error migrating data"
    exit 1
fi

echo "✅ Database setup complete!"
echo "You can now set USE_DATABASE=true in your .env file to use the database."
exit 0 