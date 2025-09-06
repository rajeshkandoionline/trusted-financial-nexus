/**
 * Authentication Controller
 * Handles user authentication, registration, and session management
 */

const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

class AuthController {
    /**
     * Register a new user
     */
    async register(req, res) {
        try {
            const { username, email, password, role, permissions } = req.body;

            // Check if user already exists
            const existingUser = await User.findOne({
                $or: [{ email }, { username }]
            });

            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    message: 'User already exists with this email or username'
                });
            }

            // Create new user
            const user = new User({
                username,
                email,
                password,
                role: role || 'staff',
                permissions: permissions || []
            });

            await user.save();

            // Generate JWT token
            const token = jwt.sign(
                { userId: user._id, role: user.role },
                process.env.JWT_SECRET,
                { expiresIn: '24h' }
            );

            res.status(201).json({
                success: true,
                message: 'User registered successfully',
                data: {
                    user: {
                        id: user._id,
                        username: user.username,
                        email: user.email,
                        role: user.role,
                        permissions: user.permissions
                    },
                    token
                }
            });

        } catch (error) {
            console.error('Registration error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error during registration'
            });
        }
    }

    /**
     * Login user
     */
    async login(req, res) {
        try {
            const { username, password, remember } = req.body;

            // Find user by username or email
            const user = await User.findOne({
                $or: [{ username }, { email: username }]
            });

            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid credentials'
                });
            }

            // Check if user is active
            if (!user.is_active) {
                return res.status(401).json({
                    success: false,
                    message: 'Account is deactivated'
                });
            }

            // Check password
            const isPasswordValid = await user.matchPassword(password);
            if (!isPasswordValid) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid credentials'
                });
            }

            // Update last login
            user.last_login = new Date();
            await user.save();

            // Generate JWT token
            const tokenExpiry = remember ? '30d' : '24h';
            const token = jwt.sign(
                { userId: user._id, role: user.role },
                process.env.JWT_SECRET,
                { expiresIn: tokenExpiry }
            );

            res.json({
                success: true,
                message: 'Login successful',
                data: {
                    user: {
                        id: user._id,
                        username: user.username,
                        email: user.email,
                        role: user.role,
                        permissions: user.permissions,
                        last_login: user.last_login
                    },
                    token
                }
            });

        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error during login'
            });
        }
    }

    /**
     * Verify JWT token
     */
    async verifyToken(req, res) {
        try {
            const token = req.headers.authorization?.replace('Bearer ', '');

            if (!token) {
                return res.status(401).json({
                    success: false,
                    message: 'No token provided'
                });
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findById(decoded.userId).select('-password');

            if (!user || !user.is_active) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid or expired token'
                });
            }

            res.json({
                success: true,
                data: {
                    user: {
                        id: user._id,
                        username: user.username,
                        email: user.email,
                        role: user.role,
                        permissions: user.permissions,
                        last_login: user.last_login
                    }
                }
            });

        } catch (error) {
            console.error('Token verification error:', error);
            res.status(401).json({
                success: false,
                message: 'Invalid or expired token'
            });
        }
    }

    /**
     * Logout user
     */
    async logout(req, res) {
        try {
            // In a more sophisticated implementation, you might want to blacklist the token
            // For now, we'll just return success as the client will remove the token
            res.json({
                success: true,
                message: 'Logout successful'
            });
        } catch (error) {
            console.error('Logout error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error during logout'
            });
        }
    }

    /**
     * Change password
     */
    async changePassword(req, res) {
        try {
            const { currentPassword, newPassword } = req.body;
            const userId = req.user.userId;

            const user = await User.findById(userId);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            // Verify current password
            const isCurrentPasswordValid = await user.matchPassword(currentPassword);
            if (!isCurrentPasswordValid) {
                return res.status(400).json({
                    success: false,
                    message: 'Current password is incorrect'
                });
            }

            // Update password
            user.password = newPassword;
            await user.save();

            res.json({
                success: true,
                message: 'Password changed successfully'
            });

        } catch (error) {
            console.error('Change password error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error during password change'
            });
        }
    }

    /**
     * Request password reset
     */
    async requestPasswordReset(req, res) {
        try {
            const { email } = req.body;

            const user = await User.findOne({ email });
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found with this email'
                });
            }

            // Generate reset token
            const resetToken = jwt.sign(
                { userId: user._id, type: 'password_reset' },
                process.env.JWT_SECRET,
                { expiresIn: '1h' }
            );

            // In a real implementation, you would send this token via email
            // For now, we'll just return it (in development only)
            res.json({
                success: true,
                message: 'Password reset token generated',
                data: {
                    resetToken: process.env.NODE_ENV === 'development' ? resetToken : undefined
                }
            });

        } catch (error) {
            console.error('Password reset request error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error during password reset request'
            });
        }
    }

    /**
     * Reset password with token
     */
    async resetPassword(req, res) {
        try {
            const { token, newPassword } = req.body;

            // Verify reset token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            if (decoded.type !== 'password_reset') {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid reset token'
                });
            }

            const user = await User.findById(decoded.userId);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            // Update password
            user.password = newPassword;
            await user.save();

            res.json({
                success: true,
                message: 'Password reset successfully'
            });

        } catch (error) {
            console.error('Password reset error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error during password reset'
            });
        }
    }

    /**
     * Get user profile
     */
    async getProfile(req, res) {
        try {
            const userId = req.user.userId;
            const user = await User.findById(userId).select('-password');

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            res.json({
                success: true,
                data: { user }
            });

        } catch (error) {
            console.error('Get profile error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error while fetching profile'
            });
        }
    }

    /**
     * Update user profile
     */
    async updateProfile(req, res) {
        try {
            const userId = req.user.userId;
            const { username, email, name } = req.body;

            const user = await User.findById(userId);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            // Update allowed fields
            if (username) user.username = username;
            if (email) user.email = email;
            if (name) user.name = name;

            user.updated_at = new Date();
            await user.save();

            res.json({
                success: true,
                message: 'Profile updated successfully',
                data: {
                    user: {
                        id: user._id,
                        username: user.username,
                        email: user.email,
                        name: user.name,
                        role: user.role,
                        permissions: user.permissions
                    }
                }
            });

        } catch (error) {
            console.error('Update profile error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error while updating profile'
            });
        }
    }
}

module.exports = new AuthController();