/**
 * Clients Module
 * Handles client management functionality
 */

class ClientsModule {
    constructor(app) {
        this.app = app;
        this.api = app.api;
        this.data = {
            clients: [],
            pagination: {},
            filters: {}
        };
    }

    /**
     * Load clients module
     */
    async load() {
        try {
            this.showClientsPage();
            await this.loadClients();
            this.setupEventListeners();
        } catch (error) {
            console.error('Clients load error:', error);
            this.app.toast.error('Failed to load clients');
        }
    }

    /**
     * Show clients page
     */
    showClientsPage() {
        // Hide all pages
        document.querySelectorAll('.page').forEach(page => {
            page.classList.add('hidden');
        });

        // Create clients page if it doesn't exist
        let clientsPage = document.getElementById('clients-page');
        if (!clientsPage) {
            clientsPage = this.createClientsPage();
            document.getElementById('main-content-area').appendChild(clientsPage);
        }

        clientsPage.classList.remove('hidden');
        clientsPage.classList.add('active');
    }

    /**
     * Create clients page HTML
     */
    createClientsPage() {
        const page = document.createElement('div');
        page.id = 'clients-page';
        page.className = 'page clients-page';
        
        page.innerHTML = `
            <div class="page-header">
                <h1>Clients</h1>
                <div class="page-actions">
                    <button class="btn btn-secondary" id="export-clients">
                        <i class="fas fa-download"></i>
                        Export
                    </button>
                    <button class="btn btn-primary" id="add-client">
                        <i class="fas fa-plus"></i>
                        Add Client
                    </button>
                </div>
            </div>
            
            <div class="clients-content">
                <!-- Filters -->
                <div class="filters-section">
                    <div class="filters-row">
                        <div class="filter-group">
                            <label>Search</label>
                            <input type="text" id="client-search" placeholder="Search clients..." class="form-control">
                        </div>
                        <div class="filter-group">
                            <label>Status</label>
                            <select id="status-filter" class="form-select">
                                <option value="">All Status</option>
                                <option value="Active">Active</option>
                                <option value="Inactive">Inactive</option>
                                <option value="Prospect">Prospect</option>
                                <option value="Suspended">Suspended</option>
                            </select>
                        </div>
                        <div class="filter-group">
                            <label>Type</label>
                            <select id="type-filter" class="form-select">
                                <option value="">All Types</option>
                                <option value="Individual">Individual</option>
                                <option value="Sole Proprietorship">Sole Proprietorship</option>
                                <option value="Partnership">Partnership</option>
                                <option value="LLP">LLP</option>
                                <option value="Private Limited">Private Limited</option>
                                <option value="Public Limited">Public Limited</option>
                                <option value="Trust">Trust</option>
                                <option value="Society">Society</option>
                            </select>
                        </div>
                        <div class="filter-group">
                            <label>Risk Category</label>
                            <select id="risk-filter" class="form-select">
                                <option value="">All Risk Levels</option>
                                <option value="Low">Low</option>
                                <option value="Medium">Medium</option>
                                <option value="High">High</option>
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

                <!-- Clients Table -->
                <div class="table-container">
                    <table class="table" id="clients-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Type</th>
                                <th>Email</th>
                                <th>Phone</th>
                                <th>Status</th>
                                <th>Risk</th>
                                <th>Rating</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody id="clients-table-body">
                            <!-- Clients will be populated here -->
                        </tbody>
                    </table>
                </div>

                <!-- Pagination -->
                <div class="pagination" id="clients-pagination">
                    <!-- Pagination will be populated here -->
                </div>
            </div>
        `;

        return page;
    }

    /**
     * Load clients data
     */
    async loadClients(page = 1) {
        try {
            this.app.loading.showOverlay('Loading clients...');

            const params = {
                page,
                limit: 10,
                ...this.data.filters
            };

            const response = await this.api.get('/clients', params);
            
            if (response.success) {
                this.data.clients = response.data.clients;
                this.data.pagination = response.data.pagination;
                this.renderClients();
                this.renderPagination();
            } else {
                this.app.toast.error(response.message || 'Failed to load clients');
            }
        } catch (error) {
            console.error('Load clients error:', error);
            this.app.toast.error('Failed to load clients');
        } finally {
            this.app.loading.hideOverlay();
        }
    }

