const express = require('express');
const { body, validationResult, query } = require('express-validator');
const auth = require('../middleware/auth');
const Communication = require('../models/Communication');

const router = express.Router();

// @route   GET /api/communications
// @desc    Get all communications with pagination and search
// @access  Private
router.get('/', [
    auth,
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('search').optional().isLength({ min: 1 }).withMessage('Search query must not be empty'),
    query('type').optional().isIn(['Incoming', 'Outgoing']).withMessage('Invalid type'),
    query('channel').optional().isIn(['Email', 'Phone', 'WhatsApp', 'SMS', 'Video Call', 'In-Person', 'Letter', 'Fax']).withMessage('Invalid channel'),
    query('priority').optional().isIn(['Low', 'Medium', 'High', 'Urgent']).withMessage('Invalid priority'),
    query('status').optional().isIn(['Pending', 'In Progress', 'Completed', 'Cancelled']).withMessage('Invalid status'),
    query('client_id').optional().isMongoId().withMessage('Invalid client ID'),
    query('date_from').optional().isISO8601().withMessage('Invalid date format'),
    query('date_to').optional().isISO8601().withMessage('Invalid date format')
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
            type,
            channel,
            priority,
            status,
            client_id,
            date_from,
            date_to
        } = req.query;

        // Build search query
        const searchQuery = {};
        
        if (search) {
            searchQuery.$or = [
                { subject: { $regex: search, $options: 'i' } },
                { summary: { $regex: search, $options: 'i' } },
                { detailed_notes: { $regex: search, $options: 'i' } },
                { client_name: { $regex: search, $options: 'i' } },
                { staff_name: { $regex: search, $options: 'i' } }
            ];
        }

        // Add filters
        if (type) searchQuery.type = type;
        if (channel) searchQuery.channel = channel;
        if (priority) searchQuery.priority = priority;
        if (status) searchQuery.status = status;
        if (client_id) searchQuery.client_id = client_id;

        // Date range filter
        if (date_from || date_to) {
            searchQuery.date = {};
            if (date_from) searchQuery.date.$gte = new Date(date_from);
            if (date_to) searchQuery.date.$lte = new Date(date_to);
        }

        // Role-based filtering
        const userRole = req.user.role;
        if (userRole === 'manager') {
            searchQuery.staff_id = req.user.id;
        } else if (userRole === 'executive') {
            searchQuery.staff_id = req.user.id;
        } else if (userRole === 'staff') {
            searchQuery.staff_id = req.user.id;
        }

        // Execute query
        const communications = await Communication.find(searchQuery)
            .populate('client_id', 'name email phone')
            .populate('staff_id', 'fullName email phone')
            .sort({ date: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        const total = await Communication.countDocuments(searchQuery);

        res.json({
            success: true,
            data: {
                communications,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / limit)
                }
            }
        });

    } catch (error) {
        console.error('Get communications error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching communications'
        });
    }
});

// @route   GET /api/communications/:id
// @desc    Get communication by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
    try {
        const communication = await Communication.findById(req.params.id)
            .populate('client_id', 'name email phone type')
            .populate('staff_id', 'fullName email phone designation');

        if (!communication) {
            return res.status(404).json({
                success: false,
                message: 'Communication not found'
            });
        }

        // Check access permissions
        const userRole = req.user.role;
        if (userRole === 'manager' && communication.staff_id?.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }
        if (userRole === 'executive' && communication.staff_id?.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }
        if (userRole === 'staff' && communication.staff_id?.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        res.json({
            success: true,
            data: { communication }
        });

    } catch (error) {
        console.error('Get communication error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching communication'
        });
    }
});

// @route   POST /api/communications
// @desc    Create new communication
// @access  Private
router.post('/', [
    auth,
    body('client_id').isMongoId().withMessage('Valid client ID is required'),
    body('type').isIn(['Incoming', 'Outgoing']).withMessage('Type must be Incoming or Outgoing'),
    body('channel').isIn(['Email', 'Phone', 'WhatsApp', 'SMS', 'Video Call', 'In-Person', 'Letter', 'Fax']).withMessage('Invalid channel'),
    body('subject').optional().isLength({ max: 200 }).withMessage('Subject must not exceed 200 characters'),
    body('summary').optional().isLength({ max: 500 }).withMessage('Summary must not exceed 500 characters'),
    body('priority').optional().isIn(['Low', 'Medium', 'High', 'Urgent']).withMessage('Invalid priority'),
    body('service_category').optional().isLength({ max: 100 }).withMessage('Service category must not exceed 100 characters')
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

        const communicationData = {
            ...req.body,
            staff_id: req.user.id,
            staff_name: req.user.fullName || req.user.username,
            created_by: req.user.id,
            updated_by: req.user.id
        };

        const communication = new Communication(communicationData);
        await communication.save();

        // Populate the created communication
        await communication.populate([
            { path: 'client_id', select: 'name email phone type' },
            { path: 'staff_id', select: 'fullName email phone designation' }
        ]);

        res.status(201).json({
            success: true,
            message: 'Communication created successfully',
            data: { communication }
        });

    } catch (error) {
        console.error('Create communication error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while creating communication'
        });
    }
});

