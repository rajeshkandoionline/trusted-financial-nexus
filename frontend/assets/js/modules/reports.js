/**
 * Reports Module
 * Handles reporting and analytics functionality
 */

class ReportsModule {
    constructor(app) {
        this.app = app;
        this.api = app.api;
        this.data = {
            reports: [],
            templates: [],
            categories: []
        };
    }

    /**
     * Load reports module
     */
    async load() {
        try {
            this.showReportsPage();
            await this.loadReportTemplates();
            this.setupEventListeners();
        } catch (error) {
            console.error('Reports load error:', error);
            this.app.toast.error('Failed to load reports');
        }
    }

    /**
     * Show reports page
     */
    showReportsPage() {
        // Hide all pages
        document.querySelectorAll('.page').forEach(page => {
            page.classList.add('hidden');
        });

        // Create reports page if it doesn't exist
        let reportsPage = document.getElementById('reports-page');
        if (!reportsPage) {
            reportsPage = this.createReportsPage();
            document.getElementById('main-content-area').appendChild(reportsPage);
        }

        reportsPage.classList.remove('hidden');
        reportsPage.classList.add('active');
    }

    /**
     * Create reports page HTML
     */
    createReportsPage() {
        const page = document.createElement('div');
        page.id = 'reports-page';
        page.className = 'page reports-page';
        
        page.innerHTML = `
            <div class="page-header">
                <h1>Reports & Analytics</h1>
                <div class="page-actions">
                    <button class="btn btn-secondary" id="schedule-report">
                        <i class="fas fa-clock"></i>
                        Schedule Report
                    </button>
                    <button class="btn btn-primary" id="create-report">
                        <i class="fas fa-plus"></i>
                        Create Report
                    </button>
                </div>
            </div>
            
            <div class="reports-content">
                <!-- Report Categories -->
                <div class="report-categories">
                    <div class="category-tabs">
                        <button class="category-tab active" data-category="financial">
                            <i class="fas fa-chart-line"></i>
                            Financial Reports
                        </button>
                        <button class="category-tab" data-category="client">
                            <i class="fas fa-users"></i>
                            Client Reports
                        </button>
                        <button class="category-tab" data-category="staff">
                            <i class="fas fa-user-tie"></i>
                            Staff Performance
                        </button>
                        <button class="category-tab" data-category="communication">
                            <i class="fas fa-comments"></i>
                            Communication Analytics
                        </button>
                        <button class="category-tab" data-category="business">
                            <i class="fas fa-chart-pie"></i>
                            Business Intelligence
                        </button>
                    </div>
                </div>

                <!-- Report Templates -->
                <div class="report-templates" id="report-templates">
                    <!-- Templates will be populated here -->
                </div>

                <!-- Recent Reports -->
                <div class="recent-reports">
                    <h2>Recent Reports</h2>
                    <div class="reports-list" id="reports-list">
                        <!-- Recent reports will be populated here -->
                    </div>
                </div>
            </div>
        `;

        return page;
    }

    /**
     * Load report templates
     */
    async loadReportTemplates() {
        try {
            this.app.loading.showOverlay('Loading report templates...');

            const response = await this.api.get('/reports/templates');
            
            if (response.success) {
                this.data.templates = response.data.templates;
                this.data.categories = response.data.categories;
                this.renderReportTemplates('financial');
                this.loadRecentReports();
            } else {
                this.app.toast.error(response.message || 'Failed to load report templates');
            }
        } catch (error) {
            console.error('Load report templates error:', error);
            this.app.toast.error('Failed to load report templates');
        } finally {
            this.app.loading.hideOverlay();
        }
    }

    /**
     * Load recent reports
     */
    async loadRecentReports() {
        try {
            const response = await this.api.get('/reports/recent');
            
            if (response.success) {
                this.data.reports = response.data.reports;
                this.renderRecentReports();
            }
        } catch (error) {
            console.error('Load recent reports error:', error);
        }
    }

