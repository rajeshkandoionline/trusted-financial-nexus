/**
 * Analytics Module
 * Handles advanced analytics and business intelligence
 */

class AnalyticsModule {
    constructor(app) {
        this.app = app;
        this.api = app.api;
        this.data = {
            analytics: {},
            charts: {},
            filters: {}
        };
    }

    /**
     * Load analytics module
     */
    async load() {
        try {
            this.showAnalyticsPage();
            await this.loadAnalyticsData();
            this.setupEventListeners();
        } catch (error) {
            console.error('Analytics load error:', error);
            this.app.toast.error('Failed to load analytics');
        }
    }

    /**
     * Show analytics page
     */
    showAnalyticsPage() {
        // Hide all pages
        document.querySelectorAll('.page').forEach(page => {
            page.classList.add('hidden');
        });

        // Create analytics page if it doesn't exist
        let analyticsPage = document.getElementById('analytics-page');
        if (!analyticsPage) {
            analyticsPage = this.createAnalyticsPage();
            document.getElementById('main-content-area').appendChild(analyticsPage);
        }

        analyticsPage.classList.remove('hidden');
        analyticsPage.classList.add('active');
    }

    /**
     * Create analytics page HTML
     */
    createAnalyticsPage() {
        const page = document.createElement('div');
        page.id = 'analytics-page';
        page.className = 'page analytics-page';
        
        page.innerHTML = `
            <div class="page-header">
                <h1>Analytics & Business Intelligence</h1>
                <div class="page-actions">
                    <button class="btn btn-secondary" id="export-analytics">
                        <i class="fas fa-download"></i>
                        Export Data
                    </button>
                    <button class="btn btn-primary" id="refresh-analytics">
                        <i class="fas fa-sync"></i>
                        Refresh
                    </button>
                </div>
            </div>
            
            <div class="analytics-content">
                <!-- Date Range Filter -->
                <div class="analytics-filters">
                    <div class="filter-row">
                        <div class="filter-group">
                            <label>Date Range</label>
                            <select id="date-range" class="form-select">
                                <option value="7">Last 7 days</option>
                                <option value="30" selected>Last 30 days</option>
                                <option value="90">Last 90 days</option>
                                <option value="365">Last year</option>
                                <option value="custom">Custom Range</option>
                            </select>
                        </div>
                        <div class="filter-group" id="custom-date-range" style="display: none;">
                            <label>Start Date</label>
                            <input type="date" id="start-date" class="form-control">
                        </div>
                        <div class="filter-group" id="custom-date-range-end" style="display: none;">
                            <label>End Date</label>
                            <input type="date" id="end-date" class="form-control">
                        </div>
                        <div class="filter-group">
                            <label>Client</label>
                            <select id="client-filter" class="form-select">
                                <option value="">All Clients</option>
                            </select>
                        </div>
                        <div class="filter-group">
                            <label>Staff</label>
                            <select id="staff-filter" class="form-select">
                                <option value="">All Staff</option>
                            </select>
                        </div>
                        <div class="filter-actions">
                            <button class="btn btn-primary" id="apply-filters">
                                <i class="fas fa-filter"></i>
                                Apply
                            </button>
                        </div>
                    </div>
                </div>

                <!-- KPI Cards -->
                <div class="kpi-cards">
                    <div class="kpi-card">
                        <div class="kpi-icon">
                            <i class="fas fa-users"></i>
                        </div>
                        <div class="kpi-content">
                            <h3 id="total-clients">0</h3>
                            <p>Total Clients</p>
                            <span class="kpi-change positive" id="clients-change">+0%</span>
                        </div>
                    </div>
                    
                    <div class="kpi-card">
                        <div class="kpi-icon">
                            <i class="fas fa-rupee-sign"></i>
                        </div>
                        <div class="kpi-content">
                            <h3 id="total-revenue">₹0</h3>
                            <p>Total Revenue</p>
                            <span class="kpi-change positive" id="revenue-change">+0%</span>
                        </div>
                    </div>
                    
                    <div class="kpi-card">
                        <div class="kpi-icon">
                            <i class="fas fa-tasks"></i>
                        </div>
                        <div class="kpi-content">
                            <h3 id="completed-tasks">0</h3>
                            <p>Completed Tasks</p>
                            <span class="kpi-change positive" id="tasks-change">+0%</span>
                        </div>
                    </div>
                    
                    <div class="kpi-card">
                        <div class="kpi-icon">
                            <i class="fas fa-comments"></i>
                        </div>
                        <div class="kpi-content">
                            <h3 id="communications">0</h3>
                            <p>Communications</p>
                            <span class="kpi-change positive" id="communications-change">+0%</span>
                        </div>
                    </div>
                </div>

                <!-- Charts Section -->
                <div class="charts-section">
                    <div class="chart-row">
                        <div class="chart-container">
                            <div class="chart-header">
                                <h3>Revenue Trend</h3>
                                <div class="chart-actions">
                                    <button class="btn btn-sm btn-secondary" onclick="window.app.modules.analytics.toggleChartType('revenue', 'line')">
                                        <i class="fas fa-chart-line"></i>
                                    </button>
                                    <button class="btn btn-sm btn-secondary" onclick="window.app.modules.analytics.toggleChartType('revenue', 'bar')">
                                        <i class="fas fa-chart-bar"></i>
                                    </button>
                                </div>
                            </div>
                            <div class="chart-content">
                                <canvas id="revenue-chart" width="400" height="200"></canvas>
                            </div>
                        </div>
                        
                        <div class="chart-container">
                            <div class="chart-header">
                                <h3>Client Distribution</h3>
                                <div class="chart-actions">
                                    <button class="btn btn-sm btn-secondary" onclick="window.app.modules.analytics.toggleChartType('clients', 'pie')">
                                        <i class="fas fa-chart-pie"></i>
                                    </button>
                                    <button class="btn btn-sm btn-secondary" onclick="window.app.modules.analytics.toggleChartType('clients', 'doughnut')">
                                        <i class="fas fa-circle"></i>
                                    </button>
                                </div>
                            </div>
                            <div class="chart-content">
                                <canvas id="clients-chart" width="400" height="200"></canvas>
                            </div>
                        </div>
                    </div>
                    
                    <div class="chart-row">
                        <div class="chart-container">
                            <div class="chart-header">
                                <h3>Staff Performance</h3>
                                <div class="chart-actions">
                                    <button class="btn btn-sm btn-secondary" onclick="window.app.modules.analytics.toggleChartType('staff', 'bar')">
                                        <i class="fas fa-chart-bar"></i>
                                    </button>
                                    <button class="btn btn-sm btn-secondary" onclick="window.app.modules.analytics.toggleChartType('staff', 'horizontalBar')">
                                        <i class="fas fa-chart-bar"></i>
                                    </button>
                                </div>
                            </div>
                            <div class="chart-content">
                                <canvas id="staff-chart" width="400" height="200"></canvas>
                            </div>
                        </div>
                        
                        <div class="chart-container">
                            <div class="chart-header">
                                <h3>Communication Channels</h3>
                                <div class="chart-actions">
                                    <button class="btn btn-sm btn-secondary" onclick="window.app.modules.analytics.toggleChartType('communications', 'pie')">
                                        <i class="fas fa-chart-pie"></i>
                                    </button>
                                    <button class="btn btn-sm btn-secondary" onclick="window.app.modules.analytics.toggleChartType('communications', 'doughnut')">
                                        <i class="fas fa-circle"></i>
                                    </button>
                                </div>
                            </div>
                            <div class="chart-content">
                                <canvas id="communications-chart" width="400" height="200"></canvas>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Data Tables -->
                <div class="data-tables">
                    <div class="table-container">
                        <div class="table-header">
                            <h3>Top Performing Staff</h3>
                            <button class="btn btn-sm btn-primary" onclick="window.app.modules.analytics.exportTable('staff')">
                                <i class="fas fa-download"></i>
                                Export
                            </button>
                        </div>
                        <div class="table-content">
                            <table class="table" id="staff-table">
                                <thead>
                                    <tr>
                                        <th>Staff Member</th>
                                        <th>Tasks Completed</th>
                                        <th>Revenue Generated</th>
                                        <th>Client Satisfaction</th>
                                        <th>Performance Score</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <!-- Data will be populated here -->
                                </tbody>
                            </table>
                        </div>
                    </div>
                    
                    <div class="table-container">
                        <div class="table-header">
                            <h3>Client Analytics</h3>
                            <button class="btn btn-sm btn-primary" onclick="window.app.modules.analytics.exportTable('clients')">
                                <i class="fas fa-download"></i>
                                Export
                            </button>
                        </div>
                        <div class="table-content">
                            <table class="table" id="clients-table">
                                <thead>
                                    <tr>
                                        <th>Client Name</th>
                                        <th>Services</th>
                                        <th>Revenue</th>
                                        <th>Last Activity</th>
                                        <th>Satisfaction</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <!-- Data will be populated here -->
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        `;

        return page;
    }

