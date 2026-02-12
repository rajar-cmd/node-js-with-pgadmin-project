
const errorHandler = (err, req, res, next) => {
    let error = { ...err };
    error.message = err.message;

    // Log error for debugging
    console.error(err);

    // PostgreSQL duplicate key error
    if (err.code === '23505') {
        error.message = 'Duplicate field value entered';
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }

    // PostgreSQL foreign key error
    if (err.code === '23503') {
        error.message = 'Referenced record does not exist';
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
            success: false,
            message: 'Invalid token'
        });
    }

    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
            success: false,
            message: 'Token expired'
        });
    }

    res.status(err.statusCode || 500).json({
        success: false,
        message: error.message || 'Internal server error'
    });
};

module.exports = errorHandler;