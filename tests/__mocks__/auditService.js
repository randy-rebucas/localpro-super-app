module.exports = {
	logAuditEvent: jest.fn().mockResolvedValue({}),
	logAuthEvent: jest.fn().mockResolvedValue({}),
	logUserEvent: jest.fn().mockResolvedValue({}),
	logFinancialEvent: jest.fn().mockResolvedValue({}),
	logSecurityEvent: jest.fn().mockResolvedValue({}),
	logDataEvent: jest.fn().mockResolvedValue({}),
	logSystemEvent: jest.fn().mockResolvedValue({}),
	getAuditLogs: jest.fn().mockResolvedValue({ logs: [], pagination: { page: 1, limit: 50, total: 0, pages: 0 } }),
	getAuditStats: jest.fn().mockResolvedValue([]),
	getUserActivitySummary: jest.fn().mockResolvedValue([]),
	cleanupExpiredLogs: jest.fn().mockResolvedValue(0),
	exportAuditLogs: jest.fn().mockResolvedValue([])
};


