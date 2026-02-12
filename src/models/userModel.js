const db = require('../config/database');

class User {
    // Create user
    static async create(userData) {
        const { name, email, password, age, city } = userData;
        const query = `
      INSERT INTO users (name, email, password, age, city)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, name, email, age, city, created_at
    `;
        const values = [name, email, password, age, city];

        try {
            const result = await db.query(query, values);
            return result.rows[0];
        } catch (error) {
            throw error;
        }
    }

    // Get all users with pagination
    static async findAll(page = 1, limit = 10) {
        const offset = (page - 1) * limit;
        const query = `
      SELECT id, name, email, age, city, is_active, created_at 
      FROM users 
      WHERE is_active = true
      ORDER BY created_at DESC
      LIMIT $1 OFFSET $2
    `;

        try {
            const result = await db.query(query, [limit, offset]);

            // Get total count
            const countResult = await db.query('SELECT COUNT(*) FROM users WHERE is_active = true');
            const total = parseInt(countResult.rows[0].count);

            return {
                users: result.rows,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit)
                }
            };
        } catch (error) {
            throw error;
        }
    }

    // Get user by ID
    static async findById(id) {
        const query = `
      SELECT id, name, email, age, city, is_active, created_at 
      FROM users 
      WHERE id = $1 AND is_active = true
    `;

        try {
            const result = await db.query(query, [id]);
            return result.rows[0];
        } catch (error) {
            throw error;
        }
    }

    // Get user by email
    static async findByEmail(email) {
        const query = 'SELECT * FROM users WHERE email = $1 AND is_active = true';

        try {
            const result = await db.query(query, [email]);
            return result.rows[0];
        } catch (error) {
            throw error;
        }
    }

    // Update user
    static async update(id, userData) {
        const { name, age, city } = userData;
        const query = `
      UPDATE users 
      SET name = COALESCE($1, name),
          age = COALESCE($2, age),
          city = COALESCE($3, city),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $4 AND is_active = true
      RETURNING id, name, email, age, city, updated_at
    `;
        const values = [name, age, city, id];

        try {
            const result = await db.query(query, values);
            return result.rows[0];
        } catch (error) {
            throw error;
        }
    }

    // Soft delete
    static async delete(id) {
        const checkQuery = 'SELECT id FROM users WHERE id = $1 AND is_active = true';
        const checkResult = await db.query(checkQuery, [id]);

        if (checkResult.rows.length === 0) {
            return false; 
        }
        const query = `
    UPDATE users 
    SET is_active = false, updated_at = CURRENT_TIMESTAMP 
    WHERE id = $1 AND is_active = true
    RETURNING id
  `;

        try {
            const result = await db.query(query, [id]);
            return result.rowCount > 0;
        } catch (error) {
            throw error;
        }
    }

    static async hardDelete(id) {
        const query = 'DELETE FROM users WHERE id = $1';

        try {
            const result = await db.query(query, [id]);
            return result.rowCount > 0;
        } catch (error) {
            throw error;
        }
    }
}

module.exports = User;