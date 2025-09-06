/**
 * Documents Module
 * Handles document management functionality
 */

class DocumentsModule {
    constructor(app) {
        this.app = app;
        this.api = app.api;
        this.data = {
            documents: [],
            pagination: {}
        };
    }

    /**
     * Load documents module
     */
    async load() {
        try {
            this.showDocumentsPage();
            await this.loadDocuments();
            this.setupEventListeners();
        } catch (error) {
            console.error('Documents load error:', error);
            this.app.toast.error('Failed to load documents');
        }
    }

    /**
     * Show documents page
     */
    showDocumentsPage() {
        // Hide all pages
        document.querySelectorAll('.page').forEach(page => {
            page.classList.add('hidden');
        });

        // Create documents page if it doesn't exist
        let documentsPage = document.getElementById('documents-page');
        if (!documentsPage) {
            documentsPage = this.createDocumentsPage();
            document.getElementById('main-content-area').appendChild(documentsPage);
        }

        documentsPage.classList.remove('hidden');
        documentsPage.classList.add('active');
    }

    /**
     * Create documents page HTML
     */
    createDocumentsPage() {
        const page = document.createElement('div');
        page.id = 'documents-page';
        page.className = 'page documents-page';
        
        page.innerHTML = `
            <div class="page-header">
                <h1>Documents</h1>
                <div class="page-actions">
                    <button class="btn btn-secondary" id="upload-document">
                        <i class="fas fa-upload"></i>
                        Upload Document
                    </button>
                    <button class="btn btn-primary" id="create-folder">
                        <i class="fas fa-folder-plus"></i>
                        Create Folder
                    </button>
                </div>
            </div>
            
            <div class="documents-content">
                <!-- Breadcrumb -->
                <div class="breadcrumb" id="documents-breadcrumb">
                    <span class="breadcrumb-item active">All Documents</span>
                </div>
                
                <!-- Filters and Search -->
                <div class="filters-section">
                    <div class="filters-row">
                        <div class="filter-group">
                            <label>Search</label>
                            <input type="text" id="document-search" placeholder="Search documents..." class="form-control">
                        </div>
                        <div class="filter-group">
                            <label>Type</label>
                            <select id="type-filter" class="form-select">
                                <option value="">All Types</option>
                                <option value="Invoice">Invoice</option>
                                <option value="Agreement">Agreement</option>
                                <option value="PAN Card">PAN Card</option>
                                <option value="GST Certificate">GST Certificate</option>
                                <option value="Bank Statement">Bank Statement</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                        <div class="filter-group">
                            <label>Client</label>
                            <select id="client-filter" class="form-select">
                                <option value="">All Clients</option>
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

                <!-- View Toggle -->
                <div class="view-toggle">
                    <button class="btn btn-sm btn-secondary active" id="grid-view">
                        <i class="fas fa-th"></i>
                    </button>
                    <button class="btn btn-sm btn-secondary" id="list-view">
                        <i class="fas fa-list"></i>
                    </button>
                </div>

                <!-- Documents Grid/List -->
                <div class="documents-container" id="documents-container">
                    <!-- Documents will be populated here -->
                </div>
                
                <!-- Pagination -->
                <div class="pagination" id="documents-pagination">
                    <!-- Pagination will be populated here -->
                </div>
            </div>
        `;

        return page;
    }

    /**
     * Load documents data
     */
    async loadDocuments(page = 1) {
        try {
            this.app.loading.showOverlay('Loading documents...');

            const params = {
                page,
                limit: 12
            };

            const response = await this.api.get('/documents', params);
            
            if (response.success) {
                this.data.documents = response.data.documents;
                this.data.pagination = response.data.pagination;
                this.renderDocuments();
                this.renderPagination();
            } else {
                this.app.toast.error(response.message || 'Failed to load documents');
            }
        } catch (error) {
            console.error('Load documents error:', error);
            this.app.toast.error('Failed to load documents');
        } finally {
            this.app.loading.hideOverlay();
        }
    }