    /**
     * Render report templates
     */
    renderReportTemplates(category) {
        const container = document.getElementById('report-templates');
        if (!container) return;

        const templates = this.data.templates.filter(template => template.category === category);
        
        if (templates.length === 0) {
            container.innerHTML = `
                <div class="no-data">
                    <i class="fas fa-chart-bar"></i>
                    <p>No report templates found for this category</p>
                </div>
            `;
            return;
        }

        container.innerHTML = templates.map(template => `
            <div class="report-template" data-template-id="${template.id}">
                <div class="template-icon">
                    <i class="fas fa-${template.icon}"></i>
                </div>
                
                <div class="template-info">
                    <h3>${template.name}</h3>
                    <p>${template.description}</p>
                    <div class="template-meta">
                        <span class="template-type">${template.type}</span>
                        <span class="template-frequency">${template.frequency}</span>
                    </div>
                </div>
                
                <div class="template-actions">
                    <button class="btn btn-primary" onclick="window.app.modules.reports.generateReport('${template.id}')">
                        <i class="fas fa-play"></i>
                        Generate
                    </button>
                    <button class="btn btn-secondary" onclick="window.app.modules.reports.previewReport('${template.id}')">
                        <i class="fas fa-eye"></i>
                        Preview
                    </button>
                </div>
            </div>
        `).join('');
    }

