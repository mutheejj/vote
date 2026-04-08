# Backend Setup Guide

This guide will walk you through setting up the voting system backend from scratch.

## Prerequisites

Before you begin, ensure you have the following installed:
- Node.js (v16 or higher)
- npm or yarn
- Git
- PostgreSQL (v14 or higher)

## Step 1: Clone the Repository

```bash
git clone <repository-url>
cd voting-system/backend
```

## Step 2: Install Dependencies

```bash
npm install
```

Or if you're using yarn:

```bash
yarn install
```

## Step 3: Install and Configure PostgreSQL

### Windows

1. Download PostgreSQL from [https://www.postgresql.org/download/windows/](https://www.postgresql.org/download/windows/)
2. Run the installer and follow the setup wizard
3. Set a password for the `postgres` user (remember this for later)
4. Default port is `5432` - keep this unless you have conflicts
5. Add PostgreSQL bin directory to your system PATH (usually done automatically by installer)

### macOS

Using Homebrew:
```bash
brew install postgresql@14
brew services start postgresql@14
```

### Linux (Ubuntu/Debian)

```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

## Step 4: Create the Database

### Option 1: Using PostgreSQL Command Line (Recommended for Windows CMD)

```cmd
set PGPASSWORD=your_password
createdb -U postgres -h localhost voting_system
```

### Option 2: Using psql

```bash
psql -U postgres -h localhost
CREATE DATABASE voting_system;
\q
```

### Option 3: Using pgAdmin

1. Open pgAdmin
2. Connect to your PostgreSQL server
3. Right-click "Databases" → "Create" → "Database"
4. Name it `voting_system`
5. Click "Save"

## Step 5: Configure Environment Variables

1. Copy the `.env.example` file to `.env` (or create a new `.env` file)
2. Update the database connection string:

```env
DATABASE_URL="postgresql://postgres:your_password@localhost:5432/voting_system"
```

Replace `your_password` with your PostgreSQL password.

**Important**: Review and update all other environment variables in the `.env` file according to your environment:
- JWT secrets
- SMTP credentials (for email)
- Twilio credentials (for SMS)
- Redis configuration
- etc.

## Step 6: Generate Prisma Client

This command generates the Prisma Client based on your schema:

```bash
npx prisma generate
```

## Step 7: Push the Database Schema

This command synchronizes your database schema with the Prisma schema:

```bash
npx prisma db push
```

**Note**: This creates all tables, enums, indexes, and foreign keys defined in `prisma/schema.prisma`.

## Step 8: Run Migrations

After `prisma db push`, you need to apply additional migrations that add extra features and optimizations.

Execute the migrations in order using the following commands:

### Migration 2: Add Gender and Metadata Fields
```cmd
set PGPASSWORD=your_password && psql -U postgres -h localhost -d voting_system -f prisma\migrations\20251011164122_add_gender_and_metadata_fields\migration.sql
```

### Migration 3: Add Election Status Index
```cmd
set PGPASSWORD=your_password && psql -U postgres -h localhost -d voting_system -f prisma\migrations\20251022152925_add_election_status_enddate_index\migration.sql
```

### Migration 4: Add Pre-Registration Tables
```cmd
set PGPASSWORD=your_password && psql -U postgres -h localhost -d voting_system -f prisma\migrations\20251023083002_add_candidate_pre_registration_and_admin_invitations\migration.sql
```

### Migration 5: Add Election/Position to Pre-Registration
```cmd
set PGPASSWORD=your_password && psql -U postgres -h localhost -d voting_system -f prisma\migrations\20251029090352_add_election_position_to_prereg\migration.sql
```

### Migration 6: Optimize Indexes
```cmd
set PGPASSWORD=your_password && psql -U postgres -h localhost -d voting_system -f prisma\migrations\20251111_optimize_indexes\migration.sql
```

### Migration 7: Add System Stats Table
```cmd
set PGPASSWORD=your_password && psql -U postgres -h localhost -d voting_system -f prisma\migrations\20251112_add_system_stats\migration.sql
```

### Migration 8: Add System Stats with Triggers
```cmd
set PGPASSWORD=your_password && psql -U postgres -h localhost -d voting_system -f prisma\migrations\20251112_add_system_stats_with_triggers\migration.sql
```

### Migration 9: Fix Election Trigger Enum Cast
```cmd
set PGPASSWORD=your_password && psql -U postgres -h localhost -d voting_system -f prisma\migrations\20251113_fix_election_trigger_enum_cast\migration.sql
```

### macOS/Linux Migration Commands

For macOS and Linux, use this format instead:

```bash
PGPASSWORD=your_password psql -U postgres -h localhost -d voting_system -f prisma/migrations/20251011164122_add_gender_and_metadata_fields/migration.sql
```

Repeat for all migrations, changing the path accordingly.

### Run All Migrations at Once (Bash Script)

Create a file `run-migrations.sh`:

```bash
#!/bin/bash
export PGPASSWORD='your_password'

psql -U postgres -h localhost -d voting_system -f prisma/migrations/20251011164122_add_gender_and_metadata_fields/migration.sql
psql -U postgres -h localhost -d voting_system -f prisma/migrations/20251022152925_add_election_status_enddate_index/migration.sql
psql -U postgres -h localhost -d voting_system -f prisma/migrations/20251023083002_add_candidate_pre_registration_and_admin_invitations/migration.sql
psql -U postgres -h localhost -d voting_system -f prisma/migrations/20251029090352_add_election_position_to_prereg/migration.sql
psql -U postgres -h localhost -d voting_system -f prisma/migrations/20251111_optimize_indexes/migration.sql
psql -U postgres -h localhost -d voting_system -f prisma/migrations/20251112_add_system_stats/migration.sql
psql -U postgres -h localhost -d voting_system -f prisma/migrations/20251112_add_system_stats_with_triggers/migration.sql
psql -U postgres -h localhost -d voting_system -f prisma/migrations/20251113_fix_election_trigger_enum_cast/migration.sql

echo "All migrations completed!"
```

Make it executable and run:
```bash
chmod +x run-migrations.sh
./run-migrations.sh
```

## Step 9: Verify Database Setup

Check that all tables were created successfully:

```cmd
set PGPASSWORD=your_password && psql -U postgres -h localhost -d voting_system -c "\dt"
```

You should see tables like:
- User
- Election
- Candidate
- Position
- Vote
- VotingSession
- SystemStats
- CandidatePreRegistration
- AdminInvitation
- And many more...

## Step 10: Seed the Database (Optional)

If there's a seed script available:

```bash
npx prisma db seed
```

Or run your custom seed script:

```bash
npm run seed
```

## Step 11: Start the Development Server

```bash
npm run dev
```

Or:

```bash
yarn dev
```

The backend should now be running on `http://localhost:5000` (or the port specified in your `.env` file).

## Troubleshooting

### Issue: `psql` command not found (Windows)

**Solution**: Add PostgreSQL's `bin` directory to your system PATH:
1. Find your PostgreSQL installation (usually `C:\Program Files\PostgreSQL\14\bin`)
2. Add it to your system PATH environment variable
3. Restart your terminal

### Issue: `psql` commands hang on Git Bash (Windows)

**Solution**: Use Windows CMD or PowerShell instead of Git Bash for PostgreSQL commands.

### Issue: Database connection refused

**Solutions**:
- Verify PostgreSQL is running: `pg_isready -h localhost`
- Check the port (default 5432) isn't blocked
- Verify credentials in your `.env` file
- Ensure the database exists: `psql -U postgres -l`

### Issue: Migration fails with "relation already exists"

**Solution**: Some migrations use `CREATE INDEX IF NOT EXISTS` which is safe to re-run. If you encounter errors:
1. Check which tables/indexes already exist
2. Skip that specific migration or modify it to use `IF NOT EXISTS` clauses

### Issue: Prisma Client not found

**Solution**: Run `npx prisma generate` again

### Issue: Permission denied on PostgreSQL

**Solution**:
- On Linux/macOS, you may need to create a PostgreSQL user with your system username
- Or specify `-U postgres` with the password in commands

## Additional Commands

### View Prisma Studio (Database GUI)

```bash
npx prisma studio
```

This opens a web interface at `http://localhost:5555` to view and edit your database.

### Reset Database (Development Only)

**Warning**: This deletes all data!

```bash
npx prisma db push --force-reset
```

Then re-run all migrations from Step 8.

### Generate Migration from Schema Changes

If you modify `prisma/schema.prisma`:

```bash
npx prisma migrate dev --name your_migration_name
```

## What Each Migration Does

1. **Migration 2**: Adds `gender` field to User table and `metadata` JSONB field to Vote table
2. **Migration 3**: Adds composite index on Election(status, endDate) for better query performance
3. **Migration 4**: Creates CandidatePreRegistration and AdminInvitation tables for the registration workflow
4. **Migration 5**: Adds election and position foreign keys to CandidatePreRegistration
5. **Migration 6**: Adds comprehensive performance indexes across User, Election, Notification, Vote, and other tables
6. **Migration 7**: Creates SystemStats table for caching statistics
7. **Migration 8**: Adds database triggers to keep SystemStats updated in real-time
8. **Migration 9**: Fixes enum casting issues in the election statistics trigger

## Next Steps

After completing the setup:

1. Review the API documentation (if available)
2. Test the endpoints using Postman or similar tool
3. Set up the frontend application
4. Configure Redis for session management (if needed)
5. Set up email/SMS services with real credentials

## Support

If you encounter issues not covered in this guide:
1. Check the project's issue tracker
2. Review the `.env.example` file for required environment variables
3. Consult the main README.md file
4. Contact the development team
