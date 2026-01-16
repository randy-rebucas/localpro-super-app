// Trust Verification API module for LocalPro SDK
class TrustVerificationAPI {
  constructor(client) {
    this.client = client;
  }

  async getVerifiedUsers(params = {}) {
    return this.client.client.get('/api/trust-verification/verified-users', { params }).then(r => r.data);
  }

  async getRequests(params = {}) {
    return this.client.client.get('/api/trust-verification/requests', { params }).then(r => r.data);
  }

  async getRequestById(id) {
    return this.client.client.get(`/api/trust-verification/requests/${id}`).then(r => r.data);
  }

  async createVerificationRequest(data) {
    return this.client.client.post('/api/trust-verification/requests', data).then(r => r.data);
  }

  async updateVerificationRequest(id, data) {
    return this.client.client.put(`/api/trust-verification/requests/${id}`, data).then(r => r.data);
  }

  async deleteVerificationRequest(id) {
    return this.client.client.delete(`/api/trust-verification/requests/${id}`).then(r => r.data);
  }

  async uploadDocuments(id, formData) {
    return this.client.client.post(`/api/trust-verification/requests/${id}/documents`, formData).then(r => r.data);
  }

  async deleteDocument(id, documentId) {
    return this.client.client.delete(`/api/trust-verification/requests/${id}/documents/${documentId}`).then(r => r.data);
  }

  async getMyRequests(params = {}) {
    return this.client.client.get('/api/trust-verification/my-requests', { params }).then(r => r.data);
  }

  async reviewRequest(id, data) {
    return this.client.client.put(`/api/trust-verification/requests/${id}/review`, data).then(r => r.data);
  }

  async getStatistics(params = {}) {
    return this.client.client.get('/api/trust-verification/statistics', { params }).then(r => r.data);
  }
}

module.exports = TrustVerificationAPI;
