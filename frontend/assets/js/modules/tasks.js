/**
 * Tasks Module
 * Handles task management functionality
 */

class TasksModule {
    constructor(app) {
        this.app = app;
        this.api = app.api;
        this.data = {
            tasks: [],
            pagination: {}
        };
    }

    /**
     * Load tasks module
     */
    async load() {
        try {
            this.showTasksPage();
            await this.loadTasks();
            this.setupEventListeners();
        } catch (error) {
            console.error('Tasks load error:', error);
            this.app.toast.error('Failed to load tasks');
        }
    }

    /**
     * Show tasks page
     */
    showTasksPage() {
        // Hide all pages
        document.querySelectorAll('.page').forEach(page => {
            page.classList.add('hidden');
        });

        // Create tasks page if it doesn't exist
        let tasksPage = document.getElementById('tasks-page');
        if (!tasksPage) {
            tasksPage = this.createTasksPage();
            document.getElementById('main-content-area').appendChild(tasksPage);
        }

        tasksPage.classList.remove('hidden');
        tasksPage.classList.add('active');
    }

    /**
     * Create tasks page HTML
     */
    createTasksPage() {
        const page = document.createElement('div');
        page.id = 'tasks-page';
        page.className = 'page tasks-page';
        
        page.innerHTML = `
            <div class="page-header">
                <h1>Tasks</h1>
                <div class="page-actions">
                    <button class="btn btn-secondary" id="export-tasks">
                        <i class="fas fa-download"></i>
                        Export
                    </button>
                    <button class="btn btn-primary" id="add-task">
                        <i class="fas fa-plus"></i>
                        Add Task
                    </button>
                </div>
            </div>
            
            <div class="tasks-content">
                <!-- Task Filters -->
                <div class="filters-section">
                    <div class="filters-row">
                        <div class="filter-group">
                            <label>Search</label>
                            <input type="text" id="task-search" placeholder="Search tasks..." class="form-control">
                        </div>
                        <div class="filter-group">
                            <label>Status</label>
                            <select id="status-filter" class="form-select">
                                <option value="">All Status</option>
                                <option value="Pending">Pending</option>
                                <option value="In Progress">In Progress</option>
                                <option value="Completed">Completed</option>
                                <option value="Cancelled">Cancelled</option>
                                <option value="On Hold">On Hold</option>
                            </select>
                        </div>
                        <div class="filter-group">
                            <label>Priority</label>
                            <select id="priority-filter" class="form-select">
                                <option value="">All Priorities</option>
                                <option value="Low">Low</option>
                                <option value="Medium">Medium</option>
                                <option value="High">High</option>
                                <option value="Urgent">Urgent</option>
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

                <!-- Tasks List -->
                <div class="tasks-list" id="tasks-list">
                    <!-- Tasks will be populated here -->
                </div>
                
                <!-- Pagination -->
                <div class="pagination" id="tasks-pagination">
                    <!-- Pagination will be populated here -->
                </div>
            </div>
        `;

        return page;
    }

    /**
     * Load tasks data
     */
    async loadTasks(page = 1) {
        try {
            this.app.loading.showOverlay('Loading tasks...');

            const params = {
                page,
                limit: 10
            };

            const response = await this.api.get('/tasks', params);
            
            if (response.success) {
                this.data.tasks = response.data.tasks;
                this.data.pagination = response.data.pagination;
                this.renderTasks();
                this.renderPagination();
            } else {
                this.app.toast.error(response.message || 'Failed to load tasks');
            }
        } catch (error) {
            console.error('Load tasks error:', error);
            this.app.toast.error('Failed to load tasks');
        } finally {
            this.app.loading.hideOverlay();
        }
    }

