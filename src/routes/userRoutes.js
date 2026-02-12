
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { validateUser, validateLogin } = require('../middlewares/validation');
const { protect } = require('../middlewares/auth');

// Public routes
router.post('/register', validateUser, userController.register);
router.post('/login', validateLogin, userController.login);

// Protected routes
router.use(protect); // All routes below require authentication
router.get('/', userController.getAllUsers);
router.get('/:id', userController.getUserById);
router.put('/:id', userController.updateUser);
router.delete('/:id', userController.deleteUser);

module.exports = router;