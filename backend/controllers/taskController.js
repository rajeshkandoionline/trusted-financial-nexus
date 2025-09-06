/**
 * Task Controller
 * Handles task management operations
 */

const Task = require('../models/Task');
const Client = require('../models/Client');
const User = require('../models/User');

class TaskController {
    /**
     * Get all tasks with pagination and filtering
     */
    async getTasks(req, res) {
        try {
            const {
                page = 1,
                limit = 10,
                search = '',
                status = '',
                priority = '',
                client_id = '',
                assigned_to = '',
                project = '',
                start_date = '',
                end_date = '',
                sortBy = 'created_at',
                sortOrder = 'desc'
            } = req.query;

            // Build query
            const query = {};
            
            if (search) {
                query.$or = [
                    { name: { $regex: search, $options: 'i' } },
                    { description: { $regex: search, $options: 'i' } },
                    { project: { $regex: search, $options: 'i' } }
                ];
            }
            
            if (status) query.status = status;
            if (priority) query.priority = priority;
            if (client_id) query.client = client_id;
            if (project) query.project = { $regex: project, $options: 'i' };

            // Date range filter
            if (start_date || end_date) {
                query.created_at = {};
                if (start_date) query.created_at.$gte = new Date(start_date);
                if (end_date) query.created_at.$lte = new Date(end_date);
            }

            // Role-based filtering
            const userRole = req.user.role;
            if (userRole === 'manager') {
                // Managers can see tasks assigned to their team
                const teamMembers = await User.find({ reporting_manager: req.user.userId }).select('_id');
                const teamMemberIds = teamMembers.map(member => member._id);
                query.assigned_to = { $in: teamMemberIds };
            } else if (userRole === 'executive') {
                // Executives can see their own tasks
                query.assigned_to = req.user.userId;
            } else if (userRole === 'staff') {
                // Staff can see their own tasks
                query.assigned_to = req.user.userId;
            } else if (userRole === 'client') {
                // Clients can see tasks related to them
                query.client = req.user.userId;
            }

            // Assigned to filter
            if (assigned_to) {
                query.assigned_to = assigned_to;
            }

            // Build sort object
            const sort = {};
            sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

            // Execute query with pagination
            const tasks = await Task.find(query)
                .populate('client', 'name email phone')
                .populate('assigned_to', 'username email')
                .populate('created_by', 'username email')
                .sort(sort)
                .limit(limit * 1)
                .skip((page - 1) * limit);

            const total = await Task.countDocuments(query);

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
                message: 'Internal server error while fetching tasks'
            });
        }
    }

    /**
     * Get task by ID
     */
    async getTaskById(req, res) {
        try {
            const { id } = req.params;

            const task = await Task.findById(id)
                .populate('client', 'name email phone')
                .populate('assigned_to', 'username email')
                .populate('created_by', 'username email');

            if (!task) {
                return res.status(404).json({
                    success: false,
                    message: 'Task not found'
                });
            }

            // Check access permissions
            const userRole = req.user.role;
            if (userRole === 'executive' && !task.assigned_to.some(assignee => assignee._id.toString() === req.user.userId)) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied'
                });
            }
            if (userRole === 'staff' && !task.assigned_to.some(assignee => assignee._id.toString() === req.user.userId)) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied'
                });
            }
            if (userRole === 'client' && task.client._id.toString() !== req.user.userId) {
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
                message: 'Internal server error while fetching task'
            });
        }
    }

    /**
     * Create new task
     */
    async createTask(req, res) {
        try {
            const taskData = req.body;

            // Validate required fields
            if (!taskData.name || !taskData.assigned_to || taskData.assigned_to.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Task name and assigned users are required'
                });
            }

            // Verify client exists if provided
            if (taskData.client) {
                const client = await Client.findById(taskData.client);
                if (!client) {
                    return res.status(404).json({
                        success: false,
                        message: 'Client not found'
                    });
                }
            }

            // Verify assigned users exist
            const assignedUsers = await User.find({ _id: { $in: taskData.assigned_to } });
            if (assignedUsers.length !== taskData.assigned_to.length) {
                return res.status(404).json({
                    success: false,
                    message: 'One or more assigned users not found'
                });
            }

            // Set default values
            taskData.status = taskData.status || 'Pending';
            taskData.priority = taskData.priority || 'Medium';
            taskData.created_by = req.user.userId;

            const task = new Task(taskData);
            await task.save();

            // Populate the created task
            await task.populate([
                { path: 'client', select: 'name email phone' },
                { path: 'assigned_to', select: 'username email' },
                { path: 'created_by', select: 'username email' }
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
                message: 'Internal server error while creating task'
            });
        }
    }

    /**
     * Update task
     */
    async updateTask(req, res) {
        try {
            const { id } = req.params;
            const updateData = req.body;

            const task = await Task.findById(id);
            if (!task) {
                return res.status(404).json({
                    success: false,
                    message: 'Task not found'
                });
            }

            // Check access permissions
            const userRole = req.user.role;
            if (userRole === 'executive' && !task.assigned_to.some(assignee => assignee.toString() === req.user.userId)) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied'
                });
            }
            if (userRole === 'staff' && !task.assigned_to.some(assignee => assignee.toString() === req.user.userId)) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied'
                });
            }

            // Update task data
            Object.keys(updateData).forEach(key => {
                if (updateData[key] !== undefined) {
                    task[key] = updateData[key];
                }
            });

            // Set completion date if status is changed to completed
            if (updateData.status === 'Completed' && task.status !== 'Completed') {
                task.completion_date = new Date();
            }

            task.updated_at = new Date();
            await task.save();

            // Populate the updated task
            await task.populate([
                { path: 'client', select: 'name email phone' },
                { path: 'assigned_to', select: 'username email' }
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
                message: 'Internal server error while updating task'
            });
        }
    }

    /**
     * Delete task
     */
    async deleteTask(req, res) {
        try {
            const { id } = req.params;

            const task = await Task.findById(id);
            if (!task) {
                return res.status(404).json({
                    success: false,
                    message: 'Task not found'
                });
            }

            // Check access permissions
            const userRole = req.user.role;
            if (userRole === 'executive' && !task.assigned_to.some(assignee => assignee.toString() === req.user.userId)) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied'
                });
            }
            if (userRole === 'staff' && !task.assigned_to.some(assignee => assignee.toString() === req.user.userId)) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied'
                });
            }

            await Task.findByIdAndDelete(id);

            res.json({
                success: true,
                message: 'Task deleted successfully'
            });

        } catch (error) {
            console.error('Delete task error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error while deleting task'
            });
        }
    }

    /**
     * Get task statistics
     */
    async getTaskStats(req, res) {
        try {
            const { period = '30' } = req.query;
            const userId = req.user.userId;
            const userRole = req.user.role;

            // Calculate date range
            const endDate = new Date();
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - parseInt(period));

            // Build query based on user role
            let query = { created_at: { $gte: startDate, $lte: endDate } };
            
            if (userRole === 'manager') {
                const teamMembers = await User.find({ reporting_manager: userId }).select('_id');
                const teamMemberIds = teamMembers.map(member => member._id);
                query.assigned_to = { $in: teamMemberIds };
            } else if (userRole === 'executive' || userRole === 'staff') {
                query.assigned_to = userId;
            } else if (userRole === 'client') {
                query.client = userId;
            }

            const [
                totalTasks,
                pendingTasks,
                inProgressTasks,
                completedTasks,
                overdueTasks,
                priorityBreakdown,
                statusBreakdown
            ] = await Promise.all([
                Task.countDocuments(query),
                Task.countDocuments({ ...query, status: 'Pending' }),
                Task.countDocuments({ ...query, status: 'In Progress' }),
                Task.countDocuments({ ...query, status: 'Completed' }),
                Task.countDocuments({
                    ...query,
                    status: { $in: ['Pending', 'In Progress'] },
                    due_date: { $lt: new Date() }
                }),
                Task.aggregate([
                    { $match: query },
                    { $group: { _id: '$priority', count: { $sum: 1 } } },
                    { $sort: { count: -1 } }
                ]),
                Task.aggregate([
                    { $match: query },
                    { $group: { _id: '$status', count: { $sum: 1 } } },
                    { $sort: { count: -1 } }
                ])
            ]);

            res.json({
                success: true,
                data: {
                    totalTasks,
                    pendingTasks,
                    inProgressTasks,
                    completedTasks,
                    overdueTasks,
                    completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
                    priorityBreakdown: priorityBreakdown.reduce((acc, item) => {
                        acc[item._id] = item.count;
                        return acc;
                    }, {}),
                    statusBreakdown: statusBreakdown.reduce((acc, item) => {
                        acc[item._id] = item.count;
                        return acc;
                    }, {})
                }
            });

        } catch (error) {
            console.error('Get task stats error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error while fetching task statistics'
            });
        }
    }

    /**
     * Get overdue tasks
     */
    async getOverdueTasks(req, res) {
        try {
            const { page = 1, limit = 10 } = req.query;
            const userId = req.user.userId;
            const userRole = req.user.role;

            // Build query for overdue tasks
            let query = {
                status: { $in: ['Pending', 'In Progress'] },
                due_date: { $lt: new Date() }
            };
            
            if (userRole === 'manager') {
                const teamMembers = await User.find({ reporting_manager: userId }).select('_id');
                const teamMemberIds = teamMembers.map(member => member._id);
                query.assigned_to = { $in: teamMemberIds };
            } else if (userRole === 'executive' || userRole === 'staff') {
                query.assigned_to = userId;
            } else if (userRole === 'client') {
                query.client = userId;
            }

            const tasks = await Task.find(query)
                .populate('client', 'name email phone')
                .populate('assigned_to', 'username email')
                .sort({ due_date: 1 })
                .limit(limit * 1)
                .skip((page - 1) * limit);

            const total = await Task.countDocuments(query);

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
            console.error('Get overdue tasks error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error while fetching overdue tasks'
            });
        }
    }

    /**
     * Update task status
     */
    async updateTaskStatus(req, res) {
        try {
            const { id } = req.params;
            const { status, completion_notes } = req.body;

            const task = await Task.findById(id);
            if (!task) {
                return res.status(404).json({
                    success: false,
                    message: 'Task not found'
                });
            }

            // Check access permissions
            const userRole = req.user.role;
            if (userRole === 'executive' && !task.assigned_to.some(assignee => assignee.toString() === req.user.userId)) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied'
                });
            }
            if (userRole === 'staff' && !task.assigned_to.some(assignee => assignee.toString() === req.user.userId)) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied'
                });
            }

            task.status = status;
            
            if (status === 'Completed') {
                task.completion_date = new Date();
                if (completion_notes) {
                    task.description = task.description + '\n\nCompletion Notes: ' + completion_notes;
                }
            }

            task.updated_at = new Date();
            await task.save();

            res.json({
                success: true,
                message: 'Task status updated successfully'
            });

        } catch (error) {
            console.error('Update task status error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error while updating task status'
            });
        }
    }

    /**
     * Log time for task
     */
    async logTime(req, res) {
        try {
            const { id } = req.params;
            const { time_spent_minutes, notes } = req.body;

            const task = await Task.findById(id);
            if (!task) {
                return res.status(404).json({
                    success: false,
                    message: 'Task not found'
                });
            }

            // Check access permissions
            const userRole = req.user.role;
            if (userRole === 'executive' && !task.assigned_to.some(assignee => assignee.toString() === req.user.userId)) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied'
                });
            }
            if (userRole === 'staff' && !task.assigned_to.some(assignee => assignee.toString() === req.user.userId)) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied'
                });
            }

            task.time_spent_minutes = (task.time_spent_minutes || 0) + time_spent_minutes;
            
            if (notes) {
                task.description = task.description + `\n\nTime Log: ${new Date().toISOString()} - ${time_spent_minutes} minutes - ${notes}`;
            }

            task.updated_at = new Date();
            await task.save();

            res.json({
                success: true,
                message: 'Time logged successfully'
            });

        } catch (error) {
            console.error('Log time error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error while logging time'
            });
        }
    }

    /**
     * Get task analytics
     */
    async getTaskAnalytics(req, res) {
        try {
            const { period = '30' } = req.query;
            const userId = req.user.userId;
            const userRole = req.user.role;

            // Calculate date range
            const endDate = new Date();
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - parseInt(period));

            // Build query based on user role
            let query = { created_at: { $gte: startDate, $lte: endDate } };
            
            if (userRole === 'manager') {
                const teamMembers = await User.find({ reporting_manager: userId }).select('_id');
                const teamMemberIds = teamMembers.map(member => member._id);
                query.assigned_to = { $in: teamMemberIds };
            } else if (userRole === 'executive' || userRole === 'staff') {
                query.assigned_to = userId;
            } else if (userRole === 'client') {
                query.client = userId;
            }

            // Daily task trends
            const dailyTrends = await Task.aggregate([
                { $match: query },
                {
                    $group: {
                        _id: {
                            year: { $year: '$created_at' },
                            month: { $month: '$created_at' },
                            day: { $dayOfMonth: '$created_at' }
                        },
                        count: { $sum: 1 }
                    }
                },
                { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
            ]);

            // Staff performance
            const staffPerformance = await Task.aggregate([
                { $match: query },
                { $unwind: '$assigned_to' },
                {
                    $group: {
                        _id: '$assigned_to',
                        total: { $sum: 1 },
                        completed: { $sum: { $cond: [{ $eq: ['$status', 'Completed'] }, 1, 0] } },
                        avgTimeSpent: { $avg: '$time_spent_minutes' }
                    }
                },
                {
                    $lookup: {
                        from: 'users',
                        localField: '_id',
                        foreignField: '_id',
                        as: 'staff'
                    }
                },
                {
                    $project: {
                        staff: { $arrayElemAt: ['$staff', 0] },
                        total: 1,
                        completed: 1,
                        completionRate: { $multiply: [{ $divide: ['$completed', '$total'] }, 100] },
                        avgTimeSpent: 1
                    }
                },
                { $sort: { completionRate: -1 } }
            ]);

            res.json({
                success: true,
                data: {
                    dailyTrends,
                    staffPerformance
                }
            });

        } catch (error) {
            console.error('Get task analytics error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error while fetching task analytics'
            });
        }
    }
}

module.exports = new TaskController();