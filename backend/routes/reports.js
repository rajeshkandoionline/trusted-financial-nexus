const express = require('express');
const { body, validationResult, query } = require('express-validator');
const auth = require('../middleware/auth');
const Client = require('../models/Client');
const User = require('../models/User');
const Communication = require('../models/Communication');
const Task = require('../models/Task');
const Document = require('../models/Document');

const router = express.Router();

// @route   GET /api/reports/financial
// @desc    Generate financial reports
// @access  Private
router.get('/financial', [
    auth,
    query('start_date').isISO8601().withMessage('Valid start date is required'),
    query('end_date').isISO8601().withMessage('Valid end date is required'),
    query('report_type').optional().isIn(['revenue', 'expenses', 'profitability', 'aging']).withMessage('Invalid report type')
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

        const { start_date, end_date, report_type = 'revenue' } = req.query;
        const startDate = new Date(start_date);
        const endDate = new Date(end_date);

        let reportData = {};

        switch (report_type) {
            case 'revenue':
                reportData = await generateRevenueReport(startDate, endDate, req.user);
                break;
            case 'expenses':
                reportData = await generateExpensesReport(startDate, endDate, req.user);
                break;
            case 'profitability':
                reportData = await generateProfitabilityReport(startDate, endDate, req.user);
                break;
            case 'aging':
                reportData = await generateAgingReport(req.user);
                break;
            default:
                return res.status(400).json({
                    success: false,
                    message: 'Invalid report type'
                });
        }

        res.json({
            success: true,
            data: reportData
        });

    } catch (error) {
        console.error('Financial report error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while generating financial report'
        });
    }
});

// @route   GET /api/reports/client
// @desc    Generate client reports
// @access  Private
router.get('/client', [
    auth,
    query('report_type').isIn(['acquisition', 'satisfaction', 'compliance', 'risk']).withMessage('Invalid report type'),
    query('start_date').optional().isISO8601().withMessage('Invalid start date format'),
    query('end_date').optional().isISO8601().withMessage('Invalid end date format')
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

        const { report_type, start_date, end_date } = req.query;
        const startDate = start_date ? new Date(start_date) : null;
        const endDate = end_date ? new Date(end_date) : null;

        let reportData = {};

        switch (report_type) {
            case 'acquisition':
                reportData = await generateClientAcquisitionReport(startDate, endDate, req.user);
                break;
            case 'satisfaction':
                reportData = await generateClientSatisfactionReport(startDate, endDate, req.user);
                break;
            case 'compliance':
                reportData = await generateClientComplianceReport(req.user);
                break;
            case 'risk':
                reportData = await generateClientRiskReport(req.user);
                break;
            default:
                return res.status(400).json({
                    success: false,
                    message: 'Invalid report type'
                });
        }

        res.json({
            success: true,
            data: reportData
        });

    } catch (error) {
        console.error('Client report error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while generating client report'
        });
    }
});

// @route   GET /api/reports/staff
// @desc    Generate staff performance reports
// @access  Private
router.get('/staff', [
    auth,
    query('report_type').isIn(['performance', 'productivity', 'workload', 'timesheet']).withMessage('Invalid report type'),
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

        const { report_type, start_date, end_date, staff_id } = req.query;
        const startDate = start_date ? new Date(start_date) : null;
        const endDate = end_date ? new Date(end_date) : null;

        let reportData = {};

        switch (report_type) {
            case 'performance':
                reportData = await generateStaffPerformanceReport(startDate, endDate, staff_id, req.user);
                break;
            case 'productivity':
                reportData = await generateStaffProductivityReport(startDate, endDate, staff_id, req.user);
                break;
            case 'workload':
                reportData = await generateStaffWorkloadReport(staff_id, req.user);
                break;
            case 'timesheet':
                reportData = await generateStaffTimesheetReport(startDate, end_date, staff_id, req.user);
                break;
            default:
                return res.status(400).json({
                    success: false,
                    message: 'Invalid report type'
                });
        }

        res.json({
            success: true,
            data: reportData
        });

    } catch (error) {
        console.error('Staff report error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while generating staff report'
        });
    }
});

