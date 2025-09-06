/**
 * Dashboard Module
 * Handles dashboard functionality and data visualization
 */

class DashboardModule {
    constructor(app) {
        this.app = app;
        this.api = app.api;
        this.charts = {};
        this.data = {};
        this.refreshInterval = null;
    }

    /**
     * Load dashboard module
     */
    async load() {
        try {
            this.showDashboardPage();
            await this.loadDashboardData();
            this.initializeCharts();
            this.setupEventListeners();
            this.startAutoRefresh();
        } catch (error) {
            console.error('Dashboard load error:', error);
            this.app.toast.error('Failed to load dashboard');
        }
    }

    /**
     * Show dashboard page
     */
    showDashboardPage() {
        // Hide all pages
        document.querySelectorAll('.page').forEach(page => {
            page.classList.add('hidden');
        });

        // Show dashboard page
        const dashboardPage = document.getElementById('dashboard-page');
        if (dashboardPage) {
            dashboardPage.classList.remove('hidden');
            dashboardPage.classList.add('active');
        }
    }

    /**
     * Load dashboard data
     */
    async loadDashboardData() {
        try {
            this.app.loading.showOverlay('Loading dashboard data...');

            // Load all dashboard data in parallel
            const [
                kpiData,
                revenueData,
                clientData,
                activitiesData,
                notificationsData
            ] = await Promise.all([
                this.api.get('/dashboard/kpis'),
                this.api.get('/dashboard/revenue'),
                this.api.get('/dashboard/clients'),
                this.api.get('/dashboard/activities'),
                this.api.get('/notifications')
            ]);

            this.data = {
                kpis: kpiData.data || {},
                revenue: revenueData.data || [],
                clients: clientData.data || {},
                activities: activitiesData.data || [],
                notifications: notificationsData.data || []
            };

            // Update UI with data
            this.updateKPIs();
            this.updateActivities();
            this.updateNotifications();

        } catch (error) {
            console.error('Dashboard data load error:', error);
            this.app.toast.error('Failed to load dashboard data');
        } finally {
            this.app.loading.hideOverlay();
        }
    }

    /**
     * Update KPI cards
     */
    updateKPIs() {
        const kpis = this.data.kpis;
        
        // Total Clients
        this.updateElement('total-clients', kpis.totalClients || 0);
        this.updateElement('client-change', this.formatChange(kpis.clientChange || 0));

        // Monthly Revenue
        this.updateElement('monthly-revenue', this.formatCurrency(kpis.monthlyRevenue || 0));
        this.updateElement('revenue-change', this.formatChange(kpis.revenueChange || 0));

        // Pending Tasks
        this.updateElement('pending-tasks', kpis.pendingTasks || 0);
        this.updateElement('task-change', this.formatChange(kpis.taskChange || 0));

        // Client Satisfaction
        this.updateElement('satisfaction-rating', (kpis.satisfactionRating || 0).toFixed(1));
        this.updateElement('satisfaction-change', this.formatChange(kpis.satisfactionChange || 0));
    }

    /**
     * Update activities list
     */
    updateActivities() {
        const activitiesList = document.getElementById('activities-list');
        if (!activitiesList) return;

        const activities = this.data.activities;
        
        if (activities.length === 0) {
            activitiesList.innerHTML = '<div class="no-activities">No recent activities</div>';
            return;
        }

        activitiesList.innerHTML = activities.map(activity => `
            <div class="activity-item" data-aos="fade-up">
                <div class="activity-icon">
                    <i class="fas fa-${this.getActivityIcon(activity.type)}"></i>
                </div>
                <div class="activity-content">
                    <div class="activity-title">${activity.title}</div>
                    <div class="activity-description">${activity.description}</div>
                </div>
                <div class="activity-time">${this.app.formatTime(activity.created_at)}</div>
            </div>
        `).join('');
    }

    /**
     * Update notifications
     */
    updateNotifications() {
        const notificationCount = document.getElementById('notification-count');
        if (notificationCount) {
            notificationCount.textContent = this.data.notifications.length.toString();
        }
    }

    /**
     * Initialize charts
     */
    initializeCharts() {
        this.initializeRevenueChart();
        this.initializeClientDistributionChart();
    }

