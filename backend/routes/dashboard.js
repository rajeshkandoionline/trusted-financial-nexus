const express = require('express');
const auth = require('../middleware/auth');
const User = require('../models/User');
const Client = require('../models/Client');
const Communication = require('../models/Communication');
const Task = require('../models/Task');

const router = express.Router();

// @route   GET /api/dashboard/kpis
// @desc    Get dashboard KPIs
// @access  Private
router.get('/kpis', auth, async (req, res) => {
    try {
        const userId = req.user.id;
        const userRole = req.user.role;

        // Get date ranges
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

        // Base query based on user role
        let clientQuery = {};
        let taskQuery = {};
        let communicationQuery = {};

        if (userRole === 'manager') {
            clientQuery = { assigned_manager: userId };
            taskQuery = { assignedTo: userId };
            communicationQuery = { staff_id: userId };
        } else if (userRole === 'executive') {
            clientQuery = { assigned_executive: userId };
            taskQuery = { assignedTo: userId };
            communicationQuery = { staff_id: userId };
        } else if (userRole === 'staff') {
            taskQuery = { assignedTo: userId };
            communicationQuery = { staff_id: userId };
        }

        // Get KPIs in parallel
        const [
            totalClients,
            activeClients,
            monthlyRevenue,
            lastMonthRevenue,
            pendingTasks,
            completedTasks,
            totalCommunications,
            avgSatisfaction
        ] = await Promise.all([
            // Total clients
            Client.countDocuments(clientQuery),
            
            // Active clients
            Client.countDocuments({ ...clientQuery, status: 'Active' }),
            
            // Monthly revenue (mock data - replace with actual revenue calculation)
            calculateMonthlyRevenue(clientQuery, startOfMonth, now),
            
            // Last month revenue
            calculateMonthlyRevenue(clientQuery, startOfLastMonth, endOfLastMonth),
            
            // Pending tasks
            Task.countDocuments({ ...taskQuery, status: { $in: ['Pending', 'In Progress'] } }),
            
            // Completed tasks this month
            Task.countDocuments({
                ...taskQuery,
                status: 'Completed',
                completedAt: { $gte: startOfMonth }
            }),
            
            // Total communications this month
            Communication.countDocuments({
                ...communicationQuery,
                date: { $gte: startOfMonth }
            }),
            
            // Average client satisfaction
            Client.aggregate([
                { $match: clientQuery },
                { $group: { _id: null, avgRating: { $avg: '$satisfaction_rating' } } }
            ])
        ]);

        // Calculate changes
        const clientChange = totalClients > 0 ? 
            ((activeClients / totalClients) * 100 - 50) : 0; // Mock calculation
        
        const revenueChange = lastMonthRevenue > 0 ? 
            ((monthlyRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 : 0;
        
        const taskChange = completedTasks > 0 ? 
            ((completedTasks / (completedTasks + pendingTasks)) * 100 - 50) : 0; // Mock calculation
        
        const satisfactionChange = avgSatisfaction.length > 0 ? 
            (avgSatisfaction[0].avgRating - 4.0) * 25 : 0; // Mock calculation

        res.json({
            success: true,
            data: {
                totalClients,
                activeClients,
                monthlyRevenue,
                lastMonthRevenue,
                pendingTasks,
                completedTasks,
                totalCommunications,
                satisfactionRating: avgSatisfaction.length > 0 ? avgSatisfaction[0].avgRating : 0,
                clientChange: Math.round(clientChange * 10) / 10,
                revenueChange: Math.round(revenueChange * 10) / 10,
                taskChange: Math.round(taskChange * 10) / 10,
                satisfactionChange: Math.round(satisfactionChange * 10) / 10
            }
        });

    } catch (error) {
        console.error('Dashboard KPIs error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching KPIs'
        });
    }
});

// @route   GET /api/dashboard/revenue
// @desc    Get revenue data for charts
// @access  Private
router.get('/revenue', auth, async (req, res) => {
    try {
        const { period = '30' } = req.query;
        const userId = req.user.id;
        const userRole = req.user.role;

        // Calculate date range
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - parseInt(period));

        // Base query based on user role
        let clientQuery = {};
        if (userRole === 'manager') {
            clientQuery = { assigned_manager: userId };
        } else if (userRole === 'executive') {
            clientQuery = { assigned_executive: userId };
        }

        // Mock revenue data - replace with actual revenue calculation
        const revenueData = generateMockRevenueData(startDate, endDate, parseInt(period));

        res.json({
            success: true,
            data: revenueData
        });

    } catch (error) {
        console.error('Revenue data error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching revenue data'
        });
    }
});

