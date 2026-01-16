// User Management API module for LocalPro SDK
class UserManagementAPI {
  constructor(client) {
    this.client = client;
  }

  async list(params = {}) {
    return this.client.client.get('/api/users', { params }).then(r => r.data);
  }

  async getStats() {
    return this.client.client.get('/api/users/stats').then(r => r.data);
  }

  async getById(id) {
    return this.client.client.get(`/api/users/${id}`).then(r => r.data);
  }

  async create(data) {
    return this.client.client.post('/api/users', data).then(r => r.data);
  }

  async update(id, data) {
    return this.client.client.put(`/api/users/${id}`, data).then(r => r.data);
  }

  async updateStatus(id, data) {
    return this.client.client.patch(`/api/users/${id}/status`, data).then(r => r.data);
  }

  async updateVerification(id, data) {
    return this.client.client.patch(`/api/users/${id}/verification`, data).then(r => r.data);
  }

  async addBadge(id, data) {
    return this.client.client.post(`/api/users/${id}/badges`, data).then(r => r.data);
  }

  async bulkUpdate(data) {
    return this.client.client.patch('/api/users/bulk', data).then(r => r.data);
  }

  async restore(id) {
    return this.client.client.patch(`/api/users/${id}/restore`).then(r => r.data);
  }

  async delete(id) {
    return this.client.client.delete(`/api/users/${id}`).then(r => r.data);
  }

  async ban(id, data) {
    return this.client.client.post(`/api/users/${id}/ban`, data).then(r => r.data);
  }

  async getRoles(id) {
    return this.client.client.get(`/api/users/${id}/roles`).then(r => r.data);
  }

  async updateRoles(id, data) {
    return this.client.client.put(`/api/users/${id}/roles`, data).then(r => r.data);
  }

  async getBadges(id) {
    return this.client.client.get(`/api/users/${id}/badges`).then(r => r.data);
  }

  async deleteBadge(id, badgeId) {
    return this.client.client.delete(`/api/users/${id}/badges/${badgeId}`).then(r => r.data);
  }

  async resetPassword(id, data) {
    return this.client.client.post(`/api/users/${id}/reset-password`, data).then(r => r.data);
  }

  async sendEmail(id, data) {
    return this.client.client.post(`/api/users/${id}/send-email`, data).then(r => r.data);
  }

  async exportData(id) {
    return this.client.client.get(`/api/users/${id}/export`).then(r => r.data);
  }
}

module.exports = UserManagementAPI;
