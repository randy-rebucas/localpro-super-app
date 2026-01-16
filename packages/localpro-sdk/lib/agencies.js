// Agencies API module for LocalPro SDK
// Provides methods for interacting with the Agencies endpoints

class AgenciesAPI {
  constructor(client) {
    this.client = client;
  }

  list(params) {
    return this.client.get('/agencies', { params });
  }
  getById(id) {
    return this.client.get(`/agencies/${id}`);
  }
  create(data) {
    return this.client.post('/agencies', data);
  }
  update(id, data) {
    return this.client.put(`/agencies/${id}`, data);
  }
  patch(id, data) {
    return this.client.patch(`/agencies/${id}`, data);
  }
  delete(id) {
    return this.client.delete(`/agencies/${id}`);
  }
  uploadLogo(id, formData) {
    return this.client.post(`/agencies/${id}/logo`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
  }
  addProvider(id, data) {
    return this.client.post(`/agencies/${id}/providers`, data);
  }
  removeProvider(id, providerId) {
    return this.client.delete(`/agencies/${id}/providers/${providerId}`);
  }
  updateProviderStatus(id, providerId, data) {
    return this.client.put(`/agencies/${id}/providers/${providerId}/status`, data);
  }
  addAdmin(id, data) {
    return this.client.post(`/agencies/${id}/admins`, data);
  }
  removeAdmin(id, adminId) {
    return this.client.delete(`/agencies/${id}/admins/${adminId}`);
  }
  getAnalytics(id) {
    return this.client.get(`/agencies/${id}/analytics`);
  }
  getMyAgencies() {
    return this.client.get('/agencies/my/agencies');
  }
  joinAgency(data) {
    return this.client.post('/agencies/join', data);
  }
  leaveAgency(data) {
    return this.client.post('/agencies/leave', data);
  }
}

module.exports = AgenciesAPI;
