// Dashboard functionality
class Dashboard {
    constructor() {
        this.API_URL = 'http://localhost:3000/api';
        this.token = localStorage.getItem('token');
        this.user = JSON.parse(localStorage.getItem('user') || '{}');
    }

    async init() {
        // Check authentication
        if (!this.token) {
            window.location.href = '../../../public/index.html';
            return;
        }

        // Set user name
        const userNameElement = document.getElementById('userName');
        if (userNameElement && this.user.name) {
            userNameElement.textContent = this.user.name;
        }

        // Load dashboard data
        await this.loadDashboardData();
        
        // Set up logout
        this.setupLogout();
        
        // Refresh data every 30 seconds
        setInterval(() => this.loadDashboardData(), 30000);
    }

    async loadDashboardData() {
        try {
            const response = await fetch(`${this.API_URL}/reports/dashboard`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.status === 401) {
                this.handleUnauthorized();
                return;
            }

            const data = await response.json();
            this.updateStats(data);
        } catch (error) {
            console.error('Error loading dashboard:', error);
        }
    }

    updateStats(data) {
        // Update stat cards
        this.setElementText('totalMembers', data.totalMembers || 0);
        this.setElementText('totalTrainers', data.totalTrainers || 0);
        this.setElementText('todayAttendance', data.todayAttendance || 0);
        this.setElementText('monthlyRevenue', `$${(data.monthlyRevenue || 0).toLocaleString()}`);
        this.setElementText('activeSessions', data.activeSessions || 0);
        this.setElementText('expiringMemberships', data.expiringMemberships || 0);
    }

    setElementText(id, value) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        }
    }

    setupLogout() {
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.logout();
            });
        }
    }

    logout() {
        localStorage.clear();
        window.location.href = '../../../public/index.html';
    }

    handleUnauthorized() {
        this.logout();
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const dashboard = new Dashboard();
    dashboard.init();
});