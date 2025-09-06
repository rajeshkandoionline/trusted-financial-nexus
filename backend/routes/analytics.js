const express = require('express');
const { body, validationResult, query } = require('express-validator');
const auth = require('../middleware/auth');
const Client = require('../models/Client');
const User = require('../models/User');
const Communication = require('../models/Communication');
const Task = require('../models/Task');
const Document = require('../models/Document');

const router = express.Router();

// @route   GET /api/analytics/dashboard
// @desc    Get analytics data for dashboard
// @access  Private
router.get('/dashboard', auth, async (req, res) => {
    try {
        const userId = req.user.id;
        const userRole = req.user.role;

        // Get analytics data in parallel
        const [
            clientAnalytics,
            taskAnalytics,
            communicationAnalytics,
            revenueAnalytics,
            performanceAnalytics
        ] = await Promise.all([
            getClientAnalytics(userId, userRole),
            getTaskAnalytics(userId, userRole),
            getCommunicationAnalytics(userId, userRole),
            getRevenueAnalytics(userId, userRole),
            getPerformanceAnalytics(userId, userRole)
        ]);

        res.json({
            success: true,
            data: {
                clients: clientAnalytics,
                tasks: taskAnalytics,
                communications: communicationAnalytics,
                revenue: revenueAnalytics,
                performance: performanceAnalytics
            }
        });

    } catch (error) {
        console.error('Dashboard analytics error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching dashboard analytics'
        });
    }
});

// @route   GET /api/analytics/trends
// @desc    Get trend analytics
// @access  Private
router.get('/trends', [
    auth,
    query('period').optional().isIn(['7d', '30d', '90d', '1y']).withMessage('Invalid period'),
    query('metric').optional().isIn(['revenue', 'clients', 'tasks', 'communications']).withMessage('Invalid metric')
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

        const { period = '30d', metric = 'revenue' } = req.query;
        const userId = req.user.id;
        const userRole = req.user.role;

        let trendData = {};

        switch (metric) {
            case 'revenue':
                trendData = await getRevenueTrends(period, userId, userRole);
                break;
            case 'clients':
                trendData = await getClientTrends(period, userId, userRole);
                break;
            case 'tasks':
                trendData = await getTaskTrends(period, userId, userRole);
                break;
            case 'communications':
                trendData = await getCommunicationTrends(period, userId, userRole);
                break;
            default:
                return res.status(400).json({
                    success: false,
                    message: 'Invalid metric'
                });
        }

        res.json({
            success: true,
            data: trendData
        });

    } catch (error) {
        console.error('Trend analytics error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching trend analytics'
        });
    }
});

// @route   GET /api/analytics/performance
// @desc    Get performance analytics
// @access  Private
router.get('/performance', [
    auth,
    query('start_date').optional().isISO8601().withMessage('Invalid start date format'),
    query('end_date').optional().isISO8601().withMessage('Invalid end date format'),
    query('staff_id').optional().isMongoId().withMessage('Invalid staff ID')
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

        const { start_date, end_date, staff_id } = req.query;
        const userId = req.user.id;
        const userRole = req.user.role;

        const performanceData = await getPerformanceAnalytics(userId, userRole, {
            startDate: start_date ? new Date(start_date) : null,
            endDate: end_date ? new Date(end_date) : null,
            staffId: staff_id
        });

        res.json({
            success: true,
            data: performanceData
        });

    } catch (error) {
        console.error('Performance analytics error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching performance analytics'
        });
    }
});