// @route   GET /api/reports/communication
// @desc    Generate communication reports
// @access  Private
router.get('/communication', [
    auth,
    query('report_type').isIn(['volume', 'response_time', 'satisfaction', 'channel_analysis']).withMessage('Invalid report type'),
    query('start_date').isISO8601().withMessage('Valid start date is required'),
    query('end_date').isISO8601().withMessage('Valid end date is required')
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

        const { report_type, start_date, end_date } = req.query;
        const startDate = new Date(start_date);
        const endDate = new Date(end_date);

        let reportData = {};

        switch (report_type) {
            case 'volume':
                reportData = await generateCommunicationVolumeReport(startDate, endDate, req.user);
                break;
            case 'response_time':
                reportData = await generateResponseTimeReport(startDate, endDate, req.user);
                break;
            case 'satisfaction':
                reportData = await generateCommunicationSatisfactionReport(startDate, endDate, req.user);
                break;
            case 'channel_analysis':
                reportData = await generateChannelAnalysisReport(startDate, endDate, req.user);
                break;
            default:
                return res.status(400).json({
                    success: false,
                    message: 'Invalid report type'
                });
        }

        res.json({
            success: true,
            data: reportData
        });

    } catch (error) {
        console.error('Communication report error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while generating communication report'
        });
    }
});

// @route   GET /api/reports/export
// @desc    Export report to file
// @access  Private
router.get('/export', [
    auth,
    query('report_type').isIn(['financial', 'client', 'staff', 'communication']).withMessage('Invalid report type'),
    query('format').isIn(['pdf', 'excel', 'csv']).withMessage('Invalid export format'),
    query('start_date').optional().isISO8601().withMessage('Invalid start date format'),
    query('end_date').optional().isISO8601().withMessage('Invalid end date format')
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

        const { report_type, format, start_date, end_date } = req.query;
        
        // Generate report data
        let reportData = {};
        const startDate = start_date ? new Date(start_date) : null;
        const endDate = end_date ? new Date(end_date) : null;

        // This would call the appropriate report generation function
        // For now, return a placeholder response
        res.json({
            success: true,
            message: 'Report export functionality will be implemented',
            data: {
                report_type,
                format,
                download_url: '/api/reports/download/sample-report.' + format
            }
        });

    } catch (error) {
        console.error('Report export error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while exporting report'
        });
    }
});

// Helper function to generate revenue report
async function generateRevenueReport(startDate, endDate, user) {
    // Mock revenue data - replace with actual revenue calculation
    const revenueData = {
        totalRevenue: 1500000,
        monthlyBreakdown: [
            { month: 'Jan', revenue: 120000 },
            { month: 'Feb', revenue: 135000 },
            { month: 'Mar', revenue: 150000 },
            { month: 'Apr', revenue: 140000 },
            { month: 'May', revenue: 160000 },
            { month: 'Jun', revenue: 155000 }
        ],
        byService: [
            { service: 'Audit', revenue: 600000, percentage: 40 },
            { service: 'Tax', revenue: 450000, percentage: 30 },
            { service: 'Consulting', revenue: 300000, percentage: 20 },
            { service: 'Other', revenue: 150000, percentage: 10 }
        ],
        byClient: [
            { client: 'ABC Corp', revenue: 200000 },
            { client: 'XYZ Ltd', revenue: 180000 },
            { client: 'DEF Inc', revenue: 150000 }
        ]
    };

    return revenueData;
}

// Helper function to generate expenses report
async function generateExpensesReport(startDate, endDate, user) {
    // Mock expenses data
    const expensesData = {
        totalExpenses: 800000,
        categories: [
            { category: 'Salaries', amount: 500000, percentage: 62.5 },
            { category: 'Office Rent', amount: 120000, percentage: 15 },
            { category: 'Utilities', amount: 50000, percentage: 6.25 },
            { category: 'Software', amount: 40000, percentage: 5 },
            { category: 'Marketing', amount: 30000, percentage: 3.75 },
            { category: 'Other', amount: 60000, percentage: 7.5 }
        ],
        monthlyTrend: [
            { month: 'Jan', expenses: 65000 },
            { month: 'Feb', expenses: 68000 },
            { month: 'Mar', expenses: 70000 },
            { month: 'Apr', expenses: 72000 },
            { month: 'May', expenses: 75000 },
            { month: 'Jun', expenses: 78000 }
        ]
    };

    return expensesData;
}

