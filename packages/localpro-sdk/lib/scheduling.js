// Scheduling API module for LocalPro SDK
class SchedulingAPI {
  constructor(client) {
    this.client = client;
  }

  async calculateJobRanking(jobId, data = {}) {
    return this.client.client.post(`/api/scheduling/rank-job/${jobId}`, data).then(r => r.data);
  }

  async getRankedJobs(params = {}) {
    return this.client.client.get('/api/scheduling/ranked-jobs', { params }).then(r => r.data);
  }

  async generateDailySuggestion(data = {}) {
    return this.client.client.post('/api/scheduling/suggestions/daily', data).then(r => r.data);
  }

  async generateWeeklySuggestion(data = {}) {
    return this.client.client.post('/api/scheduling/suggestions/weekly', data).then(r => r.data);
  }

  async detectIdleTimeAndSuggest(data = {}) {
    return this.client.client.post('/api/scheduling/suggestions/idle-time', data).then(r => r.data);
  }

  async getSuggestions(params = {}) {
    return this.client.client.get('/api/scheduling/suggestions', { params }).then(r => r.data);
  }

  async acceptSuggestedJob(suggestionId, jobId, data = {}) {
    return this.client.client.put(`/api/scheduling/suggestions/${suggestionId}/accept-job/${jobId}`, data).then(r => r.data);
  }

  async rejectSuggestedJob(suggestionId, jobId, data = {}) {
    return this.client.client.put(`/api/scheduling/suggestions/${suggestionId}/reject-job/${jobId}`, data).then(r => r.data);
  }

  async learnFromOutcome(data = {}) {
    return this.client.client.post('/api/scheduling/learn-outcome', data).then(r => r.data);
  }
}

module.exports = SchedulingAPI;