// @route   GET /api/analytics/predictions
// @desc    Get predictive analytics
// @access  Private
router.get('/predictions', [
    auth,
    query('metric').isIn(['revenue', 'clients', 'tasks', 'workload']).withMessage('Invalid metric'),
    query('period').optional().isIn(['1m', '3m', '6m', '1y']).withMessage('Invalid period')
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

        const { metric, period = '3m' } = req.query;
        const userId = req.user.id;
        const userRole = req.user.role;

        let predictionData = {};

        switch (metric) {
            case 'revenue':
                predictionData = await getRevenuePredictions(period, userId, userRole);
                break;
            case 'clients':
                predictionData = await getClientPredictions(period, userId, userRole);
                break;
            case 'tasks':
                predictionData = await getTaskPredictions(period, userId, userRole);
                break;
            case 'workload':
                predictionData = await getWorkloadPredictions(period, userId, userRole);
                break;
            default:
                return res.status(400).json({
                    success: false,
                    message: 'Invalid metric'
                });
        }

        res.json({
            success: true,
            data: predictionData
        });

    } catch (error) {
        console.error('Prediction analytics error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching prediction analytics'
        });
    }
});

// @route   GET /api/analytics/benchmarks
// @desc    Get benchmark analytics
// @access  Private
router.get('/benchmarks', [
    auth,
    query('category').optional().isIn(['industry', 'peer', 'historical']).withMessage('Invalid category')
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

        const { category = 'industry' } = req.query;
        const userId = req.user.id;
        const userRole = req.user.role;

        const benchmarkData = await getBenchmarkAnalytics(category, userId, userRole);

        res.json({
            success: true,
            data: benchmarkData
        });

    } catch (error) {
        console.error('Benchmark analytics error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching benchmark analytics'
        });
    }
});

// Helper function to get client analytics
async function getClientAnalytics(userId, userRole) {
    // Build query based on user role
    let clientQuery = {};
    if (userRole === 'manager') {
        clientQuery.assigned_manager = userId;
    } else if (userRole === 'executive') {
        clientQuery.assigned_executive = userId;
    }

    const stats = await Client.getClientStats();
    const byType = await Client.getClientsByType();
    const byRisk = await Client.getClientsByRisk();

    return {
        total: stats.total,
        active: stats.active,
        inactive: stats.inactive,
        prospects: stats.prospects,
        suspended: stats.suspended,
        avgSatisfaction: stats.avgSatisfaction,
        byType,
        byRisk
    };
}

// Helper function to get task analytics
async function getTaskAnalytics(userId, userRole) {
    // Build query based on user role
    let taskQuery = {};
    if (['manager', 'executive', 'staff'].includes(userRole)) {
        taskQuery.assigned_to = userId;
    }

    const stats = await Task.getTaskStats(taskQuery);
    const byPriority = await Task.getTasksByPriority(taskQuery);
    const overdue = await Task.getOverdueTasks(taskQuery);

    return {
        total: stats.total,
        pending: stats.pending,
        inProgress: stats.inProgress,
        completed: stats.completed,
        cancelled: stats.cancelled,
        onHold: stats.onHold,
        overdue: stats.overdue,
        totalEstimatedHours: stats.totalEstimatedHours,
        totalActualHours: stats.totalActualHours,
        avgProgress: stats.avgProgress,
        byPriority,
        overdueTasks: overdue.length
    };
}

// Helper function to get communication analytics
async function getCommunicationAnalytics(userId, userRole) {
    // Build query based on user role
    let commQuery = {};
    if (['manager', 'executive', 'staff'].includes(userRole)) {
        commQuery.staff_id = userId;
    }

    const stats = await Communication.getCommunicationStats(commQuery);
    const byChannel = await Communication.getCommunicationsByChannel(commQuery);
    const byPriority = await Communication.getCommunicationsByPriority(commQuery);

    return {
        total: stats.total,
        incoming: stats.incoming,
        outgoing: stats.outgoing,
        pending: stats.pending,
        inProgress: stats.inProgress,
        completed: stats.completed,
        cancelled: stats.cancelled,
        avgSatisfaction: stats.avgSatisfaction,
        avgResponseTime: stats.avgResponseTime,
        avgDuration: stats.avgDuration,
        byChannel,
        byPriority
    };
}

