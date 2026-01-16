// Analytics API module for LocalPro SDK

class AnalyticsAPI {
  constructor(client) {
    this.client = client;
  }

  async getMetadata(params = {}) {
    return this.client.client.get('/api/analytics/metadata', { params }).then(r => r.data);
  }

  async getDashboard(params = {}) {
    return this.client.client.get('/api/analytics/dashboard', { params }).then(r => r.data);
  }

  async getRealTime(params = {}) {
    return this.client.client.get('/api/analytics/realtime', { params }).then(r => r.data);
  }

  async getTimeSeries(params = {}) {
    return this.client.client.get('/api/analytics/time-series', { params }).then(r => r.data);
  }

  async getComparison(params = {}) {
    return this.client.client.get('/api/analytics/comparison', { params }).then(r => r.data);
  }

  async export(params = {}) {
    return this.client.client.get('/api/analytics/export', { params }).then(r => r.data);
  }

  async getOverview(params = {}) {
    return this.client.client.get('/api/analytics/overview', { params }).then(r => r.data);
  }

  async getCurrentUserAnalytics(params = {}) {
    return this.client.client.get('/api/analytics/user', { params }).then(r => r.data);
  }

  async getAllUserAnalytics(params = {}) {
    return this.client.client.get('/api/analytics/users', { params }).then(r => r.data);
  }

  async getFinancial(params = {}) {
    return this.client.client.get('/api/analytics/financial', { params }).then(r => r.data);
  }

  async getMarketplace(params = {}) {
    return this.client.client.get('/api/analytics/marketplace', { params }).then(r => r.data);
  }

  async getJobs(params = {}) {
    return this.client.client.get('/api/analytics/jobs', { params }).then(r => r.data);
  }

  async getReferrals(params = {}) {
    return this.client.client.get('/api/analytics/referrals', { params }).then(r => r.data);
  }

  async getAgencies(params = {}) {
    return this.client.client.get('/api/analytics/agencies', { params }).then(r => r.data);
  }

  async getProvider(params = {}) {
    return this.client.client.get('/api/analytics/provider', { params }).then(r => r.data);
  }

  async getProviderById(providerId, params = {}) {
    return this.client.client.get(`/api/analytics/provider/${providerId}`, { params }).then(r => r.data);
  }

  async getCustom(params = {}) {
    return this.client.client.get('/api/analytics/custom', { params }).then(r => r.data);
  }

  async trackEvent(data) {
    return this.client.client.post('/api/analytics/track', data).then(r => r.data);
  }
}

module.exports = AnalyticsAPI;
