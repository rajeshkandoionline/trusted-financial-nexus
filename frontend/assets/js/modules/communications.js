/**
 * Communications Module
 * Handles communication management functionality
 */

class CommunicationsModule {
    constructor(app) {
        this.app = app;
        this.api = app.api;
        this.data = {
            communications: [],
            pagination: {}
        };
    }

    /**
     * Load communications module
     */
    async load() {
        try {
            this.showCommunicationsPage();
            await this.loadCommunications();
            this.setupEventListeners();
        } catch (error) {
            console.error('Communications load error:', error);
            this.app.toast.error('Failed to load communications');
        }
    }

    /**
     * Show communications page
     */
    showCommunicationsPage() {
        // Hide all pages
        document.querySelectorAll('.page').forEach(page => {
            page.classList.add('hidden');
        });

        // Create communications page if it doesn't exist
        let communicationsPage = document.getElementById('communications-page');
        if (!communicationsPage) {
            communicationsPage = this.createCommunicationsPage();
            document.getElementById('main-content-area').appendChild(communicationsPage);
        }

        communicationsPage.classList.remove('hidden');
        communicationsPage.classList.add('active');
    }

    /**
     * Create communications page HTML
     */
    createCommunicationsPage() {
        const page = document.createElement('div');
        page.id = 'communications-page';
        page.className = 'page communications-page';
        
        page.innerHTML = `
            <div class="page-header">
                <h1>Communications</h1>
                <div class="page-actions">
                    <button class="btn btn-secondary" id="export-communications">
                        <i class="fas fa-download"></i>
                        Export
                    </button>
                    <button class="btn btn-primary" id="add-communication">
                        <i class="fas fa-plus"></i>
                        Add Communication
                    </button>
                </div>
            </div>
            
            <div class="communications-content">
                <!-- Filters -->
                <div class="filters-section">
                    <div class="filters-row">
                        <div class="filter-group">
                            <label>Search</label>
                            <input type="text" id="communication-search" placeholder="Search communications..." class="form-control">
                        </div>
                        <div class="filter-group">
                            <label>Type</label>
                            <select id="type-filter" class="form-select">
                                <option value="">All Types</option>
                                <option value="Incoming">Incoming</option>
                                <option value="Outgoing">Outgoing</option>
                            </select>
                        </div>
                        <div class="filter-group">
                            <label>Channel</label>
                            <select id="channel-filter" class="form-select">
                                <option value="">All Channels</option>
                                <option value="Email">Email</option>
                                <option value="Phone">Phone</option>
                                <option value="WhatsApp">WhatsApp</option>
                                <option value="SMS">SMS</option>
                                <option value="Video Call">Video Call</option>
                                <option value="In-Person">In-Person</option>
                                <option value="Letter">Letter</option>
                                <option value="Fax">Fax</option>
                            </select>
                        </div>
                        <div class="filter-group">
                            <label>Status</label>
                            <select id="status-filter" class="form-select">
                                <option value="">All Status</option>
                                <option value="Pending">Pending</option>
                                <option value="In Progress">In Progress</option>
                                <option value="Completed">Completed</option>
                                <option value="Cancelled">Cancelled</option>
                            </select>
                        </div>
                        <div class="filter-actions">
                            <button class="btn btn-secondary" id="clear-filters">
                                <i class="fas fa-times"></i>
                                Clear
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Communications List -->
                <div class="communications-list" id="communications-list">
                    <!-- Communications will be populated here -->
                </div>
                
                <!-- Pagination -->
                <div class="pagination" id="communications-pagination">
                    <!-- Pagination will be populated here -->
                </div>
            </div>
        `;

        return page;
    }

    /**
     * Load communications data
     */
    async loadCommunications(page = 1) {
        try {
            this.app.loading.showOverlay('Loading communications...');

            const params = {
                page,
                limit: 10
            };

            const response = await this.api.get('/communications', params);
            
            if (response.success) {
                this.data.communications = response.data.communications;
                this.data.pagination = response.data.pagination;
                this.renderCommunications();
                this.renderPagination();
            } else {
                this.app.toast.error(response.message || 'Failed to load communications');
            }
        } catch (error) {
            console.error('Load communications error:', error);
            this.app.toast.error('Failed to load communications');
        } finally {
            this.app.loading.hideOverlay();
        }
    }

