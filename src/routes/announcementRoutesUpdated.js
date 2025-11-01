const express = require('express');
const router = express.Router();
const {
  getAnnouncements,
  getMyAnnouncements,
  getAnnouncement,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement
} = require('../controllers/announcementControllerUpdated');

const { offsetPaginationMiddleware, cursorPaginationMiddleware } = require('../middleware/paginationMiddleware');
const { authenticateToken } = require('../middleware/authMiddleware');
const { validateAnnouncement } = require('../middleware/validationMiddleware');

/**
 * Updated Announcement Routes with Standardized Pagination
 * Demonstrates different pagination strategies for different endpoints
 */

// Public announcements - offset pagination (good for browsing)
router.get('/', 
  offsetPaginationMiddleware({
    defaultLimit: 20,
    maxLimit: 50,
    sortField: 'publishedAt',
    sortOrder: 'desc'
  }),
  getAnnouncements
);

// Personalized announcements - cursor pagination (good for feeds)
router.get('/my',
  authenticateToken,
  cursorPaginationMiddleware({
    defaultLimit: 20,
    maxLimit: 50,
    cursorField: 'publishedAt',
    sortField: 'publishedAt',
    sortOrder: 'desc'
  }),
  getMyAnnouncements
);

// Single announcement
router.get('/:id', getAnnouncement);

// Create announcement
router.post('/',
  authenticateToken,
  validateAnnouncement,
  createAnnouncement
);

// Update announcement
router.put('/:id',
  authenticateToken,
  validateAnnouncement,
  updateAnnouncement
);

// Delete announcement
router.delete('/:id',
  authenticateToken,
  deleteAnnouncement
);

module.exports = router;
