/**
 * AMC10 Math Mastery System - Main Application
 * Handles initialization and global navigation
 */

const App = {
    /**
     * Initialize the application
     */
    init() {
        // Check for existing session
        if (Auth.isLoggedIn()) {
            this.showMainApp();
        } else {
            this.showLoginScreen();
        }

        this.bindEvents();
        this.initKaTeX();
    },

    /**
     * Bind global event listeners
     */
    bindEvents() {
        // Login form
        document.getElementById('login-form')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });

        // Logout button
        document.getElementById('btn-logout')?.addEventListener('click', () => this.handleLogout());

        // Navigation tabs
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                const tabId = tab.dataset.tab;
                this.switchTab(tabId);
            });
        });

        // Modal triggers
        document.getElementById('btn-notes')?.addEventListener('click', () => this.openModal('notes-modal'));
        document.getElementById('btn-report')?.addEventListener('click', () => this.openModal('report-modal'));
        document.getElementById('btn-badges')?.addEventListener('click', () => this.openModal('badges-modal'));

        // Modal close buttons
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', () => {
                const modalId = btn.dataset.modal;
                this.closeModal(modalId);
            });
        });

        // Close modal on backdrop click
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.remove('active');
                }
            });
        });

        // Review filter buttons
        document.querySelectorAll('.review-filters .filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.review-filters .filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                Analysis.renderReviewList(btn.dataset.filter);
            });
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Escape to close modals
            if (e.key === 'Escape') {
                document.querySelectorAll('.modal.active').forEach(modal => {
                    modal.classList.remove('active');
                });
            }
        });
    },

    /**
     * Initialize KaTeX auto-render
     */
    initKaTeX() {
        // Wait for KaTeX to load
        const checkKaTeX = setInterval(() => {
            if (typeof renderMathInElement === 'function') {
                clearInterval(checkKaTeX);
                this.renderAllMath();
            }
        }, 100);
    },

    /**
     * Render all math on page
     */
    renderAllMath() {
        if (typeof renderMathInElement === 'function') {
            renderMathInElement(document.body, {
                delimiters: [
                    { left: '$$', right: '$$', display: true },
                    { left: '$', right: '$', display: false },
                    { left: '\\[', right: '\\]', display: true },
                    { left: '\\(', right: '\\)', display: false }
                ],
                throwOnError: false
            });
        }
    },

    /**
     * Handle login
     */
    handleLogin() {
        const studentId = document.getElementById('student-id')?.value;
        const accessCode = document.getElementById('access-code')?.value;

        const result = Auth.validate(studentId, accessCode);

        if (result.success) {
            Auth.saveSession({
                studentId: result.studentId,
                studentName: result.studentName
            });
            this.showMainApp();
        } else {
            alert(result.message);
        }
    },

    /**
     * Handle logout
     */
    handleLogout() {
        if (confirm('确定要退出吗？Are you sure you want to logout?')) {
            Auth.clearSession();
            this.showLoginScreen();
        }
    },

    /**
     * Show login screen
     */
    showLoginScreen() {
        document.getElementById('login-screen')?.classList.add('active');
        document.getElementById('main-app')?.classList.remove('active');

        // Clear form
        document.getElementById('student-id').value = '';
        document.getElementById('access-code').value = '';
    },

    /**
     * Show main application
     */
    showMainApp() {
        document.getElementById('login-screen')?.classList.remove('active');
        document.getElementById('main-app')?.classList.add('active');

        // Display student name
        const nameEl = document.getElementById('display-student-name');
        if (nameEl) {
            nameEl.textContent = Auth.getStudentName();
        }

        // Initialize components
        this.initializeComponents();

        // Show default tab
        this.switchTab('practice');
    },

    /**
     * Initialize all components
     */
    initializeComponents() {
        // Update stats
        Practice.updateStatsDisplay();

        // Check for new badges
        Badges.checkAllBadges();
    },

    /**
     * Switch to a tab
     */
    switchTab(tabId) {
        // Update navigation
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabId);
        });

        // Update content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.toggle('active', content.id === `tab-${tabId}`);
        });

        // Tab-specific initialization
        switch (tabId) {
            case 'practice':
                // Reset practice area if not in session
                if (!Practice.state.questions.length) {
                    document.getElementById('practice-area')?.classList.add('hidden');
                    document.querySelector('.filter-panel')?.classList.remove('hidden');
                }
                break;

            case 'review':
                Analysis.renderReviewList('all');
                break;

            case 'weakness':
                Analysis.renderWeaknessDashboard();
                break;

            case 'history':
                Practice.updateStatsDisplay();
                Analysis.renderHistoryList();
                Analysis.renderHistoryChart();
                break;
        }

        // Re-render math
        setTimeout(() => this.renderAllMath(), 100);
    },

    /**
     * Open a modal
     */
    openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (!modal) return;

        modal.classList.add('active');

        // Modal-specific initialization
        switch (modalId) {
            case 'notes-modal':
                Notes.renderNotesList();
                break;

            case 'report-modal':
                Report.renderReport();
                break;

            case 'badges-modal':
                Badges.renderBadgesGrid();
                break;
        }

        // Re-render math
        setTimeout(() => this.renderAllMath(), 100);
    },

    /**
     * Close a modal
     */
    closeModal(modalId) {
        document.getElementById(modalId)?.classList.remove('active');
    },

    /**
     * Show toast notification
     */
    showToast(message, type = 'info') {
        // Simple alert for now
        // In production, would use a proper toast component
        console.log(`[${type}] ${message}`);
    },

    /**
     * Format date for display
     */
    formatDate(dateStr) {
        const date = new Date(dateStr);
        return date.toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    },

    /**
     * Get URL parameters
     */
    getUrlParams() {
        const params = new URLSearchParams(window.location.search);
        return Object.fromEntries(params.entries());
    }
};

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});

// Handle page visibility changes (pause timer when hidden)
document.addEventListener('visibilitychange', () => {
    if (document.hidden && Practice.state.timerInterval) {
        // Page is hidden, could pause timer for timed mode
        console.log('Page hidden');
    }
});

// Prevent accidental navigation during practice
window.addEventListener('beforeunload', (e) => {
    if (Practice.state.questions.length > 0 && Practice.state.results.length > 0) {
        e.preventDefault();
        e.returnValue = '练习进行中，确定要离开吗？Practice in progress, are you sure you want to leave?';
    }
});

// Global error handler
window.addEventListener('error', (e) => {
    console.error('Application error:', e.error);
});

// Export for debugging
window.App = App;
window.Practice = Practice;
window.Analysis = Analysis;
window.Notes = Notes;
window.Badges = Badges;
window.Report = Report;
window.Auth = Auth;
