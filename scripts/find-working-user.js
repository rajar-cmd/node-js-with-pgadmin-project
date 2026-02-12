require('dotenv').config();
const { Pool } = require('pg');

const host = process.env.DB_HOST || 'localhost';
const port = parseInt(process.env.DB_PORT, 10) || 5432;
const dbName = process.env.DB_DATABASE || 'new_database';

// Common PostgreSQL user/password combinations to try
const credentialsToTry = [
    { user: 'postgres', password: '' },
    { user: 'postgres', password: 'postgres' },
    { user: 'postgres', password: 'root' },
    { user: process.env.USER || 'gurramrajareddy', password: '' },
    { user: 'users', password: 'root' },
    { user: 'users', password: '' },
];

console.log('🔍 Testing PostgreSQL connections to find working credentials...\n');
console.log(`Target: ${host}:${port}\n`);

let workingCreds = null;

async function testConnection(user, password) {
    const pool = new Pool({
        user,
        password,
        host,
        port,
        database: 'postgres' // Try connecting to default postgres DB
    });
    
    try {
        const client = await pool.connect();
        await client.query('SELECT current_user, current_database()');
        client.release();
        await pool.end();
        return true;
    } catch (error) {
        await pool.end();
        return false;
    }
}

async function findWorkingUser() {
    for (const creds of credentialsToTry) {
        process.stdout.write(`Testing user "${creds.user}" with password "${creds.password || '(empty)'}"... `);
        if (await testConnection(creds.user, creds.password)) {
            console.log('✅ SUCCESS!');
            workingCreds = creds;
            break;
        } else {
            console.log('❌ Failed');
        }
    }
    
    if (!workingCreds) {
        console.log('\n❌ Could not connect with any tested credentials.');
        console.log('\nPlease check:');
        console.log('1. PostgreSQL is running');
        console.log('2. You can connect via pgAdmin4');
        console.log('3. What username/password you use in pgAdmin4');
        console.log('\nThen update your .env file with the correct credentials.');
        process.exit(1);
    }
    
    console.log(`\n✅ Found working credentials:`);
    console.log(`   User: ${workingCreds.user}`);
    console.log(`   Password: ${workingCreds.password || '(empty)'}`);
    
    // Check if target database exists
    const pool = new Pool({
        user: workingCreds.user,
        password: workingCreds.password,
        host,
        port,
        database: 'postgres'
    });
    
    try {
        const client = await pool.connect();
        const dbCheck = await client.query(
            'SELECT 1 FROM pg_database WHERE datname = $1',
            [dbName]
        );
        
        if (dbCheck.rows.length > 0) {
            console.log(`✅ Database "${dbName}" exists`);
        } else {
            console.log(`⚠️  Database "${dbName}" does NOT exist`);
            console.log(`\nTo create it in pgAdmin4:`);
            console.log(`   1. Right-click "Databases" → Create → Database`);
            console.log(`   2. Name: ${dbName}`);
            console.log(`   3. Owner: ${workingCreds.user}`);
        }
        
        // Check if users table exists in the target database
        if (dbCheck.rows.length > 0) {
            const dbPool = new Pool({
                user: workingCreds.user,
                password: workingCreds.password,
                host,
                port,
                database: dbName
            });
            
            try {
                const dbClient = await dbPool.connect();
                const tableCheck = await dbClient.query(`
                    SELECT EXISTS (
                        SELECT FROM information_schema.tables 
                        WHERE table_schema = 'public' 
                        AND table_name = 'users'
                    )
                `);
                
                if (tableCheck.rows[0].exists) {
                    console.log(`✅ Table "users" exists`);
                } else {
                    console.log(`⚠️  Table "users" does NOT exist`);
                    console.log(`\nRun this SQL in pgAdmin4 Query Tool:`);
                    console.log(`\nCREATE TABLE users (`);
                    console.log(`    id SERIAL PRIMARY KEY,`);
                    console.log(`    name VARCHAR(255) NOT NULL,`);
                    console.log(`    email VARCHAR(255) NOT NULL UNIQUE,`);
                    console.log(`    password VARCHAR(255) NOT NULL,`);
                    console.log(`    age INTEGER,`);
                    console.log(`    city VARCHAR(255),`);
                    console.log(`    is_active BOOLEAN DEFAULT true,`);
                    console.log(`    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,`);
                    console.log(`    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`);
                    console.log(`);`);
                }
                
                dbClient.release();
                await dbPool.end();
            } catch (err) {
                // Database exists but can't connect - might be permission issue
                console.log(`⚠️  Cannot access database "${dbName}": ${err.message}`);
            }
        }
        
        client.release();
        await pool.end();
    } catch (error) {
        console.error('Error:', error.message);
    }
    
    console.log(`\n📝 Update your .env file:`);
    console.log(`DB_USER=${workingCreds.user}`);
    console.log(`DB_PASSWORD=${workingCreds.password || ''}`);
    console.log(`DB_DATABASE=${dbName}`);
}

findWorkingUser().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