    /**
     * Load analytics data
     */
    async loadAnalyticsData() {
        try {
            this.app.loading.showOverlay('Loading analytics data...');

            const response = await this.api.get('/analytics/dashboard');
            
            if (response.success) {
                this.data.analytics = response.data.analytics;
                this.updateKPICards();
                this.renderCharts();
                this.renderTables();
            } else {
                this.app.toast.error(response.message || 'Failed to load analytics data');
            }
        } catch (error) {
            console.error('Load analytics error:', error);
            this.app.toast.error('Failed to load analytics data');
        } finally {
            this.app.loading.hideOverlay();
        }
    }

    /**
     * Update KPI cards
     */
    updateKPICards() {
        const analytics = this.data.analytics;
        
        // Update total clients
        document.getElementById('total-clients').textContent = analytics.totalClients || 0;
        document.getElementById('clients-change').textContent = `+${analytics.clientsChange || 0}%`;
        
        // Update total revenue
        document.getElementById('total-revenue').textContent = `₹${(analytics.totalRevenue || 0).toLocaleString()}`;
        document.getElementById('revenue-change').textContent = `+${analytics.revenueChange || 0}%`;
        
        // Update completed tasks
        document.getElementById('completed-tasks').textContent = analytics.completedTasks || 0;
        document.getElementById('tasks-change').textContent = `+${analytics.tasksChange || 0}%`;
        
        // Update communications
        document.getElementById('communications').textContent = analytics.totalCommunications || 0;
        document.getElementById('communications-change').textContent = `+${analytics.communicationsChange || 0}%`;
    }

