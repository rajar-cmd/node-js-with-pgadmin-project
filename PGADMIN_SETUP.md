# Setting up Database with pgAdmin4

## Step 1: Create the User "users"

1. Open **pgAdmin4**
2. Connect to your PostgreSQL server (usually `localhost` or `127.0.0.1`)
3. Expand **Servers** → Your server → **Login/Group Roles**
4. Right-click **Login/Group Roles** → **Create** → **Login/Group Role**
5. In the **General** tab:
   - Name: `users`
6. In the **Definition** tab:
   - Password: `root`
   - Password expiration: Leave empty
7. In the **Privileges** tab:
   - Check **Can login?** ✅
8. Click **Save**

## Step 2: Create the Database "new_database"

1. Right-click **Databases** → **Create** → **Database**
2. In the **General** tab:
   - Database: `new_database`
   - Owner: Select `users` from dropdown
3. Click **Save**

## Step 3: Grant Privileges

1. Right-click the `new_database` database → **Properties**
2. Go to **Security** tab
3. Click **+** to add a privilege
4. Select **Grantee**: `users`
5. Check all privileges ✅
6. Click **Save**

## Step 4: Create the Users Table

1. Expand **Databases** → `new_database` → **Schemas** → **public** → **Tables**
2. Right-click **Tables** → **Query Tool**
3. Copy and paste this SQL:

```sql
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    age INTEGER,
    city VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);
```

4. Click **Execute** (▶️) or press `F5`
5. You should see "Successfully run. Total query runtime: X ms"

## Step 5: Verify Your .env File

Make sure your `.env` file has:

```
DB_USER=users
DB_PASSWORD=root
DB_HOST=localhost
DB_PORT=5432
DB_DATABASE=new_database
```

## Step 6: Test Connection

Run:
```bash
node scripts/test-connection.js
```

You should see: ✅ Successfully connected to PostgreSQL!

## Step 7: Start Your Server

```bash
npm run dev
```

Your server should now connect successfully! 🎉
