/**
 * Communication Controller
 * Handles communication management operations
 */

const Communication = require('../models/Communication');
const Client = require('../models/Client');
const User = require('../models/User');

class CommunicationController {
    /**
     * Get all communications with pagination and filtering
     */
    async getCommunications(req, res) {
        try {
            const {
                page = 1,
                limit = 10,
                search = '',
                type = '',
                channel = '',
                status = '',
                priority = '',
                client_id = '',
                staff_id = '',
                start_date = '',
                end_date = '',
                sortBy = 'date',
                sortOrder = 'desc'
            } = req.query;

            // Build query
            const query = {};
            
            if (search) {
                query.$or = [
                    { subject: { $regex: search, $options: 'i' } },
                    { summary: { $regex: search, $options: 'i' } },
                    { detailed_notes: { $regex: search, $options: 'i' } }
                ];
            }
            
            if (type) query.type = type;
            if (channel) query.channel = channel;
            if (status) query.status = status;
            if (priority) query.priority = priority;
            if (client_id) query.client_id = client_id;
            if (staff_id) query.staff_id = staff_id;

            // Date range filter
            if (start_date || end_date) {
                query.date = {};
                if (start_date) query.date.$gte = new Date(start_date);
                if (end_date) query.date.$lte = new Date(end_date);
            }

            // Role-based filtering
            const userRole = req.user.role;
            if (userRole === 'manager') {
                // Managers can see communications from their team
                const teamMembers = await User.find({ reporting_manager: req.user.userId }).select('_id');
                const teamMemberIds = teamMembers.map(member => member._id);
                query.staff_id = { $in: teamMemberIds };
            } else if (userRole === 'executive') {
                // Executives can see their own communications
                query.staff_id = req.user.userId;
            } else if (userRole === 'staff') {
                // Staff can see their own communications
                query.staff_id = req.user.userId;
            } else if (userRole === 'client') {
                // Clients can see communications about them
                query.client_id = req.user.userId;
            }

            // Build sort object
            const sort = {};
            sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

            // Execute query with pagination
            const communications = await Communication.find(query)
                .populate('client_id', 'name email phone')
                .populate('staff_id', 'username email')
                .populate('follow_up_assigned_to', 'username email')
                .sort(sort)
                .limit(limit * 1)
                .skip((page - 1) * limit);

            const total = await Communication.countDocuments(query);

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
                message: 'Internal server error while fetching communications'
            });
        }
    }

    /**
     * Get communication by ID
     */
    async getCommunicationById(req, res) {
        try {
            const { id } = req.params;

            const communication = await Communication.findById(id)
                .populate('client_id', 'name email phone')
                .populate('staff_id', 'username email')
                .populate('follow_up_assigned_to', 'username email')
                .populate('created_by', 'username email')
                .populate('updated_by', 'username email');

            if (!communication) {
                return res.status(404).json({
                    success: false,
                    message: 'Communication not found'
                });
            }

            // Check access permissions
            const userRole = req.user.role;
            if (userRole === 'executive' && communication.staff_id._id.toString() !== req.user.userId) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied'
                });
            }
            if (userRole === 'staff' && communication.staff_id._id.toString() !== req.user.userId) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied'
                });
            }
            if (userRole === 'client' && communication.client_id._id.toString() !== req.user.userId) {
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
                message: 'Internal server error while fetching communication'
            });
        }
    }

    /**
     * Create new communication
     */
    async createCommunication(req, res) {
        try {
            const communicationData = req.body;

            // Validate required fields
            if (!communicationData.client_id || !communicationData.staff_id) {
                return res.status(400).json({
                    success: false,
                    message: 'Client and staff are required'
                });
            }

            // Verify client exists
            const client = await Client.findById(communicationData.client_id);
            if (!client) {
                return res.status(404).json({
                    success: false,
                    message: 'Client not found'
                });
            }

            // Verify staff exists
            const staff = await User.findById(communicationData.staff_id);
            if (!staff) {
                return res.status(404).json({
                    success: false,
                    message: 'Staff member not found'
                });
            }

            // Set default values
            communicationData.date = communicationData.date || new Date();
            communicationData.status = communicationData.status || 'Pending';
            communicationData.priority = communicationData.priority || 'Medium';
            communicationData.client_name = client.name;
            communicationData.staff_name = staff.username;
            communicationData.created_by = req.user.userId;

            const communication = new Communication(communicationData);
            await communication.save();

            // Populate the created communication
            await communication.populate([
                { path: 'client_id', select: 'name email phone' },
                { path: 'staff_id', select: 'username email' },
                { path: 'created_by', select: 'username email' }
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
                message: 'Internal server error while creating communication'
            });
        }
    }

    /**
     * Update communication
     */
    async updateCommunication(req, res) {
        try {
            const { id } = req.params;
            const updateData = req.body;

            const communication = await Communication.findById(id);
            if (!communication) {
                return res.status(404).json({
                    success: false,
                    message: 'Communication not found'
                });
            }

            // Check access permissions
            const userRole = req.user.role;
            if (userRole === 'executive' && communication.staff_id.toString() !== req.user.userId) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied'
                });
            }
            if (userRole === 'staff' && communication.staff_id.toString() !== req.user.userId) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied'
                });
            }

            // Update communication data
            Object.keys(updateData).forEach(key => {
                if (updateData[key] !== undefined) {
                    communication[key] = updateData[key];
                }
            });

            communication.updated_by = req.user.userId;
            communication.updated_at = new Date();
            await communication.save();

            // Populate the updated communication
            await communication.populate([
                { path: 'client_id', select: 'name email phone' },
                { path: 'staff_id', select: 'username email' },
                { path: 'updated_by', select: 'username email' }
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
                message: 'Internal server error while updating communication'
            });
        }
    }

    /**
     * Delete communication
     */
    async deleteCommunication(req, res) {
        try {
            const { id } = req.params;

            const communication = await Communication.findById(id);
            if (!communication) {
                return res.status(404).json({
                    success: false,
                    message: 'Communication not found'
                });
            }

            // Check access permissions
            const userRole = req.user.role;
            if (userRole === 'executive' && communication.staff_id.toString() !== req.user.userId) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied'
                });
            }
            if (userRole === 'staff' && communication.staff_id.toString() !== req.user.userId) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied'
                });
            }

            await Communication.findByIdAndDelete(id);

            res.json({
                success: true,
                message: 'Communication deleted successfully'
            });

        } catch (error) {
            console.error('Delete communication error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error while deleting communication'
            });
        }
    }

    /**
     * Get communication statistics
     */
    async getCommunicationStats(req, res) {
        try {
            const { period = '30' } = req.query;
            const userId = req.user.userId;
            const userRole = req.user.role;

            // Calculate date range
            const endDate = new Date();
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - parseInt(period));

            // Build query based on user role
            let query = { date: { $gte: startDate, $lte: endDate } };
            
            if (userRole === 'manager') {
                const teamMembers = await User.find({ reporting_manager: userId }).select('_id');
                const teamMemberIds = teamMembers.map(member => member._id);
                query.staff_id = { $in: teamMemberIds };
            } else if (userRole === 'executive' || userRole === 'staff') {
                query.staff_id = userId;
            } else if (userRole === 'client') {
                query.client_id = userId;
            }

            const [
                totalCommunications,
                incomingCommunications,
                outgoingCommunications,
                completedCommunications,
                pendingCommunications,
                channelBreakdown,
                priorityBreakdown,
                responseTimeStats
            ] = await Promise.all([
                Communication.countDocuments(query),
                Communication.countDocuments({ ...query, type: 'Incoming' }),
                Communication.countDocuments({ ...query, type: 'Outgoing' }),
                Communication.countDocuments({ ...query, status: 'Completed' }),
                Communication.countDocuments({ ...query, status: 'Pending' }),
                Communication.aggregate([
                    { $match: query },
                    { $group: { _id: '$channel', count: { $sum: 1 } } },
                    { $sort: { count: -1 } }
                ]),
                Communication.aggregate([
                    { $match: query },
                    { $group: { _id: '$priority', count: { $sum: 1 } } },
                    { $sort: { count: -1 } }
                ]),
                Communication.aggregate([
                    { $match: { ...query, response_time_hours: { $exists: true } } },
                    { $group: { _id: null, avgResponseTime: { $avg: '$response_time_hours' } } }
                ])
            ]);

            res.json({
                success: true,
                data: {
                    totalCommunications,
                    incomingCommunications,
                    outgoingCommunications,
                    completedCommunications,
                    pendingCommunications,
                    completionRate: totalCommunications > 0 ? Math.round((completedCommunications / totalCommunications) * 100) : 0,
                    channelBreakdown: channelBreakdown.reduce((acc, item) => {
                        acc[item._id] = item.count;
                        return acc;
                    }, {}),
                    priorityBreakdown: priorityBreakdown.reduce((acc, item) => {
                        acc[item._id] = item.count;
                        return acc;
                    }, {}),
                    averageResponseTime: responseTimeStats.length > 0 ? responseTimeStats[0].avgResponseTime : 0
                }
            });

        } catch (error) {
            console.error('Get communication stats error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error while fetching communication statistics'
            });
        }
    }

    /**
     * Get communication analytics
     */
    async getCommunicationAnalytics(req, res) {
        try {
            const { period = '30' } = req.query;
            const userId = req.user.userId;
            const userRole = req.user.role;

            // Calculate date range
            const endDate = new Date();
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - parseInt(period));

            // Build query based on user role
            let query = { date: { $gte: startDate, $lte: endDate } };
            
            if (userRole === 'manager') {
                const teamMembers = await User.find({ reporting_manager: userId }).select('_id');
                const teamMemberIds = teamMembers.map(member => member._id);
                query.staff_id = { $in: teamMemberIds };
            } else if (userRole === 'executive' || userRole === 'staff') {
                query.staff_id = userId;
            } else if (userRole === 'client') {
                query.client_id = userId;
            }

            // Daily communication trends
            const dailyTrends = await Communication.aggregate([
                { $match: query },
                {
                    $group: {
                        _id: {
                            year: { $year: '$date' },
                            month: { $month: '$date' },
                            day: { $dayOfMonth: '$date' }
                        },
                        count: { $sum: 1 }
                    }
                },
                { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
            ]);

            // Channel effectiveness
            const channelEffectiveness = await Communication.aggregate([
                { $match: query },
                {
                    $group: {
                        _id: '$channel',
                        total: { $sum: 1 },
                        completed: { $sum: { $cond: [{ $eq: ['$status', 'Completed'] }, 1, 0] } },
                        avgSatisfaction: { $avg: '$satisfaction_rating' }
                    }
                },
                {
                    $project: {
                        channel: '$_id',
                        total: 1,
                        completed: 1,
                        completionRate: { $multiply: [{ $divide: ['$completed', '$total'] }, 100] },
                        avgSatisfaction: 1
                    }
                },
                { $sort: { completionRate: -1 } }
            ]);

            // Staff performance
            const staffPerformance = await Communication.aggregate([
                { $match: query },
                {
                    $group: {
                        _id: '$staff_id',
                        total: { $sum: 1 },
                        completed: { $sum: { $cond: [{ $eq: ['$status', 'Completed'] }, 1, 0] } },
                        avgSatisfaction: { $avg: '$satisfaction_rating' },
                        avgResponseTime: { $avg: '$response_time_hours' }
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
                        avgSatisfaction: 1,
                        avgResponseTime: 1
                    }
                },
                { $sort: { completionRate: -1 } }
            ]);

            res.json({
                success: true,
                data: {
                    dailyTrends,
                    channelEffectiveness,
                    staffPerformance
                }
            });

        } catch (error) {
            console.error('Get communication analytics error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error while fetching communication analytics'
            });
        }
    }

    /**
     * Mark communication as completed
     */
    async completeCommunication(req, res) {
        try {
            const { id } = req.params;
            const { completion_notes } = req.body;

            const communication = await Communication.findById(id);
            if (!communication) {
                return res.status(404).json({
                    success: false,
                    message: 'Communication not found'
                });
            }

            // Check access permissions
            const userRole = req.user.role;
            if (userRole === 'executive' && communication.staff_id.toString() !== req.user.userId) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied'
                });
            }
            if (userRole === 'staff' && communication.staff_id.toString() !== req.user.userId) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied'
                });
            }

            communication.status = 'Completed';
            if (completion_notes) {
                communication.detailed_notes = communication.detailed_notes + '\n\nCompletion Notes: ' + completion_notes;
            }
            communication.updated_by = req.user.userId;
            communication.updated_at = new Date();

            await communication.save();

            res.json({
                success: true,
                message: 'Communication marked as completed'
            });

        } catch (error) {
            console.error('Complete communication error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error while completing communication'
            });
        }
    }

    /**
     * Get follow-up communications
     */
    async getFollowUpCommunications(req, res) {
        try {
            const { page = 1, limit = 10 } = req.query;
            const userId = req.user.userId;
            const userRole = req.user.role;

            // Build query for follow-up communications
            let query = { follow_up_required: true, follow_up_completed: false };
            
            if (userRole === 'manager') {
                const teamMembers = await User.find({ reporting_manager: userId }).select('_id');
                const teamMemberIds = teamMembers.map(member => member._id);
                query.$or = [
                    { staff_id: { $in: teamMemberIds } },
                    { follow_up_assigned_to: { $in: teamMemberIds } }
                ];
            } else if (userRole === 'executive' || userRole === 'staff') {
                query.$or = [
                    { staff_id: userId },
                    { follow_up_assigned_to: userId }
                ];
            }

            const communications = await Communication.find(query)
                .populate('client_id', 'name email phone')
                .populate('staff_id', 'username email')
                .populate('follow_up_assigned_to', 'username email')
                .sort({ follow_up_date: 1 })
                .limit(limit * 1)
                .skip((page - 1) * limit);

            const total = await Communication.countDocuments(query);

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
            console.error('Get follow-up communications error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error while fetching follow-up communications'
            });
        }
    }
}

module.exports = new CommunicationController();