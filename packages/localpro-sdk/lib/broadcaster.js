// Broadcaster API module for LocalPro SDK
class BroadcasterAPI {
  constructor(client) {
    this.client = client;
  }

  async getActive(params = {}) {
    return this.client.client.get('/api/broadcaster/active', { params }).then(r => r.data);
  }

  async getStats(params = {}) {
    return this.client.client.get('/api/broadcaster/stats', { params }).then(r => r.data);
  }

  async trackView(id, data = {}) {
    return this.client.client.post(`/api/broadcaster/${id}/view`, data).then(r => r.data);
  }

  async trackClick(id, data = {}) {
    return this.client.client.post(`/api/broadcaster/${id}/click`, data).then(r => r.data);
  }

  async getById(id) {
    return this.client.client.get(`/api/broadcaster/${id}`).then(r => r.data);
  }

  async create(data) {
    return this.client.client.post('/api/broadcaster', data).then(r => r.data);
  }

  async update(id, data) {
    return this.client.client.put(`/api/broadcaster/${id}`, data).then(r => r.data);
  }

  async delete(id) {
    return this.client.client.delete(`/api/broadcaster/${id}`).then(r => r.data);
  }

  async list(params = {}) {
    return this.client.client.get('/api/broadcaster', { params }).then(r => r.data);
  }
}

module.exports = BroadcasterAPI;