    /**
     * Render communications list
     */
    renderCommunications() {
        const list = document.getElementById('communications-list');
        if (!list) return;

        if (this.data.communications.length === 0) {
            list.innerHTML = `
                <div class="no-data">
                    <i class="fas fa-comments"></i>
                    <p>No communications found</p>
                </div>
            `;
            return;
        }

        list.innerHTML = this.data.communications.map(comm => `
            <div class="communication-item" data-communication-id="${comm._id}">
                <div class="communication-header">
                    <div class="communication-type">
                        <span class="type-indicator ${comm.type.toLowerCase()}"></span>
                        <span class="type-text">${comm.type}</span>
                    </div>
                    <div class="communication-meta">
                        <span class="communication-date">${this.app.helpers.formatDateTime(comm.date)}</span>
                        <span class="communication-status badge badge-${this.getStatusClass(comm.status)}">${comm.status}</span>
                    </div>
                </div>
                
                <div class="communication-content">
                    <div class="communication-subject">
                        <h3>${comm.subject || 'No Subject'}</h3>
                    </div>
                    
                    <div class="communication-summary">
                        <p>${comm.summary || 'No summary available'}</p>
                    </div>
                    
                    <div class="communication-details">
                        <div class="communication-detail">
                            <i class="fas fa-${this.getChannelIcon(comm.channel)}"></i>
                            <span>${comm.channel}</span>
                        </div>
                        <div class="communication-detail">
                            <i class="fas fa-user"></i>
                            <span>${comm.client_name}</span>
                        </div>
                        <div class="communication-detail">
                            <i class="fas fa-user-tie"></i>
                            <span>${comm.staff_name}</span>
                        </div>
                        ${comm.duration_minutes ? `
                            <div class="communication-detail">
                                <i class="fas fa-clock"></i>
                                <span>${comm.duration_minutes} min</span>
                            </div>
                        ` : ''}
                    </div>
                    
                    ${comm.action_items && comm.action_items.length > 0 ? `
                        <div class="communication-actions">
                            <h4>Action Items:</h4>
                            <ul>
                                ${comm.action_items.map(item => `<li>${item}</li>`).join('')}
                            </ul>
                        </div>
                    ` : ''}
                </div>
                
                <div class="communication-footer">
                    <div class="communication-tags">
                        ${comm.priority ? `<span class="tag tag-${comm.priority.toLowerCase()}">${comm.priority}</span>` : ''}
                    </div>
                    <div class="communication-actions">
                        <button class="btn btn-sm btn-secondary" onclick="window.app.modules.communications.viewCommunication('${comm._id}')">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-sm btn-primary" onclick="window.app.modules.communications.editCommunication('${comm._id}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-success" onclick="window.app.modules.communications.completeCommunication('${comm._id}')">
                            <i class="fas fa-check"></i>
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    /**
     * Render pagination
     */
    renderPagination() {
        const pagination = document.getElementById('communications-pagination');
        if (!pagination) return;

        const { page, pages, total } = this.data.pagination;
        
        if (pages <= 1) {
            pagination.innerHTML = '';
            return;
        }

        let paginationHTML = '';
        
        // Previous button
        paginationHTML += `
            <button class="pagination-item ${page === 1 ? 'disabled' : ''}" 
                    ${page === 1 ? 'disabled' : ''} 
                    onclick="window.app.modules.communications.loadCommunications(${page - 1})">
                Previous
            </button>
        `;

        // Page numbers
        const startPage = Math.max(1, page - 2);
        const endPage = Math.min(pages, page + 2);

        for (let i = startPage; i <= endPage; i++) {
            paginationHTML += `
                <button class="pagination-item ${i === page ? 'active' : ''}" 
                        onclick="window.app.modules.communications.loadCommunications(${i})">
                    ${i}
                </button>
            `;
        }

        // Next button
        paginationHTML += `
            <button class="pagination-item ${page === pages ? 'disabled' : ''}" 
                    ${page === pages ? 'disabled' : ''} 
                    onclick="window.app.modules.communications.loadCommunications(${page + 1})">
                Next
            </button>
        `;

        pagination.innerHTML = paginationHTML;
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Search input
        const searchInput = document.getElementById('communication-search');
        if (searchInput) {
            searchInput.addEventListener('input', this.app.helpers.debounce((e) => {
                this.loadCommunications(1);
            }, 500));
        }

        // Filter selects
        const filters = ['type-filter', 'channel-filter', 'status-filter'];
        filters.forEach(filterId => {
            const filter = document.getElementById(filterId);
            if (filter) {
                filter.addEventListener('change', () => {
                    this.loadCommunications(1);
                });
            }
        });

        // Clear filters
        const clearFilters = document.getElementById('clear-filters');
        if (clearFilters) {
            clearFilters.addEventListener('click', () => {
                this.clearFilters();
            });
        }

        // Add communication button
        const addCommBtn = document.getElementById('add-communication');
        if (addCommBtn) {
            addCommBtn.addEventListener('click', () => {
                this.showAddCommunicationModal();
            });
        }

        // Export communications button
        const exportBtn = document.getElementById('export-communications');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                this.exportCommunications();
            });
        }
    }

    /**
     * Clear all filters
     */
    clearFilters() {
        document.getElementById('communication-search').value = '';
        document.getElementById('type-filter').value = '';
        document.getElementById('channel-filter').value = '';
        document.getElementById('status-filter').value = '';
        this.loadCommunications(1);
    }

    /**
     * View communication details
     */
    async viewCommunication(commId) {
        try {
            this.app.loading.showOverlay('Loading communication details...');
            
            const response = await this.api.get(`/communications/${commId}`);
            
            if (response.success) {
                this.showCommunicationDetailsModal(response.data.communication);
            } else {
                this.app.toast.error(response.message || 'Failed to load communication details');
            }
        } catch (error) {
            console.error('View communication error:', error);
            this.app.toast.error('Failed to load communication details');
        } finally {
            this.app.loading.hideOverlay();
        }
    }

    /**
     * Edit communication
     */
    async editCommunication(commId) {
        try {
            this.app.loading.showOverlay('Loading communication details...');
            
            const response = await this.api.get(`/communications/${commId}`);
            
            if (response.success) {
                this.showEditCommunicationModal(response.data.communication);
            } else {
                this.app.toast.error(response.message || 'Failed to load communication details');
            }
        } catch (error) {
            console.error('Edit communication error:', error);
            this.app.toast.error('Failed to load communication details');
        } finally {
            this.app.loading.hideOverlay();
        }
    }

    /**
     * Complete communication
     */
    async completeCommunication(commId) {
        const confirmed = await this.app.modal.confirm(
            'Are you sure you want to mark this communication as completed?',
            {
                title: 'Complete Communication',
                confirmText: 'Complete',
                cancelText: 'Cancel',
                type: 'success'
            }
        );

        if (confirmed) {
            try {
                this.app.loading.showOverlay('Completing communication...');
                
                const response = await this.api.put(`/communications/${commId}`, {
                    status: 'Completed'
                });
                
                if (response.success) {
                    this.app.toast.success('Communication completed successfully');
                    this.loadCommunications(this.data.pagination.page);
                } else {
                    this.app.toast.error(response.message || 'Failed to complete communication');
                }
            } catch (error) {
                console.error('Complete communication error:', error);
                this.app.toast.error('Failed to complete communication');
            } finally {
                this.app.loading.hideOverlay();
            }
        }
    }

    /**
     * Show add communication modal
     */
    showAddCommunicationModal() {
        const formHTML = this.getCommunicationFormHTML();
        
        this.app.modal.showForm(formHTML, {
            title: 'Add New Communication',
            size: 'lg',
            onSubmit: (data) => this.handleAddCommunication(data),
            onCancel: () => this.app.modal.close()
        });
    }

    /**
     * Show edit communication modal
     */
    showEditCommunicationModal(comm) {
        const formHTML = this.getCommunicationFormHTML(comm);
        
        this.app.modal.showForm(formHTML, {
            title: 'Edit Communication',
            size: 'lg',
            onSubmit: (data) => this.handleEditCommunication(comm._id, data),
            onCancel: () => this.app.modal.close()
        });
    }

    /**
     * Show communication details modal
     */
    showCommunicationDetailsModal(comm) {
        const detailsHTML = this.getCommunicationDetailsHTML(comm);
        
        this.app.modal.show(detailsHTML, {
            title: 'Communication Details',
            size: 'lg'
        });
    }

    /**
     * Get communication form HTML
     */
    getCommunicationFormHTML(comm = null) {
        return `
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">Type *</label>
                    <select name="type" class="form-select" required>
                        <option value="">Select Type</option>
                        <option value="Incoming" ${comm?.type === 'Incoming' ? 'selected' : ''}>Incoming</option>
                        <option value="Outgoing" ${comm?.type === 'Outgoing' ? 'selected' : ''}>Outgoing</option>
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">Channel *</label>
                    <select name="channel" class="form-select" required>
                        <option value="">Select Channel</option>
                        <option value="Email" ${comm?.channel === 'Email' ? 'selected' : ''}>Email</option>
                        <option value="Phone" ${comm?.channel === 'Phone' ? 'selected' : ''}>Phone</option>
                        <option value="WhatsApp" ${comm?.channel === 'WhatsApp' ? 'selected' : ''}>WhatsApp</option>
                        <option value="SMS" ${comm?.channel === 'SMS' ? 'selected' : ''}>SMS</option>
                        <option value="Video Call" ${comm?.channel === 'Video Call' ? 'selected' : ''}>Video Call</option>
                        <option value="In-Person" ${comm?.channel === 'In-Person' ? 'selected' : ''}>In-Person</option>
                        <option value="Letter" ${comm?.channel === 'Letter' ? 'selected' : ''}>Letter</option>
                        <option value="Fax" ${comm?.channel === 'Fax' ? 'selected' : ''}>Fax</option>
                    </select>
                </div>
            </div>
            
            <div class="form-group">
                <label class="form-label">Subject</label>
                <input type="text" name="subject" class="form-control" value="${comm?.subject || ''}">
            </div>
            
            <div class="form-group">
                <label class="form-label">Summary</label>
                <textarea name="summary" class="form-textarea" rows="3">${comm?.summary || ''}</textarea>
            </div>
            
            <div class="form-group">
                <label class="form-label">Detailed Notes</label>
                <textarea name="detailed_notes" class="form-textarea" rows="4">${comm?.detailed_notes || ''}</textarea>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">Priority</label>
                    <select name="priority" class="form-select">
                        <option value="Low" ${comm?.priority === 'Low' ? 'selected' : ''}>Low</option>
                        <option value="Medium" ${comm?.priority === 'Medium' ? 'selected' : ''}>Medium</option>
                        <option value="High" ${comm?.priority === 'High' ? 'selected' : ''}>High</option>
                        <option value="Urgent" ${comm?.priority === 'Urgent' ? 'selected' : ''}>Urgent</option>
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">Status</label>
                    <select name="status" class="form-select">
                        <option value="Pending" ${comm?.status === 'Pending' ? 'selected' : ''}>Pending</option>
                        <option value="In Progress" ${comm?.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
                        <option value="Completed" ${comm?.status === 'Completed' ? 'selected' : ''}>Completed</option>
                        <option value="Cancelled" ${comm?.status === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
                    </select>
                </div>
            </div>
        `;
    }

    /**
     * Get communication details HTML
     */
    getCommunicationDetailsHTML(comm) {
        return `
            <div class="communication-details-view">
                <div class="communication-header">
                    <h2>${comm.subject || 'No Subject'}</h2>
                    <div class="communication-meta">
                        <span class="badge badge-${this.getStatusClass(comm.status)}">${comm.status}</span>
                        <span class="badge badge-${comm.priority?.toLowerCase() || 'secondary'}">${comm.priority || 'Medium'}</span>
                    </div>
                </div>
                
                <div class="communication-info">
                    <div class="info-row">
                        <label>Type:</label>
                        <span>${comm.type}</span>
                    </div>
                    <div class="info-row">
                        <label>Channel:</label>
                        <span>${comm.channel}</span>
                    </div>
                    <div class="info-row">
                        <label>Client:</label>
                        <span>${comm.client_name}</span>
                    </div>
                    <div class="info-row">
                        <label>Staff:</label>
                        <span>${comm.staff_name}</span>
                    </div>
                    <div class="info-row">
                        <label>Date:</label>
                        <span>${this.app.helpers.formatDateTime(comm.date)}</span>
                    </div>
                    ${comm.duration_minutes ? `
                        <div class="info-row">
                            <label>Duration:</label>
                            <span>${comm.duration_minutes} minutes</span>
                        </div>
                    ` : ''}
                </div>
                
                <div class="communication-content">
                    <h3>Summary</h3>
                    <p>${comm.summary || 'No summary available'}</p>
                    
                    ${comm.detailed_notes ? `
                        <h3>Detailed Notes</h3>
                        <p>${comm.detailed_notes}</p>
                    ` : ''}
                    
                    ${comm.action_items && comm.action_items.length > 0 ? `
                        <h3>Action Items</h3>
                        <ul>
                            ${comm.action_items.map(item => `<li>${item}</li>`).join('')}
                        </ul>
                    ` : ''}
                </div>
            </div>
        `;
    }

    /**
     * Handle add communication
     */
    async handleAddCommunication(data) {
        try {
            this.app.loading.showOverlay('Adding communication...');
            
            const response = await this.api.post('/communications', data);
            
            if (response.success) {
                this.app.toast.success('Communication added successfully');
                this.app.modal.close();
                this.loadCommunications(1);
            } else {
                this.app.toast.error(response.message || 'Failed to add communication');
            }
        } catch (error) {
            console.error('Add communication error:', error);
            this.app.toast.error('Failed to add communication');
        } finally {
            this.app.loading.hideOverlay();
        }
    }

    /**
     * Handle edit communication
     */
    async handleEditCommunication(commId, data) {
        try {
            this.app.loading.showOverlay('Updating communication...');
            
            const response = await this.api.put(`/communications/${commId}`, data);
            
            if (response.success) {
                this.app.toast.success('Communication updated successfully');
                this.app.modal.close();
                this.loadCommunications(this.data.pagination.page);
            } else {
                this.app.toast.error(response.message || 'Failed to update communication');
            }
        } catch (error) {
            console.error('Edit communication error:', error);
            this.app.toast.error('Failed to update communication');
        } finally {
            this.app.loading.hideOverlay();
        }
    }

    /**
     * Export communications
     */
    async exportCommunications() {
        try {
            this.app.loading.showOverlay('Exporting communications...');
            
            // This would call the export API
            this.app.toast.success('Export functionality will be implemented');
        } catch (error) {
            console.error('Export communications error:', error);
            this.app.toast.error('Failed to export communications');
        } finally {
            this.app.loading.hideOverlay();
        }
    }

    /**
     * Get status CSS class
     */
    getStatusClass(status) {
        const statusClasses = {
            'Pending': 'warning',
            'In Progress': 'info',
            'Completed': 'success',
            'Cancelled': 'error'
        };
        return statusClasses[status] || 'secondary';
    }

    /**
     * Get channel icon
     */
    getChannelIcon(channel) {
        const channelIcons = {
            'Email': 'envelope',
            'Phone': 'phone',
            'WhatsApp': 'whatsapp',
            'SMS': 'sms',
            'Video Call': 'video',
            'In-Person': 'user',
            'Letter': 'mail-bulk',
            'Fax': 'fax'
        };
        return channelIcons[channel] || 'comment';
    }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CommunicationsModule;
}