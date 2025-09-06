/**
 * Loading Component
 * Handles loading states and spinners
 */

class Loading {
    constructor() {
        this.loadingScreen = document.getElementById('loading-screen');
        this.loadingOverlay = null;
        this.loadingCount = 0;
        
        this.init();
    }

    /**
     * Initialize loading component
     */
    init() {
        // Create loading overlay if it doesn't exist
        this.createLoadingOverlay();
    }

    /**
     * Create loading overlay
     */
    createLoadingOverlay() {
        this.loadingOverlay = document.createElement('div');
        this.loadingOverlay.className = 'loading-overlay hidden';
        this.loadingOverlay.innerHTML = `
            <div class="loading-content">
                <div class="spinner"></div>
                <p class="loading-message">Loading...</p>
            </div>
        `;
        document.body.appendChild(this.loadingOverlay);
    }

    /**
     * Show loading screen
     */
    show(message = 'Loading...') {
        if (this.loadingScreen) {
            const messageEl = this.loadingScreen.querySelector('p');
            if (messageEl) {
                messageEl.textContent = message;
            }
            this.loadingScreen.classList.remove('hidden');
        }
    }

    /**
     * Hide loading screen
     */
    hide() {
        if (this.loadingScreen) {
            this.loadingScreen.classList.add('hidden');
        }
    }

    /**
     * Show loading overlay
     */
    showOverlay(message = 'Loading...', options = {}) {
        const {
            size = 'medium',
            color = 'primary',
            fullscreen = false,
            closable = false
        } = options;

        this.loadingCount++;
        
        if (this.loadingCount === 1) {
            const messageEl = this.loadingOverlay.querySelector('.loading-message');
            if (messageEl) {
                messageEl.textContent = message;
            }
            
            this.loadingOverlay.className = `loading-overlay loading-${size} loading-${color} ${fullscreen ? 'loading-fullscreen' : ''}`;
            this.loadingOverlay.classList.remove('hidden');
            
            if (closable) {
                this.loadingOverlay.innerHTML = `
                    <div class="loading-content">
                        <div class="spinner"></div>
                        <p class="loading-message">${message}</p>
                        <button class="loading-close" onclick="window.app.loading.hideOverlay()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                `;
            }
        }
    }

    /**
     * Hide loading overlay
     */
    hideOverlay() {
        this.loadingCount = Math.max(0, this.loadingCount - 1);
        
        if (this.loadingCount === 0) {
            this.loadingOverlay.classList.add('hidden');
        }
    }

    /**
     * Show loading button
     */
    showButton(button, text = 'Loading...') {
        if (!button) return;

        // Store original content
        button.dataset.originalText = button.textContent;
        button.dataset.originalDisabled = button.disabled;
        
        // Set loading state
        button.disabled = true;
        button.classList.add('btn-loading');
        button.textContent = text;
    }

    /**
     * Hide loading button
     */
    hideButton(button, originalText = null) {
        if (!button) return;

        // Restore original state
        button.disabled = button.dataset.originalDisabled === 'true';
        button.classList.remove('btn-loading');
        button.textContent = originalText || button.dataset.originalText || 'Submit';
        
        // Clean up
        delete button.dataset.originalText;
        delete button.dataset.originalDisabled;
    }

    /**
     * Show loading spinner in element
     */
    showSpinner(element, message = 'Loading...') {
        if (!element) return;

        // Store original content
        element.dataset.originalContent = element.innerHTML;
        
        // Show spinner
        element.innerHTML = `
            <div class="spinner-container">
                <div class="spinner"></div>
                <p class="spinner-message">${message}</p>
            </div>
        `;
    }

    /**
     * Hide loading spinner in element
     */
    hideSpinner(element, originalContent = null) {
        if (!element) return;

        // Restore original content
        element.innerHTML = originalContent || element.dataset.originalContent || '';
        
        // Clean up
        delete element.dataset.originalContent;
    }

    /**
     * Show skeleton loading
     */
    showSkeleton(element, rows = 3) {
        if (!element) return;

        // Store original content
        element.dataset.originalContent = element.innerHTML;
        
        // Create skeleton
        const skeletonHTML = Array.from({ length: rows }, (_, i) => `
            <div class="skeleton-item">
                <div class="skeleton skeleton-text ${i === rows - 1 ? 'short' : 'medium'}"></div>
            </div>
        `).join('');
        
        element.innerHTML = `
            <div class="skeleton-container">
                ${skeletonHTML}
            </div>
        `;
    }

    /**
     * Hide skeleton loading
     */
    hideSkeleton(element, originalContent = null) {
        if (!element) return;

        // Restore original content
        element.innerHTML = originalContent || element.dataset.originalContent || '';
        
        // Clean up
        delete element.dataset.originalContent;
    }

