const express = require('express');
const { body, validationResult, query } = require('express-validator');
const auth = require('../middleware/auth');
const User = require('../models/User');

const router = express.Router();

// @route   GET /api/staff
// @desc    Get all staff members
// @access  Private
router.get('/', [
    auth,
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('search').optional().isLength({ min: 1 }).withMessage('Search query must not be empty'),
    query('role').optional().isIn(['manager', 'executive', 'staff']).withMessage('Invalid role'),
    query('department').optional().isLength({ min: 1 }).withMessage('Department must not be empty'),
    query('isActive').optional().isBoolean().withMessage('isActive must be boolean')
], async (req, res) => {
    try {
        // Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const {
            page = 1,
            limit = 10,
            search = '',
            role,
            department,
            isActive
        } = req.query;

        // Build search query for staff only
        const searchQuery = {
            role: { $in: ['manager', 'executive', 'staff'] }
        };
        
        if (search) {
            searchQuery.$or = [
                { fullName: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { designation: { $regex: search, $options: 'i' } },
                { department: { $regex: search, $options: 'i' } }
            ];
        }

        // Add filters
        if (role) searchQuery.role = role;
        if (department) searchQuery.department = { $regex: department, $options: 'i' };
        if (isActive !== undefined) searchQuery.isActive = isActive === 'true';

        // Execute query
        const staff = await User.find(searchQuery)
            .select('-password')
            .populate('createdBy', 'fullName email')
            .populate('updatedBy', 'fullName email')
            .sort({ fullName: 1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        const total = await User.countDocuments(searchQuery);

        res.json({
            success: true,
            data: {
                staff,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / limit)
                }
            }
        });

    } catch (error) {
        console.error('Get staff error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching staff'
        });
    }
});

// @route   GET /api/staff/:id
// @desc    Get staff member by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
    try {
        const staff = await User.findById(req.params.id)
            .select('-password')
            .populate('createdBy', 'fullName email')
            .populate('updatedBy', 'fullName email');

        if (!staff) {
            return res.status(404).json({
                success: false,
                message: 'Staff member not found'
            });
        }

        // Check if user is staff member
        if (!['manager', 'executive', 'staff'].includes(staff.role)) {
            return res.status(404).json({
                success: false,
                message: 'Staff member not found'
            });
        }

        res.json({
            success: true,
            data: { staff }
        });

    } catch (error) {
        console.error('Get staff error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching staff member'
        });
    }
});

// @route   GET /api/staff/stats/overview
// @desc    Get staff statistics overview
// @access  Private
router.get('/stats/overview', auth, async (req, res) => {
    try {
        const stats = await User.aggregate([
            {
                $match: {
                    role: { $in: ['manager', 'executive', 'staff'] }
                }
            },
            {
                $group: {
                    _id: '$role',
                    count: { $sum: 1 },
                    active: {
                        $sum: { $cond: ['$isActive', 1, 0] }
                    }
                }
            }
        ]);

        const departmentStats = await User.aggregate([
            {
                $match: {
                    role: { $in: ['manager', 'executive', 'staff'] }
                }
            },
            {
                $group: {
                    _id: '$department',
                    count: { $sum: 1 },
                    active: {
                        $sum: { $cond: ['$isActive', 1, 0] }
                    }
                }
            },
            {
                $sort: { count: -1 }
            }
        ]);

        res.json({
            success: true,
            data: {
                byRole: stats,
                byDepartment: departmentStats
            }
        });

    } catch (error) {
        console.error('Staff stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching staff statistics'
        });
    }
});

module.exports = router;