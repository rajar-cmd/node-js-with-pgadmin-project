const { Pool } = require('pg');
require('dotenv').config();

// Validate required environment variables
const getDbConfig = () => {
    // Support DATABASE_URL (e.g., for Heroku, Supabase, etc.)
    if (process.env.DATABASE_URL) {
        return {
            connectionString: process.env.DATABASE_URL,
            ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
            max: 20,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 10000
        };
    }

    const required = ['DB_USER', 'DB_PASSWORD', 'DB_HOST', 'DB_DATABASE'];
    const missing = required.filter((key) => !process.env[key]);

    if (missing.length > 0) {
        throw new Error(
            `Missing required database environment variables: ${missing.join(', ')}. ` +
                'Please create a .env file (copy .env.example) and set these values.'
        );
    }

    return {
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        host: process.env.DB_HOST,
        port: parseInt(process.env.DB_PORT, 10) || 5432,
        database: process.env.DB_DATABASE,
        ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000
    };
};

let pool;
try {
    pool = new Pool(getDbConfig());
} catch (err) {
    console.error('Database configuration error:', err.message);
    process.exit(1);
}

// Test database connection on startup
pool.on('connect', () => {
    console.log('Database connected successfully');
});

pool.on('error', (err) => {
    console.error('Unexpected database pool error:', err.message);
});

// Verify connection works before app starts
const verifyConnection = async () => {
    try {
        const client = await pool.connect();
        await client.query('SELECT NOW()');
        client.release();
        console.log('Database connection verified');
    } catch (err) {
        console.error('Failed to connect to database:', err.message);
        if (err.code) {
            console.error('Error code:', err.code);
        }
        console.error('\nTroubleshooting tips:');
        console.error('- Ensure PostgreSQL is running');
        console.error('- Check DB_HOST, DB_PORT in .env (default port: 5432)');
        console.error('- Verify DB_USER and DB_PASSWORD are correct');
        console.error('- Ensure the database exists: createdb your_db_name');
        if (process.env.DB_SSL === 'true' || process.env.DATABASE_URL) {
            console.error('- For cloud DBs, try DB_SSL=true in .env');
        }
        throw err; // Re-throw so server doesn't start
    }
};

module.exports = {
    query: (text, params) => pool.query(text, params),
    pool,
    verifyConnection
};
