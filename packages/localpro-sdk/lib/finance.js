/**
 * Finance API methods for LocalPro SDK
 */
class FinanceAPI {
  constructor(client) {
    this.client = client;
  }

  /**
   * Get financial overview
   * @returns {Promise<Object>} Financial overview data
   */
  async getOverview() {
    return await this.client.get('/api/finance/overview');
  }

  /**
   * Get financial transactions
   * @param {Object} [filters] - Filter options
   * @param {string} [filters.type] - Transaction type (income, expense, withdrawal, deposit)
   * @param {string} [filters.startDate] - Start date (ISO string)
   * @param {string} [filters.endDate] - End date (ISO string)
   * @param {number} [filters.page] - Page number
   * @param {number} [filters.limit] - Items per page
   * @returns {Promise<Object>} List of transactions
   */
  async getTransactions(filters = {}) {
    return await this.client.get('/api/finance/transactions', filters);
  }

  /**
   * Get user earnings
   * @param {Object} [filters] - Filter options
   * @param {string} [filters.startDate] - Start date (ISO string)
   * @param {string} [filters.endDate] - End date (ISO string)
   * @param {number} [filters.page] - Page number
   * @param {number} [filters.limit] - Items per page
   * @returns {Promise<Object>} Earnings data
   */
  async getEarnings(filters = {}) {
    return await this.client.get('/api/finance/earnings', filters);
  }

  /**
   * Get user expenses
   * @param {Object} [filters] - Filter options
   * @param {string} [filters.startDate] - Start date (ISO string)
   * @param {string} [filters.endDate] - End date (ISO string)
   * @param {number} [filters.page] - Page number
   * @param {number} [filters.limit] - Items per page
   * @returns {Promise<Object>} Expenses data
   */
  async getExpenses(filters = {}) {
    return await this.client.get('/api/finance/expenses', filters);
  }

  /**
   * Add expense
   * @param {Object} expenseData - Expense data
   * @param {number} expenseData.amount - Expense amount
   * @param {string} expenseData.category - Expense category
   * @param {string} [expenseData.description] - Expense description
   * @param {string} [expenseData.date] - Expense date (ISO string)
   * @returns {Promise<Object>} Created expense
   */
  async addExpense(expenseData) {
    if (!expenseData.amount || !expenseData.category) {
      throw new Error('Amount and category are required');
    }

    return await this.client.post('/api/finance/expenses', expenseData);
  }

  /**
   * Request withdrawal
   * @param {Object} withdrawalData - Withdrawal data
   * @param {number} withdrawalData.amount - Withdrawal amount
   * @param {string} withdrawalData.method - Withdrawal method
   * @param {Object} [withdrawalData.accountDetails] - Account details
   * @returns {Promise<Object>} Withdrawal request result
   */
  async requestWithdrawal(withdrawalData) {
    if (!withdrawalData.amount || !withdrawalData.method) {
      throw new Error('Amount and method are required');
    }

    return await this.client.post('/api/finance/withdraw', withdrawalData);
  }

  /**
   * Process withdrawal (Admin only)
   * @param {string} withdrawalId - Withdrawal ID
   * @param {Object} processData - Process data
   * @param {string} processData.status - Status (approved, rejected)
   * @param {string} [processData.notes] - Admin notes
   * @returns {Promise<Object>} Process result
   */
  async processWithdrawal(withdrawalId, processData) {
    if (!withdrawalId) {
      throw new Error('Withdrawal ID is required');
    }

    if (!processData.status) {
      throw new Error('Status is required');
    }

    return await this.client.put(`/api/finance/withdrawals/${withdrawalId}/process`, processData);
  }

  /**
   * Request top-up (wallet deposit)
   * @param {Object} topUpData - Top-up data
   * @param {number} topUpData.amount - Top-up amount
   * @param {string} topUpData.method - Payment method
   * @param {FormData|Object} [formData] - Optional form data with receipt
   * @returns {Promise<Object>} Top-up request result
   */
  async requestTopUp(topUpData, formData = null) {
    if (!topUpData.amount || !topUpData.method) {
      throw new Error('Amount and method are required');
    }

    if (formData) {
      return await this.client.upload('/api/finance/top-up', formData);
    }

    return await this.client.post('/api/finance/top-up', topUpData);
  }

  /**
   * Get my top-up requests
   * @param {Object} [filters] - Filter options
   * @param {string} [filters.status] - Filter by status
   * @param {number} [filters.page] - Page number
   * @param {number} [filters.limit] - Items per page
   * @returns {Promise<Object>} List of top-up requests
   */
  async getMyTopUpRequests(filters = {}) {
    return await this.client.get('/api/finance/top-ups/my-requests', filters);
  }

  /**
   * Process top-up (Admin only)
   * @param {string} topUpId - Top-up ID
   * @param {Object} processData - Process data
   * @param {string} processData.status - Status (approved, rejected)
   * @param {string} [processData.notes] - Admin notes
   * @returns {Promise<Object>} Process result
   */
  async processTopUp(topUpId, processData) {
    if (!topUpId) {
      throw new Error('Top-up ID is required');
    }

    if (!processData.status) {
      throw new Error('Status is required');
    }

    return await this.client.put(`/api/finance/top-ups/${topUpId}/process`, processData);
  }

  /**
   * Get tax documents
   * @param {Object} [filters] - Filter options
   * @param {string} [filters.year] - Tax year
   * @param {number} [filters.page] - Page number
   * @param {number} [filters.limit] - Items per page
   * @returns {Promise<Object>} Tax documents
   */
  async getTaxDocuments(filters = {}) {
    return await this.client.get('/api/finance/tax-documents', filters);
  }

  /**
   * Get financial reports
   * @param {Object} [filters] - Filter options
   * @param {string} [filters.startDate] - Start date (ISO string)
   * @param {string} [filters.endDate] - End date (ISO string)
   * @param {string} [filters.reportType] - Report type
   * @returns {Promise<Object>} Financial reports
   */
  async getReports(filters = {}) {
    return await this.client.get('/api/finance/reports', filters);
  }

  /**
   * Update wallet settings
   * @param {Object} settingsData - Wallet settings
   * @param {Object} [settingsData.preferences] - Wallet preferences
   * @param {Object} [settingsData.notifications] - Notification settings
   * @returns {Promise<Object>} Updated settings
   */
  async updateWalletSettings(settingsData) {
    return await this.client.put('/api/finance/wallet/settings', settingsData);
  }
}

module.exports = FinanceAPI;