// Helper function to generate profitability report
async function generateProfitabilityReport(startDate, endDate, user) {
    // Mock profitability data
    const profitabilityData = {
        grossProfit: 700000,
        netProfit: 450000,
        profitMargin: 30,
        revenue: 1500000,
        expenses: 800000,
        byMonth: [
            { month: 'Jan', profit: 55000, margin: 45.8 },
            { month: 'Feb', profit: 67000, margin: 49.6 },
            { month: 'Mar', profit: 80000, margin: 53.3 },
            { month: 'Apr', profit: 68000, margin: 48.6 },
            { month: 'May', profit: 85000, margin: 53.1 },
            { month: 'Jun', profit: 95000, margin: 61.3 }
        ]
    };

    return profitabilityData;
}

// Helper function to generate aging report
async function generateAgingReport(user) {
    // Mock aging data
    const agingData = {
        totalOutstanding: 250000,
        agingBreakdown: [
            { period: '0-30 days', amount: 150000, percentage: 60 },
            { period: '31-60 days', amount: 60000, percentage: 24 },
            { period: '61-90 days', amount: 30000, percentage: 12 },
            { period: '90+ days', amount: 10000, percentage: 4 }
        ],
        byClient: [
            { client: 'ABC Corp', amount: 50000, days: 25 },
            { client: 'XYZ Ltd', amount: 40000, days: 45 },
            { client: 'DEF Inc', amount: 35000, days: 60 }
        ]
    };

    return agingData;
}

// Helper function to generate client acquisition report
async function generateClientAcquisitionReport(startDate, endDate, user) {
    // Mock client acquisition data
    const acquisitionData = {
        totalNewClients: 25,
        monthlyAcquisition: [
            { month: 'Jan', newClients: 3 },
            { month: 'Feb', newClients: 4 },
            { month: 'Mar', newClients: 5 },
            { month: 'Apr', newClients: 3 },
            { month: 'May', newClients: 6 },
            { month: 'Jun', newClients: 4 }
        ],
        bySource: [
            { source: 'Referral', count: 12, percentage: 48 },
            { source: 'Website', count: 6, percentage: 24 },
            { source: 'Social Media', count: 4, percentage: 16 },
            { source: 'Other', count: 3, percentage: 12 }
        ],
        byType: [
            { type: 'Individual', count: 8 },
            { type: 'Private Limited', count: 12 },
            { type: 'LLP', count: 3 },
            { type: 'Partnership', count: 2 }
        ]
    };

    return acquisitionData;
}

// Helper function to generate client satisfaction report
async function generateClientSatisfactionReport(startDate, endDate, user) {
    // Mock satisfaction data
    const satisfactionData = {
        averageRating: 4.2,
        totalResponses: 150,
        ratingDistribution: [
            { rating: 5, count: 75, percentage: 50 },
            { rating: 4, count: 45, percentage: 30 },
            { rating: 3, count: 20, percentage: 13.3 },
            { rating: 2, count: 7, percentage: 4.7 },
            { rating: 1, count: 3, percentage: 2 }
        ],
        byService: [
            { service: 'Audit', rating: 4.5 },
            { service: 'Tax', rating: 4.1 },
            { service: 'Consulting', rating: 4.3 }
        ],
        trends: [
            { month: 'Jan', rating: 4.0 },
            { month: 'Feb', rating: 4.1 },
            { month: 'Mar', rating: 4.2 },
            { month: 'Apr', rating: 4.3 },
            { month: 'May', rating: 4.1 },
            { month: 'Jun', rating: 4.2 }
        ]
    };

    return satisfactionData;
}

