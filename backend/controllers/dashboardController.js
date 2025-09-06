/**
 * Dashboard Controller
 * Handles dashboard data and analytics
 */

const Client = require('../models/Client');
const User = require('../models/User');
const Task = require('../models/Task');
const Communication = require('../models/Communication');

class DashboardController {
    /**
     * Get dashboard data based on user role
     */
    async getDashboardData(req, res) {
        try {
            const userId = req.user.userId;
            const userRole = req.user.role;
            const { period = '30' } = req.query;

            // Calculate date range
            const endDate = new Date();
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - parseInt(period));

            let dashboardData = {};

            // Get role-specific dashboard data
            switch (userRole) {
                case 'admin':
                    dashboardData = await this.getAdminDashboard(startDate, endDate);
                    break;
                case 'manager':
                    dashboardData = await this.getManagerDashboard(userId, startDate, endDate);
                    break;
                case 'executive':
                    dashboardData = await this.getExecutiveDashboard(userId, startDate, endDate);
                    break;
                case 'staff':
                    dashboardData = await this.getStaffDashboard(userId, startDate, endDate);
                    break;
                case 'client':
                    dashboardData = await this.getClientDashboard(userId, startDate, endDate);
                    break;
                default:
                    dashboardData = await this.getDefaultDashboard(startDate, endDate);
            }

            res.json({
                success: true,
                data: dashboardData
            });

        } catch (error) {
            console.error('Dashboard data error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error while fetching dashboard data'
            });
        }
    }

    /**
     * Get admin dashboard data
     */
    async getAdminDashboard(startDate, endDate) {
        const [
            totalClients,
            activeClients,
            totalStaff,
            activeStaff,
            totalTasks,
            completedTasks,
            totalCommunications,
            recentActivities,
            revenueData,
            clientGrowth,
            staffPerformance,
            upcomingDeadlines
        ] = await Promise.all([
            Client.countDocuments(),
            Client.countDocuments({ status: 'Active' }),
            User.countDocuments({ role: { $in: ['manager', 'executive', 'staff'] } }),
            User.countDocuments({ role: { $in: ['manager', 'executive', 'staff'] }, is_active: true }),
            Task.countDocuments({ created_at: { $gte: startDate, $lte: endDate } }),
            Task.countDocuments({ status: 'Completed', created_at: { $gte: startDate, $lte: endDate } }),
            Communication.countDocuments({ date: { $gte: startDate, $lte: endDate } }),
            this.getRecentActivities(20),
            this.getRevenueData(startDate, endDate),
            this.getClientGrowthData(startDate, endDate),
            this.getStaffPerformanceData(startDate, endDate),
            this.getUpcomingDeadlines()
        ]);

        return {
            kpis: {
                totalClients,
                activeClients,
                totalStaff,
                activeStaff,
                totalTasks,
                completedTasks,
                totalCommunications,
                taskCompletionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
            },
            charts: {
                revenue: revenueData,
                clientGrowth: clientGrowth,
                staffPerformance: staffPerformance
            },
            recentActivities,
            upcomingDeadlines,
            quickActions: [
                { title: 'Add New Client', icon: 'fas fa-user-plus', action: 'add-client' },
                { title: 'Create Task', icon: 'fas fa-tasks', action: 'create-task' },
                { title: 'Generate Report', icon: 'fas fa-chart-bar', action: 'generate-report' },
                { title: 'View Analytics', icon: 'fas fa-analytics', action: 'view-analytics' }
            ]
        };
    }

    /**
     * Get manager dashboard data
     */
    async getManagerDashboard(userId, startDate, endDate) {
        const [
            teamMembers,
            teamTasks,
            teamCommunications,
            recentActivities,
            teamPerformance
        ] = await Promise.all([
            User.find({ reporting_manager: userId }).select('username email role'),
            Task.find({ 
                assigned_to: { $in: await this.getTeamMemberIds(userId) },
                created_at: { $gte: startDate, $lte: endDate }
            }),
            Communication.find({ 
                staff_id: { $in: await this.getTeamMemberIds(userId) },
                date: { $gte: startDate, $lte: endDate }
            }),
            this.getRecentActivities(15, userId),
            this.getTeamPerformanceData(userId, startDate, endDate)
        ]);

        const completedTasks = teamTasks.filter(task => task.status === 'Completed').length;

        return {
            kpis: {
                teamMembers: teamMembers.length,
                teamTasks: teamTasks.length,
                completedTasks,
                teamCommunications: teamCommunications.length,
                taskCompletionRate: teamTasks.length > 0 ? Math.round((completedTasks / teamTasks.length) * 100) : 0
            },
            charts: {
                teamPerformance: teamPerformance
            },
            recentActivities,
            teamMembers,
            quickActions: [
                { title: 'Assign Task', icon: 'fas fa-tasks', action: 'assign-task' },
                { title: 'Team Report', icon: 'fas fa-users', action: 'team-report' },
                { title: 'Performance Review', icon: 'fas fa-chart-line', action: 'performance-review' }
            ]
        };
    }

    /**
     * Get executive dashboard data
     */
    async getExecutiveDashboard(userId, startDate, endDate) {
        const [
            assignedClients,
            myTasks,
            myCommunications,
            recentActivities,
            clientSatisfaction
        ] = await Promise.all([
            Client.find({ assigned_executive: userId }).select('name status satisfaction_rating'),
            Task.find({ 
                assigned_to: userId,
                created_at: { $gte: startDate, $lte: endDate }
            }),
            Communication.find({ 
                staff_id: userId,
                date: { $gte: startDate, $lte: endDate }
            }),
            this.getRecentActivities(10, userId),
            this.getClientSatisfactionData(userId, startDate, endDate)
        ]);

        const completedTasks = myTasks.filter(task => task.status === 'Completed').length;

        return {
            kpis: {
                assignedClients: assignedClients.length,
                myTasks: myTasks.length,
                completedTasks,
                myCommunications: myCommunications.length,
                taskCompletionRate: myTasks.length > 0 ? Math.round((completedTasks / myTasks.length) * 100) : 0,
                averageSatisfaction: clientSatisfaction.average
            },
            charts: {
                clientSatisfaction: clientSatisfaction
            },
            recentActivities,
            assignedClients,
            quickActions: [
                { title: 'New Communication', icon: 'fas fa-comment', action: 'new-communication' },
                { title: 'Client Meeting', icon: 'fas fa-calendar', action: 'schedule-meeting' },
                { title: 'Task Update', icon: 'fas fa-edit', action: 'update-task' }
            ]
        };
    }

    /**
     * Get staff dashboard data
     */
    async getStaffDashboard(userId, startDate, endDate) {
        const [
            myTasks,
            myCommunications,
            recentActivities,
            myPerformance
        ] = await Promise.all([
            Task.find({ 
                assigned_to: userId,
                created_at: { $gte: startDate, $lte: endDate }
            }),
            Communication.find({ 
                staff_id: userId,
                date: { $gte: startDate, $lte: endDate }
            }),
            this.getRecentActivities(10, userId),
            this.getMyPerformanceData(userId, startDate, endDate)
        ]);

        const completedTasks = myTasks.filter(task => task.status === 'Completed').length;
        const overdueTasks = myTasks.filter(task => 
            task.status !== 'Completed' && 
            task.due_date && 
            new Date(task.due_date) < new Date()
        ).length;

        return {
            kpis: {
                myTasks: myTasks.length,
                completedTasks,
                overdueTasks,
                myCommunications: myCommunications.length,
                taskCompletionRate: myTasks.length > 0 ? Math.round((completedTasks / myTasks.length) * 100) : 0
            },
            charts: {
                myPerformance: myPerformance
            },
            recentActivities,
            quickActions: [
                { title: 'Start Task', icon: 'fas fa-play', action: 'start-task' },
                { title: 'Log Time', icon: 'fas fa-clock', action: 'log-time' },
                { title: 'Update Status', icon: 'fas fa-check', action: 'update-status' }
            ]
        };
    }

    /**
     * Get client dashboard data
     */
    async getClientDashboard(userId, startDate, endDate) {
        const [
            myServices,
            myDocuments,
            myCommunications,
            recentActivities,
            upcomingDeadlines
        ] = await Promise.all([
            Client.findOne({ _id: userId }).select('services_availed'),
            this.getClientDocuments(userId),
            Communication.find({ 
                client_id: userId,
                date: { $gte: startDate, $lte: endDate }
            }),
            this.getRecentActivities(10, null, userId),
            this.getClientUpcomingDeadlines(userId)
        ]);

        return {
            kpis: {
                activeServices: myServices?.services_availed?.filter(s => s.status === 'Active').length || 0,
                totalDocuments: myDocuments.length,
                myCommunications: myCommunications.length
            },
            charts: {
                serviceUtilization: this.getServiceUtilizationData(myServices?.services_availed || [])
            },
            recentActivities,
            upcomingDeadlines,
            myServices: myServices?.services_availed || [],
            myDocuments,
            quickActions: [
                { title: 'Upload Document', icon: 'fas fa-upload', action: 'upload-document' },
                { title: 'Send Message', icon: 'fas fa-envelope', action: 'send-message' },
                { title: 'View Services', icon: 'fas fa-list', action: 'view-services' }
            ]
        };
    }

    /**
     * Get default dashboard data
     */
    async getDefaultDashboard(startDate, endDate) {
        return {
            kpis: {
                totalClients: 0,
                totalTasks: 0,
                totalCommunications: 0
            },
            charts: {},
            recentActivities: [],
            quickActions: []
        };
    }

    /**
     * Get recent activities
     */
    async getRecentActivities(limit = 10, staffId = null, clientId = null) {
        const query = {};
        if (staffId) query.staff_id = staffId;
        if (clientId) query.client_id = clientId;

        const activities = await Communication.find(query)
            .populate('client_id', 'name')
            .populate('staff_id', 'username')
            .sort({ created_at: -1 })
            .limit(limit);

        return activities.map(activity => ({
            id: activity._id,
            type: 'communication',
            title: activity.subject || 'Communication',
            description: activity.summary,
            user: activity.staff_id?.username || 'Unknown',
            client: activity.client_id?.name || 'Unknown',
            date: activity.date,
            icon: this.getActivityIcon(activity.channel)
        }));
    }

    /**
     * Get revenue data
     */
    async getRevenueData(startDate, endDate) {
        // This would typically come from a financial/transaction model
        // For now, return mock data
        return {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
            datasets: [{
                label: 'Revenue',
                data: [120000, 150000, 180000, 160000, 200000, 220000],
                borderColor: '#4A90E2',
                backgroundColor: 'rgba(74, 144, 226, 0.1)'
            }]
        };
    }

    /**
     * Get client growth data
     */
    async getClientGrowthData(startDate, endDate) {
        const monthlyData = await Client.aggregate([
            {
                $match: {
                    created_at: { $gte: startDate, $lte: endDate }
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: '$created_at' },
                        month: { $month: '$created_at' }
                    },
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { '_id.year': 1, '_id.month': 1 }
            }
        ]);

        return {
            labels: monthlyData.map(item => `${item._id.year}-${item._id.month}`),
            datasets: [{
                label: 'New Clients',
                data: monthlyData.map(item => item.count),
                borderColor: '#27AE60',
                backgroundColor: 'rgba(39, 174, 96, 0.1)'
            }]
        };
    }

    /**
     * Get staff performance data
     */
    async getStaffPerformanceData(startDate, endDate) {
        const staffData = await User.aggregate([
            {
                $match: {
                    role: { $in: ['manager', 'executive', 'staff'] },
                    is_active: true
                }
            },
            {
                $lookup: {
                    from: 'tasks',
                    localField: '_id',
                    foreignField: 'assigned_to',
                    as: 'tasks'
                }
            },
            {
                $project: {
                    username: 1,
                    completedTasks: {
                        $size: {
                            $filter: {
                                input: '$tasks',
                                cond: { $eq: ['$$this.status', 'Completed'] }
                            }
                        }
                    },
                    totalTasks: { $size: '$tasks' }
                }
            }
        ]);

        return {
            labels: staffData.map(staff => staff.username),
            datasets: [{
                label: 'Completed Tasks',
                data: staffData.map(staff => staff.completedTasks),
                backgroundColor: '#E67E22'
            }]
        };
    }

    /**
     * Get upcoming deadlines
     */
    async getUpcomingDeadlines() {
        const upcomingDate = new Date();
        upcomingDate.setDate(upcomingDate.getDate() + 7);

        const deadlines = await Client.find({
            'compliance_calendar.due_date': {
                $gte: new Date(),
                $lte: upcomingDate
            }
        }).select('name compliance_calendar');

        return deadlines.flatMap(client => 
            client.compliance_calendar
                .filter(deadline => 
                    deadline.due_date >= new Date() && 
                    deadline.due_date <= upcomingDate
                )
                .map(deadline => ({
                    id: deadline._id,
                    title: deadline.filing_type,
                    client: client.name,
                    dueDate: deadline.due_date,
                    status: deadline.status
                }))
        );
    }

    /**
     * Get team member IDs
     */
    async getTeamMemberIds(managerId) {
        const teamMembers = await User.find({ reporting_manager: managerId }).select('_id');
        return teamMembers.map(member => member._id);
    }

    /**
     * Get team performance data
     */
    async getTeamPerformanceData(managerId, startDate, endDate) {
        const teamMemberIds = await this.getTeamMemberIds(managerId);
        
        const performanceData = await User.aggregate([
            {
                $match: {
                    _id: { $in: teamMemberIds }
                }
            },
            {
                $lookup: {
                    from: 'tasks',
                    localField: '_id',
                    foreignField: 'assigned_to',
                    as: 'tasks'
                }
            },
            {
                $project: {
                    username: 1,
                    completedTasks: {
                        $size: {
                            $filter: {
                                input: '$tasks',
                                cond: { $eq: ['$$this.status', 'Completed'] }
                            }
                        }
                    }
                }
            }
        ]);

        return {
            labels: performanceData.map(member => member.username),
            datasets: [{
                label: 'Completed Tasks',
                data: performanceData.map(member => member.completedTasks),
                backgroundColor: '#9B59B6'
            }]
        };
    }

    /**
     * Get client satisfaction data
     */
    async getClientSatisfactionData(executiveId, startDate, endDate) {
        const clients = await Client.find({
            assigned_executive: executiveId,
            satisfaction_rating: { $exists: true }
        }).select('name satisfaction_rating');

        return {
            average: clients.length > 0 ? 
                clients.reduce((sum, client) => sum + client.satisfaction_rating, 0) / clients.length : 0,
            data: clients.map(client => ({
                name: client.name,
                rating: client.satisfaction_rating
            }))
        };
    }

    /**
     * Get my performance data
     */
    async getMyPerformanceData(userId, startDate, endDate) {
        const tasks = await Task.find({
            assigned_to: userId,
            created_at: { $gte: startDate, $lte: endDate }
        });

        const monthlyData = {};
        tasks.forEach(task => {
            const month = task.created_at.toISOString().substring(0, 7);
            if (!monthlyData[month]) {
                monthlyData[month] = { completed: 0, total: 0 };
            }
            monthlyData[month].total++;
            if (task.status === 'Completed') {
                monthlyData[month].completed++;
            }
        });

        const months = Object.keys(monthlyData).sort();
        
        return {
            labels: months,
            datasets: [{
                label: 'Completed Tasks',
                data: months.map(month => monthlyData[month].completed),
                backgroundColor: '#3498DB'
            }]
        };
    }

    /**
     * Get client documents
     */
    async getClientDocuments(clientId) {
        // This would typically come from a Document model
        // For now, return empty array
        return [];
    }

    /**
     * Get client upcoming deadlines
     */
    async getClientUpcomingDeadlines(clientId) {
        const client = await Client.findById(clientId).select('compliance_calendar');
        if (!client) return [];

        const upcomingDate = new Date();
        upcomingDate.setDate(upcomingDate.getDate() + 30);

        return client.compliance_calendar
            .filter(deadline => 
                deadline.due_date >= new Date() && 
                deadline.due_date <= upcomingDate
            )
            .map(deadline => ({
                id: deadline._id,
                title: deadline.filing_type,
                dueDate: deadline.due_date,
                status: deadline.status
            }));
    }

    /**
     * Get service utilization data
     */
    getServiceUtilizationData(services) {
        const serviceCounts = {};
        services.forEach(service => {
            serviceCounts[service.service_name] = (serviceCounts[service.service_name] || 0) + 1;
        });

        return {
            labels: Object.keys(serviceCounts),
            datasets: [{
                label: 'Services',
                data: Object.values(serviceCounts),
                backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF']
            }]
        };
    }

    /**
     * Get activity icon
     */
    getActivityIcon(channel) {
        const iconMap = {
            'Email': 'fas fa-envelope',
            'Phone': 'fas fa-phone',
            'WhatsApp': 'fab fa-whatsapp',
            'SMS': 'fas fa-sms',
            'Video Call': 'fas fa-video',
            'In-Person': 'fas fa-user',
            'Letter': 'fas fa-mail-bulk',
            'Fax': 'fas fa-fax'
        };
        return iconMap[channel] || 'fas fa-comment';
    }
}

module.exports = new DashboardController();