// Helper function to get revenue analytics
async function getRevenueAnalytics(userId, userRole) {
    // Mock revenue analytics - replace with actual revenue calculation
    const revenueData = {
        totalRevenue: 1500000,
        monthlyRevenue: 250000,
        growthRate: 12.5,
        byService: [
            { service: 'Audit', revenue: 600000, percentage: 40 },
            { service: 'Tax', revenue: 450000, percentage: 30 },
            { service: 'Consulting', revenue: 300000, percentage: 20 },
            { service: 'Other', revenue: 150000, percentage: 10 }
        ],
        trends: [
            { month: 'Jan', revenue: 200000 },
            { month: 'Feb', revenue: 220000 },
            { month: 'Mar', revenue: 250000 },
            { month: 'Apr', revenue: 230000 },
            { month: 'May', revenue: 270000 },
            { month: 'Jun', revenue: 250000 }
        ]
    };

    return revenueData;
}

// Helper function to get performance analytics
async function getPerformanceAnalytics(userId, userRole, options = {}) {
    // Mock performance analytics
    const performanceData = {
        overallScore: 85,
        metrics: [
            { metric: 'Client Satisfaction', score: 88, target: 90 },
            { metric: 'Task Completion', score: 92, target: 95 },
            { metric: 'Response Time', score: 78, target: 80 },
            { metric: 'Revenue Generation', score: 85, target: 90 }
        ],
        trends: [
            { week: 'Week 1', score: 80 },
            { week: 'Week 2', score: 82 },
            { week: 'Week 3', score: 84 },
            { week: 'Week 4', score: 85 }
        ],
        topPerformers: [
            { name: 'John Doe', score: 95 },
            { name: 'Jane Smith', score: 92 },
            { name: 'Mike Johnson', score: 88 }
        ]
    };

    return performanceData;
}

// Helper function to get revenue trends
async function getRevenueTrends(period, userId, userRole) {
    // Mock revenue trends data
    const trendsData = {
        period,
        data: [
            { date: '2024-01-01', revenue: 200000 },
            { date: '2024-01-02', revenue: 220000 },
            { date: '2024-01-03', revenue: 180000 },
            { date: '2024-01-04', revenue: 250000 },
            { date: '2024-01-05', revenue: 230000 }
        ],
        summary: {
            total: 1080000,
            average: 216000,
            growth: 15.2,
            trend: 'increasing'
        }
    };

    return trendsData;
}

// Helper function to get client trends
async function getClientTrends(period, userId, userRole) {
    // Mock client trends data
    const trendsData = {
        period,
        data: [
            { date: '2024-01-01', newClients: 2, totalClients: 150 },
            { date: '2024-01-02', newClients: 1, totalClients: 151 },
            { date: '2024-01-03', newClients: 3, totalClients: 154 },
            { date: '2024-01-04', newClients: 0, totalClients: 154 },
            { date: '2024-01-05', newClients: 2, totalClients: 156 }
        ],
        summary: {
            newClients: 8,
            totalClients: 156,
            growth: 5.3,
            trend: 'increasing'
        }
    };

    return trendsData;
}

// Helper function to get task trends
async function getTaskTrends(period, userId, userRole) {
    // Mock task trends data
    const trendsData = {
        period,
        data: [
            { date: '2024-01-01', created: 5, completed: 4, pending: 20 },
            { date: '2024-01-02', created: 3, completed: 6, pending: 17 },
            { date: '2024-01-03', created: 7, completed: 5, pending: 19 },
            { date: '2024-01-04', created: 4, completed: 8, pending: 15 },
            { date: '2024-01-05', created: 6, completed: 7, pending: 14 }
        ],
        summary: {
            totalCreated: 25,
            totalCompleted: 30,
            completionRate: 120,
            trend: 'improving'
        }
    };

    return trendsData;
}

