const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Authentication middleware
 * Verifies JWT token and adds user to request object
 */
const auth = async (req, res, next) => {
    try {
        // Get token from header
        const authHeader = req.header('Authorization');
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'No token provided, authorization denied'
            });
        }

        // Extract token
        const token = authHeader.substring(7); // Remove 'Bearer ' prefix

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Find user
        const user = await User.findById(decoded.userId).select('-password');
        
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Token is not valid, user not found'
            });
        }

        if (!user.isActive) {
            return res.status(401).json({
                success: false,
                message: 'Account is deactivated'
            });
        }

        // Add user to request object
        req.user = {
            id: user._id,
            username: user.username,
            email: user.email,
            role: user.role,
            permissions: user.permissions
        };

        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Token is not valid'
            });
        }
        
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token has expired'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Server error during authentication'
        });
    }
};

/**
 * Authorization middleware
 * Checks if user has required permissions
 */
const authorize = (...permissions) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        // Admin has all permissions
        if (req.user.role === 'admin' || req.user.permissions.includes('all')) {
            return next();
        }

        // Check if user has any of the required permissions
        const hasPermission = permissions.some(permission => 
            req.user.permissions.includes(permission)
        );

        if (!hasPermission) {
            return res.status(403).json({
                success: false,
                message: 'Insufficient permissions'
            });
        }

        next();
    };
};

/**
 * Role-based authorization middleware
 * Checks if user has required role
 */
const requireRole = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Insufficient role privileges'
            });
        }

        next();
    };
};

/**
 * Optional authentication middleware
 * Adds user to request if token is valid, but doesn't require it
 */
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.header('Authorization');
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return next();
        }

        const token = authHeader.substring(7);
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        const user = await User.findById(decoded.userId).select('-password');
        
        if (user && user.isActive) {
            req.user = {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
                permissions: user.permissions
            };
        }

        next();
    } catch (error) {
        // Continue without user if token is invalid
        next();
    }
};

/**
 * Resource ownership middleware
 * Checks if user owns the resource or has admin privileges
 */
const requireOwnership = (resourceModel, paramName = 'id') => {
    return async (req, res, next) => {
        try {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required'
                });
            }

            // Admin can access all resources
            if (req.user.role === 'admin') {
                return next();
            }

            const resourceId = req.params[paramName];
            const resource = await resourceModel.findById(resourceId);

            if (!resource) {
                return res.status(404).json({
                    success: false,
                    message: 'Resource not found'
                });
            }

            // Check if user owns the resource
            const ownerField = resource.createdBy || resource.user || resource.assignedTo;
            
            if (ownerField && ownerField.toString() === req.user.id.toString()) {
                return next();
            }

            // Check if user is assigned to the resource
            if (resource.assignedTo && resource.assignedTo.toString() === req.user.id.toString()) {
                return next();
            }

            return res.status(403).json({
                success: false,
                message: 'Access denied. You can only access your own resources.'
            });

        } catch (error) {
            console.error('Ownership check error:', error);
            res.status(500).json({
                success: false,
                message: 'Server error during ownership check'
            });
        }
    };
};

/**
 * Rate limiting middleware
 * Prevents abuse by limiting requests per user
 */
const rateLimit = (windowMs = 15 * 60 * 1000, maxRequests = 100) => {
    const requests = new Map();

    return (req, res, next) => {
        const userId = req.user?.id || req.ip;
        const now = Date.now();
        const windowStart = now - windowMs;

        // Clean up old entries
        for (const [key, timestamps] of requests.entries()) {
            const validTimestamps = timestamps.filter(timestamp => timestamp > windowStart);
            if (validTimestamps.length === 0) {
                requests.delete(key);
            } else {
                requests.set(key, validTimestamps);
            }
        }

        // Check current user's requests
        const userRequests = requests.get(userId) || [];
        const recentRequests = userRequests.filter(timestamp => timestamp > windowStart);

        if (recentRequests.length >= maxRequests) {
            return res.status(429).json({
                success: false,
                message: 'Too many requests, please try again later',
                retryAfter: Math.ceil(windowMs / 1000)
            });
        }

        // Add current request
        recentRequests.push(now);
        requests.set(userId, recentRequests);

        next();
    };
};

/**
 * Audit logging middleware
 * Logs user actions for audit trail
 */
const auditLog = (action) => {
    return (req, res, next) => {
        // Store action for logging after response
        req.auditAction = action;
        req.auditTimestamp = new Date();
        
        next();
    };
};

module.exports = {
    auth,
    authorize,
    requireRole,
    optionalAuth,
    requireOwnership,
    rateLimit,
    auditLog
};