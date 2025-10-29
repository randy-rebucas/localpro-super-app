// MIGRATION TEMPLATE FOR ROUTES
// Add pagination middleware to your routes:

const { offsetPaginationMiddleware, cursorPaginationMiddleware } = require('../middleware/paginationMiddleware');

// For traditional browsing (offset pagination)
router.get('/', 
  offsetPaginationMiddleware({
    defaultLimit: 20,
    maxLimit: 100,
    sortField: 'createdAt',
    sortOrder: 'desc'
  }),
  getItems
);

// For feeds/real-time data (cursor pagination)
router.get('/feed',
  cursorPaginationMiddleware({
    defaultLimit: 20,
    maxLimit: 50,
    cursorField: 'createdAt',
    sortField: 'createdAt',
    sortOrder: 'desc'
  }),
  getItemsFeed
);
