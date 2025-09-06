/**
 * Modal Component
 * Handles modal display and interactions
 */

class Modal {
    constructor() {
        this.overlay = document.getElementById('modal-overlay');
        this.container = document.getElementById('modal-container');
        this.isOpen = false;
        this.currentModal = null;
        
        this.init();
    }

    /**
     * Initialize modal
     */
    init() {
        // Close modal on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.close();
            }
        });

        // Close modal on overlay click
        if (this.overlay) {
            this.overlay.addEventListener('click', (e) => {
                if (e.target === this.overlay) {
                    this.close();
                }
            });
        }
    }

    /**
     * Show modal
     */
    show(content, options = {}) {
        const {
            title = '',
            size = 'md',
            closable = true,
            backdrop = true,
            keyboard = true,
            onClose = null,
            onShow = null
        } = options;

        // Create modal HTML
        const modalHTML = this.createModalHTML(content, { title, size, closable });
        
        // Set modal content
        this.container.innerHTML = modalHTML;
        
        // Add size class
        this.container.className = `modal-container modal-${size}`;
        
        // Store options
        this.currentModal = {
            onClose,
            onShow,
            keyboard,
            backdrop
        };

        // Show modal
        this.overlay.classList.remove('hidden');
        this.overlay.classList.add('show');
        this.isOpen = true;

        // Trigger show callback
        if (onShow) {
            onShow();
        }

        // Focus first input
        this.focusFirstInput();

        // Add animation
        requestAnimationFrame(() => {
            this.container.style.transform = 'scale(1)';
        });
    }

    /**
     * Close modal
     */
    close() {
        if (!this.isOpen) return;

        // Trigger close callback
        if (this.currentModal && this.currentModal.onClose) {
            this.currentModal.onClose();
        }

        // Hide modal
        this.overlay.classList.remove('show');
        this.container.style.transform = 'scale(0.9)';
        
        setTimeout(() => {
            this.overlay.classList.add('hidden');
            this.container.innerHTML = '';
            this.isOpen = false;
            this.currentModal = null;
        }, 250);
    }

    /**
     * Create modal HTML
     */
    createModalHTML(content, options) {
        const { title, size, closable } = options;
        
        return `
            <div class="modal-header">
                <h3 class="modal-title">${title}</h3>
                ${closable ? '<button class="modal-close" type="button">&times;</button>' : ''}
            </div>
            <div class="modal-body">
                ${content}
            </div>
        `;
    }

    /**
     * Focus first input in modal
     */
    focusFirstInput() {
        const firstInput = this.container.querySelector('input, textarea, select, button');
        if (firstInput) {
            setTimeout(() => firstInput.focus(), 100);
        }
    }

    /**
     * Show confirmation modal
     */
    confirm(message, options = {}) {
        const {
            title = 'Confirm',
            confirmText = 'Yes',
            cancelText = 'No',
            type = 'warning'
        } = options;

        return new Promise((resolve) => {
            const content = `
                <div class="alert alert-${type}">
                    <div class="alert-icon">
                        <i class="fas fa-exclamation-triangle"></i>
                    </div>
                    <div class="alert-content">
                        <div class="alert-message">${message}</div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-action="cancel">${cancelText}</button>
                    <button type="button" class="btn btn-${type === 'warning' ? 'warning' : 'primary'}" data-action="confirm">${confirmText}</button>
                </div>
            `;

            this.show(content, {
                title,
                size: 'sm',
                onShow: () => {
                    // Add event listeners
                    this.container.addEventListener('click', (e) => {
                        if (e.target.dataset.action === 'confirm') {
                            this.close();
                            resolve(true);
                        } else if (e.target.dataset.action === 'cancel') {
                            this.close();
                            resolve(false);
                        }
                    });
                }
            });
        });
    }

    /**
     * Show alert modal
     */
    alert(message, options = {}) {
        const {
            title = 'Alert',
            type = 'info',
            buttonText = 'OK'
        } = options;

        return new Promise((resolve) => {
            const content = `
                <div class="alert alert-${type}">
                    <div class="alert-icon">
                        <i class="fas fa-${this.getAlertIcon(type)}"></i>
                    </div>
                    <div class="alert-content">
                        <div class="alert-message">${message}</div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-primary" data-action="ok">${buttonText}</button>
                </div>
            `;

            this.show(content, {
                title,
                size: 'sm',
                onShow: () => {
                    // Add event listeners
                    this.container.addEventListener('click', (e) => {
                        if (e.target.dataset.action === 'ok') {
                            this.close();
                            resolve();
                        }
                    });
                }
            });
        });
    }

    /**
     * Show prompt modal
     */
    prompt(message, options = {}) {
        const {
            title = 'Prompt',
            placeholder = '',
            defaultValue = '',
            inputType = 'text',
            confirmText = 'OK',
            cancelText = 'Cancel'
        } = options;

        return new Promise((resolve) => {
            const content = `
                <div class="form-group">
                    <label class="form-label">${message}</label>
                    <input type="${inputType}" class="form-control" placeholder="${placeholder}" value="${defaultValue}" id="prompt-input">
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-action="cancel">${cancelText}</button>
                    <button type="button" class="btn btn-primary" data-action="confirm">${confirmText}</button>
                </div>
            `;

            this.show(content, {
                title,
                size: 'sm',
                onShow: () => {
                    const input = document.getElementById('prompt-input');
                    input.focus();
                    input.select();

                    // Add event listeners
                    this.container.addEventListener('click', (e) => {
                        if (e.target.dataset.action === 'confirm') {
                            const value = input.value;
                            this.close();
                            resolve(value);
                        } else if (e.target.dataset.action === 'cancel') {
                            this.close();
                            resolve(null);
                        }
                    });

                    // Handle enter key
                    input.addEventListener('keydown', (e) => {
                        if (e.key === 'Enter') {
                            const value = input.value;
                            this.close();
                            resolve(value);
                        }
                    });
                }
            });
        });
    }

    /**
     * Show loading modal
     */
    showLoading(message = 'Loading...') {
        const content = `
            <div class="loading-container">
                <div class="spinner"></div>
                <p>${message}</p>
            </div>
        `;

        this.show(content, {
            title: '',
            size: 'sm',
            closable: false
        });
    }

    /**
     * Hide loading modal
     */
    hideLoading() {
        this.close();
    }

    /**
     * Get alert icon based on type
     */
    getAlertIcon(type) {
        const icons = {
            success: 'check-circle',
            warning: 'exclamation-triangle',
            error: 'times-circle',
            info: 'info-circle'
        };
        return icons[type] || 'info-circle';
    }

    /**
     * Show form modal
     */
    showForm(formHTML, options = {}) {
        const {
            title = 'Form',
            size = 'md',
            onSubmit = null,
            onCancel = null
        } = options;

        return new Promise((resolve) => {
            const content = `
                <form id="modal-form">
                    ${formHTML}
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-action="cancel">Cancel</button>
                        <button type="submit" class="btn btn-primary" data-action="submit">Submit</button>
                    </div>
                </form>
            `;

            this.show(content, {
                title,
                size,
                onShow: () => {
                    const form = document.getElementById('modal-form');
                    
                    // Handle form submission
                    form.addEventListener('submit', (e) => {
                        e.preventDefault();
                        
                        const formData = new FormData(form);
                        const data = Object.fromEntries(formData.entries());
                        
                        if (onSubmit) {
                            onSubmit(data);
                        }
                        
                        this.close();
                        resolve(data);
                    });

                    // Handle cancel
                    this.container.addEventListener('click', (e) => {
                        if (e.target.dataset.action === 'cancel') {
                            if (onCancel) {
                                onCancel();
                            }
                            this.close();
                            resolve(null);
                        }
                    });
                }
            });
        });
    }

    /**
     * Show table modal
     */
    showTable(data, columns, options = {}) {
        const {
            title = 'Data Table',
            size = 'lg',
            searchable = true,
            sortable = true,
            pagination = true
        } = options;

        const tableHTML = this.createTableHTML(data, columns, { searchable, sortable, pagination });
        
        this.show(tableHTML, {
            title,
            size
        });
    }

    /**
     * Create table HTML
     */
    createTableHTML(data, columns, options) {
        const { searchable, sortable, pagination } = options;
        
        let html = '';
        
        if (searchable) {
            html += `
                <div class="table-search">
                    <input type="text" class="form-control" placeholder="Search..." id="table-search">
                </div>
            `;
        }
        
        html += `
            <div class="table-container">
                <table class="table">
                    <thead>
                        <tr>
                            ${columns.map(col => `
                                <th ${sortable ? 'class="sortable"' : ''} data-column="${col.key}">
                                    ${col.title}
                                    ${sortable ? '<i class="fas fa-sort"></i>' : ''}
                                </th>
                            `).join('')}
                        </tr>
                    </thead>
                    <tbody>
                        ${data.map(row => `
                            <tr>
                                ${columns.map(col => `
                                    <td>${row[col.key] || ''}</td>
                                `).join('')}
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
        
        if (pagination) {
            html += `
                <div class="pagination">
                    <button class="pagination-item" disabled>Previous</button>
                    <button class="pagination-item active">1</button>
                    <button class="pagination-item">2</button>
                    <button class="pagination-item">3</button>
                    <button class="pagination-item">Next</button>
                </div>
            `;
        }
        
        return html;
    }

    /**
     * Check if modal is open
     */
    isModalOpen() {
        return this.isOpen;
    }

    /**
     * Get current modal
     */
    getCurrentModal() {
        return this.currentModal;
    }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Modal;
}