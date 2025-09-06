/**
 * Staff Module
 * Handles staff management functionality
 */

class StaffModule {
    constructor(app) {
        this.app = app;
        this.api = app.api;
        this.data = {
            staff: [],
            pagination: {}
        };
    }

    /**
     * Load staff module
     */
    async load() {
        try {
            this.showStaffPage();
            await this.loadStaff();
            this.setupEventListeners();
        } catch (error) {
            console.error('Staff load error:', error);
            this.app.toast.error('Failed to load staff');
        }
    }

    /**
     * Show staff page
     */
    showStaffPage() {
        // Hide all pages
        document.querySelectorAll('.page').forEach(page => {
            page.classList.add('hidden');
        });

        // Create staff page if it doesn't exist
        let staffPage = document.getElementById('staff-page');
        if (!staffPage) {
            staffPage = this.createStaffPage();
            document.getElementById('main-content-area').appendChild(staffPage);
        }

        staffPage.classList.remove('hidden');
        staffPage.classList.add('active');
    }

    /**
     * Create staff page HTML
     */
    createStaffPage() {
        const page = document.createElement('div');
        page.id = 'staff-page';
        page.className = 'page staff-page';
        
        page.innerHTML = `
            <div class="page-header">
                <h1>Staff Management</h1>
                <div class="page-actions">
                    <button class="btn btn-secondary" id="export-staff">
                        <i class="fas fa-download"></i>
                        Export
                    </button>
                    <button class="btn btn-primary" id="add-staff">
                        <i class="fas fa-plus"></i>
                        Add Staff
                    </button>
                </div>
            </div>
            
            <div class="staff-content">
                <!-- Staff Grid -->
                <div class="staff-grid" id="staff-grid">
                    <!-- Staff cards will be populated here -->
                </div>
                
                <!-- Pagination -->
                <div class="pagination" id="staff-pagination">
                    <!-- Pagination will be populated here -->
                </div>
            </div>
        `;

        return page;
    }

    /**
     * Load staff data
     */
    async loadStaff(page = 1) {
        try {
            this.app.loading.showOverlay('Loading staff...');

            const params = {
                page,
                limit: 12
            };

            const response = await this.api.get('/staff', params);
            
            if (response.success) {
                this.data.staff = response.data.staff;
                this.data.pagination = response.data.pagination;
                this.renderStaff();
                this.renderPagination();
            } else {
                this.app.toast.error(response.message || 'Failed to load staff');
            }
        } catch (error) {
            console.error('Load staff error:', error);
            this.app.toast.error('Failed to load staff');
        } finally {
            this.app.loading.hideOverlay();
        }
    }