    /**
     * Render documents
     */
    renderDocuments() {
        const container = document.getElementById('documents-container');
        if (!container) return;

        if (this.data.documents.length === 0) {
            container.innerHTML = `
                <div class="no-data">
                    <i class="fas fa-file"></i>
                    <p>No documents found</p>
                </div>
            `;
            return;
        }

        const isGridView = document.getElementById('grid-view').classList.contains('active');
        
        if (isGridView) {
            container.className = 'documents-container grid-view';
            container.innerHTML = this.data.documents.map(doc => this.renderDocumentCard(doc)).join('');
        } else {
            container.className = 'documents-container list-view';
            container.innerHTML = this.data.documents.map(doc => this.renderDocumentRow(doc)).join('');
        }
    }

    /**
     * Render document card (grid view)
     */
    renderDocumentCard(doc) {
        return `
            <div class="document-card" data-document-id="${doc._id}">
                <div class="document-icon">
                    <i class="fas fa-${this.getFileIcon(doc.type)}"></i>
                </div>
                
                <div class="document-info">
                    <h3 class="document-name" title="${doc.name}">${doc.name}</h3>
                    <p class="document-type">${doc.type}</p>
                    <p class="document-client">${doc.client?.name || 'No Client'}</p>
                    <p class="document-date">${this.app.helpers.formatDate(doc.uploaded_date)}</p>
                </div>
                
                <div class="document-actions">
                    <button class="btn btn-sm btn-secondary" onclick="window.app.modules.documents.downloadDocument('${doc._id}')">
                        <i class="fas fa-download"></i>
                    </button>
                    <button class="btn btn-sm btn-primary" onclick="window.app.modules.documents.viewDocument('${doc._id}')">
                        <i class="fas fa-eye"></i>
                    </button>
                    <div class="dropdown">
                        <button class="btn btn-sm btn-secondary dropdown-toggle" data-bs-toggle="dropdown">
                            <i class="fas fa-ellipsis-v"></i>
                        </button>
                        <ul class="dropdown-menu">
                            <li><a class="dropdown-item" href="#" onclick="window.app.modules.documents.editDocument('${doc._id}')">
                                <i class="fas fa-edit"></i> Edit
                            </a></li>
                            <li><a class="dropdown-item" href="#" onclick="window.app.modules.documents.shareDocument('${doc._id}')">
                                <i class="fas fa-share"></i> Share
                            </a></li>
                            <li><a class="dropdown-item" href="#" onclick="window.app.modules.documents.archiveDocument('${doc._id}')">
                                <i class="fas fa-archive"></i> Archive
                            </a></li>
                            <li><hr class="dropdown-divider"></li>
                            <li><a class="dropdown-item text-danger" href="#" onclick="window.app.modules.documents.deleteDocument('${doc._id}')">
                                <i class="fas fa-trash"></i> Delete
                            </a></li>
                        </ul>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Render document row (list view)
     */
    renderDocumentRow(doc) {
        return `
            <div class="document-row" data-document-id="${doc._id}">
                <div class="document-icon">
                    <i class="fas fa-${this.getFileIcon(doc.type)}"></i>
                </div>
                
                <div class="document-info">
                    <h3 class="document-name">${doc.name}</h3>
                    <p class="document-meta">
                        <span class="document-type">${doc.type}</span>
                        <span class="document-client">${doc.client?.name || 'No Client'}</span>
                        <span class="document-date">${this.app.helpers.formatDate(doc.uploaded_date)}</span>
                    </p>
                </div>
                
                <div class="document-actions">
                    <button class="btn btn-sm btn-secondary" onclick="window.app.modules.documents.downloadDocument('${doc._id}')">
                        <i class="fas fa-download"></i>
                    </button>
                    <button class="btn btn-sm btn-primary" onclick="window.app.modules.documents.viewDocument('${doc._id}')">
                        <i class="fas fa-eye"></i>
                    </button>
                    <div class="dropdown">
                        <button class="btn btn-sm btn-secondary dropdown-toggle" data-bs-toggle="dropdown">
                            <i class="fas fa-ellipsis-v"></i>
                        </button>
                        <ul class="dropdown-menu">
                            <li><a class="dropdown-item" href="#" onclick="window.app.modules.documents.editDocument('${doc._id}')">
                                <i class="fas fa-edit"></i> Edit
                            </a></li>
                            <li><a class="dropdown-item" href="#" onclick="window.app.modules.documents.shareDocument('${doc._id}')">
                                <i class="fas fa-share"></i> Share
                            </a></li>
                            <li><a class="dropdown-item" href="#" onclick="window.app.modules.documents.archiveDocument('${doc._id}')">
                                <i class="fas fa-archive"></i> Archive
                            </a></li>
                            <li><hr class="dropdown-divider"></li>
                            <li><a class="dropdown-item text-danger" href="#" onclick="window.app.modules.documents.deleteDocument('${doc._id}')">
                                <i class="fas fa-trash"></i> Delete
                            </a></li>
                        </ul>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Render pagination
     */
    renderPagination() {
        const pagination = document.getElementById('documents-pagination');
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
                    onclick="window.app.modules.documents.loadDocuments(${page - 1})">
                Previous
            </button>
        `;

        // Page numbers
        const startPage = Math.max(1, page - 2);
        const endPage = Math.min(pages, page + 2);

        for (let i = startPage; i <= endPage; i++) {
            paginationHTML += `
                <button class="pagination-item ${i === page ? 'active' : ''}" 
                        onclick="window.app.modules.documents.loadDocuments(${i})">
                    ${i}
                </button>
            `;
        }

        // Next button
        paginationHTML += `
            <button class="pagination-item ${page === pages ? 'disabled' : ''}" 
                    ${page === pages ? 'disabled' : ''} 
                    onclick="window.app.modules.documents.loadDocuments(${page + 1})">
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
        const searchInput = document.getElementById('document-search');
        if (searchInput) {
            searchInput.addEventListener('input', this.app.helpers.debounce((e) => {
                this.loadDocuments(1);
            }, 500));
        }

        // Filter selects
        const filters = ['type-filter', 'client-filter'];
        filters.forEach(filterId => {
            const filter = document.getElementById(filterId);
            if (filter) {
                filter.addEventListener('change', () => {
                    this.loadDocuments(1);
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

        // View toggle
        const gridView = document.getElementById('grid-view');
        const listView = document.getElementById('list-view');
        
        if (gridView) {
            gridView.addEventListener('click', () => {
                gridView.classList.add('active');
                listView.classList.remove('active');
                this.renderDocuments();
            });
        }
        
        if (listView) {
            listView.addEventListener('click', () => {
                listView.classList.add('active');
                gridView.classList.remove('active');
                this.renderDocuments();
            });
        }

        // Upload document button
        const uploadBtn = document.getElementById('upload-document');
        if (uploadBtn) {
            uploadBtn.addEventListener('click', () => {
                this.showUploadModal();
            });
        }

        // Create folder button
        const createFolderBtn = document.getElementById('create-folder');
        if (createFolderBtn) {
            createFolderBtn.addEventListener('click', () => {
                this.showCreateFolderModal();
            });
        }
    }

    /**
     * Clear all filters
     */
    clearFilters() {
        document.getElementById('document-search').value = '';
        document.getElementById('type-filter').value = '';
        document.getElementById('client-filter').value = '';
        this.loadDocuments(1);
    }

    /**
     * Show upload modal
     */
    showUploadModal() {
        const formHTML = `
            <div class="upload-area" id="upload-area">
                <div class="upload-content">
                    <i class="fas fa-cloud-upload-alt"></i>
                    <p>Drag and drop files here or click to browse</p>
                    <input type="file" id="file-input" multiple accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png" style="display: none;">
                </div>
            </div>
            
            <div class="form-group">
                <label class="form-label">Document Type *</label>
                <select name="type" class="form-select" required>
                    <option value="">Select Type</option>
                    <option value="Invoice">Invoice</option>
                    <option value="Agreement">Agreement</option>
                    <option value="PAN Card">PAN Card</option>
                    <option value="GST Certificate">GST Certificate</option>
                    <option value="Bank Statement">Bank Statement</option>
                    <option value="Other">Other</option>
                </select>
            </div>
            
            <div class="form-group">
                <label class="form-label">Client</label>
                <select name="client" class="form-select">
                    <option value="">Select Client</option>
                </select>
            </div>
            
            <div class="form-group">
                <label class="form-label">Description</label>
                <textarea name="description" class="form-textarea" rows="3"></textarea>
            </div>
            
            <div class="form-group">
                <label class="form-label">Tags</label>
                <input type="text" name="tags" class="form-control" placeholder="Enter tags separated by commas">
            </div>
        `;
        
        this.app.modal.showForm(formHTML, {
            title: 'Upload Document',
            size: 'lg',
            onSubmit: (data) => this.handleUpload(data),
            onCancel: () => this.app.modal.close()
        });

        // Setup file upload
        this.setupFileUpload();
    }

    /**
     * Setup file upload functionality
     */
    setupFileUpload() {
        const uploadArea = document.getElementById('upload-area');
        const fileInput = document.getElementById('file-input');
        
        if (uploadArea && fileInput) {
            // Click to browse
            uploadArea.addEventListener('click', () => {
                fileInput.click();
            });
            
            // Drag and drop
            uploadArea.addEventListener('dragover', (e) => {
                e.preventDefault();
                uploadArea.classList.add('dragover');
            });
            
            uploadArea.addEventListener('dragleave', () => {
                uploadArea.classList.remove('dragover');
            });
            
            uploadArea.addEventListener('drop', (e) => {
                e.preventDefault();
                uploadArea.classList.remove('dragover');
                const files = e.dataTransfer.files;
                this.handleFileSelection(files);
            });
            
            // File input change
            fileInput.addEventListener('change', (e) => {
                this.handleFileSelection(e.target.files);
            });
        }
    }

    /**
     * Handle file selection
     */
    handleFileSelection(files) {
        if (files.length === 0) return;
        
        // Show selected files
        const uploadArea = document.getElementById('upload-area');
        uploadArea.innerHTML = `
            <div class="selected-files">
                <h4>Selected Files:</h4>
                ${Array.from(files).map(file => `
                    <div class="file-item">
                        <i class="fas fa-${this.getFileIcon(file.type)}"></i>
                        <span>${file.name}</span>
                        <span class="file-size">${this.formatFileSize(file.size)}</span>
                    </div>
                `).join('')}
            </div>
        `;
    }

    /**
     * Show create folder modal
     */
    showCreateFolderModal() {
        const formHTML = `
            <div class="form-group">
                <label class="form-label">Folder Name *</label>
                <input type="text" name="name" class="form-control" required>
            </div>
            
            <div class="form-group">
                <label class="form-label">Description</label>
                <textarea name="description" class="form-textarea" rows="3"></textarea>
            </div>
            
            <div class="form-group">
                <label class="form-label">Parent Folder</label>
                <select name="parent" class="form-select">
                    <option value="">Root Folder</option>
                </select>
            </div>
        `;
        
        this.app.modal.showForm(formHTML, {
            title: 'Create Folder',
            onSubmit: (data) => this.handleCreateFolder(data),
            onCancel: () => this.app.modal.close()
        });
    }

    /**
     * View document
     */
    async viewDocument(docId) {
        try {
            this.app.loading.showOverlay('Loading document...');
            
            const response = await this.api.get(`/documents/${docId}`);
            
            if (response.success) {
                this.showDocumentViewer(response.data.document);
            } else {
                this.app.toast.error(response.message || 'Failed to load document');
            }
        } catch (error) {
            console.error('View document error:', error);
            this.app.toast.error('Failed to load document');
        } finally {
            this.app.loading.hideOverlay();
        }
    }

    /**
     * Download document
     */
    async downloadDocument(docId) {
        try {
            this.app.loading.showOverlay('Preparing download...');
            
            const response = await this.api.get(`/documents/${docId}/download`);
            
            if (response.success) {
                // Create download link
                const link = document.createElement('a');
                link.href = response.data.downloadUrl;
                link.download = response.data.filename;
                link.click();
                
                this.app.toast.success('Download started');
            } else {
                this.app.toast.error(response.message || 'Failed to download document');
            }
        } catch (error) {
            console.error('Download document error:', error);
            this.app.toast.error('Failed to download document');
        } finally {
            this.app.loading.hideOverlay();
        }
    }

    /**
     * Edit document
     */
    async editDocument(docId) {
        try {
            this.app.loading.showOverlay('Loading document details...');
            
            const response = await this.api.get(`/documents/${docId}`);
            
            if (response.success) {
                this.showEditDocumentModal(response.data.document);
            } else {
                this.app.toast.error(response.message || 'Failed to load document details');
            }
        } catch (error) {
            console.error('Edit document error:', error);
            this.app.toast.error('Failed to load document details');
        } finally {
            this.app.loading.hideOverlay();
        }
    }

    /**
     * Share document
     */
    async shareDocument(docId) {
        try {
            this.app.loading.showOverlay('Preparing share link...');
            
            const response = await this.api.post(`/documents/${docId}/share`);
            
            if (response.success) {
                this.showShareModal(response.data.shareUrl);
            } else {
                this.app.toast.error(response.message || 'Failed to create share link');
            }
        } catch (error) {
            console.error('Share document error:', error);
            this.app.toast.error('Failed to create share link');
        } finally {
            this.app.loading.hideOverlay();
        }
    }

    /**
     * Archive document
     */
    async archiveDocument(docId) {
        const confirmed = await this.app.modal.confirm(
            'Are you sure you want to archive this document?',
            {
                title: 'Archive Document',
                confirmText: 'Archive',
                cancelText: 'Cancel',
                type: 'warning'
            }
        );

        if (confirmed) {
            try {
                this.app.loading.showOverlay('Archiving document...');
                
                const response = await this.api.put(`/documents/${docId}`, {
                    is_archived: true
                });
                
                if (response.success) {
                    this.app.toast.success('Document archived successfully');
                    this.loadDocuments(this.data.pagination.page);
                } else {
                    this.app.toast.error(response.message || 'Failed to archive document');
                }
            } catch (error) {
                console.error('Archive document error:', error);
                this.app.toast.error('Failed to archive document');
            } finally {
                this.app.loading.hideOverlay();
            }
        }
    }

    /**
     * Delete document
     */
    async deleteDocument(docId) {
        const confirmed = await this.app.modal.confirm(
            'Are you sure you want to delete this document? This action cannot be undone.',
            {
                title: 'Delete Document',
                confirmText: 'Delete',
                cancelText: 'Cancel',
                type: 'error'
            }
        );

        if (confirmed) {
            try {
                this.app.loading.showOverlay('Deleting document...');
                
                const response = await this.api.delete(`/documents/${docId}`);
                
                if (response.success) {
                    this.app.toast.success('Document deleted successfully');
                    this.loadDocuments(this.data.pagination.page);
                } else {
                    this.app.toast.error(response.message || 'Failed to delete document');
                }
            } catch (error) {
                console.error('Delete document error:', error);
                this.app.toast.error('Failed to delete document');
            } finally {
                this.app.loading.hideOverlay();
            }
        }
    }

    /**
     * Handle upload
     */
    async handleUpload(data) {
        try {
            this.app.loading.showOverlay('Uploading document...');
            
            const formData = new FormData();
            const fileInput = document.getElementById('file-input');
            
            if (fileInput.files.length === 0) {
                this.app.toast.error('Please select a file to upload');
                return;
            }
            
            // Add file
            formData.append('file', fileInput.files[0]);
            
            // Add other data
            Object.keys(data).forEach(key => {
                if (data[key]) {
                    formData.append(key, data[key]);
                }
            });
            
            const response = await this.api.post('/documents/upload', formData, true);
            
            if (response.success) {
                this.app.toast.success('Document uploaded successfully');
                this.app.modal.close();
                this.loadDocuments(1);
            } else {
                this.app.toast.error(response.message || 'Failed to upload document');
            }
        } catch (error) {
            console.error('Upload document error:', error);
            this.app.toast.error('Failed to upload document');
        } finally {
            this.app.loading.hideOverlay();
        }
    }

    /**
     * Handle create folder
     */
    async handleCreateFolder(data) {
        try {
            this.app.loading.showOverlay('Creating folder...');
            
            const response = await this.api.post('/documents/folders', data);
            
            if (response.success) {
                this.app.toast.success('Folder created successfully');
                this.app.modal.close();
                this.loadDocuments(1);
            } else {
                this.app.toast.error(response.message || 'Failed to create folder');
            }
        } catch (error) {
            console.error('Create folder error:', error);
            this.app.toast.error('Failed to create folder');
        } finally {
            this.app.loading.hideOverlay();
        }
    }

    /**
     * Show document viewer
     */
    showDocumentViewer(doc) {
        const viewerHTML = `
            <div class="document-viewer">
                <div class="viewer-header">
                    <h2>${doc.name}</h2>
                    <div class="viewer-actions">
                        <button class="btn btn-secondary" onclick="window.app.modules.documents.downloadDocument('${doc._id}')">
                            <i class="fas fa-download"></i>
                            Download
                        </button>
                        <button class="btn btn-primary" onclick="window.app.modules.documents.shareDocument('${doc._id}')">
                            <i class="fas fa-share"></i>
                            Share
                        </button>
                    </div>
                </div>
                
                <div class="viewer-content">
                    <div class="document-preview">
                        <iframe src="${doc.url}" width="100%" height="600px"></iframe>
                    </div>
                </div>
                
                <div class="viewer-sidebar">
                    <div class="document-info">
                        <h3>Document Information</h3>
                        <div class="info-item">
                            <label>Type:</label>
                            <span>${doc.type}</span>
                        </div>
                        <div class="info-item">
                            <label>Client:</label>
                            <span>${doc.client?.name || 'No Client'}</span>
                        </div>
                        <div class="info-item">
                            <label>Uploaded:</label>
                            <span>${this.app.helpers.formatDateTime(doc.uploaded_date)}</span>
                        </div>
                        <div class="info-item">
                            <label>Uploaded by:</label>
                            <span>${doc.uploaded_by?.username || 'Unknown'}</span>
                        </div>
                        ${doc.expiry_date ? `
                            <div class="info-item">
                                <label>Expires:</label>
                                <span>${this.app.helpers.formatDate(doc.expiry_date)}</span>
                            </div>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
        
        this.app.modal.show(viewerHTML, {
            title: 'Document Viewer',
            size: 'xl'
        });
    }

    /**
     * Show edit document modal
     */
    showEditDocumentModal(doc) {
        const formHTML = `
            <div class="form-group">
                <label class="form-label">Document Name *</label>
                <input type="text" name="name" class="form-control" value="${doc.name}" required>
            </div>
            
            <div class="form-group">
                <label class="form-label">Document Type *</label>
                <select name="type" class="form-select" required>
                    <option value="">Select Type</option>
                    <option value="Invoice" ${doc.type === 'Invoice' ? 'selected' : ''}>Invoice</option>
                    <option value="Agreement" ${doc.type === 'Agreement' ? 'selected' : ''}>Agreement</option>
                    <option value="PAN Card" ${doc.type === 'PAN Card' ? 'selected' : ''}>PAN Card</option>
                    <option value="GST Certificate" ${doc.type === 'GST Certificate' ? 'selected' : ''}>GST Certificate</option>
                    <option value="Bank Statement" ${doc.type === 'Bank Statement' ? 'selected' : ''}>Bank Statement</option>
                    <option value="Other" ${doc.type === 'Other' ? 'selected' : ''}>Other</option>
                </select>
            </div>
            
            <div class="form-group">
                <label class="form-label">Client</label>
                <select name="client" class="form-select">
                    <option value="">Select Client</option>
                </select>
            </div>
            
            <div class="form-group">
                <label class="form-label">Tags</label>
                <input type="text" name="tags" class="form-control" value="${doc.tags?.join(', ') || ''}" placeholder="Enter tags separated by commas">
            </div>
            
            <div class="form-group">
                <label class="form-label">Expiry Date</label>
                <input type="date" name="expiry_date" class="form-control" value="${doc.expiry_date ? this.app.helpers.formatDate(doc.expiry_date, 'YYYY-MM-DD') : ''}">
            </div>
        `;
        
        this.app.modal.showForm(formHTML, {
            title: 'Edit Document',
            onSubmit: (data) => this.handleEditDocument(doc._id, data),
            onCancel: () => this.app.modal.close()
        });
    }

    /**
     * Handle edit document
     */
    async handleEditDocument(docId, data) {
        try {
            this.app.loading.showOverlay('Updating document...');
            
            const response = await this.api.put(`/documents/${docId}`, data);
            
            if (response.success) {
                this.app.toast.success('Document updated successfully');
                this.app.modal.close();
                this.loadDocuments(this.data.pagination.page);
            } else {
                this.app.toast.error(response.message || 'Failed to update document');
            }
        } catch (error) {
            console.error('Edit document error:', error);
            this.app.toast.error('Failed to update document');
        } finally {
            this.app.loading.hideOverlay();
        }
    }

    /**
     * Show share modal
     */
    showShareModal(shareUrl) {
        const shareHTML = `
            <div class="share-modal">
                <div class="form-group">
                    <label class="form-label">Share Link</label>
                    <div class="input-group">
                        <input type="text" class="form-control" value="${shareUrl}" readonly>
                        <button class="btn btn-secondary" onclick="navigator.clipboard.writeText('${shareUrl}')">
                            <i class="fas fa-copy"></i>
                        </button>
                    </div>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Expiry</label>
                    <select class="form-select">
                        <option value="1">1 day</option>
                        <option value="7" selected>7 days</option>
                        <option value="30">30 days</option>
                        <option value="never">Never</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Permissions</label>
                    <div class="checkbox-group">
                        <label class="checkbox-label">
                            <input type="checkbox" checked>
                            <span>View</span>
                        </label>
                        <label class="checkbox-label">
                            <input type="checkbox">
                            <span>Download</span>
                        </label>
                    </div>
                </div>
            </div>
        `;
        
        this.app.modal.show(shareHTML, {
            title: 'Share Document',
            onSubmit: () => {
                this.app.toast.success('Share link copied to clipboard');
                this.app.modal.close();
            }
        });
    }

    /**
     * Get file icon based on type
     */
    getFileIcon(type) {
        const iconMap = {
            'pdf': 'file-pdf',
            'doc': 'file-word',
            'docx': 'file-word',
            'xls': 'file-excel',
            'xlsx': 'file-excel',
            'jpg': 'file-image',
            'jpeg': 'file-image',
            'png': 'file-image',
            'gif': 'file-image',
            'txt': 'file-alt',
            'zip': 'file-archive',
            'rar': 'file-archive'
        };
        
        const extension = type.split('/').pop().toLowerCase();
        return iconMap[extension] || 'file';
    }

    /**
     * Format file size
     */
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DocumentsModule;
}