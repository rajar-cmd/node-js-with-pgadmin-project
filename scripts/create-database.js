require('dotenv').config();
const { Pool } = require('pg');

// Connect to default 'postgres' database to create our target database
const adminPool = new Pool({
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 5432,
    database: 'postgres' // Connect to default postgres database
});

async function createDatabase() {
    const dbName = process.env.DB_DATABASE || 'new_database';
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
            // Create database
            await client.query(`CREATE DATABASE ${dbName}`);
            console.log(`✅ Database "${dbName}" created successfully`);
        }
        
        // Now connect to the new database and create tables
        const dbPool = new Pool({
            user: process.env.DB_USER || 'postgres',
            password: process.env.DB_PASSWORD || '',
            host: process.env.DB_HOST || 'localhost',
            port: parseInt(process.env.DB_PORT, 10) || 5432,
            database: dbName
        });
        
        const dbClient = await dbPool.connect();
        try {
            // Create users table
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
            
            // Create indexes
            await dbClient.query(`
                CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)
            `);
            await dbClient.query(`
                CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active)
            `);
            
            console.log(`✅ Tables and indexes created in "${dbName}"`);
        } finally {
            dbClient.release();
            await dbPool.end();
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        if (error.code === '3D000') {
            console.error('   Database does not exist and could not be created');
        } else if (error.code === '28P01') {
            console.error('   Authentication failed. Check DB_USER and DB_PASSWORD in .env');
        } else if (error.code === 'ECONNREFUSED') {
            console.error('   Cannot connect to PostgreSQL. Is it running?');
        }
        process.exit(1);
    } finally {
        client.release();
        await adminPool.end();
    }
}

createDatabase();
