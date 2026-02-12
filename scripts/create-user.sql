-- Run this script as a PostgreSQL superuser (usually 'postgres' or your macOS username)
-- Connect with: psql -U postgres -d postgres
-- OR: psql -U $(whoami) -d postgres

-- Create the user
CREATE USER users WITH PASSWORD 'root';

-- Create the database
CREATE DATABASE new_database;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE new_database TO users;

-- Connect to the new database and grant schema privileges
\c new_database
GRANT ALL ON SCHEMA public TO users;

-- Create the users table
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

\q
