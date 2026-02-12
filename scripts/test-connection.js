require('dotenv').config();
const { Pool } = require('pg');

const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 5432,
    database: 'postgres' // Try connecting to default postgres DB first
};

console.log('🔍 Testing PostgreSQL connection...\n');
console.log('Configuration:');
console.log(`  User: ${config.user || '(not set)'}`);
console.log(`  Host: ${config.host}`);
console.log(`  Port: ${config.port}`);
console.log(`  Database: postgres (testing connection)\n`);

const pool = new Pool(config);

pool.on('error', (err) => {
    console.error('❌ Pool error:', err.message);
});

pool.connect()
    .then(async (client) => {
        console.log('✅ Successfully connected to PostgreSQL!');
        
        // Check if target database exists
        const dbName = process.env.DB_DATABASE || 'new_database';
        const dbCheck = await client.query(
            'SELECT 1 FROM pg_database WHERE datname = $1',
            [dbName]
        );
        
        if (dbCheck.rows.length > 0) {
            console.log(`✅ Database "${dbName}" exists`);
        } else {
            console.log(`⚠️  Database "${dbName}" does NOT exist`);
            console.log(`\nTo create it, run:`);
            console.log(`  psql -U ${config.user} -d postgres -c "CREATE DATABASE ${dbName};"`);
        }
        
        client.release();
        await pool.end();
        process.exit(0);
    })
    .catch((err) => {
        console.error('\n❌ Connection failed!\n');
        console.error('Error:', err.message);
        
        if (err.code === '28P01') {
            console.error('\n💡 Password authentication failed.');
            console.error('   Possible solutions:');
            console.error('   1. Check DB_USER and DB_PASSWORD in .env');
            console.error('   2. Try empty password: DB_PASSWORD=');
            console.error('   3. Create the user: CREATE USER users WITH PASSWORD \'root\';');
        } else if (err.code === 'ECONNREFUSED') {
            console.error('\n💡 Cannot connect to PostgreSQL server.');
            console.error('   Is PostgreSQL running?');
        } else if (err.code === '3D000') {
            console.error('\n💡 Database does not exist.');
        } else {
            console.error('\n💡 Error code:', err.code);
        }
        
        process.exit(1);
    });
