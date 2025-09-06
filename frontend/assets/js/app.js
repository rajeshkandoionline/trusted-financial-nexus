/**
 * CA Firm Management System - Main Application
 * Main entry point and application controller
 */

class CAFirmApp {
    constructor() {
        this.currentUser = null;
        this.currentModule = 'dashboard';
        this.isAuthenticated = false;
        this.modules = {};
        this.api = new API();
        this.modal = new Modal();
        this.toast = new Toast();
        this.loading = new Loading();
        
        this.init();
    }

    /**
     * Initialize the application
     */
    async init() {
        try {
            // Initialize AOS animations
            if (typeof AOS !== 'undefined') {
                AOS.init({
                    duration: 800,
                    easing: 'ease-in-out',
                    once: true,
                    offset: 100
                });
            }

            // Check authentication status
            await this.checkAuthStatus();
            
            // Initialize event listeners
            this.initEventListeners();
            
            // Initialize modules
            this.initModules();
            
            // Show appropriate page based on auth status
            if (this.isAuthenticated) {
                this.showMainApp();
                await this.loadDashboard();
            } else {
                this.showLoginPage();
            }
            
            // Hide loading screen
            this.loading.hide();
            
        } catch (error) {
            console.error('App initialization error:', error);
            this.toast.error('Failed to initialize application');
            this.loading.hide();
        }
    }

    /**
     * Check authentication status
     */
    async checkAuthStatus() {
        try {
            const token = localStorage.getItem('authToken');
            if (!token) {
                this.isAuthenticated = false;
                return;
            }

            // Verify token with server
            const response = await this.api.get('/auth/verify');
            if (response.success) {
                this.currentUser = response.data.user;
                this.isAuthenticated = true;
                this.updateUserInterface();
            } else {
                this.isAuthenticated = false;
                localStorage.removeItem('authToken');
            }
        } catch (error) {
            console.error('Auth check error:', error);
            this.isAuthenticated = false;
            localStorage.removeItem('authToken');
        }
    }

    /**
     * Initialize event listeners
     */
    initEventListeners() {
        // Login form
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', this.handleLogin.bind(this));
        }

        // Password toggle
        const passwordToggle = document.getElementById('password-toggle');
        if (passwordToggle) {
            passwordToggle.addEventListener('click', this.togglePasswordVisibility.bind(this));
        }

        // Sidebar toggle
        const sidebarToggle = document.getElementById('sidebar-toggle');
        if (sidebarToggle) {
            sidebarToggle.addEventListener('click', this.toggleSidebar.bind(this));
        }

