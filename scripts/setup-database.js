require('dotenv').config();
const { Pool } = require('pg');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function question(query) {
    return new Promise(resolve => rl.question(query, resolve));
}

async function tryConnection(user, password, database = 'postgres') {
    const pool = new Pool({
        user,
        password,
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT, 10) || 5432,
        database
    });
    
    try {
        const client = await pool.connect();
        await client.query('SELECT 1');
        client.release();
        await pool.end();
        return true;
    } catch (error) {
        await pool.end();
        return false;
    }
}

async function setupDatabase() {
    console.log('🔍 Testing PostgreSQL connection...\n');
    
    const dbName = process.env.DB_DATABASE || 'new_database';
    const host = process.env.DB_HOST || 'localhost';
    const port = parseInt(process.env.DB_PORT, 10) || 5432;
    
    // Try common default users
    const commonUsers = [
        { user: 'postgres', password: '' },
        { user: 'postgres', password: 'postgres' },
        { user: process.env.USER || 'postgres', password: '' },
        { user: 'users', password: 'root' },
        { user: 'users', password: '' }
    ];
    
    let workingUser = null;
    let workingPassword = null;
    
    console.log('Trying common PostgreSQL users...');
    for (const { user, password } of commonUsers) {
        process.stdout.write(`  Trying user "${user}"... `);
        if (await tryConnection(user, password)) {
            console.log('✅ SUCCESS!');
            workingUser = user;
            workingPassword = password;
            break;
        } else {
            console.log('❌ Failed');
        }
    }
    
    if (!workingUser) {
        console.log('\n❌ Could not connect with any default user.');
        console.log('\nPlease provide PostgreSQL credentials:');
        const user = await question('PostgreSQL username: ');
        const password = await question('PostgreSQL password (press Enter if none): ');
        
        if (await tryConnection(user, password)) {
            workingUser = user;
            workingPassword = password;
            console.log('✅ Connection successful!\n');
        } else {
            console.log('❌ Connection failed. Please check your credentials.');
            rl.close();
            process.exit(1);
        }
    }
    
    console.log(`\n✅ Connected as user: ${workingUser}`);
    
    // Create database
    const adminPool = new Pool({
        user: workingUser,
        password: workingPassword,
        host,
        port,
        database: 'postgres'
    });
    
    const client = await adminPool.connect();
    
    try {
        // Check if database exists
        const checkResult = await client.query(
            'SELECT 1 FROM pg_database WHERE datname = $1',
            [dbName]
        );
        
        if (checkResult.rows.length > 0) {
            console.log(`✅ Database "${dbName}" already exists`);
        } else {
            await client.query(`CREATE DATABASE ${dbName}`);
            console.log(`✅ Database "${dbName}" created`);
        }
        
        // Create user if it doesn't exist (optional)
        if (workingUser !== 'users' && process.env.DB_USER === 'users') {
            try {
                await client.query(`CREATE USER users WITH PASSWORD 'root'`);
                await client.query(`GRANT ALL PRIVILEGES ON DATABASE ${dbName} TO users`);
                console.log(`✅ User "users" created with password "root"`);
            } catch (err) {
                if (err.code !== '42710') { // User already exists
                    console.log(`⚠️  Could not create user "users": ${err.message}`);
                }
            }
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        rl.close();
        process.exit(1);
    } finally {
        client.release();
        await adminPool.end();
    }
    
    // Create tables in the new database
    const dbPool = new Pool({
        user: workingUser,
        password: workingPassword,
        host,
        port,
        database: dbName
    });
    
    const dbClient = await dbPool.connect();
    try {
        await dbClient.query(`
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
            )
        `);
        
        await dbClient.query(`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`);
        await dbClient.query(`CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active)`);
        
        console.log(`✅ Tables created in "${dbName}"`);
        
    } catch (error) {
        console.error('❌ Error creating tables:', error.message);
    } finally {
        dbClient.release();
        await dbPool.end();
    }
    
    console.log('\n✅ Database setup complete!');
    console.log('\n📝 Update your .env file with:');
    console.log(`   DB_USER=${workingUser}`);
    console.log(`   DB_PASSWORD=${workingPassword || '(empty)'}`);
    console.log(`   DB_DATABASE=${dbName}`);
    
    rl.close();
}

setupDatabase().catch(err => {
    console.error('Fatal error:', err);
    rl.close();
    process.exit(1);
});
