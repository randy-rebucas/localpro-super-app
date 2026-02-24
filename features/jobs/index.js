/**
 * Jobs Feature Module
 *
 * Public API for the Jobs domain.
 * All external code must import from this index -- not from internal files directly.
 *
 * External dependencies (from src/):
 * - src/middleware/auth (auth, authorize)
 * - src/middleware/routeValidation
 * - src/models/User, TaskChecklist, Communication, UserSettings
 * - src/services/notificationService, emailService, cloudinaryService, googleMapsService
 * - src/config/cloudinary, logger
 * - src/utils/responseHelper, controllerValidation
 */

// -- Routes -------------------------------------------------------------------
const routes         = require('./routes/jobs');
const categoryRoutes = require('./routes/jobCategories');
const workflowRoutes = require('./routes/jobWorkflow');

// -- Models -------------------------------------------------------------------
const Job             = require('./models/Job');
const JobCategory     = require('./models/JobCategory');
const JobIssue        = require('./models/JobIssue');
const JobProgress     = require('./models/JobProgress');
const JobProof        = require('./models/JobProof');
const JobRankingScore = require('./models/JobRankingScore');
const JobSchedule     = require('./models/JobSchedule');

// -- Services -----------------------------------------------------------------
const jobWorkflowService             = require('./services/jobWorkflowService');
const automatedJobFollowUpService    = require('./services/automatedJobApplicationFollowUpService');
const automatedJobBoardDigestService = require('./services/automatedJobBoardDigestService');

module.exports = {
  // Routes (mount in server.js)
  routes,
  categoryRoutes,
  workflowRoutes,

  // Models
  Job,
  JobCategory,
  JobIssue,
  JobProgress,
  JobProof,
  JobRankingScore,
  JobSchedule,

  // Services
  jobWorkflowService,
  automatedJobFollowUpService,
  automatedJobBoardDigestService,
};
