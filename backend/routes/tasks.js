const express = require('express');
const { body, validationResult, query } = require('express-validator');
const auth = require('../middleware/auth');
const Task = require('../models/Task');

const router = express.Router();

// @route   GET /api/tasks
// @desc    Get all tasks with pagination and search
// @access  Private
router.get('/', [
    auth,
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('search').optional().isLength({ min: 1 }).withMessage('Search query must not be empty'),
    query('status').optional().isIn(['Pending', 'In Progress', 'Completed', 'Cancelled', 'On Hold']).withMessage('Invalid status'),
    query('priority').optional().isIn(['Low', 'Medium', 'High', 'Urgent']).withMessage('Invalid priority'),
    query('assigned_to').optional().isMongoId().withMessage('Invalid assigned user ID'),
    query('client_id').optional().isMongoId().withMessage('Invalid client ID'),
    query('due_date_from').optional().isISO8601().withMessage('Invalid date format'),
    query('due_date_to').optional().isISO8601().withMessage('Invalid date format')
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
            status,
            priority,
            assigned_to,
            client_id,
            due_date_from,
            due_date_to
        } = req.query;

        // Build search query
        const searchQuery = {};
        
        if (search) {
            searchQuery.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { tags: { $regex: search, $options: 'i' } }
            ];
        }

        // Add filters
        if (status) searchQuery.status = status;
        if (priority) searchQuery.priority = priority;
        if (assigned_to) searchQuery.assigned_to = assigned_to;
        if (client_id) searchQuery.client_id = client_id;

        // Due date range filter
        if (due_date_from || due_date_to) {
            searchQuery.due_date = {};
            if (due_date_from) searchQuery.due_date.$gte = new Date(due_date_from);
            if (due_date_to) searchQuery.due_date.$lte = new Date(due_date_to);
        }

        // Role-based filtering
        const userRole = req.user.role;
        if (userRole === 'manager' || userRole === 'executive' || userRole === 'staff') {
            searchQuery.assigned_to = req.user.id;
        }

        // Execute query
        const tasks = await Task.find(searchQuery)
            .populate('assigned_to', 'fullName email phone')
            .populate('client_id', 'name email phone')
            .populate('created_by', 'fullName email')
            .populate('updated_by', 'fullName email')
            .sort({ due_date: 1, priority: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        const total = await Task.countDocuments(searchQuery);

        res.json({
            success: true,
            data: {
                tasks,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / limit)
                }
            }
        });

    } catch (error) {
        console.error('Get tasks error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching tasks'
        });
    }
});

// @route   GET /api/tasks/:id
// @desc    Get task by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
    try {
        const task = await Task.findById(req.params.id)
            .populate('assigned_to', 'fullName email phone designation')
            .populate('client_id', 'name email phone type')
            .populate('created_by', 'fullName email')
            .populate('updated_by', 'fullName email');

        if (!task) {
            return res.status(404).json({
                success: false,
                message: 'Task not found'
            });
        }

        // Check access permissions
        const userRole = req.user.role;
        if (userRole === 'manager' && task.assigned_to?.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }
        if (userRole === 'executive' && task.assigned_to?.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }
        if (userRole === 'staff' && task.assigned_to?.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        res.json({
            success: true,
            data: { task }
        });

    } catch (error) {
        console.error('Get task error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching task'
        });
    }
});

// @route   POST /api/tasks
// @desc    Create new task
// @access  Private
router.post('/', [
    auth,
    body('title').notEmpty().withMessage('Task title is required'),
    body('description').optional().isLength({ max: 1000 }).withMessage('Description must not exceed 1000 characters'),
    body('assigned_to').isMongoId().withMessage('Valid assigned user ID is required'),
    body('client_id').optional().isMongoId().withMessage('Valid client ID is required'),
    body('priority').optional().isIn(['Low', 'Medium', 'High', 'Urgent']).withMessage('Invalid priority'),
    body('due_date').optional().isISO8601().withMessage('Valid due date is required'),
    body('estimated_hours').optional().isNumeric().withMessage('Estimated hours must be a number')
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

        const taskData = {
            ...req.body,
            created_by: req.user.id,
            updated_by: req.user.id
        };

        const task = new Task(taskData);
        await task.save();

        // Populate the created task
        await task.populate([
            { path: 'assigned_to', select: 'fullName email phone designation' },
            { path: 'client_id', select: 'name email phone type' },
            { path: 'created_by', select: 'fullName email' }
        ]);

        res.status(201).json({
            success: true,
            message: 'Task created successfully',
            data: { task }
        });

    } catch (error) {
        console.error('Create task error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while creating task'
        });
    }
});