// @route   GET /api/dashboard/clients
// @desc    Get client distribution data
// @access  Private
router.get('/clients', auth, async (req, res) => {
    try {
        const userId = req.user.id;
        const userRole = req.user.role;

        // Base query based on user role
        let clientQuery = {};
        if (userRole === 'manager') {
            clientQuery = { assigned_manager: userId };
        } else if (userRole === 'executive') {
            clientQuery = { assigned_executive: userId };
        }

        // Get client distribution by type
        const distributionByType = await Client.aggregate([
            { $match: clientQuery },
            { $group: { _id: '$type', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);

        // Get client distribution by risk category
        const distributionByRisk = await Client.aggregate([
            { $match: clientQuery },
            { $group: { _id: '$risk_category', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);

        // Get client distribution by status
        const distributionByStatus = await Client.aggregate([
            { $match: clientQuery },
            { $group: { _id: '$status', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);

        res.json({
            success: true,
            data: {
                byType: distributionByType.reduce((acc, item) => {
                    acc[item._id] = item.count;
                    return acc;
                }, {}),
                byRisk: distributionByRisk.reduce((acc, item) => {
                    acc[item._id] = item.count;
                    return acc;
                }, {}),
                byStatus: distributionByStatus.reduce((acc, item) => {
                    acc[item._id] = item.count;
                    return acc;
                }, {})
            }
        });

    } catch (error) {
        console.error('Client data error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching client data'
        });
    }
});

// @route   GET /api/dashboard/activities
// @desc    Get recent activities
// @access  Private
router.get('/activities', auth, async (req, res) => {
    try {
        const userId = req.user.id;
        const userRole = req.user.role;
        const limit = parseInt(req.query.limit) || 10;

        // Base query based on user role
        let query = {};
        if (userRole === 'manager') {
            query = { $or: [{ createdBy: userId }, { assignedTo: userId }] };
        } else if (userRole === 'executive') {
            query = { $or: [{ createdBy: userId }, { assignedTo: userId }] };
        } else if (userRole === 'staff') {
            query = { $or: [{ createdBy: userId }, { assignedTo: userId }] };
        }

        // Mock activities data - replace with actual activities from various collections
        const activities = generateMockActivities(limit);

        res.json({
            success: true,
            data: activities
        });

    } catch (error) {
        console.error('Activities data error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching activities'
        });
    }
});

// @route   GET /api/dashboard/notifications
// @desc    Get notifications
// @access  Private
router.get('/notifications', auth, async (req, res) => {
    try {
        const userId = req.user.id;
        const limit = parseInt(req.query.limit) || 20;

        // Mock notifications data - replace with actual notifications
        const notifications = generateMockNotifications(userId, limit);

        res.json({
            success: true,
            data: notifications
        });

    } catch (error) {
        console.error('Notifications error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching notifications'
        });
    }
});

// Helper function to calculate monthly revenue
async function calculateMonthlyRevenue(clientQuery, startDate, endDate) {
    // Mock calculation - replace with actual revenue calculation
    const clientCount = await Client.countDocuments(clientQuery);
    return clientCount * 50000; // Mock: 50k per client
}

// Helper function to generate mock revenue data
function generateMockRevenueData(startDate, endDate, days) {
    const data = [];
    const baseAmount = 100000;
    const variance = 0.3;

    for (let i = 0; i < days; i++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);
        
        // Generate random revenue with some trend
        const trend = Math.sin((i / days) * Math.PI * 2) * 0.2;
        const random = (Math.random() - 0.5) * variance;
        const amount = baseAmount * (1 + trend + random);
        
        data.push({
            date: date.toISOString().split('T')[0],
            amount: Math.round(amount)
        });
    }

    return data;
}

// Helper function to generate mock activities
function generateMockActivities(limit) {
    const activityTypes = [
        { type: 'client_added', title: 'New Client Added', description: 'A new client has been added to the system' },
        { type: 'client_updated', title: 'Client Updated', description: 'Client information has been updated' },
        { type: 'task_created', title: 'Task Created', description: 'A new task has been assigned' },
        { type: 'task_completed', title: 'Task Completed', description: 'A task has been marked as completed' },
        { type: 'document_uploaded', title: 'Document Uploaded', description: 'A new document has been uploaded' },
        { type: 'communication_sent', title: 'Communication Sent', description: 'A communication has been sent to client' },
        { type: 'payment_received', title: 'Payment Received', description: 'Payment has been received from client' },
        { type: 'meeting_scheduled', title: 'Meeting Scheduled', description: 'A meeting has been scheduled' },
        { type: 'report_generated', title: 'Report Generated', description: 'A report has been generated' },
        { type: 'system_alert', title: 'System Alert', description: 'A system alert has been triggered' }
    ];

    const activities = [];
    const now = new Date();

    for (let i = 0; i < limit; i++) {
        const activityType = activityTypes[Math.floor(Math.random() * activityTypes.length)];
        const hoursAgo = Math.floor(Math.random() * 24 * 7); // Random time within last week
        const createdAt = new Date(now.getTime() - (hoursAgo * 60 * 60 * 1000));

        activities.push({
            id: `activity_${i + 1}`,
            type: activityType.type,
            title: activityType.title,
            description: activityType.description,
            created_at: createdAt.toISOString(),
            user: {
                name: 'John Doe',
                avatar: null
            }
        });
    }

    return activities.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}

// Helper function to generate mock notifications
function generateMockNotifications(userId, limit) {
    const notificationTypes = [
        { type: 'info', title: 'New Task Assigned', message: 'You have been assigned a new task' },
        { type: 'warning', title: 'Deadline Approaching', message: 'A task deadline is approaching' },
        { type: 'success', title: 'Task Completed', message: 'A task has been completed successfully' },
        { type: 'error', title: 'System Error', message: 'A system error has occurred' },
        { type: 'info', title: 'Client Update', message: 'A client has been updated' },
        { type: 'warning', title: 'Payment Overdue', message: 'A client payment is overdue' },
        { type: 'success', title: 'Payment Received', message: 'Payment has been received' },
        { type: 'info', title: 'Meeting Reminder', message: 'You have a meeting scheduled' }
    ];

    const notifications = [];
    const now = new Date();

    for (let i = 0; i < limit; i++) {
        const notificationType = notificationTypes[Math.floor(Math.random() * notificationTypes.length)];
        const hoursAgo = Math.floor(Math.random() * 24 * 3); // Random time within last 3 days
        const createdAt = new Date(now.getTime() - (hoursAgo * 60 * 60 * 1000));
        const isRead = Math.random() > 0.3; // 70% chance of being read

        notifications.push({
            id: `notification_${i + 1}`,
            type: notificationType.type,
            title: notificationType.title,
            message: notificationType.message,
            read: isRead,
            created_at: createdAt.toISOString(),
            icon: getNotificationIcon(notificationType.type)
        });
    }

    return notifications.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}

// Helper function to get notification icon
function getNotificationIcon(type) {
    const icons = {
        info: 'info-circle',
        warning: 'exclamation-triangle',
        success: 'check-circle',
        error: 'times-circle'
    };
    return icons[type] || 'bell';
}

module.exports = router;