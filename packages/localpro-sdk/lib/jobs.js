/**
 * Jobs API methods for LocalPro SDK
 */
class JobsAPI {
  constructor(client) {
    this.client = client;
  }

  /**
   * Get list of jobs
   * @param {Object} [filters] - Filter options
   * @param {string} [filters.category] - Filter by category
   * @param {string} [filters.location] - Filter by location
   * @param {number} [filters.page] - Page number
   * @param {number} [filters.limit] - Items per page
   * @returns {Promise<Object>} Paginated list of jobs
   */
  async list(filters = {}) {
    return await this.client.get('/api/jobs', filters);
  }

  /**
   * Search jobs
   * @param {Object} searchParams - Search parameters
   * @param {string} [searchParams.q] - Search query
   * @param {string} [searchParams.location] - Location filter
   * @param {string} [searchParams.category] - Category filter
   * @param {number} [searchParams.page] - Page number
   * @param {number} [searchParams.limit] - Items per page
   * @returns {Promise<Object>} Search results
   */
  async search(searchParams = {}) {
    return await this.client.get('/api/jobs/search', searchParams);
  }

  /**
   * Get job by ID
   * @param {string} jobId - Job ID
   * @returns {Promise<Object>} Job details
   */
  async getById(jobId) {
    if (!jobId) {
      throw new Error('Job ID is required');
    }

    return await this.client.get(`/api/jobs/${jobId}`);
  }

  /**
   * Get job categories
   * @returns {Promise<Object>} List of job categories
   */
  async getCategories() {
    return await this.client.get('/api/jobs/categories');
  }

  /**
   * Create a new job posting (Employer/Admin only)
   * @param {Object} jobData - Job data
   * @param {string} jobData.title - Job title
   * @param {string} jobData.description - Job description
   * @param {string} [jobData.category] - Job category
   * @param {Object} [jobData.location] - Job location
   * @param {string} [jobData.type] - Job type (full-time, part-time, contract, etc.)
   * @param {string} [jobData.salary] - Salary range
   * @returns {Promise<Object>} Created job
   */
  async create(jobData) {
    if (!jobData.title || !jobData.description) {
      throw new Error('Title and description are required');
    }

    return await this.client.post('/api/jobs', jobData);
  }

  /**
   * Update job posting (Employer/Admin only)
   * @param {string} jobId - Job ID
   * @param {Object} jobData - Job data to update
   * @returns {Promise<Object>} Updated job
   */
  async update(jobId, jobData) {
    if (!jobId) {
      throw new Error('Job ID is required');
    }

    return await this.client.put(`/api/jobs/${jobId}`, jobData);
  }

  /**
   * Delete job posting (Employer/Admin only)
   * @param {string} jobId - Job ID
   * @returns {Promise<Object>} Deletion result
   */
  async delete(jobId) {
    if (!jobId) {
      throw new Error('Job ID is required');
    }

    return await this.client.delete(`/api/jobs/${jobId}`);
  }

  /**
   * Get my jobs (Employer only)
   * @param {Object} [filters] - Filter options
   * @param {number} [filters.page] - Page number
   * @param {number} [filters.limit] - Items per page
   * @returns {Promise<Object>} List of my jobs
   */
  async getMyJobs(filters = {}) {
    return await this.client.get('/api/jobs/my-jobs', filters);
  }

  /**
   * Get job statistics (Employer/Admin only)
   * @param {string} jobId - Job ID
   * @returns {Promise<Object>} Job statistics
   */
  async getStats(jobId) {
    if (!jobId) {
      throw new Error('Job ID is required');
    }

    return await this.client.get(`/api/jobs/${jobId}/stats`);
  }

  /**
   * Upload company logo (Employer/Admin only)
   * @param {string} jobId - Job ID
   * @param {FormData|Object} formData - Form data with logo
   * @returns {Promise<Object>} Upload result
   */
  async uploadCompanyLogo(jobId, formData) {
    if (!jobId) {
      throw new Error('Job ID is required');
    }

    return await this.client.upload(`/api/jobs/${jobId}/logo`, formData);
  }

  // ==================== Applications ====================

  /**
   * Apply for a job
   * @param {string} jobId - Job ID
   * @param {Object} applicationData - Application data
   * @param {string} [applicationData.coverLetter] - Cover letter
   * @param {FormData|Object} [formData] - Optional form data with resume
   * @returns {Promise<Object>} Created application
   */
  async apply(jobId, applicationData, formData = null) {
    if (!jobId) {
      throw new Error('Job ID is required');
    }

    if (formData) {
      return await this.client.upload(`/api/jobs/${jobId}/apply`, formData);
    }

    return await this.client.post(`/api/jobs/${jobId}/apply`, applicationData);
  }

  /**
   * Get my applications
   * @param {Object} [filters] - Filter options
   * @param {number} [filters.page] - Page number
   * @param {number} [filters.limit] - Items per page
   * @returns {Promise<Object>} List of my applications
   */
  async getMyApplications(filters = {}) {
    return await this.client.get('/api/jobs/my-applications', filters);
  }

  /**
   * Withdraw application
   * @param {string} jobId - Job ID
   * @param {string} applicationId - Application ID
   * @returns {Promise<Object>} Withdrawal result
   */
  async withdrawApplication(jobId, applicationId) {
    if (!jobId || !applicationId) {
      throw new Error('Job ID and application ID are required');
    }

    return await this.client.delete(`/api/jobs/${jobId}/applications/${applicationId}`);
  }

  /**
   * Get job applications (Employer/Admin only)
   * @param {string} jobId - Job ID
   * @param {Object} [filters] - Filter options
   * @param {number} [filters.page] - Page number
   * @param {number} [filters.limit] - Items per page
   * @returns {Promise<Object>} List of applications
   */
  async getApplications(jobId, filters = {}) {
    if (!jobId) {
      throw new Error('Job ID is required');
    }

    return await this.client.get(`/api/jobs/${jobId}/applications`, filters);
  }

  /**
   * Update application status (Employer/Admin only)
   * @param {string} jobId - Job ID
   * @param {string} applicationId - Application ID
   * @param {Object} statusData - Status data
   * @param {string} statusData.status - New status (pending, reviewed, shortlisted, rejected, hired)
   * @param {string} [statusData.notes] - Status notes
   * @returns {Promise<Object>} Updated application
   */
  async updateApplicationStatus(jobId, applicationId, statusData) {
    if (!jobId || !applicationId) {
      throw new Error('Job ID and application ID are required');
    }

    if (!statusData.status) {
      throw new Error('Status is required');
    }

    return await this.client.put(
      `/api/jobs/${jobId}/applications/${applicationId}/status`,
      statusData
    );
  }
}

module.exports = JobsAPI;