    /**
     * Render tasks list
     */
    renderTasks() {
        const list = document.getElementById('tasks-list');
        if (!list) return;

        if (this.data.tasks.length === 0) {
            list.innerHTML = `
                <div class="no-data">
                    <i class="fas fa-tasks"></i>
                    <p>No tasks found</p>
                </div>
            `;
            return;
        }

        list.innerHTML = this.data.tasks.map(task => `
            <div class="task-item" data-task-id="${task._id}">
                <div class="task-priority">
                    <span class="priority-indicator ${this.getPriorityClass(task.priority)}"></span>
                </div>
                
                <div class="task-content">
                    <div class="task-header">
                        <h3 class="task-title">${task.title}</h3>
                        <div class="task-meta">
                            <span class="task-id">#${task._id.slice(-8)}</span>
                            <span class="task-status badge badge-${this.getStatusClass(task.status)}">${task.status}</span>
                        </div>
                    </div>
                    
                    <div class="task-body">
                        <p class="task-description">${task.description || 'No description provided'}</p>
                        
                        <div class="task-details">
                            <div class="task-detail">
                                <i class="fas fa-user"></i>
                                <span>${task.assigned_to?.fullName || 'Unassigned'}</span>
                            </div>
                            <div class="task-detail">
                                <i class="fas fa-calendar"></i>
                                <span>Due: ${this.app.helpers.formatDate(task.due_date)}</span>
                            </div>
                            <div class="task-detail">
                                <i class="fas fa-clock"></i>
                                <span>${task.estimated_hours || 0}h estimated</span>
                            </div>
                        </div>
                        
                        <div class="task-progress">
                            <div class="progress">
                                <div class="progress-bar" style="width: ${task.progress_percentage || 0}%"></div>
                            </div>
                            <span class="progress-text">${task.progress_percentage || 0}%</span>
                        </div>
                    </div>
                    
                    <div class="task-footer">
                        <div class="task-tags">
                            ${task.tags ? task.tags.map(tag => `<span class="tag">${tag}</span>`).join('') : ''}
                        </div>
                        <div class="task-actions">
                            <button class="btn btn-sm btn-secondary" onclick="window.app.modules.tasks.viewTask('${task._id}')">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button class="btn btn-sm btn-primary" onclick="window.app.modules.tasks.editTask('${task._id}')">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-sm btn-success" onclick="window.app.modules.tasks.completeTask('${task._id}')">
                                <i class="fas fa-check"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    }

    /**
     * Render pagination
     */
    renderPagination() {
        const pagination = document.getElementById('tasks-pagination');
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
                    onclick="window.app.modules.tasks.loadTasks(${page - 1})">
                Previous
            </button>
        `;

        // Page numbers
        const startPage = Math.max(1, page - 2);
        const endPage = Math.min(pages, page + 2);

        for (let i = startPage; i <= endPage; i++) {
            paginationHTML += `
                <button class="pagination-item ${i === page ? 'active' : ''}" 
                        onclick="window.app.modules.tasks.loadTasks(${i})">
                    ${i}
                </button>
            `;
        }

        // Next button
        paginationHTML += `
            <button class="pagination-item ${page === pages ? 'disabled' : ''}" 
                    ${page === pages ? 'disabled' : ''} 
                    onclick="window.app.modules.tasks.loadTasks(${page + 1})">
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
        const searchInput = document.getElementById('task-search');
        if (searchInput) {
            searchInput.addEventListener('input', this.app.helpers.debounce((e) => {
                this.loadTasks(1);
            }, 500));
        }

        // Filter selects
        const filters = ['status-filter', 'priority-filter'];
        filters.forEach(filterId => {
            const filter = document.getElementById(filterId);
            if (filter) {
                filter.addEventListener('change', () => {
                    this.loadTasks(1);
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

        // Add task button
        const addTaskBtn = document.getElementById('add-task');
        if (addTaskBtn) {
            addTaskBtn.addEventListener('click', () => {
                this.showAddTaskModal();
            });
        }

        // Export tasks button
        const exportBtn = document.getElementById('export-tasks');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                this.exportTasks();
            });
        }
    }

    /**
     * Clear all filters
     */
    clearFilters() {
        document.getElementById('task-search').value = '';
        document.getElementById('status-filter').value = '';
        document.getElementById('priority-filter').value = '';
        this.loadTasks(1);
    }

    /**
     * View task details
     */
    async viewTask(taskId) {
        try {
            this.app.loading.showOverlay('Loading task details...');
            
            const response = await this.api.get(`/tasks/${taskId}`);
            
            if (response.success) {
                this.showTaskDetailsModal(response.data.task);
            } else {
                this.app.toast.error(response.message || 'Failed to load task details');
            }
        } catch (error) {
            console.error('View task error:', error);
            this.app.toast.error('Failed to load task details');
        } finally {
            this.app.loading.hideOverlay();
        }
    }

    /**
     * Edit task
     */
    async editTask(taskId) {
        try {
            this.app.loading.showOverlay('Loading task details...');
            
            const response = await this.api.get(`/tasks/${taskId}`);
            
            if (response.success) {
                this.showEditTaskModal(response.data.task);
            } else {
                this.app.toast.error(response.message || 'Failed to load task details');
            }
        } catch (error) {
            console.error('Edit task error:', error);
            this.app.toast.error('Failed to load task details');
        } finally {
            this.app.loading.hideOverlay();
        }
    }

    /**
     * Complete task
     */
    async completeTask(taskId) {
        const confirmed = await this.app.modal.confirm(
            'Are you sure you want to mark this task as completed?',
            {
                title: 'Complete Task',
                confirmText: 'Complete',
                cancelText: 'Cancel',
                type: 'success'
            }
        );

        if (confirmed) {
            try {
                this.app.loading.showOverlay('Completing task...');
                
                const response = await this.api.put(`/tasks/${taskId}`, {
                    status: 'Completed',
                    progress_percentage: 100
                });
                
                if (response.success) {
                    this.app.toast.success('Task completed successfully');
                    this.loadTasks(this.data.pagination.page);
                } else {
                    this.app.toast.error(response.message || 'Failed to complete task');
                }
            } catch (error) {
                console.error('Complete task error:', error);
                this.app.toast.error('Failed to complete task');
            } finally {
                this.app.loading.hideOverlay();
            }
        }
    }

    /**
     * Show add task modal
     */
    showAddTaskModal() {
        const formHTML = this.getTaskFormHTML();
        
        this.app.modal.showForm(formHTML, {
            title: 'Add New Task',
            size: 'lg',
            onSubmit: (data) => this.handleAddTask(data),
            onCancel: () => this.app.modal.close()
        });
    }

    /**
     * Show edit task modal
     */
    showEditTaskModal(task) {
        const formHTML = this.getTaskFormHTML(task);
        
        this.app.modal.showForm(formHTML, {
            title: 'Edit Task',
            size: 'lg',
            onSubmit: (data) => this.handleEditTask(task._id, data),
            onCancel: () => this.app.modal.close()
        });
    }

    /**
     * Show task details modal
     */
    showTaskDetailsModal(task) {
        const detailsHTML = this.getTaskDetailsHTML(task);
        
        this.app.modal.show(detailsHTML, {
            title: 'Task Details',
            size: 'lg'
        });
    }

    /**
     * Get task form HTML
     */
    getTaskFormHTML(task = null) {
        return `
            <div class="form-group">
                <label class="form-label">Task Title *</label>
                <input type="text" name="title" class="form-control" value="${task?.title || ''}" required>
            </div>
            
            <div class="form-group">
                <label class="form-label">Description</label>
                <textarea name="description" class="form-textarea" rows="3">${task?.description || ''}</textarea>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">Assigned To *</label>
                    <select name="assigned_to" class="form-select" required>
                        <option value="">Select Assignee</option>
                        <!-- Options will be populated dynamically -->
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">Priority</label>
                    <select name="priority" class="form-select">
                        <option value="Low" ${task?.priority === 'Low' ? 'selected' : ''}>Low</option>
                        <option value="Medium" ${task?.priority === 'Medium' ? 'selected' : ''}>Medium</option>
                        <option value="High" ${task?.priority === 'High' ? 'selected' : ''}>High</option>
                        <option value="Urgent" ${task?.priority === 'Urgent' ? 'selected' : ''}>Urgent</option>
                    </select>
                </div>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">Due Date</label>
                    <input type="date" name="due_date" class="form-control" value="${task?.due_date ? this.app.helpers.formatDate(task.due_date, 'YYYY-MM-DD') : ''}">
                </div>
                <div class="form-group">
                    <label class="form-label">Estimated Hours</label>
                    <input type="number" name="estimated_hours" class="form-control" value="${task?.estimated_hours || ''}" min="0" step="0.5">
                </div>
            </div>
            
            <div class="form-group">
                <label class="form-label">Tags</label>
                <input type="text" name="tags" class="form-control" value="${task?.tags ? task.tags.join(', ') : ''}" placeholder="Enter tags separated by commas">
            </div>
        `;
    }

    /**
     * Get task details HTML
     */
    getTaskDetailsHTML(task) {
        return `
            <div class="task-details-view">
                <div class="task-header">
                    <h2>${task.title}</h2>
                    <div class="task-meta">
                        <span class="badge badge-${this.getStatusClass(task.status)}">${task.status}</span>
                        <span class="badge badge-${this.getPriorityClass(task.priority)}">${task.priority}</span>
                    </div>
                </div>
                
                <div class="task-description">
                    <h3>Description</h3>
                    <p>${task.description || 'No description provided'}</p>
                </div>
                
                <div class="task-details-grid">
                    <div class="detail-section">
                        <h3>Assignment</h3>
                        <div class="detail-item">
                            <label>Assigned To:</label>
                            <span>${task.assigned_to?.fullName || 'Unassigned'}</span>
                        </div>
                        <div class="detail-item">
                            <label>Created By:</label>
                            <span>${task.created_by?.fullName || 'Unknown'}</span>
                        </div>
                    </div>
                    
                    <div class="detail-section">
                        <h3>Timeline</h3>
                        <div class="detail-item">
                            <label>Due Date:</label>
                            <span>${this.app.helpers.formatDate(task.due_date)}</span>
                        </div>
                        <div class="detail-item">
                            <label>Created:</label>
                            <span>${this.app.helpers.formatDateTime(task.createdAt)}</span>
                        </div>
                        <div class="detail-item">
                            <label>Updated:</label>
                            <span>${this.app.helpers.formatDateTime(task.updatedAt)}</span>
                        </div>
                    </div>
                </div>
                
                <div class="task-progress-section">
                    <h3>Progress</h3>
                    <div class="progress">
                        <div class="progress-bar" style="width: ${task.progress_percentage || 0}%"></div>
                    </div>
                    <span class="progress-text">${task.progress_percentage || 0}% Complete</span>
                </div>
            </div>
        `;
    }

    /**
     * Handle add task
     */
    async handleAddTask(data) {
        try {
            this.app.loading.showOverlay('Adding task...');
            
            const response = await this.api.post('/tasks', data);
            
            if (response.success) {
                this.app.toast.success('Task added successfully');
                this.app.modal.close();
                this.loadTasks(1);
            } else {
                this.app.toast.error(response.message || 'Failed to add task');
            }
        } catch (error) {
            console.error('Add task error:', error);
            this.app.toast.error('Failed to add task');
        } finally {
            this.app.loading.hideOverlay();
        }
    }

    /**
     * Handle edit task
     */
    async handleEditTask(taskId, data) {
        try {
            this.app.loading.showOverlay('Updating task...');
            
            const response = await this.api.put(`/tasks/${taskId}`, data);
            
            if (response.success) {
                this.app.toast.success('Task updated successfully');
                this.app.modal.close();
                this.loadTasks(this.data.pagination.page);
            } else {
                this.app.toast.error(response.message || 'Failed to update task');
            }
        } catch (error) {
            console.error('Edit task error:', error);
            this.app.toast.error('Failed to update task');
        } finally {
            this.app.loading.hideOverlay();
        }
    }

    /**
     * Export tasks
     */
    async exportTasks() {
        try {
            this.app.loading.showOverlay('Exporting tasks...');
            
            // This would call the export API
            this.app.toast.success('Export functionality will be implemented');
        } catch (error) {
            console.error('Export tasks error:', error);
            this.app.toast.error('Failed to export tasks');
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
            'Cancelled': 'error',
            'On Hold': 'secondary'
        };
        return statusClasses[status] || 'secondary';
    }

    /**
     * Get priority CSS class
     */
    getPriorityClass(priority) {
        const priorityClasses = {
            'Low': 'success',
            'Medium': 'warning',
            'High': 'error',
            'Urgent': 'error'
        };
        return priorityClasses[priority] || 'secondary';
    }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TasksModule;
}