    /**
     * Render clients table
     */
    renderClients() {
        const tbody = document.getElementById('clients-table-body');
        if (!tbody) return;

        if (this.data.clients.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center">
                        <div class="no-data">
                            <i class="fas fa-users"></i>
                            <p>No clients found</p>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = this.data.clients.map(client => `
            <tr data-client-id="${client._id}">
                <td>
                    <div class="client-info">
                        <div class="client-avatar">
                            <img src="${client.avatar || '/assets/images/default-avatar.png'}" alt="${client.name}">
                        </div>
                        <div class="client-details">
                            <div class="client-name">${client.name}</div>
                            <div class="client-id">ID: ${client._id.slice(-8)}</div>
                        </div>
                    </div>
                </td>
                <td>
                    <span class="client-type">${client.type}</span>
                </td>
                <td>
                    <a href="mailto:${client.email}" class="client-email">${client.email}</a>
                </td>
                <td>
                    <a href="tel:${client.phone}" class="client-phone">${client.phone}</a>
                </td>
                <td>
                    <span class="badge badge-${this.getStatusClass(client.status)}">${client.status}</span>
                </td>
                <td>
                    <span class="badge badge-${this.getRiskClass(client.risk_category)}">${client.risk_category}</span>
                </td>
                <td>
                    <div class="rating">
                        ${this.renderRating(client.satisfaction_rating)}
                    </div>
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-sm btn-secondary" onclick="window.app.modules.clients.viewClient('${client._id}')">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-sm btn-primary" onclick="window.app.modules.clients.editClient('${client._id}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-error" onclick="window.app.modules.clients.deleteClient('${client._id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    /**
     * Render pagination
     */
    renderPagination() {
        const pagination = document.getElementById('clients-pagination');
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
                    onclick="window.app.modules.clients.loadClients(${page - 1})">
                Previous
            </button>
        `;

        // Page numbers
        const startPage = Math.max(1, page - 2);
        const endPage = Math.min(pages, page + 2);

        for (let i = startPage; i <= endPage; i++) {
            paginationHTML += `
                <button class="pagination-item ${i === page ? 'active' : ''}" 
                        onclick="window.app.modules.clients.loadClients(${i})">
                    ${i}
                </button>
            `;
        }

        // Next button
        paginationHTML += `
            <button class="pagination-item ${page === pages ? 'disabled' : ''}" 
                    ${page === pages ? 'disabled' : ''} 
                    onclick="window.app.modules.clients.loadClients(${page + 1})">
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
        const searchInput = document.getElementById('client-search');
        if (searchInput) {
            searchInput.addEventListener('input', this.app.helpers.debounce((e) => {
                this.data.filters.search = e.target.value;
                this.loadClients(1);
            }, 500));
        }

        // Filter selects
        const filters = ['status-filter', 'type-filter', 'risk-filter'];
        filters.forEach(filterId => {
            const filter = document.getElementById(filterId);
            if (filter) {
                filter.addEventListener('change', (e) => {
                    const filterName = filterId.replace('-filter', '');
                    this.data.filters[filterName] = e.target.value;
                    this.loadClients(1);
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

        // Add client button
        const addClientBtn = document.getElementById('add-client');
        if (addClientBtn) {
            addClientBtn.addEventListener('click', () => {
                this.showAddClientModal();
            });
        }

        // Export clients button
        const exportBtn = document.getElementById('export-clients');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                this.exportClients();
            });
        }
    }

    /**
     * Clear all filters
     */
    clearFilters() {
        this.data.filters = {};
        
        // Reset form inputs
        document.getElementById('client-search').value = '';
        document.getElementById('status-filter').value = '';
        document.getElementById('type-filter').value = '';
        document.getElementById('risk-filter').value = '';
        
        this.loadClients(1);
    }

    /**
     * View client details
     */
    async viewClient(clientId) {
        try {
            this.app.loading.showOverlay('Loading client details...');
            
            const response = await this.api.get(`/clients/${clientId}`);
            
            if (response.success) {
                this.showClientDetailsModal(response.data.client);
            } else {
                this.app.toast.error(response.message || 'Failed to load client details');
            }
        } catch (error) {
            console.error('View client error:', error);
            this.app.toast.error('Failed to load client details');
        } finally {
            this.app.loading.hideOverlay();
        }
    }

    /**
     * Edit client
     */
    async editClient(clientId) {
        try {
            this.app.loading.showOverlay('Loading client details...');
            
            const response = await this.api.get(`/clients/${clientId}`);
            
            if (response.success) {
                this.showEditClientModal(response.data.client);
            } else {
                this.app.toast.error(response.message || 'Failed to load client details');
            }
        } catch (error) {
            console.error('Edit client error:', error);
            this.app.toast.error('Failed to load client details');
        } finally {
            this.app.loading.hideOverlay();
        }
    }

    /**
     * Delete client
     */
    async deleteClient(clientId) {
        const confirmed = await this.app.modal.confirm(
            'Are you sure you want to delete this client? This action cannot be undone.',
            {
                title: 'Delete Client',
                confirmText: 'Delete',
                cancelText: 'Cancel',
                type: 'warning'
            }
        );

        if (confirmed) {
            try {
                this.app.loading.showOverlay('Deleting client...');
                
                const response = await this.api.delete(`/clients/${clientId}`);
                
                if (response.success) {
                    this.app.toast.success('Client deleted successfully');
                    this.loadClients(this.data.pagination.page);
                } else {
                    this.app.toast.error(response.message || 'Failed to delete client');
                }
            } catch (error) {
                console.error('Delete client error:', error);
                this.app.toast.error('Failed to delete client');
            } finally {
                this.app.loading.hideOverlay();
            }
        }
    }

    /**
     * Show add client modal
     */
    showAddClientModal() {
        const formHTML = this.getClientFormHTML();
        
        this.app.modal.showForm(formHTML, {
            title: 'Add New Client',
            size: 'lg',
            onSubmit: (data) => this.handleAddClient(data),
            onCancel: () => this.app.modal.close()
        });
    }

    /**
     * Show edit client modal
     */
    showEditClientModal(client) {
        const formHTML = this.getClientFormHTML(client);
        
        this.app.modal.showForm(formHTML, {
            title: 'Edit Client',
            size: 'lg',
            onSubmit: (data) => this.handleEditClient(client._id, data),
            onCancel: () => this.app.modal.close()
        });
    }

    /**
     * Show client details modal
     */
    showClientDetailsModal(client) {
        const detailsHTML = this.getClientDetailsHTML(client);
        
        this.app.modal.show(detailsHTML, {
            title: 'Client Details',
            size: 'lg'
        });
    }

    /**
     * Get client form HTML
     */
    getClientFormHTML(client = null) {
        return `
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">Client Name *</label>
                    <input type="text" name="name" class="form-control" value="${client?.name || ''}" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Client Type *</label>
                    <select name="type" class="form-select" required>
                        <option value="">Select Type</option>
                        <option value="Individual" ${client?.type === 'Individual' ? 'selected' : ''}>Individual</option>
                        <option value="Sole Proprietorship" ${client?.type === 'Sole Proprietorship' ? 'selected' : ''}>Sole Proprietorship</option>
                        <option value="Partnership" ${client?.type === 'Partnership' ? 'selected' : ''}>Partnership</option>
                        <option value="LLP" ${client?.type === 'LLP' ? 'selected' : ''}>LLP</option>
                        <option value="Private Limited" ${client?.type === 'Private Limited' ? 'selected' : ''}>Private Limited</option>
                        <option value="Public Limited" ${client?.type === 'Public Limited' ? 'selected' : ''}>Public Limited</option>
                        <option value="Trust" ${client?.type === 'Trust' ? 'selected' : ''}>Trust</option>
                        <option value="Society" ${client?.type === 'Society' ? 'selected' : ''}>Society</option>
                    </select>
                </div>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">Email *</label>
                    <input type="email" name="email" class="form-control" value="${client?.email || ''}" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Phone *</label>
                    <input type="tel" name="phone" class="form-control" value="${client?.phone || ''}" required>
                </div>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">PAN</label>
                    <input type="text" name="pan" class="form-control" value="${client?.pan || ''}">
                </div>
                <div class="form-group">
                    <label class="form-label">GSTIN</label>
                    <input type="text" name="gstin" class="form-control" value="${client?.gstin || ''}">
                </div>
            </div>
            
            <div class="form-group">
                <label class="form-label">Address</label>
                <textarea name="address" class="form-textarea" rows="3">${client?.address || ''}</textarea>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">Status</label>
                    <select name="status" class="form-select">
                        <option value="Active" ${client?.status === 'Active' ? 'selected' : ''}>Active</option>
                        <option value="Inactive" ${client?.status === 'Inactive' ? 'selected' : ''}>Inactive</option>
                        <option value="Prospect" ${client?.status === 'Prospect' ? 'selected' : ''}>Prospect</option>
                        <option value="Suspended" ${client?.status === 'Suspended' ? 'selected' : ''}>Suspended</option>
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">Risk Category</label>
                    <select name="risk_category" class="form-select">
                        <option value="Low" ${client?.risk_category === 'Low' ? 'selected' : ''}>Low</option>
                        <option value="Medium" ${client?.risk_category === 'Medium' ? 'selected' : ''}>Medium</option>
                        <option value="High" ${client?.risk_category === 'High' ? 'selected' : ''}>High</option>
                    </select>
                </div>
            </div>
        `;
    }

    /**
     * Get client details HTML
     */
    getClientDetailsHTML(client) {
        return `
            <div class="client-details-view">
                <div class="client-header">
                    <div class="client-avatar-large">
                        <img src="${client.avatar || '/assets/images/default-avatar.png'}" alt="${client.name}">
                    </div>
                    <div class="client-info">
                        <h2>${client.name}</h2>
                        <p class="client-type">${client.type}</p>
                        <div class="client-status">
                            <span class="badge badge-${this.getStatusClass(client.status)}">${client.status}</span>
                            <span class="badge badge-${this.getRiskClass(client.risk_category)}">${client.risk_category} Risk</span>
                        </div>
                    </div>
                </div>
                
                <div class="client-details-grid">
                    <div class="detail-section">
                        <h3>Contact Information</h3>
                        <div class="detail-item">
                            <label>Email:</label>
                            <span><a href="mailto:${client.email}">${client.email}</a></span>
                        </div>
                        <div class="detail-item">
                            <label>Phone:</label>
                            <span><a href="tel:${client.phone}">${client.phone}</a></span>
                        </div>
                        <div class="detail-item">
                            <label>Address:</label>
                            <span>${client.address || 'Not provided'}</span>
                        </div>
                    </div>
                    
                    <div class="detail-section">
                        <h3>Legal Information</h3>
                        <div class="detail-item">
                            <label>PAN:</label>
                            <span>${client.pan || 'Not provided'}</span>
                        </div>
                        <div class="detail-item">
                            <label>GSTIN:</label>
                            <span>${client.gstin || 'Not provided'}</span>
                        </div>
                        <div class="detail-item">
                            <label>Client Since:</label>
                            <span>${this.app.helpers.formatDate(client.client_since)}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Handle add client
     */
    async handleAddClient(data) {
        try {
            this.app.loading.showOverlay('Adding client...');
            
            const response = await this.api.post('/clients', data);
            
            if (response.success) {
                this.app.toast.success('Client added successfully');
                this.app.modal.close();
                this.loadClients(1);
            } else {
                this.app.toast.error(response.message || 'Failed to add client');
            }
        } catch (error) {
            console.error('Add client error:', error);
            this.app.toast.error('Failed to add client');
        } finally {
            this.app.loading.hideOverlay();
        }
    }

    /**
     * Handle edit client
     */
    async handleEditClient(clientId, data) {
        try {
            this.app.loading.showOverlay('Updating client...');
            
            const response = await this.api.put(`/clients/${clientId}`, data);
            
            if (response.success) {
                this.app.toast.success('Client updated successfully');
                this.app.modal.close();
                this.loadClients(this.data.pagination.page);
            } else {
                this.app.toast.error(response.message || 'Failed to update client');
            }
        } catch (error) {
            console.error('Edit client error:', error);
            this.app.toast.error('Failed to update client');
        } finally {
            this.app.loading.hideOverlay();
        }
    }

    /**
     * Export clients
     */
    async exportClients() {
        try {
            this.app.loading.showOverlay('Exporting clients...');
            
            // This would call the export API
            this.app.toast.success('Export functionality will be implemented');
        } catch (error) {
            console.error('Export clients error:', error);
            this.app.toast.error('Failed to export clients');
        } finally {
            this.app.loading.hideOverlay();
        }
    }

    /**
     * Get status CSS class
     */
    getStatusClass(status) {
        const statusClasses = {
            'Active': 'success',
            'Inactive': 'secondary',
            'Prospect': 'info',
            'Suspended': 'error'
        };
        return statusClasses[status] || 'secondary';
    }

    /**
     * Get risk CSS class
     */
    getRiskClass(risk) {
        const riskClasses = {
            'Low': 'success',
            'Medium': 'warning',
            'High': 'error'
        };
        return riskClasses[risk] || 'secondary';
    }

    /**
     * Render rating stars
     */
    renderRating(rating) {
        const stars = [];
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 !== 0;
        
        for (let i = 0; i < 5; i++) {
            if (i < fullStars) {
                stars.push('<i class="fas fa-star"></i>');
            } else if (i === fullStars && hasHalfStar) {
                stars.push('<i class="fas fa-star-half-alt"></i>');
            } else {
                stars.push('<i class="far fa-star"></i>');
            }
        }
        
        return stars.join('');
    }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ClientsModule;
}