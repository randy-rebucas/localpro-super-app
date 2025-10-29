// MIGRATION TEMPLATE FOR CONTROLLERS
// Replace your existing pagination logic with this pattern:

const { paginationService } = require('../services/paginationService');
const { sendPaginatedResponse } = require('../middleware/paginationMiddleware');
const { sendServerError } = require('../utils/responseHelper');

const getItems = async (req, res) => {
  try {
    // Build your query
    const query = { /* your base query */ };
    
    // Apply filters from req.query
    if (req.query.status) query.status = req.query.status;
    if (req.query.search) {
      query.$or = [
        { title: { $regex: req.query.search, $options: 'i' } },
        { content: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    // Execute paginated query
    const result = await paginationService.executeHybridPagination(
      YourModel,
      query,
      req.pagination,
      {
        useCursor: req.query.useCursor === 'true',
        cursorThreshold: 5000,
        queryOptions: {
          populate: [
            { path: 'author', select: 'firstName lastName email' }
          ]
        }
      }
    );

    // Send standardized response
    return sendPaginatedResponse(
      res,
      result.results,
      result.pagination,
      'Items retrieved successfully',
      {
        filters: req.query,
        performance: result.performance
      }
    );

  } catch (error) {
    return sendServerError(res, error, 'Failed to retrieve items');
  }
};
