/**
 * @class SchedulingAPI
 * @classdesc Provider scheduling, AI-driven suggestions, calendar availability,
 * and reschedule-request management for the LocalPro platform.
 *
 * **Scheduling** — ranks jobs for a provider, generates daily/weekly schedule
 * suggestions, detects idle time, and learns from past job outcomes.
 *
 * **Availability** — manages CalendarAvailability blocks, delivers a calendar
 * view, handles time-off requests, surfaces job schedules, and orchestrates
 * reschedule requests between clients and providers.
 *
 * All endpoints require a valid auth token.  Both routers are protected by
 * `schedulingLimiter` (60 req / min).
 *
 * @example
 * const { LocalProSDK } = require('@localpro/sdk');
 * const sdk = new LocalProSDK({ baseURL: 'https://api.localpro.com', token: 'JWT' });
 *
 * // AI: rank a specific job for the authenticated provider
 * const ranking = await sdk.scheduling.calculateJobRanking('job-id');
 *
 * // AI: generate a daily schedule suggestion for today
 * const daily = await sdk.scheduling.generateDailySuggestion();
 *
 * // Calendar: create an availability block
 * await sdk.scheduling.createAvailability({
 *   startTime: '2026-03-01T09:00:00Z',
 *   endTime:   '2026-03-01T17:00:00Z',
 *   type: 'available'
 * });
 *
 * // Calendar: get week view
 * const cal = await sdk.scheduling.getCalendarView({ viewType: 'week' });
 *
 * // Reschedule: request a new time slot
 * await sdk.scheduling.createRescheduleRequest({
 *   jobSchedule: 'schedule-id',
 *   requestedStartTime: '2026-03-02T10:00:00Z',
 *   requestedEndTime:   '2026-03-02T12:00:00Z',
 *   reason: 'Equipment delay'
 * });
 */
class SchedulingAPI {
  constructor(client) {
    this.client = client;
  }

  // ─── Scheduling / AI Suggestions ──────────────────────────────────────────

  /**
   * Calculate job ranking score for the authenticated provider.
   * @param {string} jobId - MongoDB ObjectId of the job to rank
   * @param {Object} [data={}] - Additional ranking context
   * @returns {Promise<Object>} Ranking result
   * @throws {Error} If `jobId` is empty
   */
  async calculateJobRanking(jobId, data = {}) {
    if (!jobId || typeof jobId !== 'string') {
      throw new Error('calculateJobRanking: jobId must be a non-empty string');
    }
    return this.client.post(`/api/scheduling/rank-job/${jobId}`, data);
  }

  /**
   * Get top-ranked jobs for the authenticated provider.
   * @param {Object} [params={}] - Filter options
   * @param {number} [params.limit=50] - Max results
   * @param {number} [params.minScore=0] - Minimum score threshold
   * @returns {Promise<Object>} Ranked job list
   */
  async getRankedJobs(params = {}) {
    return this.client.get('/api/scheduling/ranked-jobs', params);
  }

  /**
   * Generate a daily schedule suggestion for the provider.
   * @param {Object} [data={}] - Options
   * @param {string} [data.date] - ISO date string (defaults to today)
   * @returns {Promise<Object>} Daily suggestion
   */
  async generateDailySuggestion(data = {}) {
    return this.client.post('/api/scheduling/suggestions/daily', data);
  }

  /**
   * Generate a weekly schedule suggestion for the provider.
   * @param {Object} [data={}] - Options
   * @param {string} [data.weekStartDate] - ISO date string for week start (defaults to today)
   * @returns {Promise<Object>} Weekly suggestion
   */
  async generateWeeklySuggestion(data = {}) {
    return this.client.post('/api/scheduling/suggestions/weekly', data);
  }

  /**
   * Detect idle time windows and suggest fill-in jobs.
   * @param {Object} [data={}] - Options
   * @param {string} [data.startDate] - ISO date string (defaults to now)
   * @param {string} [data.endDate] - ISO date string (defaults to +7 days)
   * @returns {Promise<Object>} Idle-time suggestions
   */
  async detectIdleTimeAndSuggest(data = {}) {
    return this.client.post('/api/scheduling/suggestions/idle-time', data);
  }

