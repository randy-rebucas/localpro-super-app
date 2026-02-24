// Activities API module for LocalPro SDK
// Provides methods for interacting with the Activities endpoints

class ActivitiesAPI {
  constructor(client) {
    this.client = client;
  }

  getFeed(params) {
    return this.client.get('/api/activities/feed', { params });
  }
  getMyActivities(params) {
    return this.client.get('/api/activities/my', { params });
  }
  getUserActivities(userId, params) {
    return this.client.get(`/api/activities/user/${userId}`, { params });
  }
  getActivity(id) {
    return this.client.get(`/api/activities/${id}`);
  }
  createActivity(data) {
    return this.client.post('/api/activities', data);
  }
  updateActivity(id, data) {
    return this.client.put(`/api/activities/${id}`, data);
  }
  deleteActivity(id) {
    return this.client.delete(`/api/activities/${id}`);
  }
  addInteraction(id, data) {
    return this.client.post(`/api/activities/${id}/interactions`, data);
  }
  removeInteraction(id, data) {
    return this.client.delete(`/api/activities/${id}/interactions`, { data });
  }
  getStatsMy(params) {
    return this.client.get('/api/activities/stats/my', { params });
  }
  getStatsGlobal(params) {
    return this.client.get('/api/activities/stats/global', { params });
  }
  getMetadata() {
    return this.client.get('/api/activities/metadata');
  }
  getTimeline(params) {
    return this.client.get('/api/activities/timeline', { params });
  }
  getTotalPoints() {
    return this.client.get('/api/activities/points');
  }
  getLeaderboard(params) {
    return this.client.get('/api/activities/leaderboard', { params });
  }
}

module.exports = ActivitiesAPI;