// @route   PUT /api/communications/:id
// @desc    Update communication
// @access  Private
router.put('/:id', [
    auth,
    body('subject').optional().isLength({ max: 200 }).withMessage('Subject must not exceed 200 characters'),
    body('summary').optional().isLength({ max: 500 }).withMessage('Summary must not exceed 500 characters'),
    body('detailed_notes').optional().isLength({ max: 2000 }).withMessage('Detailed notes must not exceed 2000 characters'),
    body('priority').optional().isIn(['Low', 'Medium', 'High', 'Urgent']).withMessage('Invalid priority'),
    body('status').optional().isIn(['Pending', 'In Progress', 'Completed', 'Cancelled']).withMessage('Invalid status'),
    body('satisfaction_rating').optional().isInt({ min: 1, max: 5 }).withMessage('Satisfaction rating must be between 1 and 5')
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

        const communication = await Communication.findById(req.params.id);
        if (!communication) {
            return res.status(404).json({
                success: false,
                message: 'Communication not found'
            });
        }

        // Check access permissions
        const userRole = req.user.role;
        if (userRole === 'manager' && communication.staff_id?.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }
        if (userRole === 'executive' && communication.staff_id?.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }
        if (userRole === 'staff' && communication.staff_id?.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        // Update communication
        Object.assign(communication, req.body);
        communication.updated_by = req.user.id;
        await communication.save();

        // Populate the updated communication
        await communication.populate([
            { path: 'client_id', select: 'name email phone type' },
            { path: 'staff_id', select: 'fullName email phone designation' }
        ]);

        res.json({
            success: true,
            message: 'Communication updated successfully',
            data: { communication }
        });

    } catch (error) {
        console.error('Update communication error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while updating communication'
        });
    }
});

// @route   DELETE /api/communications/:id
// @desc    Delete communication
// @access  Private
router.delete('/:id', auth, async (req, res) => {
    try {
        const communication = await Communication.findById(req.params.id);
        if (!communication) {
            return res.status(404).json({
                success: false,
                message: 'Communication not found'
            });
        }

        // Check access permissions
        const userRole = req.user.role;
        if (userRole === 'manager' && communication.staff_id?.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }
        if (userRole === 'executive' && communication.staff_id?.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }
        if (userRole === 'staff' && communication.staff_id?.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        await Communication.findByIdAndDelete(req.params.id);

        res.json({
            success: true,
            message: 'Communication deleted successfully'
        });

    } catch (error) {
        console.error('Delete communication error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while deleting communication'
        });
    }
});

// @route   GET /api/communications/stats/overview
// @desc    Get communication statistics overview
// @access  Private
router.get('/stats/overview', auth, async (req, res) => {
    try {
        const userId = req.user.id;
        const userRole = req.user.role;

        // Base query based on user role
        let baseQuery = {};
        if (userRole === 'manager' || userRole === 'executive' || userRole === 'staff') {
            baseQuery.staff_id = userId;
        }

        const stats = await Communication.aggregate([
            { $match: baseQuery },
            {
                $group: {
                    _id: null,
                    total: { $sum: 1 },
                    incoming: {
                        $sum: { $cond: [{ $eq: ['$type', 'Incoming'] }, 1, 0] }
                    },
                    outgoing: {
                        $sum: { $cond: [{ $eq: ['$type', 'Outgoing'] }, 1, 0] }
                    },
                    pending: {
                        $sum: { $cond: [{ $eq: ['$status', 'Pending'] }, 1, 0] }
                    },
                    completed: {
                        $sum: { $cond: [{ $eq: ['$status', 'Completed'] }, 1, 0] }
                    },
                    avgSatisfaction: { $avg: '$satisfaction_rating' },
                    avgResponseTime: { $avg: '$response_time_hours' }
                }
            }
        ]);

        const channelStats = await Communication.aggregate([
            { $match: baseQuery },
            {
                $group: {
                    _id: '$channel',
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { count: -1 }
            }
        ]);

        res.json({
            success: true,
            data: {
                overview: stats[0] || {
                    total: 0,
                    incoming: 0,
                    outgoing: 0,
                    pending: 0,
                    completed: 0,
                    avgSatisfaction: 0,
                    avgResponseTime: 0
                },
                byChannel: channelStats
            }
        });

    } catch (error) {
        console.error('Communication stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching communication statistics'
        });
    }
});

module.exports = router;