  /**
   * Get active scheduling suggestions for the authenticated provider.
   * @param {Object} [params={}] - Filter options
   * @param {string} [params.type] - Suggestion type filter
   * @returns {Promise<Object>} Suggestion list
   */
  async getSuggestions(params = {}) {
    return this.client.get('/api/scheduling/suggestions', params);
  }

  /**
   * Accept a specific job from a scheduling suggestion.
   * @param {string} suggestionId - MongoDB ObjectId of the suggestion
   * @param {string} jobId - MongoDB ObjectId of the job to accept
   * @param {Object} [data={}] - Additional data
   * @returns {Promise<Object>} Updated suggestion
   * @throws {Error} If either ID is empty
   */
  async acceptSuggestedJob(suggestionId, jobId, data = {}) {
    if (!suggestionId || typeof suggestionId !== 'string') {
      throw new Error('acceptSuggestedJob: suggestionId must be a non-empty string');
    }
    if (!jobId || typeof jobId !== 'string') {
      throw new Error('acceptSuggestedJob: jobId must be a non-empty string');
    }
    return this.client.put(`/api/scheduling/suggestions/${suggestionId}/accept-job/${jobId}`, data);
  }

  /**
   * Reject a specific job from a scheduling suggestion.
   * @param {string} suggestionId - MongoDB ObjectId of the suggestion
   * @param {string} jobId - MongoDB ObjectId of the job to reject
   * @param {Object} [data={}] - Additional data (e.g. rejection reason)
   * @returns {Promise<Object>} Updated suggestion
   * @throws {Error} If either ID is empty
   */
  async rejectSuggestedJob(suggestionId, jobId, data = {}) {
    if (!suggestionId || typeof suggestionId !== 'string') {
      throw new Error('rejectSuggestedJob: suggestionId must be a non-empty string');
    }
    if (!jobId || typeof jobId !== 'string') {
      throw new Error('rejectSuggestedJob: jobId must be a non-empty string');
    }
    return this.client.put(`/api/scheduling/suggestions/${suggestionId}/reject-job/${jobId}`, data);
  }

  /**
   * Record a job outcome to improve future scheduling suggestions.
   * @param {Object} data - Outcome data
   * @param {string} data.jobId - MongoDB ObjectId of the completed job
   * @param {string} data.outcome - Outcome value (e.g. 'completed', 'cancelled', 'rejected')
   * @returns {Promise<Object>} Learning result
   * @throws {Error} If `data.jobId` or `data.outcome` is missing
   */
  async learnFromOutcome(data = {}) {
    if (!data.jobId) {
      throw new Error('learnFromOutcome: data.jobId is required');
    }
    if (!data.outcome) {
      throw new Error('learnFromOutcome: data.outcome is required');
    }
    return this.client.post('/api/scheduling/learn-outcome', data);
  }

  // ─── Availability / Calendar ───────────────────────────────────────────────

  /**
   * Create a calendar availability block.
   * @param {Object} data - Availability data
   * @param {string} data.startTime - ISO datetime string (required)
   * @param {string} data.endTime - ISO datetime string (required)
   * @param {string} [data.title] - Label for the block
   * @param {string} [data.type='available'] - Block type: `available` | `unavailable` | `busy`
   * @param {boolean} [data.isRecurring] - Whether the block recurs
   * @param {Object} [data.recurrencePattern] - Recurrence config
   * @param {string} [data.notes] - Optional notes
   * @returns {Promise<Object>} Created availability block
   * @throws {Error} If `startTime` or `endTime` is missing
   */
  async createAvailability(data) {
    if (!data || !data.startTime || !data.endTime) {
      throw new Error('createAvailability: data.startTime and data.endTime are required');
    }
    return this.client.post('/api/availability', data);
  }

  /**
   * Get availability blocks for the authenticated provider.
   * @param {Object} [params={}] - Filter options
   * @param {string} [params.startDate] - ISO date string (defaults to now)
   * @param {string} [params.endDate] - ISO date string (defaults to +30 days)
   * @returns {Promise<Object>} Availability list
   */
  async getAvailability(params = {}) {
    return this.client.get('/api/availability', params);
  }

  /**
   * Get a day or week calendar view for the provider.
   * @param {Object} [params={}] - View options
   * @param {string} [params.viewType='week'] - `day` or `week`
   * @param {string} [params.startDate] - ISO date string
   * @param {string} [params.endDate] - ISO date string
   * @returns {Promise<Object>} Calendar view
   */
  async getCalendarView(params = {}) {
    return this.client.get('/api/availability/calendar', params);
  }

