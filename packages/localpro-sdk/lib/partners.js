// Partners API module for LocalPro SDK
// Provides methods for interacting with the Partners endpoints

class PartnersAPI {
  constructor(client) {
    this.client = client;
  }

  list(params) {
    return this.client.get('/partners', { params });
  }
  getById(id) {
    return this.client.get(`/partners/${id}`);
  }
  create(data) {
    return this.client.post('/partners', data);
  }
  update(id, data) {
    return this.client.put(`/partners/${id}`, data);
  }
  delete(id) {
    return this.client.delete(`/partners/${id}`);
  }
  getAnalytics(id) {
    return this.client.get(`/partners/${id}/analytics`);
  }
}

module.exports = PartnersAPI;
