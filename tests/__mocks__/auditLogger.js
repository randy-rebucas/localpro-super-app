const passThrough = () => (req, res, next) => next();

module.exports = {
	auditLogger: passThrough,
	auditSensitiveOperations: passThrough(),
	auditFinancialOperations: passThrough(),
	auditUserManagement: passThrough(),
	auditSystemOperations: passThrough(),
	auditGeneralOperations: passThrough()
};