// @route   PUT /api/tasks/:id
// @desc    Update task
// @access  Private
router.put('/:id', [
    auth,
    body('title').optional().notEmpty().withMessage('Task title cannot be empty'),
    body('description').optional().isLength({ max: 1000 }).withMessage('Description must not exceed 1000 characters'),
    body('priority').optional().isIn(['Low', 'Medium', 'High', 'Urgent']).withMessage('Invalid priority'),
    body('status').optional().isIn(['Pending', 'In Progress', 'Completed', 'Cancelled', 'On Hold']).withMessage('Invalid status'),
    body('due_date').optional().isISO8601().withMessage('Valid due date is required'),
    body('estimated_hours').optional().isNumeric().withMessage('Estimated hours must be a number'),
    body('actual_hours').optional().isNumeric().withMessage('Actual hours must be a number')
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

        const task = await Task.findById(req.params.id);
        if (!task) {
            return res.status(404).json({
                success: false,
                message: 'Task not found'
            });
        }

        // Check access permissions
        const userRole = req.user.role;
        if (userRole === 'manager' && task.assigned_to?.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }
        if (userRole === 'executive' && task.assigned_to?.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }
        if (userRole === 'staff' && task.assigned_to?.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        // Update task
        Object.assign(task, req.body);
        task.updated_by = req.user.id;

        // Set completion date if status is being changed to completed
        if (req.body.status === 'Completed' && task.status !== 'Completed') {
            task.completed_at = new Date();
        }

        await task.save();

        // Populate the updated task
        await task.populate([
            { path: 'assigned_to', select: 'fullName email phone designation' },
            { path: 'client_id', select: 'name email phone type' },
            { path: 'updated_by', select: 'fullName email' }
        ]);

        res.json({
            success: true,
            message: 'Task updated successfully',
            data: { task }
        });

    } catch (error) {
        console.error('Update task error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while updating task'
        });
    }
});

// @route   DELETE /api/tasks/:id
// @desc    Delete task
// @access  Private
router.delete('/:id', auth, async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);
        if (!task) {
            return res.status(404).json({
                success: false,
                message: 'Task not found'
            });
        }

        // Check access permissions
        const userRole = req.user.role;
        if (userRole === 'manager' && task.assigned_to?.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }
        if (userRole === 'executive' && task.assigned_to?.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }
        if (userRole === 'staff' && task.assigned_to?.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        await Task.findByIdAndDelete(req.params.id);

        res.json({
            success: true,
            message: 'Task deleted successfully'
        });

    } catch (error) {
        console.error('Delete task error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while deleting task'
        });
    }
});

// @route   GET /api/tasks/stats/overview
// @desc    Get task statistics overview
// @access  Private
router.get('/stats/overview', auth, async (req, res) => {
    try {
        const userId = req.user.id;
        const userRole = req.user.role;

        // Base query based on user role
        let baseQuery = {};
        if (userRole === 'manager' || userRole === 'executive' || userRole === 'staff') {
            baseQuery.assigned_to = userId;
        }

        const stats = await Task.aggregate([
            { $match: baseQuery },
            {
                $group: {
                    _id: null,
                    total: { $sum: 1 },
                    pending: {
                        $sum: { $cond: [{ $eq: ['$status', 'Pending'] }, 1, 0] }
                    },
                    inProgress: {
                        $sum: { $cond: [{ $eq: ['$status', 'In Progress'] }, 1, 0] }
                    },
                    completed: {
                        $sum: { $cond: [{ $eq: ['$status', 'Completed'] }, 1, 0] }
                    },
                    cancelled: {
                        $sum: { $cond: [{ $eq: ['$status', 'Cancelled'] }, 1, 0] }
                    },
                    onHold: {
                        $sum: { $cond: [{ $eq: ['$status', 'On Hold'] }, 1, 0] }
                    },
                    overdue: {
                        $sum: {
                            $cond: [
                                {
                                    $and: [
                                        { $ne: ['$status', 'Completed'] },
                                        { $ne: ['$status', 'Cancelled'] },
                                        { $lt: ['$due_date', new Date()] }
                                    ]
                                },
                                1,
                                0
                            ]
                        }
                    },
                    totalEstimatedHours: { $sum: '$estimated_hours' },
                    totalActualHours: { $sum: '$actual_hours' }
                }
            }
        ]);

        const priorityStats = await Task.aggregate([
            { $match: baseQuery },
            {
                $group: {
                    _id: '$priority',
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
                    pending: 0,
                    inProgress: 0,
                    completed: 0,
                    cancelled: 0,
                    onHold: 0,
                    overdue: 0,
                    totalEstimatedHours: 0,
                    totalActualHours: 0
                },
                byPriority: priorityStats
            }
        });

    } catch (error) {
        console.error('Task stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching task statistics'
        });
    }
});

module.exports = router;