    /**
     * Render recent reports
     */
    renderRecentReports() {
        const container = document.getElementById('reports-list');
        if (!container) return;

        if (this.data.reports.length === 0) {
            container.innerHTML = `
                <div class="no-data">
                    <i class="fas fa-file-alt"></i>
                    <p>No recent reports found</p>
                </div>
            `;
            return;
        }

        container.innerHTML = this.data.reports.map(report => `
            <div class="report-item" data-report-id="${report.id}">
                <div class="report-icon">
                    <i class="fas fa-${report.icon}"></i>
                </div>
                
                <div class="report-info">
                    <h3>${report.name}</h3>
                    <p>Generated on ${this.app.helpers.formatDateTime(report.generated_at)}</p>
                    <div class="report-meta">
                        <span class="report-type">${report.type}</span>
                        <span class="report-status badge badge-${report.status}">${report.status}</span>
                    </div>
                </div>
                
                <div class="report-actions">
                    <button class="btn btn-sm btn-secondary" onclick="window.app.modules.reports.downloadReport('${report.id}')">
                        <i class="fas fa-download"></i>
                    </button>
                    <button class="btn btn-sm btn-primary" onclick="window.app.modules.reports.viewReport('${report.id}')">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="window.app.modules.reports.deleteReport('${report.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Category tabs
        const categoryTabs = document.querySelectorAll('.category-tab');
        categoryTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                // Remove active class from all tabs
                categoryTabs.forEach(t => t.classList.remove('active'));
                // Add active class to clicked tab
                tab.classList.add('active');
                
                // Render templates for selected category
                const category = tab.dataset.category;
                this.renderReportTemplates(category);
            });
        });

        // Create report button
        const createReportBtn = document.getElementById('create-report');
        if (createReportBtn) {
            createReportBtn.addEventListener('click', () => {
                this.showCreateReportModal();
            });
        }

        // Schedule report button
        const scheduleReportBtn = document.getElementById('schedule-report');
        if (scheduleReportBtn) {
            scheduleReportBtn.addEventListener('click', () => {
                this.showScheduleReportModal();
            });
        }
    }

    /**
     * Generate report
     */
    async generateReport(templateId) {
        try {
            this.app.loading.showOverlay('Generating report...');
            
            const response = await this.api.post(`/reports/generate/${templateId}`);
            
            if (response.success) {
                this.app.toast.success('Report generated successfully');
                this.loadRecentReports();
                
                // Show report options
                this.showReportOptions(response.data.report);
            } else {
                this.app.toast.error(response.message || 'Failed to generate report');
            }
        } catch (error) {
            console.error('Generate report error:', error);
            this.app.toast.error('Failed to generate report');
        } finally {
            this.app.loading.hideOverlay();
        }
    }

    /**
     * Preview report
     */
    async previewReport(templateId) {
        try {
            this.app.loading.showOverlay('Loading report preview...');
            
            const response = await this.api.get(`/reports/preview/${templateId}`);
            
            if (response.success) {
                this.showReportPreview(response.data.preview);
            } else {
                this.app.toast.error(response.message || 'Failed to load report preview');
            }
        } catch (error) {
            console.error('Preview report error:', error);
            this.app.toast.error('Failed to load report preview');
        } finally {
            this.app.loading.hideOverlay();
        }
    }

    /**
     * View report
     */
    async viewReport(reportId) {
        try {
            this.app.loading.showOverlay('Loading report...');
            
            const response = await this.api.get(`/reports/${reportId}`);
            
            if (response.success) {
                this.showReportViewer(response.data.report);
            } else {
                this.app.toast.error(response.message || 'Failed to load report');
            }
        } catch (error) {
            console.error('View report error:', error);
            this.app.toast.error('Failed to load report');
        } finally {
            this.app.loading.hideOverlay();
        }
    }

    /**
     * Download report
     */
    async downloadReport(reportId) {
        try {
            this.app.loading.showOverlay('Preparing download...');
            
            const response = await this.api.get(`/reports/${reportId}/download`);
            
            if (response.success) {
                // Create download link
                const link = document.createElement('a');
                link.href = response.data.downloadUrl;
                link.download = response.data.filename;
                link.click();
                
                this.app.toast.success('Download started');
            } else {
                this.app.toast.error(response.message || 'Failed to download report');
            }
        } catch (error) {
            console.error('Download report error:', error);
            this.app.toast.error('Failed to download report');
        } finally {
            this.app.loading.hideOverlay();
        }
    }

    /**
     * Delete report
     */
    async deleteReport(reportId) {
        const confirmed = await this.app.modal.confirm(
            'Are you sure you want to delete this report?',
            {
                title: 'Delete Report',
                confirmText: 'Delete',
                cancelText: 'Cancel',
                type: 'error'
            }
        );

        if (confirmed) {
            try {
                this.app.loading.showOverlay('Deleting report...');
                
                const response = await this.api.delete(`/reports/${reportId}`);
                
                if (response.success) {
                    this.app.toast.success('Report deleted successfully');
                    this.loadRecentReports();
                } else {
                    this.app.toast.error(response.message || 'Failed to delete report');
                }
            } catch (error) {
                console.error('Delete report error:', error);
                this.app.toast.error('Failed to delete report');
            } finally {
                this.app.loading.hideOverlay();
            }
        }
    }

    /**
     * Show create report modal
     */
    showCreateReportModal() {
        const formHTML = `
            <div class="form-group">
                <label class="form-label">Report Name *</label>
                <input type="text" name="name" class="form-control" required>
            </div>
            
            <div class="form-group">
                <label class="form-label">Report Type *</label>
                <select name="type" class="form-select" required>
                    <option value="">Select Type</option>
                    <option value="financial">Financial Report</option>
                    <option value="client">Client Report</option>
                    <option value="staff">Staff Performance</option>
                    <option value="communication">Communication Analytics</option>
                    <option value="business">Business Intelligence</option>
                </select>
            </div>
            
            <div class="form-group">
                <label class="form-label">Description</label>
                <textarea name="description" class="form-textarea" rows="3"></textarea>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">Start Date</label>
                    <input type="date" name="start_date" class="form-control">
                </div>
                <div class="form-group">
                    <label class="form-label">End Date</label>
                    <input type="date" name="end_date" class="form-control">
                </div>
            </div>
            
            <div class="form-group">
                <label class="form-label">Format</label>
                <div class="checkbox-group">
                    <label class="checkbox-label">
                        <input type="checkbox" name="formats" value="pdf" checked>
                        <span>PDF</span>
                    </label>
                    <label class="checkbox-label">
                        <input type="checkbox" name="formats" value="excel">
                        <span>Excel</span>
                    </label>
                    <label class="checkbox-label">
                        <input type="checkbox" name="formats" value="csv">
                        <span>CSV</span>
                    </label>
                </div>
            </div>
        `;
        
        this.app.modal.showForm(formHTML, {
            title: 'Create Custom Report',
            size: 'lg',
            onSubmit: (data) => this.handleCreateReport(data),
            onCancel: () => this.app.modal.close()
        });
    }

    /**
     * Show schedule report modal
     */
    showScheduleReportModal() {
        const formHTML = `
            <div class="form-group">
                <label class="form-label">Report Template *</label>
                <select name="template_id" class="form-select" required>
                    <option value="">Select Template</option>
                    ${this.data.templates.map(template => `
                        <option value="${template.id}">${template.name}</option>
                    `).join('')}
                </select>
            </div>
            
            <div class="form-group">
                <label class="form-label">Frequency *</label>
                <select name="frequency" class="form-select" required>
                    <option value="">Select Frequency</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="annually">Annually</option>
                </select>
            </div>
            
            <div class="form-group">
                <label class="form-label">Recipients *</label>
                <input type="text" name="recipients" class="form-control" placeholder="Enter email addresses separated by commas" required>
            </div>
            
            <div class="form-group">
                <label class="form-label">Start Date</label>
                <input type="date" name="start_date" class="form-control">
            </div>
            
            <div class="form-group">
                <label class="form-label">End Date</label>
                <input type="date" name="end_date" class="form-control">
            </div>
        `;
        
        this.app.modal.showForm(formHTML, {
            title: 'Schedule Report',
            size: 'lg',
            onSubmit: (data) => this.handleScheduleReport(data),
            onCancel: () => this.app.modal.close()
        });
    }

    /**
     * Show report options
     */
    showReportOptions(report) {
        const optionsHTML = `
            <div class="report-options">
                <h3>Report Generated Successfully!</h3>
                <p>Your report "${report.name}" has been generated and is ready for download.</p>
                
                <div class="options-actions">
                    <button class="btn btn-primary" onclick="window.app.modules.reports.downloadReport('${report.id}')">
                        <i class="fas fa-download"></i>
                        Download Now
                    </button>
                    <button class="btn btn-secondary" onclick="window.app.modules.reports.viewReport('${report.id}')">
                        <i class="fas fa-eye"></i>
                        View Online
                    </button>
                    <button class="btn btn-success" onclick="window.app.modules.reports.emailReport('${report.id}')">
                        <i class="fas fa-envelope"></i>
                        Email Report
                    </button>
                </div>
            </div>
        `;
        
        this.app.modal.show(optionsHTML, {
            title: 'Report Ready',
            size: 'md'
        });
    }

    /**
     * Show report preview
     */
    showReportPreview(preview) {
        const previewHTML = `
            <div class="report-preview">
                <div class="preview-header">
                    <h3>${preview.name}</h3>
                    <p>${preview.description}</p>
                </div>
                
                <div class="preview-content">
                    <div class="preview-chart">
                        <canvas id="preview-chart" width="400" height="200"></canvas>
                    </div>
                    
                    <div class="preview-summary">
                        <h4>Summary</h4>
                        <ul>
                            ${preview.summary.map(item => `<li>${item}</li>`).join('')}
                        </ul>
                    </div>
                </div>
            </div>
        `;
        
        this.app.modal.show(previewHTML, {
            title: 'Report Preview',
            size: 'lg',
            onShow: () => {
                this.renderPreviewChart(preview.chartData);
            }
        });
    }

    /**
     * Show report viewer
     */
    showReportViewer(report) {
        const viewerHTML = `
            <div class="report-viewer">
                <div class="viewer-header">
                    <h2>${report.name}</h2>
                    <div class="viewer-actions">
                        <button class="btn btn-secondary" onclick="window.app.modules.reports.downloadReport('${report.id}')">
                            <i class="fas fa-download"></i>
                            Download
                        </button>
                        <button class="btn btn-primary" onclick="window.app.modules.reports.emailReport('${report.id}')">
                            <i class="fas fa-envelope"></i>
                            Email
                        </button>
                    </div>
                </div>
                
                <div class="viewer-content">
                    <div class="report-charts">
                        <canvas id="report-chart" width="800" height="400"></canvas>
                    </div>
                    
                    <div class="report-data">
                        <div class="data-table">
                            <table class="table">
                                <thead>
                                    <tr>
                                        <th>Metric</th>
                                        <th>Value</th>
                                        <th>Change</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${report.data.map(row => `
                                        <tr>
                                            <td>${row.metric}</td>
                                            <td>${row.value}</td>
                                            <td class="${row.change >= 0 ? 'positive' : 'negative'}">
                                                ${row.change >= 0 ? '+' : ''}${row.change}%
                                            </td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        this.app.modal.show(viewerHTML, {
            title: 'Report Viewer',
            size: 'xl',
            onShow: () => {
                this.renderReportChart(report.chartData);
            }
        });
    }

    /**
     * Handle create report
     */
    async handleCreateReport(data) {
        try {
            this.app.loading.showOverlay('Creating report...');
            
            const response = await this.api.post('/reports', data);
            
            if (response.success) {
                this.app.toast.success('Report created successfully');
                this.app.modal.close();
                this.loadRecentReports();
            } else {
                this.app.toast.error(response.message || 'Failed to create report');
            }
        } catch (error) {
            console.error('Create report error:', error);
            this.app.toast.error('Failed to create report');
        } finally {
            this.app.loading.hideOverlay();
        }
    }

    /**
     * Handle schedule report
     */
    async handleScheduleReport(data) {
        try {
            this.app.loading.showOverlay('Scheduling report...');
            
            const response = await this.api.post('/reports/schedule', data);
            
            if (response.success) {
                this.app.toast.success('Report scheduled successfully');
                this.app.modal.close();
            } else {
                this.app.toast.error(response.message || 'Failed to schedule report');
            }
        } catch (error) {
            console.error('Schedule report error:', error);
            this.app.toast.error('Failed to schedule report');
        } finally {
            this.app.loading.hideOverlay();
        }
    }

    /**
     * Email report
     */
    async emailReport(reportId) {
        try {
            this.app.loading.showOverlay('Sending report...');
            
            const response = await this.api.post(`/reports/${reportId}/email`);
            
            if (response.success) {
                this.app.toast.success('Report sent successfully');
            } else {
                this.app.toast.error(response.message || 'Failed to send report');
            }
        } catch (error) {
            console.error('Email report error:', error);
            this.app.toast.error('Failed to send report');
        } finally {
            this.app.loading.hideOverlay();
        }
    }

    /**
     * Render preview chart
     */
    renderPreviewChart(chartData) {
        const canvas = document.getElementById('preview-chart');
        if (!canvas || !chartData) return;

        const ctx = canvas.getContext('2d');
        
        // This would integrate with Chart.js
        // For now, just show a placeholder
        ctx.fillStyle = '#f0f0f0';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#333';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Chart Preview', canvas.width / 2, canvas.height / 2);
    }

    /**
     * Render report chart
     */
    renderReportChart(chartData) {
        const canvas = document.getElementById('report-chart');
        if (!canvas || !chartData) return;

        const ctx = canvas.getContext('2d');
        
        // This would integrate with Chart.js
        // For now, just show a placeholder
        ctx.fillStyle = '#f0f0f0';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#333';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Report Chart', canvas.width / 2, canvas.height / 2);
    }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ReportsModule;
}