    /**
     * Render staff grid
     */
    renderStaff() {
        const grid = document.getElementById('staff-grid');
        if (!grid) return;

        if (this.data.staff.length === 0) {
            grid.innerHTML = `
                <div class="no-data">
                    <i class="fas fa-user-tie"></i>
                    <p>No staff members found</p>
                </div>
            `;
            return;
        }

        grid.innerHTML = this.data.staff.map(member => `
            <div class="staff-card" data-staff-id="${member._id}">
                <div class="staff-card-header">
                    <div class="staff-avatar">
                        <img src="${member.avatar || '/assets/images/default-avatar.png'}" alt="${member.fullName}">
                    </div>
                    <div class="staff-status">
                        <span class="status-indicator ${member.isActive ? 'active' : 'inactive'}"></span>
                    </div>
                </div>
                
                <div class="staff-card-body">
                    <h3 class="staff-name">${member.fullName}</h3>
                    <p class="staff-designation">${member.designation || 'N/A'}</p>
                    <p class="staff-department">${member.department || 'N/A'}</p>
                    <p class="staff-role">${this.capitalizeFirst(member.role)}</p>
                </div>
                
                <div class="staff-card-footer">
                    <div class="staff-contact">
                        <a href="mailto:${member.email}" class="contact-link">
                            <i class="fas fa-envelope"></i>
                        </a>
                        <a href="tel:${member.phone}" class="contact-link">
                            <i class="fas fa-phone"></i>
                        </a>
                    </div>
                    <div class="staff-actions">
                        <button class="btn btn-sm btn-secondary" onclick="window.app.modules.staff.viewStaff('${member._id}')">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-sm btn-primary" onclick="window.app.modules.staff.editStaff('${member._id}')">
                            <i class="fas fa-edit"></i>
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
        const pagination = document.getElementById('staff-pagination');
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
                    onclick="window.app.modules.staff.loadStaff(${page - 1})">
                Previous
            </button>
        `;

        // Page numbers
        const startPage = Math.max(1, page - 2);
        const endPage = Math.min(pages, page + 2);

        for (let i = startPage; i <= endPage; i++) {
            paginationHTML += `
                <button class="pagination-item ${i === page ? 'active' : ''}" 
                        onclick="window.app.modules.staff.loadStaff(${i})">
                    ${i}
                </button>
            `;
        }

        // Next button
        paginationHTML += `
            <button class="pagination-item ${page === pages ? 'disabled' : ''}" 
                    ${page === pages ? 'disabled' : ''} 
                    onclick="window.app.modules.staff.loadStaff(${page + 1})">
                Next
            </button>
        `;

        pagination.innerHTML = paginationHTML;
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Add staff button
        const addStaffBtn = document.getElementById('add-staff');
        if (addStaffBtn) {
            addStaffBtn.addEventListener('click', () => {
                this.showAddStaffModal();
            });
        }

        // Export staff button
        const exportBtn = document.getElementById('export-staff');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                this.exportStaff();
            });
        }
    }

    /**
     * View staff details
     */
    async viewStaff(staffId) {
        try {
            this.app.loading.showOverlay('Loading staff details...');
            
            const response = await this.api.get(`/staff/${staffId}`);
            
            if (response.success) {
                this.showStaffDetailsModal(response.data.staff);
            } else {
                this.app.toast.error(response.message || 'Failed to load staff details');
            }
        } catch (error) {
            console.error('View staff error:', error);
            this.app.toast.error('Failed to load staff details');
        } finally {
            this.app.loading.hideOverlay();
        }
    }

    /**
     * Edit staff
     */
    async editStaff(staffId) {
        try {
            this.app.loading.showOverlay('Loading staff details...');
            
            const response = await this.api.get(`/staff/${staffId}`);
            
            if (response.success) {
                this.showEditStaffModal(response.data.staff);
            } else {
                this.app.toast.error(response.message || 'Failed to load staff details');
            }
        } catch (error) {
            console.error('Edit staff error:', error);
            this.app.toast.error('Failed to load staff details');
        } finally {
            this.app.loading.hideOverlay();
        }
    }

    /**
     * Show add staff modal
     */
    showAddStaffModal() {
        const formHTML = this.getStaffFormHTML();
        
        this.app.modal.showForm(formHTML, {
            title: 'Add New Staff Member',
            size: 'lg',
            onSubmit: (data) => this.handleAddStaff(data),
            onCancel: () => this.app.modal.close()
        });
    }

    /**
     * Show edit staff modal
     */
    showEditStaffModal(staff) {
        const formHTML = this.getStaffFormHTML(staff);
        
        this.app.modal.showForm(formHTML, {
            title: 'Edit Staff Member',
            size: 'lg',
            onSubmit: (data) => this.handleEditStaff(staff._id, data),
            onCancel: () => this.app.modal.close()
        });
    }

    /**
     * Show staff details modal
     */
    showStaffDetailsModal(staff) {
        const detailsHTML = this.getStaffDetailsHTML(staff);
        
        this.app.modal.show(detailsHTML, {
            title: 'Staff Details',
            size: 'lg'
        });
    }

    /**
     * Get staff form HTML
     */
    getStaffFormHTML(staff = null) {
        return `
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">Full Name *</label>
                    <input type="text" name="fullName" class="form-control" value="${staff?.fullName || ''}" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Email *</label>
                    <input type="email" name="email" class="form-control" value="${staff?.email || ''}" required>
                </div>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">Phone</label>
                    <input type="tel" name="phone" class="form-control" value="${staff?.phone || ''}">
                </div>
                <div class="form-group">
                    <label class="form-label">Designation</label>
                    <input type="text" name="designation" class="form-control" value="${staff?.designation || ''}">
                </div>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">Department</label>
                    <input type="text" name="department" class="form-control" value="${staff?.department || ''}">
                </div>
                <div class="form-group">
                    <label class="form-label">Role</label>
                    <select name="role" class="form-select" required>
                        <option value="">Select Role</option>
                        <option value="manager" ${staff?.role === 'manager' ? 'selected' : ''}>Manager</option>
                        <option value="executive" ${staff?.role === 'executive' ? 'selected' : ''}>Executive</option>
                        <option value="staff" ${staff?.role === 'staff' ? 'selected' : ''}>Staff</option>
                    </select>
                </div>
            </div>
            
            <div class="form-group">
                <label class="form-label">Status</label>
                <select name="isActive" class="form-select">
                    <option value="true" ${staff?.isActive !== false ? 'selected' : ''}>Active</option>
                    <option value="false" ${staff?.isActive === false ? 'selected' : ''}>Inactive</option>
                </select>
            </div>
        `;
    }

    /**
     * Get staff details HTML
     */
    getStaffDetailsHTML(staff) {
        return `
            <div class="staff-details-view">
                <div class="staff-header">
                    <div class="staff-avatar-large">
                        <img src="${staff.avatar || '/assets/images/default-avatar.png'}" alt="${staff.fullName}">
                    </div>
                    <div class="staff-info">
                        <h2>${staff.fullName}</h2>
                        <p class="staff-designation">${staff.designation || 'N/A'}</p>
                        <p class="staff-department">${staff.department || 'N/A'}</p>
                        <div class="staff-status">
                            <span class="badge badge-${staff.isActive ? 'success' : 'secondary'}">
                                ${staff.isActive ? 'Active' : 'Inactive'}
                            </span>
                            <span class="badge badge-info">${this.capitalizeFirst(staff.role)}</span>
                        </div>
                    </div>
                </div>
                
                <div class="staff-details-grid">
                    <div class="detail-section">
                        <h3>Contact Information</h3>
                        <div class="detail-item">
                            <label>Email:</label>
                            <span><a href="mailto:${staff.email}">${staff.email}</a></span>
                        </div>
                        <div class="detail-item">
                            <label>Phone:</label>
                            <span><a href="tel:${staff.phone}">${staff.phone || 'Not provided'}</a></span>
                        </div>
                        <div class="detail-item">
                            <label>Last Login:</label>
                            <span>${staff.lastLogin ? this.app.helpers.formatDateTime(staff.lastLogin) : 'Never'}</span>
                        </div>
                    </div>
                    
                    <div class="detail-section">
                        <h3>Work Information</h3>
                        <div class="detail-item">
                            <label>Designation:</label>
                            <span>${staff.designation || 'Not provided'}</span>
                        </div>
                        <div class="detail-item">
                            <label>Department:</label>
                            <span>${staff.department || 'Not provided'}</span>
                        </div>
                        <div class="detail-item">
                            <label>Role:</label>
                            <span>${this.capitalizeFirst(staff.role)}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Handle add staff
     */
    async handleAddStaff(data) {
        try {
            this.app.loading.showOverlay('Adding staff member...');
            
            const response = await this.api.post('/users', data);
            
            if (response.success) {
                this.app.toast.success('Staff member added successfully');
                this.app.modal.close();
                this.loadStaff(1);
            } else {
                this.app.toast.error(response.message || 'Failed to add staff member');
            }
        } catch (error) {
            console.error('Add staff error:', error);
            this.app.toast.error('Failed to add staff member');
        } finally {
            this.app.loading.hideOverlay();
        }
    }

    /**
     * Handle edit staff
     */
    async handleEditStaff(staffId, data) {
        try {
            this.app.loading.showOverlay('Updating staff member...');
            
            const response = await this.api.put(`/users/${staffId}`, data);
            
            if (response.success) {
                this.app.toast.success('Staff member updated successfully');
                this.app.modal.close();
                this.loadStaff(this.data.pagination.page);
            } else {
                this.app.toast.error(response.message || 'Failed to update staff member');
            }
        } catch (error) {
            console.error('Edit staff error:', error);
            this.app.toast.error('Failed to update staff member');
        } finally {
            this.app.loading.hideOverlay();
        }
    }

    /**
     * Export staff
     */
    async exportStaff() {
        try {
            this.app.loading.showOverlay('Exporting staff...');
            
            // This would call the export API
            this.app.toast.success('Export functionality will be implemented');
        } catch (error) {
            console.error('Export staff error:', error);
            this.app.toast.error('Failed to export staff');
        } finally {
            this.app.loading.hideOverlay();
        }
    }

    /**
     * Capitalize first letter
     */
    capitalizeFirst(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StaffModule;
}