        // Navigation links
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', this.handleNavigation.bind(this));
        });

        // User menu
        const userMenuBtn = document.getElementById('user-menu-btn');
        if (userMenuBtn) {
            userMenuBtn.addEventListener('click', this.toggleUserMenu.bind(this));
        }

        // User menu items
        const userMenuItems = document.querySelectorAll('.user-menu .menu-item');
        userMenuItems.forEach(item => {
            item.addEventListener('click', this.handleUserMenuAction.bind(this));
        });

        // Notification button
        const notificationBtn = document.getElementById('notification-btn');
        if (notificationBtn) {
            notificationBtn.addEventListener('click', this.toggleNotifications.bind(this));
        }

        // Global search
        const globalSearch = document.getElementById('global-search');
        if (globalSearch) {
            globalSearch.addEventListener('input', this.handleGlobalSearch.bind(this));
        }

        // Refresh dashboard
        const refreshBtn = document.getElementById('refresh-dashboard');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', this.refreshDashboard.bind(this));
        }

        // Close modals on overlay click
        const modalOverlay = document.getElementById('modal-overlay');
        if (modalOverlay) {
            modalOverlay.addEventListener('click', this.closeModal.bind(this));
        }

        // Close dropdowns on outside click
        document.addEventListener('click', this.handleOutsideClick.bind(this));

        // Handle window resize
        window.addEventListener('resize', this.handleResize.bind(this));

        // Handle beforeunload
        window.addEventListener('beforeunload', this.handleBeforeUnload.bind(this));
    }

    /**
     * Initialize modules
     */
    initModules() {
        this.modules = {
            dashboard: new DashboardModule(this),
            clients: new ClientsModule(this),
            staff: new StaffModule(this),
            tasks: new TasksModule(this),
            communications: new CommunicationsModule(this),
            documents: new DocumentsModule(this),
            reports: new ReportsModule(this),
            analytics: new AnalyticsModule(this)
        };
    }

    /**
     * Handle login form submission
     */
    async handleLogin(event) {
        event.preventDefault();
        
        const formData = new FormData(event.target);
        const credentials = {
            username: formData.get('username'),
            password: formData.get('password'),
            remember: formData.get('remember') === 'on'
        };

        try {
            this.loading.show('Signing in...');
            
            const response = await this.api.post('/auth/login', credentials);
            
            if (response.success) {
                localStorage.setItem('authToken', response.data.token);
                this.currentUser = response.data.user;
                this.isAuthenticated = true;
                
                this.updateUserInterface();
                this.showMainApp();
                await this.loadDashboard();
                
                this.toast.success('Welcome back!');
            } else {
                this.toast.error(response.message || 'Login failed');
            }
        } catch (error) {
            console.error('Login error:', error);
            this.toast.error('Login failed. Please try again.');
        } finally {
            this.loading.hide();
        }
    }

    /**
     * Toggle password visibility
     */
    togglePasswordVisibility() {
        const passwordInput = document.getElementById('password');
        const toggleIcon = document.getElementById('password-toggle').querySelector('i');
        
        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            toggleIcon.className = 'fas fa-eye-slash';
        } else {
            passwordInput.type = 'password';
            toggleIcon.className = 'fas fa-eye';
        }
    }

    /**
     * Toggle sidebar visibility
     */
    toggleSidebar() {
        const sidebar = document.getElementById('sidebar');
        sidebar.classList.toggle('open');
    }

    /**
     * Handle navigation
     */
    async handleNavigation(event) {
        event.preventDefault();
        
        const link = event.currentTarget;
        const module = link.dataset.module;
        
        if (!module || !this.modules[module]) {
            return;
        }

        // Update active nav link
        document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
        link.classList.add('active');
        
        // Load module
        this.currentModule = module;
        await this.loadModule(module);
    }

    /**
     * Load a specific module
     */
    async loadModule(moduleName) {
        try {
            this.loading.show(`Loading ${moduleName}...`);
            
            if (this.modules[moduleName]) {
                await this.modules[moduleName].load();
            }
            
            // Update page title
            document.title = `${this.capitalizeFirst(moduleName)} - CA Firm Management`;
            
        } catch (error) {
            console.error(`Error loading ${moduleName}:`, error);
            this.toast.error(`Failed to load ${moduleName}`);
        } finally {
            this.loading.hide();
        }
    }

    /**
     * Load dashboard
     */
    async loadDashboard() {
        await this.loadModule('dashboard');
    }

    /**
     * Refresh dashboard
     */
    async refreshDashboard() {
        await this.loadDashboard();
        this.toast.success('Dashboard refreshed');
    }

    /**
     * Toggle user menu
     */
    toggleUserMenu() {
        const userMenu = document.getElementById('user-menu');
        userMenu.classList.toggle('show');
    }

    /**
     * Handle user menu actions
     */
    async handleUserMenuAction(event) {
        event.preventDefault();
        
        const action = event.currentTarget.dataset.action;
        
        switch (action) {
            case 'profile':
                this.showProfileModal();
                break;
            case 'settings':
                this.showSettingsModal();
                break;
            case 'help':
                this.showHelpModal();
                break;
            case 'logout':
                await this.handleLogout();
                break;
        }
        
        // Close user menu
        document.getElementById('user-menu').classList.remove('show');
    }

    /**
     * Handle logout
     */
    async handleLogout() {
        try {
            await this.api.post('/auth/logout');
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            localStorage.removeItem('authToken');
            this.isAuthenticated = false;
            this.currentUser = null;
            this.showLoginPage();
            this.toast.success('Logged out successfully');
        }
    }

    /**
     * Toggle notifications
     */
    toggleNotifications() {
        const notificationDropdown = document.getElementById('notification-dropdown');
        notificationDropdown.classList.toggle('show');
        
        // Load notifications if not already loaded
        if (!notificationDropdown.dataset.loaded) {
            this.loadNotifications();
            notificationDropdown.dataset.loaded = 'true';
        }
    }

    /**
     * Load notifications
     */
    async loadNotifications() {
        try {
            const response = await this.api.get('/notifications');
            if (response.success) {
                this.renderNotifications(response.data);
            }
        } catch (error) {
            console.error('Error loading notifications:', error);
        }
    }

    /**
     * Render notifications
     */
    renderNotifications(notifications) {
        const notificationList = document.getElementById('notification-list');
        const notificationCount = document.getElementById('notification-count');
        
        if (notifications.length === 0) {
            notificationList.innerHTML = '<div class="no-notifications">No notifications</div>';
            notificationCount.textContent = '0';
            return;
        }
        
        notificationCount.textContent = notifications.length.toString();
        
        notificationList.innerHTML = notifications.map(notification => `
            <div class="notification-item ${notification.read ? 'read' : 'unread'}">
                <div class="notification-icon">
                    <i class="fas fa-${notification.icon || 'bell'}"></i>
                </div>
                <div class="notification-content">
                    <div class="notification-title">${notification.title}</div>
                    <div class="notification-message">${notification.message}</div>
                    <div class="notification-time">${this.formatTime(notification.created_at)}</div>
                </div>
            </div>
        `).join('');
    }

    /**
     * Handle global search
     */
    async handleGlobalSearch(event) {
        const query = event.target.value.trim();
        
        if (query.length < 2) {
            return;
        }
        
        try {
            const response = await this.api.get(`/search?q=${encodeURIComponent(query)}`);
            if (response.success) {
                this.showSearchResults(response.data);
            }
        } catch (error) {
            console.error('Search error:', error);
        }
    }

    /**
     * Show search results
     */
    showSearchResults(results) {
        // Implementation for search results modal
        console.log('Search results:', results);
    }

    /**
     * Handle outside click
     */
    handleOutsideClick(event) {
        // Close user menu
        const userMenu = document.getElementById('user-menu');
        const userMenuBtn = document.getElementById('user-menu-btn');
        if (userMenu && !userMenu.contains(event.target) && !userMenuBtn.contains(event.target)) {
            userMenu.classList.remove('show');
        }
        
        // Close notification dropdown
        const notificationDropdown = document.getElementById('notification-dropdown');
        const notificationBtn = document.getElementById('notification-btn');
        if (notificationDropdown && !notificationDropdown.contains(event.target) && !notificationBtn.contains(event.target)) {
            notificationDropdown.classList.remove('show');
        }
    }

    /**
     * Handle window resize
     */
    handleResize() {
        // Close mobile sidebar on desktop
        if (window.innerWidth > 768) {
            document.getElementById('sidebar').classList.remove('open');
        }
    }

    /**
     * Handle before unload
     */
    handleBeforeUnload(event) {
        // Save any unsaved changes
        // Implementation depends on specific requirements
    }

    /**
     * Show login page
     */
    showLoginPage() {
        document.getElementById('login-page').classList.remove('hidden');
        document.getElementById('main-content-area').classList.add('hidden');
        document.title = 'Login - CA Firm Management';
    }

    /**
     * Show main application
     */
    showMainApp() {
        document.getElementById('login-page').classList.add('hidden');
        document.getElementById('main-content-area').classList.remove('hidden');
    }

    /**
     * Update user interface with current user data
     */
    updateUserInterface() {
        if (!this.currentUser) return;
        
        // Update user name in header
        const userName = document.getElementById('user-name');
        const userFullName = document.getElementById('user-full-name');
        const userRole = document.getElementById('user-role');
        
        if (userName) userName.textContent = this.currentUser.name || this.currentUser.username;
        if (userFullName) userFullName.textContent = this.currentUser.name || this.currentUser.username;
        if (userRole) userRole.textContent = this.currentUser.role;
        
        // Update user avatar
        const userAvatarImg = document.getElementById('user-avatar-img');
        const userAvatarLarge = document.getElementById('user-avatar-large');
        
        if (this.currentUser.avatar) {
            if (userAvatarImg) userAvatarImg.src = this.currentUser.avatar;
            if (userAvatarLarge) userAvatarLarge.src = this.currentUser.avatar;
        }
    }

    /**
     * Show profile modal
     */
    showProfileModal() {
        // Implementation for profile modal
        this.toast.info('Profile modal coming soon');
    }

    /**
     * Show settings modal
     */
    showSettingsModal() {
        // Implementation for settings modal
        this.toast.info('Settings modal coming soon');
    }

    /**
     * Show help modal
     */
    showHelpModal() {
        // Implementation for help modal
        this.toast.info('Help modal coming soon');
    }

    /**
     * Close modal
     */
    closeModal() {
        this.modal.close();
    }

    /**
     * Utility function to capitalize first letter
     */
    capitalizeFirst(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    /**
     * Format time for display
     */
    formatTime(timestamp) {
        return moment(timestamp).fromNow();
    }
}

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new CAFirmApp();
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CAFirmApp;
}