    /**
     * Render charts
     */
    renderCharts() {
        this.renderRevenueChart();
        this.renderClientsChart();
        this.renderStaffChart();
        this.renderCommunicationsChart();
    }

    /**
     * Render revenue chart
     */
    renderRevenueChart() {
        const canvas = document.getElementById('revenue-chart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const data = this.data.analytics.revenueData || [];
        
        // This would integrate with Chart.js
        // For now, just show a placeholder
        ctx.fillStyle = '#f0f0f0';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#333';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Revenue Trend Chart', canvas.width / 2, canvas.height / 2);
    }

    /**
     * Render clients chart
     */
    renderClientsChart() {
        const canvas = document.getElementById('clients-chart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const data = this.data.analytics.clientsData || [];
        
        // This would integrate with Chart.js
        // For now, just show a placeholder
        ctx.fillStyle = '#f0f0f0';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#333';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Client Distribution Chart', canvas.width / 2, canvas.height / 2);
    }

    /**
     * Render staff chart
     */
    renderStaffChart() {
        const canvas = document.getElementById('staff-chart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const data = this.data.analytics.staffData || [];
        
        // This would integrate with Chart.js
        // For now, just show a placeholder
        ctx.fillStyle = '#f0f0f0';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#333';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Staff Performance Chart', canvas.width / 2, canvas.height / 2);
    }

    /**
     * Render communications chart
     */
    renderCommunicationsChart() {
        const canvas = document.getElementById('communications-chart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const data = this.data.analytics.communicationsData || [];
        
        // This would integrate with Chart.js
        // For now, just show a placeholder
        ctx.fillStyle = '#f0f0f0';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#333';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Communication Channels Chart', canvas.width / 2, canvas.height / 2);
    }

    /**
     * Render data tables
     */
    renderTables() {
        this.renderStaffTable();
        this.renderClientsTable();
    }

    /**
     * Render staff table
     */
    renderStaffTable() {
        const tbody = document.querySelector('#staff-table tbody');
        if (!tbody) return;

        const staffData = this.data.analytics.staffPerformance || [];
        
        tbody.innerHTML = staffData.map(staff => `
            <tr>
                <td>${staff.name}</td>
                <td>${staff.tasksCompleted}</td>
                <td>₹${staff.revenueGenerated.toLocaleString()}</td>
                <td>
                    <div class="rating">
                        <span class="stars">${'★'.repeat(staff.satisfaction)}${'☆'.repeat(5 - staff.satisfaction)}</span>
                        <span class="rating-value">${staff.satisfaction}/5</span>
                    </div>
                </td>
                <td>
                    <div class="performance-score">
                        <div class="score-bar">
                            <div class="score-fill" style="width: ${staff.performanceScore}%"></div>
                        </div>
                        <span class="score-value">${staff.performanceScore}%</span>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    /**
     * Render clients table
     */
    renderClientsTable() {
        const tbody = document.querySelector('#clients-table tbody');
        if (!tbody) return;

        const clientsData = this.data.analytics.clientAnalytics || [];
        
        tbody.innerHTML = clientsData.map(client => `
            <tr>
                <td>${client.name}</td>
                <td>${client.services.join(', ')}</td>
                <td>₹${client.revenue.toLocaleString()}</td>
                <td>${this.app.helpers.formatDate(client.lastActivity)}</td>
                <td>
                    <div class="rating">
                        <span class="stars">${'★'.repeat(client.satisfaction)}${'☆'.repeat(5 - client.satisfaction)}</span>
                        <span class="rating-value">${client.satisfaction}/5</span>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Date range filter
        const dateRange = document.getElementById('date-range');
        if (dateRange) {
            dateRange.addEventListener('change', (e) => {
                if (e.target.value === 'custom') {
                    document.getElementById('custom-date-range').style.display = 'block';
                    document.getElementById('custom-date-range-end').style.display = 'block';
                } else {
                    document.getElementById('custom-date-range').style.display = 'none';
                    document.getElementById('custom-date-range-end').style.display = 'none';
                }
            });
        }

        // Apply filters button
        const applyFilters = document.getElementById('apply-filters');
        if (applyFilters) {
            applyFilters.addEventListener('click', () => {
                this.applyFilters();
            });
        }

        // Refresh analytics button
        const refreshBtn = document.getElementById('refresh-analytics');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.loadAnalyticsData();
            });
        }

        // Export analytics button
        const exportBtn = document.getElementById('export-analytics');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                this.exportAnalytics();
            });
        }
    }

    /**
     * Apply filters
     */
    async applyFilters() {
        try {
            this.app.loading.showOverlay('Applying filters...');

            const filters = {
                dateRange: document.getElementById('date-range').value,
                startDate: document.getElementById('start-date').value,
                endDate: document.getElementById('end-date').value,
                client: document.getElementById('client-filter').value,
                staff: document.getElementById('staff-filter').value
            };

            const response = await this.api.post('/analytics/filter', filters);
            
            if (response.success) {
                this.data.analytics = response.data.analytics;
                this.updateKPICards();
                this.renderCharts();
                this.renderTables();
                this.app.toast.success('Filters applied successfully');
            } else {
                this.app.toast.error(response.message || 'Failed to apply filters');
            }
        } catch (error) {
            console.error('Apply filters error:', error);
            this.app.toast.error('Failed to apply filters');
        } finally {
            this.app.loading.hideOverlay();
        }
    }

    /**
     * Toggle chart type
     */
    toggleChartType(chartName, type) {
        // This would update the chart type
        console.log(`Toggle ${chartName} chart to ${type}`);
        this.app.toast.info(`Chart type changed to ${type}`);
    }

    /**
     * Export table data
     */
    async exportTable(tableName) {
        try {
            this.app.loading.showOverlay('Exporting table data...');
            
            const response = await this.api.post(`/analytics/export/${tableName}`);
            
            if (response.success) {
                // Create download link
                const link = document.createElement('a');
                link.href = response.data.downloadUrl;
                link.download = response.data.filename;
                link.click();
                
                this.app.toast.success('Table data exported successfully');
            } else {
                this.app.toast.error(response.message || 'Failed to export table data');
            }
        } catch (error) {
            console.error('Export table error:', error);
            this.app.toast.error('Failed to export table data');
        } finally {
            this.app.loading.hideOverlay();
        }
    }

    /**
     * Export analytics data
     */
    async exportAnalytics() {
        try {
            this.app.loading.showOverlay('Exporting analytics data...');
            
            const response = await this.api.post('/analytics/export');
            
            if (response.success) {
                // Create download link
                const link = document.createElement('a');
                link.href = response.data.downloadUrl;
                link.download = response.data.filename;
                link.click();
                
                this.app.toast.success('Analytics data exported successfully');
            } else {
                this.app.toast.error(response.message || 'Failed to export analytics data');
            }
        } catch (error) {
            console.error('Export analytics error:', error);
            this.app.toast.error('Failed to export analytics data');
        } finally {
            this.app.loading.hideOverlay();
        }
    }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AnalyticsModule;
}