// Helper function to generate client compliance report
async function generateClientComplianceReport(user) {
    // Mock compliance data
    const complianceData = {
        totalClients: 150,
        compliantClients: 135,
        nonCompliantClients: 15,
        complianceRate: 90,
        byComplianceType: [
            { type: 'GST Filing', compliant: 140, nonCompliant: 10 },
            { type: 'TDS Filing', compliant: 145, nonCompliant: 5 },
            { type: 'Annual Return', compliant: 130, nonCompliant: 20 },
            { type: 'Audit Report', compliant: 135, nonCompliant: 15 }
        ],
        upcomingDeadlines: [
            { client: 'ABC Corp', deadline: '2024-01-15', type: 'GST Filing' },
            { client: 'XYZ Ltd', deadline: '2024-01-20', type: 'TDS Filing' },
            { client: 'DEF Inc', deadline: '2024-01-25', type: 'Annual Return' }
        ]
    };

    return complianceData;
}

// Helper function to generate client risk report
async function generateClientRiskReport(user) {
    // Mock risk data
    const riskData = {
        totalClients: 150,
        riskDistribution: [
            { level: 'Low', count: 100, percentage: 66.7 },
            { level: 'Medium', count: 35, percentage: 23.3 },
            { level: 'High', count: 15, percentage: 10 }
        ],
        riskFactors: [
            { factor: 'Late Payments', count: 25 },
            { factor: 'Compliance Issues', count: 18 },
            { factor: 'Financial Instability', count: 12 },
            { factor: 'Communication Issues', count: 8 }
        ],
        highRiskClients: [
            { client: 'ABC Corp', riskLevel: 'High', factors: ['Late Payments', 'Compliance Issues'] },
            { client: 'XYZ Ltd', riskLevel: 'High', factors: ['Financial Instability'] }
        ]
    };

    return riskData;
}

// Helper function to generate staff performance report
async function generateStaffPerformanceReport(startDate, endDate, staffId, user) {
    // Mock staff performance data
    const performanceData = {
        totalStaff: 25,
        averageRating: 4.1,
        topPerformers: [
            { name: 'John Doe', rating: 4.8, tasksCompleted: 45 },
            { name: 'Jane Smith', rating: 4.7, tasksCompleted: 42 },
            { name: 'Mike Johnson', rating: 4.6, tasksCompleted: 40 }
        ],
        performanceMetrics: [
            { metric: 'Tasks Completed', average: 35, target: 40 },
            { metric: 'Client Satisfaction', average: 4.2, target: 4.5 },
            { metric: 'Response Time (hours)', average: 4.5, target: 2.0 },
            { metric: 'Revenue Generated', average: 60000, target: 75000 }
        ]
    };

    return performanceData;
}

// Helper function to generate staff productivity report
async function generateStaffProductivityReport(startDate, endDate, staffId, user) {
    // Mock productivity data
    const productivityData = {
        totalHoursWorked: 2000,
        totalTasksCompleted: 500,
        averageTaskTime: 4.0,
        productivityTrend: [
            { week: 'Week 1', tasks: 45, hours: 180 },
            { week: 'Week 2', tasks: 52, hours: 190 },
            { week: 'Week 3', tasks: 48, hours: 185 },
            { week: 'Week 4', tasks: 55, hours: 195 }
        ],
        byDepartment: [
            { department: 'Audit', productivity: 4.2 },
            { department: 'Tax', productivity: 3.8 },
            { department: 'Consulting', productivity: 4.5 }
        ]
    };

    return productivityData;
}

// Helper function to generate staff workload report
async function generateStaffWorkloadReport(staffId, user) {
    // Mock workload data
    const workloadData = {
        totalTasks: 150,
        pendingTasks: 45,
        inProgressTasks: 30,
        completedTasks: 75,
        workloadDistribution: [
            { staff: 'John Doe', tasks: 25, utilization: 85 },
            { staff: 'Jane Smith', tasks: 22, utilization: 78 },
            { staff: 'Mike Johnson', tasks: 20, utilization: 72 }
        ],
        capacityUtilization: 78
    };

    return workloadData;
}

