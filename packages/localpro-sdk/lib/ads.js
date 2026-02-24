// Ads API module for LocalPro SDK
// Provides methods for interacting with the Ads endpoints

class AdsAPI {
  constructor(client) {
    this.client = client;
  }

  list(params) {
    return this.client.get('/api/ads', { params });
  }
  getById(id) {
    return this.client.get(`/api/ads/${id}`);
  }
  getCategories() {
    return this.client.get('/api/ads/categories');
  }
  getEnumValues() {
    return this.client.get('/api/ads/enum-values');
  }
  getFeatured() {
    return this.client.get('/api/ads/featured');
  }
  getStatistics() {
    return this.client.get('/api/ads/statistics');
  }
  create(data) {
    return this.client.post('/api/ads', data);
  }
  update(id, data) {
    return this.client.put(`/api/ads/${id}`, data);
  }
  delete(id) {
    return this.client.delete(`/api/ads/${id}`);
  }
  uploadImages(id, formData) {
    return this.client.post(`/api/ads/${id}/images`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
  }
  deleteImage(id, imageId) {
    return this.client.delete(`/api/ads/${id}/images/${imageId}`);
  }
  promote(id) {
    return this.client.post(`/api/ads/${id}/promote`);
  }
  trackClick(id) {
    return this.client.post(`/api/ads/${id}/click`);
  }
  getAnalytics(id) {
    return this.client.get(`/api/ads/${id}/analytics`);
  }
  getPending() {
    return this.client.get('/api/ads/pending');
  }
  approve(id) {
    return this.client.put(`/api/ads/${id}/approve`);
  }
  reject(id) {
    return this.client.put(`/api/ads/${id}/reject`);
  }
  getMyAds() {
    return this.client.get('/api/ads/my-ads');
  }
}

module.exports = AdsAPI;