    /**
     * Initialize revenue chart
     */
    initializeRevenueChart() {
        const ctx = document.getElementById('revenue-chart');
        if (!ctx) return;

        const revenueData = this.data.revenue;
        
        this.charts.revenue = new Chart(ctx, {
            type: 'line',
            data: {
                labels: revenueData.map(item => this.formatDate(item.date)),
                datasets: [{
                    label: 'Revenue',
                    data: revenueData.map(item => item.amount),
                    borderColor: '#4A90E2',
                    backgroundColor: 'rgba(74, 144, 226, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: '#4A90E2',
                    pointBorderColor: '#FFFFFF',
                    pointBorderWidth: 2,
                    pointRadius: 6,
                    pointHoverRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: '#FFFFFF',
                        bodyColor: '#FFFFFF',
                        borderColor: '#4A90E2',
                        borderWidth: 1,
                        callbacks: {
                            label: (context) => {
                                return `Revenue: ${this.formatCurrency(context.parsed.y)}`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            color: '#9AA0A6'
                        }
                    },
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: '#E8EAED'
                        },
                        ticks: {
                            color: '#9AA0A6',
                            callback: (value) => this.formatCurrency(value)
                        }
                    }
                },
                interaction: {
                    intersect: false,
                    mode: 'index'
                }
            }
        });
    }

    /**
     * Initialize client distribution chart
     */
    initializeClientDistributionChart() {
        const ctx = document.getElementById('client-distribution-chart');
        if (!ctx) return;

        const clientData = this.data.clients;
        const distribution = clientData.distribution || {};
        
        this.charts.clientDistribution = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: Object.keys(distribution),
                datasets: [{
                    data: Object.values(distribution),
                    backgroundColor: [
                        '#4A90E2',
                        '#E67E22',
                        '#27AE60',
                        '#E74C3C',
                        '#9B59B6',
                        '#F39C12',
                        '#1ABC9C',
                        '#34495E'
                    ],
                    borderWidth: 0,
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            usePointStyle: true,
                            font: {
                                size: 12
                            }
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: '#FFFFFF',
                        bodyColor: '#FFFFFF',
                        callbacks: {
                            label: (context) => {
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((context.parsed / total) * 100).toFixed(1);
                                return `${context.label}: ${context.parsed} (${percentage}%)`;
                            }
                        }
                    }
                },
                cutout: '60%'
            }
        });
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Revenue period selector
        const revenuePeriod = document.getElementById('revenue-period');
        if (revenuePeriod) {
            revenuePeriod.addEventListener('change', this.handleRevenuePeriodChange.bind(this));
        }

        // Chart resize on window resize
        window.addEventListener('resize', this.handleChartResize.bind(this));
    }

    /**
     * Handle revenue period change
     */
    async handleRevenuePeriodChange(event) {
        const period = event.target.value;
        
        try {
            this.app.loading.showOverlay('Loading revenue data...');
            
            const response = await this.api.get('/dashboard/revenue', { period });
            if (response.success) {
                this.data.revenue = response.data;
                this.updateRevenueChart();
            }
        } catch (error) {
            console.error('Revenue data load error:', error);
            this.app.toast.error('Failed to load revenue data');
        } finally {
            this.app.loading.hideOverlay();
        }
    }

    /**
     * Update revenue chart
     */
    updateRevenueChart() {
        if (!this.charts.revenue) return;

        const revenueData = this.data.revenue;
        
        this.charts.revenue.data.labels = revenueData.map(item => this.formatDate(item.date));
        this.charts.revenue.data.datasets[0].data = revenueData.map(item => item.amount);
        this.charts.revenue.update();
    }

    /**
     * Handle chart resize
     */
    handleChartResize() {
        Object.values(this.charts).forEach(chart => {
            if (chart && chart.resize) {
                chart.resize();
            }
        });
    }

    /**
     * Start auto refresh
     */
    startAutoRefresh() {
        // Refresh every 5 minutes
        this.refreshInterval = setInterval(() => {
            this.refreshDashboard();
        }, 5 * 60 * 1000);
    }

    /**
     * Stop auto refresh
     */
    stopAutoRefresh() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
        }
    }

    /**
     * Refresh dashboard
     */
    async refreshDashboard() {
        try {
            await this.loadDashboardData();
            this.updateRevenueChart();
            this.app.toast.success('Dashboard refreshed');
        } catch (error) {
            console.error('Dashboard refresh error:', error);
            this.app.toast.error('Failed to refresh dashboard');
        }
    }

    /**
     * Get activity icon
     */
    getActivityIcon(type) {
        const icons = {
            'client_added': 'user-plus',
            'client_updated': 'user-edit',
            'task_created': 'plus-circle',
            'task_completed': 'check-circle',
            'document_uploaded': 'file-upload',
            'communication_sent': 'comment',
            'payment_received': 'rupee-sign',
            'meeting_scheduled': 'calendar',
            'report_generated': 'chart-bar',
            'system_alert': 'exclamation-triangle'
        };
        return icons[type] || 'bell';
    }

    /**
     * Format currency
     */
    formatCurrency(amount) {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    }

    /**
     * Format change percentage
     */
    formatChange(change) {
        const sign = change >= 0 ? '+' : '';
        return `${sign}${change.toFixed(1)}%`;
    }

    /**
     * Format date
     */
    formatDate(date) {
        return moment(date).format('MMM DD');
    }

    /**
     * Update element text content
     */
    updateElement(id, value) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        }
    }

    /**
     * Cleanup module
     */
    cleanup() {
        this.stopAutoRefresh();
        
        // Destroy charts
        Object.values(this.charts).forEach(chart => {
            if (chart && chart.destroy) {
                chart.destroy();
            }
        });
        
        this.charts = {};
    }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DashboardModule;
}