// Helper function to generate staff timesheet report
async function generateStaffTimesheetReport(startDate, endDate, staffId, user) {
    // Mock timesheet data
    const timesheetData = {
        totalHours: 160,
        dailyBreakdown: [
            { date: '2024-01-01', hours: 8, tasks: 5 },
            { date: '2024-01-02', hours: 7.5, tasks: 4 },
            { date: '2024-01-03', hours: 8.5, tasks: 6 }
        ],
        byProject: [
            { project: 'ABC Corp Audit', hours: 40 },
            { project: 'XYZ Ltd Tax', hours: 35 },
            { project: 'DEF Inc Consulting', hours: 25 }
        ]
    };

    return timesheetData;
}

// Helper function to generate communication volume report
async function generateCommunicationVolumeReport(startDate, endDate, user) {
    // Mock communication volume data
    const volumeData = {
        totalCommunications: 500,
        dailyAverage: 8.3,
        byType: [
            { type: 'Incoming', count: 280, percentage: 56 },
            { type: 'Outgoing', count: 220, percentage: 44 }
        ],
        byChannel: [
            { channel: 'Email', count: 200, percentage: 40 },
            { channel: 'Phone', count: 150, percentage: 30 },
            { channel: 'WhatsApp', count: 100, percentage: 20 },
            { channel: 'In-Person', count: 50, percentage: 10 }
        ],
        trends: [
            { date: '2024-01-01', count: 12 },
            { date: '2024-01-02', count: 8 },
            { date: '2024-01-03', count: 15 }
        ]
    };

    return volumeData;
}

// Helper function to generate response time report
async function generateResponseTimeReport(startDate, endDate, user) {
    // Mock response time data
    const responseTimeData = {
        averageResponseTime: 4.2,
        byChannel: [
            { channel: 'Email', avgTime: 6.5 },
            { channel: 'Phone', avgTime: 2.0 },
            { channel: 'WhatsApp', avgTime: 1.5 },
            { channel: 'In-Person', avgTime: 0.5 }
        ],
        byPriority: [
            { priority: 'Urgent', avgTime: 1.0 },
            { priority: 'High', avgTime: 2.5 },
            { priority: 'Medium', avgTime: 4.0 },
            { priority: 'Low', avgTime: 8.0 }
        ],
        trends: [
            { week: 'Week 1', avgTime: 5.0 },
            { week: 'Week 2', avgTime: 4.5 },
            { week: 'Week 3', avgTime: 4.0 },
            { week: 'Week 4', avgTime: 3.5 }
        ]
    };

    return responseTimeData;
}

// Helper function to generate communication satisfaction report
async function generateCommunicationSatisfactionReport(startDate, endDate, user) {
    // Mock communication satisfaction data
    const satisfactionData = {
        averageRating: 4.3,
        totalResponses: 200,
        ratingDistribution: [
            { rating: 5, count: 100, percentage: 50 },
            { rating: 4, count: 60, percentage: 30 },
            { rating: 3, count: 30, percentage: 15 },
            { rating: 2, count: 8, percentage: 4 },
            { rating: 1, count: 2, percentage: 1 }
        ],
        byChannel: [
            { channel: 'Email', rating: 4.1 },
            { channel: 'Phone', rating: 4.5 },
            { channel: 'WhatsApp', rating: 4.3 },
            { channel: 'In-Person', rating: 4.6 }
        ]
    };

    return satisfactionData;
}

// Helper function to generate channel analysis report
async function generateChannelAnalysisReport(startDate, endDate, user) {
    // Mock channel analysis data
    const channelData = {
        totalCommunications: 500,
        channelEffectiveness: [
            { channel: 'In-Person', effectiveness: 95, cost: 50 },
            { channel: 'Phone', effectiveness: 85, cost: 10 },
            { channel: 'WhatsApp', effectiveness: 80, cost: 5 },
            { channel: 'Email', effectiveness: 70, cost: 2 }
        ],
        channelUsage: [
            { channel: 'Email', usage: 200, trend: 'increasing' },
            { channel: 'Phone', usage: 150, trend: 'stable' },
            { channel: 'WhatsApp', usage: 100, trend: 'increasing' },
            { channel: 'In-Person', usage: 50, trend: 'decreasing' }
        ]
    };

    return channelData;
}

module.exports = router;