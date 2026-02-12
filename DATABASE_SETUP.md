# Database Setup Guide

## Current Issue
The PostgreSQL user "users" doesn't exist. You need to either create it or use an existing user.

## Option 1: Create the "users" user (Recommended)

Connect to PostgreSQL using an admin account and run:

```bash
# Connect to PostgreSQL (try one of these):
psql -U postgres -d postgres
# OR
psql -U $(whoami) -d postgres
# OR if you have a password:
psql -U postgres -d postgres -h localhost
```

Then run these SQL commands:

```sql
CREATE USER users WITH PASSWORD 'root';
CREATE DATABASE new_database;
GRANT ALL PRIVILEGES ON DATABASE new_database TO users;
\q
```

## Option 2: Use an existing PostgreSQL user

Update your `.env` file to use an existing user. Common options:

### Try your macOS username (often works with no password):
```
DB_USER=gurramrajareddy
DB_PASSWORD=
DB_DATABASE=new_database
```

### Or try the default postgres user:
```
DB_USER=postgres
DB_PASSWORD=
DB_DATABASE=new_database
```

## After setting up the user:

1. **Create the database** (if it doesn't exist):
   ```bash
   createdb new_database
   # OR via psql:
   psql -U users -d postgres -c "CREATE DATABASE new_database;"
   ```

2. **Create the tables**:
   ```bash
   psql -U users -d new_database -f scripts/init-db.sql
   ```

3. **Test the connection**:
   ```bash
   node scripts/test-connection.js
   ```

4. **Start your server**:
   ```bash
   npm run dev
   ```

## Troubleshooting

- **"password authentication failed"**: User doesn't exist or password is wrong
- **"database does not exist"**: Run `createdb new_database`
- **"connection refused"**: PostgreSQL is not running (`brew services start postgresql@16`)