    /**
     * Show loading table
     */
    showTable(element, rows = 5, columns = 4) {
        if (!element) return;

        // Store original content
        element.dataset.originalContent = element.innerHTML;
        
        // Create table skeleton
        const tableSkeleton = `
            <div class="table-skeleton">
                <div class="skeleton-table-header">
                    ${Array.from({ length: columns }, () => '<div class="skeleton skeleton-text short"></div>').join('')}
                </div>
                ${Array.from({ length: rows }, () => `
                    <div class="skeleton-table-row">
                        ${Array.from({ length: columns }, () => '<div class="skeleton skeleton-text medium"></div>').join('')}
                    </div>
                `).join('')}
            </div>
        `;
        
        element.innerHTML = tableSkeleton;
    }

    /**
     * Hide loading table
     */
    hideTable(element, originalContent = null) {
        if (!element) return;

        // Restore original content
        element.innerHTML = originalContent || element.dataset.originalContent || '';
        
        // Clean up
        delete element.dataset.originalContent;
    }

    /**
     * Show loading card
     */
    showCard(element) {
        if (!element) return;

        // Store original content
        element.dataset.originalContent = element.innerHTML;
        
        // Create card skeleton
        element.innerHTML = `
            <div class="card-skeleton">
                <div class="skeleton-card-header">
                    <div class="skeleton skeleton-avatar"></div>
                    <div class="skeleton-content">
                        <div class="skeleton skeleton-text short"></div>
                        <div class="skeleton skeleton-text medium"></div>
                    </div>
                </div>
                <div class="skeleton-card-body">
                    <div class="skeleton skeleton-text long"></div>
                    <div class="skeleton skeleton-text medium"></div>
                    <div class="skeleton skeleton-text short"></div>
                </div>
            </div>
        `;
    }

    /**
     * Hide loading card
     */
    hideCard(element, originalContent = null) {
        if (!element) return;

        // Restore original content
        element.innerHTML = originalContent || element.dataset.originalContent || '';
        
        // Clean up
        delete element.dataset.originalContent;
    }

    /**
     * Show loading with progress
     */
    showProgress(message = 'Loading...', progress = 0) {
        this.showOverlay(message, { closable: true });
        
        const progressBar = document.createElement('div');
        progressBar.className = 'loading-progress';
        progressBar.innerHTML = `
            <div class="progress">
                <div class="progress-bar" style="width: ${progress}%"></div>
            </div>
            <div class="progress-text">${progress}%</div>
        `;
        
        const content = this.loadingOverlay.querySelector('.loading-content');
        if (content) {
            content.appendChild(progressBar);
        }
    }

    /**
     * Update progress
     */
    updateProgress(progress, message = null) {
        const progressBar = this.loadingOverlay.querySelector('.progress-bar');
        const progressText = this.loadingOverlay.querySelector('.progress-text');
        const messageEl = this.loadingOverlay.querySelector('.loading-message');
        
        if (progressBar) {
            progressBar.style.width = `${progress}%`;
        }
        
        if (progressText) {
            progressText.textContent = `${progress}%`;
        }
        
        if (message && messageEl) {
            messageEl.textContent = message;
        }
        
        // Auto hide when complete
        if (progress >= 100) {
            setTimeout(() => {
                this.hideOverlay();
            }, 1000);
        }
    }

    /**
     * Show loading with steps
     */
    showSteps(steps, currentStep = 0) {
        this.showOverlay('Processing...', { closable: true });
        
        const stepsContainer = document.createElement('div');
        stepsContainer.className = 'loading-steps';
        
        stepsContainer.innerHTML = steps.map((step, index) => `
            <div class="loading-step ${index <= currentStep ? 'completed' : ''} ${index === currentStep ? 'current' : ''}">
                <div class="step-icon">
                    ${index < currentStep ? '<i class="fas fa-check"></i>' : 
                      index === currentStep ? '<div class="spinner"></div>' : 
                      '<i class="fas fa-circle"></i>'}
                </div>
                <div class="step-text">${step}</div>
            </div>
        `).join('');
        
        const content = this.loadingOverlay.querySelector('.loading-content');
        if (content) {
            content.appendChild(stepsContainer);
        }
    }

    /**
     * Update steps
     */
    updateSteps(currentStep) {
        const steps = this.loadingOverlay.querySelectorAll('.loading-step');
        steps.forEach((step, index) => {
            step.classList.remove('current', 'completed');
            
            if (index < currentStep) {
                step.classList.add('completed');
            } else if (index === currentStep) {
                step.classList.add('current');
            }
        });
    }

    /**
     * Show loading with dots animation
     */
    showDots(message = 'Loading') {
        this.showOverlay(message, { closable: true });
        
        const dotsContainer = document.createElement('div');
        dotsContainer.className = 'loading-dots';
        dotsContainer.innerHTML = `
            <div class="dots">
                <span></span>
                <span></span>
                <span></span>
            </div>
        `;
        
        const content = this.loadingOverlay.querySelector('.loading-content');
        if (content) {
            content.appendChild(dotsContainer);
        }
    }

    /**
     * Check if loading is active
     */
    isLoading() {
        return this.loadingCount > 0;
    }

    /**
     * Get loading count
     */
    getLoadingCount() {
        return this.loadingCount;
    }

    /**
     * Force hide all loading
     */
    forceHide() {
        this.loadingCount = 0;
        this.hide();
        this.hideOverlay();
    }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Loading;
}