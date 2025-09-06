/**
 * Toast Notification Component
 * Handles toast notifications display and management
 */

class Toast {
    constructor() {
        this.container = document.getElementById('toast-container');
        this.toasts = [];
        this.defaultDuration = 5000; // 5 seconds
        
        this.init();
    }

    /**
     * Initialize toast component
     */
    init() {
        // Create container if it doesn't exist
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.id = 'toast-container';
            this.container.className = 'toast-container';
            document.body.appendChild(this.container);
        }
    }

    /**
     * Show toast notification
     */
    show(message, options = {}) {
        const {
            type = 'info',
            title = '',
            duration = this.defaultDuration,
            closable = true,
            position = 'top-right',
            onClose = null,
            onAction = null,
            actionText = null
        } = options;

        // Create toast element
        const toast = this.createToast(message, {
            type,
            title,
            closable,
            onClose,
            onAction,
            actionText
        });

        // Add to container
        this.container.appendChild(toast);
        this.toasts.push(toast);

        // Show toast with animation
        requestAnimationFrame(() => {
            toast.classList.add('show');
        });

        // Auto remove after duration
        if (duration > 0) {
            setTimeout(() => {
                this.remove(toast);
            }, duration);
        }

        return toast;
    }

    /**
     * Create toast element
     */
    createToast(message, options) {
        const { type, title, closable, onClose, onAction, actionText } = options;
        
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        
        const icon = this.getToastIcon(type);
        
        toast.innerHTML = `
            <div class="toast-icon">
                <i class="fas fa-${icon}"></i>
            </div>
            <div class="toast-content">
                ${title ? `<div class="toast-title">${title}</div>` : ''}
                <div class="toast-message">${message}</div>
            </div>
            ${actionText && onAction ? `
                <button class="toast-action" data-action="action">
                    ${actionText}
                </button>
            ` : ''}
            ${closable ? `
                <button class="toast-close" data-action="close">
                    <i class="fas fa-times"></i>
                </button>
            ` : ''}
        `;

        // Add event listeners
        toast.addEventListener('click', (e) => {
            const action = e.target.closest('[data-action]')?.dataset.action;
            
            if (action === 'close') {
                this.remove(toast);
                if (onClose) onClose();
            } else if (action === 'action' && onAction) {
                onAction();
            }
        });

        return toast;
    }

    /**
     * Remove toast
     */
    remove(toast) {
        if (!toast || !toast.parentNode) return;

        toast.classList.remove('show');
        
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
            
            // Remove from toasts array
            const index = this.toasts.indexOf(toast);
            if (index > -1) {
                this.toasts.splice(index, 1);
            }
        }, 300);
    }

    /**
     * Remove all toasts
     */
    removeAll() {
        this.toasts.forEach(toast => this.remove(toast));
    }

    /**
     * Show success toast
     */
    success(message, options = {}) {
        return this.show(message, {
            type: 'success',
            title: options.title || 'Success',
            ...options
        });
    }

    /**
     * Show error toast
     */
    error(message, options = {}) {
        return this.show(message, {
            type: 'error',
            title: options.title || 'Error',
            duration: 7000, // Longer duration for errors
            ...options
        });
    }

    /**
     * Show warning toast
     */
    warning(message, options = {}) {
        return this.show(message, {
            type: 'warning',
            title: options.title || 'Warning',
            ...options
        });
    }

    /**
     * Show info toast
     */
    info(message, options = {}) {
        return this.show(message, {
            type: 'info',
            title: options.title || 'Information',
            ...options
        });
    }

    /**
     * Show loading toast
     */
    loading(message, options = {}) {
        return this.show(message, {
            type: 'info',
            title: options.title || 'Loading',
            duration: 0, // Don't auto-remove
            closable: false,
            ...options
        });
    }

    /**
     * Update loading toast
     */
    updateLoading(toast, message, type = 'success') {
        if (!toast || !toast.parentNode) return;

        const messageEl = toast.querySelector('.toast-message');
        const iconEl = toast.querySelector('.toast-icon i');
        
        if (messageEl) {
            messageEl.textContent = message;
        }
        
        if (iconEl) {
            iconEl.className = `fas fa-${this.getToastIcon(type)}`;
        }
        
        toast.className = `toast toast-${type}`;
        
        // Auto remove after update
        setTimeout(() => {
            this.remove(toast);
        }, 3000);
    }

    /**
     * Show confirmation toast
     */
    confirm(message, options = {}) {
        const {
            onConfirm = null,
            onCancel = null,
            confirmText = 'Yes',
            cancelText = 'No'
        } = options;

        return this.show(message, {
            type: 'warning',
            title: options.title || 'Confirm',
            duration: 0, // Don't auto-remove
            actionText: confirmText,
            onAction: () => {
                this.removeAll();
                if (onConfirm) onConfirm();
            },
            onClose: () => {
                if (onCancel) onCancel();
            }
        });
    }

    /**
     * Show progress toast
     */
    progress(message, progress = 0, options = {}) {
        const toast = this.show(message, {
            type: 'info',
            title: options.title || 'Progress',
            duration: 0, // Don't auto-remove
            ...options
        });

        // Add progress bar
        const progressBar = document.createElement('div');
        progressBar.className = 'toast-progress';
        progressBar.innerHTML = `
            <div class="progress">
                <div class="progress-bar" style="width: ${progress}%"></div>
            </div>
        `;

        const content = toast.querySelector('.toast-content');
        if (content) {
            content.appendChild(progressBar);
        }

        return toast;
    }

    /**
     * Update progress toast
     */
    updateProgress(toast, progress, message = null) {
        if (!toast || !toast.parentNode) return;

        const progressBar = toast.querySelector('.progress-bar');
        const messageEl = toast.querySelector('.toast-message');
        
        if (progressBar) {
            progressBar.style.width = `${progress}%`;
        }
        
        if (message && messageEl) {
            messageEl.textContent = message;
        }

        // Auto remove when complete
        if (progress >= 100) {
            setTimeout(() => {
                this.remove(toast);
            }, 1000);
        }
    }

    /**
     * Show action toast with multiple buttons
     */
    action(message, actions, options = {}) {
        const {
            title = 'Action Required',
            type = 'warning',
            duration = 0
        } = options;

        const toast = this.show(message, {
            type,
            title,
            duration,
            ...options
        });

        // Add action buttons
        const actionContainer = document.createElement('div');
        actionContainer.className = 'toast-actions';
        
        actions.forEach(action => {
            const button = document.createElement('button');
            button.className = `btn btn-sm ${action.class || 'btn-secondary'}`;
            button.textContent = action.text;
            button.addEventListener('click', () => {
                if (action.handler) {
                    action.handler();
                }
                this.remove(toast);
            });
            actionContainer.appendChild(button);
        });

        const content = toast.querySelector('.toast-content');
        if (content) {
            content.appendChild(actionContainer);
        }

        return toast;
    }

    /**
     * Show toast with custom HTML
     */
    custom(html, options = {}) {
        const {
            type = 'info',
            duration = this.defaultDuration,
            closable = true
        } = options;

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = html;

        // Add close button if closable
        if (closable) {
            const closeBtn = document.createElement('button');
            closeBtn.className = 'toast-close';
            closeBtn.innerHTML = '<i class="fas fa-times"></i>';
            closeBtn.addEventListener('click', () => this.remove(toast));
            toast.appendChild(closeBtn);
        }

        // Add to container
        this.container.appendChild(toast);
        this.toasts.push(toast);

        // Show toast
        requestAnimationFrame(() => {
            toast.classList.add('show');
        });

        // Auto remove
        if (duration > 0) {
            setTimeout(() => {
                this.remove(toast);
            }, duration);
        }

        return toast;
    }

    /**
     * Get toast icon based on type
     */
    getToastIcon(type) {
        const icons = {
            success: 'check-circle',
            error: 'times-circle',
            warning: 'exclamation-triangle',
            info: 'info-circle',
            loading: 'spinner fa-spin'
        };
        return icons[type] || 'info-circle';
    }

    /**
     * Get toast count
     */
    getCount() {
        return this.toasts.length;
    }

    /**
     * Check if any toasts are visible
     */
    hasToasts() {
        return this.toasts.length > 0;
    }

    /**
     * Set default duration
     */
    setDefaultDuration(duration) {
        this.defaultDuration = duration;
    }

    /**
     * Show toast with sound
     */
    playSound(type = 'info') {
        // Create audio context for notification sounds
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            // Different frequencies for different types
            const frequencies = {
                success: 800,
                error: 400,
                warning: 600,
                info: 500
            };
            
            oscillator.frequency.setValueAtTime(frequencies[type] || 500, audioContext.currentTime);
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.2);
        } catch (error) {
            // Audio not supported or blocked
            console.warn('Audio notification not available:', error);
        }
    }

    /**
     * Show toast with vibration (mobile)
     */
    vibrate(pattern = [200, 100, 200]) {
        if ('vibrate' in navigator) {
            navigator.vibrate(pattern);
        }
    }

    /**
     * Show toast with notification API
     */
    showNotification(message, options = {}) {
        if ('Notification' in window && Notification.permission === 'granted') {
            const notification = new Notification(options.title || 'CA Firm Management', {
                body: message,
                icon: '/assets/images/icon-192.png',
                badge: '/assets/images/badge-72.png',
                tag: 'ca-firm-notification',
                ...options
            });

            notification.onclick = () => {
                window.focus();
                notification.close();
            };

            return notification;
        }
    }

    /**
     * Request notification permission
     */
    async requestNotificationPermission() {
        if ('Notification' in window && Notification.permission === 'default') {
            const permission = await Notification.requestPermission();
            return permission === 'granted';
        }
        return false;
    }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Toast;
}