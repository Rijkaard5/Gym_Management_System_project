// API Configuration
const API_URL = 'http://localhost:3000/api';

// Common API functions
class API {
    static async request(endpoint, options = {}) {
        const token = localStorage.getItem('token');
        
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
                ...(token && { 'Authorization': `Bearer ${token}` })
            }
        };

        const response = await fetch(`${API_URL}${endpoint}`, {
            ...defaultOptions,
            ...options,
            headers: {
                ...defaultOptions.headers,
                ...options.headers
            }
        });

        if (response.status === 401) {
            localStorage.clear();
            window.location.href = '/index.html';
            throw new Error('Unauthorized');
        }

        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Request failed');
        }

        return data;
    }

    // Auth
    static async login(email, password) {
        return this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
    }

    static async register(userData) {
        return this.request('/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
    }

    // Members
    static async getMembers(filters = {}) {
        const query = new URLSearchParams(filters).toString();
        return this.request(`/members?${query}`);
    }

    static async createMember(memberData) {
        return this.request('/members', {
            method: 'POST',
            body: JSON.stringify(memberData)
        });
    }

    static async updateMember(id, updates) {
        return this.request(`/members/${id}`, {
            method: 'PUT',
            body: JSON.stringify(updates)
        });
    }

    static async deleteMember(id) {
        return this.request(`/members/${id}`, {
            method: 'DELETE'
        });
    }

    // Trainers
    static async getTrainers() {
        return this.request('/trainers');
    }

    static async createTrainer(trainerData) {
        return this.request('/trainers', {
            method: 'POST',
            body: JSON.stringify(trainerData)
        });
    }

    // Workout Plans
    static async createWorkoutPlan(planData) {
        return this.request('/plans', {
            method: 'POST',
            body: JSON.stringify(planData)
        });
    }

    static async getMemberPlans(memberId) {
        return this.request(`/plans/member/${memberId}`);
    }

    // Sessions
    static async createSession(sessionData) {
        return this.request('/sessions', {
            method: 'POST',
            body: JSON.stringify(sessionData)
        });
    }

    static async getUpcomingSessions() {
        return this.request('/sessions/upcoming');
    }

    // Attendance
    static async checkIn(memberId, method = 'manual') {
        return this.request('/attendance/check-in', {
            method: 'POST',
            body: JSON.stringify({ memberId, method })
        });
    }

    static async checkOut(memberId) {
        return this.request('/attendance/check-out', {
            method: 'POST',
            body: JSON.stringify({ memberId })
        });
    }

    // Payments
    static async createPayment(paymentData) {
        return this.request('/payments', {
            method: 'POST',
            body: JSON.stringify(paymentData)
        });
    }

    static async getMemberPayments(memberId) {
        return this.request(`/payments/member/${memberId}`);
    }

    // Equipment
    static async getEquipment(filters = {}) {
        const query = new URLSearchParams(filters).toString();
        return this.request(`/equipment?${query}`);
    }

    static async createEquipment(equipmentData) {
        return this.request('/equipment', {
            method: 'POST',
            body: JSON.stringify(equipmentData)
        });
    }

    // Reports
    static async getDashboardStats() {
        return this.request('/reports/dashboard');
    }

    static async getRevenueReport(startDate, endDate) {
        return this.request(`/payments/revenue?startDate=${startDate}&endDate=${endDate}`);
    }

    // Notifications
    static async getNotifications() {
        return this.request('/notifications');
    }

    static async markNotificationRead(id) {
        return this.request(`/notifications/${id}/read`, {
            method: 'PUT'
        });
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = API;
}