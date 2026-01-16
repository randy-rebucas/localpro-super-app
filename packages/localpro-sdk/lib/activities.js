// Activities API module for LocalPro SDK
// Provides methods for interacting with the Activities endpoints

class ActivitiesAPI {
  constructor(client) {
    this.client = client;
  }

  getFeed(params) {
    return this.client.get('/activities/feed', { params });
  }
  getMyActivities(params) {
    return this.client.get('/activities/my', { params });
  }
  getUserActivities(userId, params) {
    return this.client.get(`/activities/user/${userId}`, { params });
  }
  getActivity(id) {
    return this.client.get(`/activities/${id}`);
  }
  createActivity(data) {
    return this.client.post('/activities', data);
  }
  updateActivity(id, data) {
    return this.client.put(`/activities/${id}`, data);
  }
  deleteActivity(id) {
    return this.client.delete(`/activities/${id}`);
  }
  addInteraction(id, data) {
    return this.client.post(`/activities/${id}/interactions`, data);
  }
  removeInteraction(id, data) {
    return this.client.delete(`/activities/${id}/interactions`, { data });
  }
  getStatsMy(params) {
    return this.client.get('/activities/stats/my', { params });
  }
  getStatsGlobal(params) {
    return this.client.get('/activities/stats/global', { params });
  }
  getMetadata() {
    return this.client.get('/activities/metadata');
  }
  getTimeline(params) {
    return this.client.get('/activities/timeline', { params });
  }
  getTotalPoints() {
    return this.client.get('/activities/points');
  }
  getLeaderboard(params) {
    return this.client.get('/activities/leaderboard', { params });
  }
}

module.exports = ActivitiesAPI;