  /**
   * Update an existing availability block.
   * @param {string} id - MongoDB ObjectId of the availability block
   * @param {Object} data - Fields to update
   * @returns {Promise<Object>} Updated availability block
   * @throws {Error} If `id` is empty
   */
  async updateAvailability(id, data) {
    if (!id || typeof id !== 'string') {
      throw new Error('updateAvailability: id must be a non-empty string');
    }
    return this.client.put(`/api/availability/${id}`, data);
  }

  /**
   * Delete an availability block.
   * @param {string} id - MongoDB ObjectId of the availability block
   * @returns {Promise<Object>}
   * @throws {Error} If `id` is empty
   */
  async deleteAvailability(id) {
    if (!id || typeof id !== 'string') {
      throw new Error('deleteAvailability: id must be a non-empty string');
    }
    return this.client.delete(`/api/availability/${id}`);
  }

  /**
   * Get job schedules for the authenticated provider.
   * @param {Object} [params={}] - Filter options
   * @param {string} [params.startDate] - ISO date string
   * @param {string} [params.endDate] - ISO date string
   * @param {string} [params.status] - Schedule status filter
   * @returns {Promise<Object>} Job schedule list
   */
  async getSchedules(params = {}) {
    return this.client.get('/api/availability/schedules', params);
  }

  /**
   * Create a reschedule request for a job schedule.
   * @param {Object} data - Request data
   * @param {string} data.jobSchedule - MongoDB ObjectId of the job schedule
   * @param {string} data.requestedStartTime - ISO datetime string
   * @param {string} data.requestedEndTime - ISO datetime string
   * @param {string} data.reason - Reason for the reschedule request
   * @returns {Promise<Object>} Created reschedule request
   * @throws {Error} If any required field is missing
   */
  async createRescheduleRequest(data) {
    if (!data || !data.jobSchedule || !data.requestedStartTime || !data.requestedEndTime || !data.reason) {
      throw new Error('createRescheduleRequest: jobSchedule, requestedStartTime, requestedEndTime, and reason are required');
    }
    return this.client.post('/api/availability/reschedule', data);
  }

  /**
   * Get reschedule requests for the authenticated user (as requester or provider).
   * @param {Object} [params={}] - Filter options
   * @param {string} [params.status] - Status filter (pending, approved, rejected)
   * @returns {Promise<Object>} Reschedule request list
   */
  async getRescheduleRequests(params = {}) {
    return this.client.get('/api/availability/reschedule', params);
  }

  /**
   * Approve a reschedule request (provider only).
   * @param {string} id - MongoDB ObjectId of the reschedule request
   * @returns {Promise<Object>} Approved reschedule request
   * @throws {Error} If `id` is empty
   */
  async approveRescheduleRequest(id) {
    if (!id || typeof id !== 'string') {
      throw new Error('approveRescheduleRequest: id must be a non-empty string');
    }
    return this.client.put(`/api/availability/reschedule/${id}/approve`, {});
  }

  /**
   * Reject a reschedule request.
   * @param {string} id - MongoDB ObjectId of the reschedule request
   * @param {Object} [data={}] - Options
   * @param {string} [data.rejectionReason] - Reason for rejecting
   * @returns {Promise<Object>} Rejected reschedule request
   * @throws {Error} If `id` is empty
   */
  async rejectRescheduleRequest(id, data = {}) {
    if (!id || typeof id !== 'string') {
      throw new Error('rejectRescheduleRequest: id must be a non-empty string');
    }
    return this.client.put(`/api/availability/reschedule/${id}/reject`, data);
  }

  /**
   * Add a time-off block to the provider's calendar.
   * @param {Object} data - Time-off data
   * @param {string} data.startDate - ISO datetime string (required)
   * @param {string} data.endDate - ISO datetime string (required)
   * @param {string} [data.reason] - Reason for time off
   * @param {string} [data.notes] - Additional notes
   * @returns {Promise<Object>} Created time-off block
   * @throws {Error} If `startDate` or `endDate` is missing
   */
  async addTimeOff(data) {
    if (!data || !data.startDate || !data.endDate) {
      throw new Error('addTimeOff: data.startDate and data.endDate are required');
    }
    return this.client.post('/api/availability/time-off', data);
  }
}

module.exports = SchedulingAPI;