// Helper function to get communication trends
async function getCommunicationTrends(period, userId, userRole) {
    // Mock communication trends data
    const trendsData = {
        period,
        data: [
            { date: '2024-01-01', incoming: 8, outgoing: 6, total: 14 },
            { date: '2024-01-02', incoming: 6, outgoing: 8, total: 14 },
            { date: '2024-01-03', incoming: 10, outgoing: 7, total: 17 },
            { date: '2024-01-04', incoming: 7, outgoing: 9, total: 16 },
            { date: '2024-01-05', incoming: 9, outgoing: 8, total: 17 }
        ],
        summary: {
            totalIncoming: 40,
            totalOutgoing: 38,
            total: 78,
            trend: 'stable'
        }
    };

    return trendsData;
}

// Helper function to get revenue predictions
async function getRevenuePredictions(period, userId, userRole) {
    // Mock revenue predictions
    const predictionData = {
        period,
        current: 250000,
        predicted: 280000,
        confidence: 85,
        factors: [
            { factor: 'Seasonal Trends', impact: 'positive', weight: 0.3 },
            { factor: 'Client Growth', impact: 'positive', weight: 0.4 },
            { factor: 'Market Conditions', impact: 'neutral', weight: 0.3 }
        ],
        scenarios: {
            optimistic: 320000,
            realistic: 280000,
            pessimistic: 240000
        }
    };

    return predictionData;
}

// Helper function to get client predictions
async function getClientPredictions(period, userId, userRole) {
    // Mock client predictions
    const predictionData = {
        period,
        current: 156,
        predicted: 170,
        confidence: 80,
        factors: [
            { factor: 'Referral Rate', impact: 'positive', weight: 0.4 },
            { factor: 'Marketing Efforts', impact: 'positive', weight: 0.3 },
            { factor: 'Market Competition', impact: 'negative', weight: 0.3 }
        ],
        scenarios: {
            optimistic: 180,
            realistic: 170,
            pessimistic: 160
        }
    };

    return predictionData;
}

// Helper function to get task predictions
async function getTaskPredictions(period, userId, userRole) {
    // Mock task predictions
    const predictionData = {
        period,
        current: 45,
        predicted: 52,
        confidence: 75,
        factors: [
            { factor: 'Workload Capacity', impact: 'positive', weight: 0.5 },
            { factor: 'Client Demands', impact: 'positive', weight: 0.3 },
            { factor: 'Resource Availability', impact: 'neutral', weight: 0.2 }
        ],
        scenarios: {
            optimistic: 60,
            realistic: 52,
            pessimistic: 45
        }
    };

    return predictionData;
}

// Helper function to get workload predictions
async function getWorkloadPredictions(period, userId, userRole) {
    // Mock workload predictions
    const predictionData = {
        period,
        current: 78,
        predicted: 85,
        confidence: 70,
        factors: [
            { factor: 'Staff Capacity', impact: 'positive', weight: 0.4 },
            { factor: 'Project Pipeline', impact: 'positive', weight: 0.4 },
            { factor: 'Seasonal Variations', impact: 'neutral', weight: 0.2 }
        ],
        scenarios: {
            optimistic: 90,
            realistic: 85,
            pessimistic: 80
        }
    };

    return predictionData;
}

// Helper function to get benchmark analytics
async function getBenchmarkAnalytics(category, userId, userRole) {
    // Mock benchmark data
    const benchmarkData = {
        category,
        current: {
            revenue: 1500000,
            clientSatisfaction: 4.2,
            taskCompletion: 92,
            responseTime: 4.5
        },
        benchmark: {
            revenue: 1200000,
            clientSatisfaction: 4.0,
            taskCompletion: 88,
            responseTime: 6.0
        },
        performance: {
            revenue: 125, // 25% above benchmark
            clientSatisfaction: 105, // 5% above benchmark
            taskCompletion: 104.5, // 4.5% above benchmark
            responseTime: 133.3 // 33.3% better than benchmark
        },
        insights: [
            'Revenue performance is 25% above industry average',
            'Client satisfaction is above benchmark',
            'Task completion rate exceeds industry standards',
            'Response time is significantly better than benchmark'
        ]
    };

    return benchmarkData;
}

module.exports = router;