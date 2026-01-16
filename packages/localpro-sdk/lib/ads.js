// Ads API module for LocalPro SDK
// Provides methods for interacting with the Ads endpoints

class AdsAPI {
  constructor(client) {
    this.client = client;
  }

  list(params) {
    return this.client.get('/ads', { params });
  }
  getById(id) {
    return this.client.get(`/ads/${id}`);
  }
  getCategories() {
    return this.client.get('/ads/categories');
  }
  getEnumValues() {
    return this.client.get('/ads/enum-values');
  }
  getFeatured() {
    return this.client.get('/ads/featured');
  }
  getStatistics() {
    return this.client.get('/ads/statistics');
  }
  create(data) {
    return this.client.post('/ads', data);
  }
  update(id, data) {
    return this.client.put(`/ads/${id}`, data);
  }
  delete(id) {
    return this.client.delete(`/ads/${id}`);
  }
  uploadImages(id, formData) {
    return this.client.post(`/ads/${id}/images`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
  }
  deleteImage(id, imageId) {
    return this.client.delete(`/ads/${id}/images/${imageId}`);
  }
  promote(id) {
    return this.client.post(`/ads/${id}/promote`);
  }
  trackClick(id) {
    return this.client.post(`/ads/${id}/click`);
  }
  getAnalytics(id) {
    return this.client.get(`/ads/${id}/analytics`);
  }
  getPending() {
    return this.client.get('/ads/pending');
  }
  approve(id) {
    return this.client.put(`/ads/${id}/approve`);
  }
  reject(id) {
    return this.client.put(`/ads/${id}/reject`);
  }
  getMyAds() {
    return this.client.get('/ads/my-ads');
  }
}

module.exports = AdsAPI;
