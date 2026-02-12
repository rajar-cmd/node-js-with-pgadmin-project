const userService = require('../services/userService');

class UserController {
    // Register
    async register(req, res, next) {
        try {
            const result = await userService.register(req.body);
            res.status(201).json({
                success: true,
                message: 'User registered successfully',
                data: result
            });
        } catch (error) {
            next(error);
        }
    }

    // Login
    async login(req, res, next) {
        try {
            const { email, password } = req.body;
            const result = await userService.login(email, password);
            res.status(200).json({
                success: true,
                message: 'Login successful',
                data: result
            });
        } catch (error) {
            next(error);
        }
    }

    // Get all users
    async getAllUsers(req, res, next) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;

            const result = await userService.getAllUsers(page, limit);
            res.status(200).json({
                success: true,
                data: result
            });
        } catch (error) {
            next(error);
        }
    }

    // Get user by ID
    async getUserById(req, res, next) {
        try {
            const user = await userService.getUserById(req.params.id);
            res.status(200).json({
                success: true,
                data: user
            });
        } catch (error) {
            next(error);
        }
    }

    // Update user
    async updateUser(req, res, next) {
        try {
            const user = await userService.updateUser(req.params.id, req.body);
            res.status(200).json({
                success: true,
                message: 'User updated successfully',
                data: user
            });
        } catch (error) {
            next(error);
        }
    }

    // Delete user - FIXED with better error handling
    async deleteUser(req, res, next) {
        try {
            const userId = parseInt(req.params.id);

            if (isNaN(userId)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid user ID format'
                });
            }

            const result = await userService.deleteUser(userId);

            res.status(200).json({
                success: true,
                message: 'User deleted successfully',
                data: { result }
            });
        } catch (error) {
            if (error.message === 'User not found') {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }
            next(error);
        }
    }
}

module.exports = new UserController();