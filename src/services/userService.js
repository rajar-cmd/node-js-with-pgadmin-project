
const User = require('../models/userModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const ApiError = require('../utils/apiError');

class UserService {
    // Register new user
    async register(userData) {
        // Check if user exists
        const existingUser = await User.findByEmail(userData.email);
        if (existingUser) {
            throw new ApiError(400, 'User already exists with this email');
        }

        // Hash password
        const salt = await bcrypt.genSalt(parseInt(process.env.BCRYPT_ROUNDS));
        const hashedPassword = await bcrypt.hash(userData.password, salt);

        // Create user
        const newUser = await User.create({
            ...userData,
            password: hashedPassword
        });

        // Generate token
        const token = this.generateToken(newUser.id);

        return { user: newUser, token };
    }

    // Login user
    async login(email, password) {
        const user = await User.findByEmail(email);
        if (!user) {
            throw new ApiError(401, 'Invalid credentials');
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            throw new ApiError(401, 'Invalid credentials');
        }

        const token = this.generateToken(user.id);

        return {
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                age: user.age,
                city: user.city
            },
            token
        };
    }

    // Generate JWT token
    generateToken(userId) {
        return jwt.sign(
            { userId },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRE }
        );
    }

    // Get all users
    async getAllUsers(page, limit) {
        return await User.findAll(page, limit);
    }

    // Get user by ID
    async getUserById(id) {
        const user = await User.findById(id);
        if (!user) {
            throw new ApiError(404, 'User not found');
        }
        return user;
    }

    // Update user
    async updateUser(id, userData) {
        const user = await User.findById(id);
        if (!user) {
            throw new ApiError(404, 'User not found');
        }
        return await User.update(id, userData);
    }

    // Delete user (PERMANENT delete from DB)
    async deleteUser(id) {
        const userId = Number(id);

        if (!Number.isInteger(userId)) {
            throw new ApiError(400, 'Invalid user ID');
        }

        // Hard delete: remove the row completely
        const deleted = await User.hardDelete(userId);

        if (!deleted) {
            // No row was deleted => user doesn't exist
            throw new ApiError(404, 'User not found');
        }

        return true;
    }
}

module.exports = new UserService();