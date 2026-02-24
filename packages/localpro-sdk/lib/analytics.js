// Analytics API module for LocalPro SDK

class AnalyticsAPI {
  constructor(client) {
    this.client = client;
  }

  async getMetadata(params = {}) {
    return this.client.get('/api/analytics/metadata', params);
  }

  async getDashboard(params = {}) {
    return this.client.get('/api/analytics/dashboard', params);
  }

  async getRealTime(params = {}) {
    return this.client.get('/api/analytics/realtime', params);
  }

  async getTimeSeries(params = {}) {
    return this.client.get('/api/analytics/time-series', params);
  }

  async getComparison(params = {}) {
    return this.client.get('/api/analytics/comparison', params);
  }

  async export(params = {}) {
    return this.client.get('/api/analytics/export', params);
  }

  async getOverview(params = {}) {
    return this.client.get('/api/analytics/overview', params);
  }

  async getCurrentUserAnalytics(params = {}) {
    return this.client.get('/api/analytics/user', params);
  }

  async getAllUserAnalytics(params = {}) {
    return this.client.get('/api/analytics/users', params);
  }

  async getFinancial(params = {}) {
    return this.client.get('/api/analytics/financial', params);
  }

  async getMarketplace(params = {}) {
    return this.client.get('/api/analytics/marketplace', params);
  }

  async getJobs(params = {}) {
    return this.client.get('/api/analytics/jobs', params);
  }

  async getReferrals(params = {}) {
    return this.client.get('/api/analytics/referrals', params);
  }

  async getAgencies(params = {}) {
    return this.client.get('/api/analytics/agencies', params);
  }

  async getProvider(params = {}) {
    return this.client.get('/api/analytics/provider', params);
  }

  async getProviderById(providerId, params = {}) {
    if (!providerId) throw new Error('providerId is required');
    return this.client.get(`/api/analytics/provider/${providerId}`, params);
  }

  async getCustom(params = {}) {
    return this.client.get('/api/analytics/custom', params);
  }

  async trackEvent(data) {
    if (!data) throw new Error('data is required');
    return this.client.post('/api/analytics/track', data);
  }
}

module.exports = AnalyticsAPI;
