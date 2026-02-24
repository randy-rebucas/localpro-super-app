const express = require('express');
const { auth } = require('../../../src/middleware/auth');
const { authorize } = require('../../../src/middleware/authorize');
const { checkPermission } = require('../../../src/middleware/checkPermission');
const {
  getAllPermissions,
  getPermissionById,
  getPermissionsByModule,
  createPermission,
  updatePermission,
  deletePermission,
  initializePermissions,
  getModules,
  getPermissionStats,
  bulkCreatePermissions,
  getActions
} = require('../controllers/permissionController');

const { permissionsLimiter } = require('../../../src/middleware/rateLimiter');

const router = express.Router();
router.use(permissionsLimiter);

// Apply authentication to all routes
router.use(auth);

router.get('/',
  checkPermission(['staff.permissions', 'system.manage'], { requireAll: false }),
  getAllPermissions
);

router.get('/modules',
  checkPermission(['staff.permissions', 'system.manage'], { requireAll: false }),
  getModules
);

router.get('/actions',
  checkPermission(['staff.permissions', 'system.manage'], { requireAll: false }),
  getActions
);

router.get('/stats',
  checkPermission(['staff.permissions', 'system.manage'], { requireAll: false }),
  getPermissionStats
);

router.get('/module/:module',
  checkPermission(['staff.permissions', 'system.manage'], { requireAll: false }),
  getPermissionsByModule
);

router.get('/:id',
  checkPermission(['staff.permissions', 'system.manage'], { requireAll: false }),
  getPermissionById
);

router.post('/',
  authorize(['admin']),
  createPermission
);

router.post('/initialize',
  authorize(['admin']),
  initializePermissions
);

router.post('/bulk',
  authorize(['admin']),
  bulkCreatePermissions
);

router.put('/:id',
  authorize(['admin']),
  updatePermission
);

router.delete('/:id',
  authorize(['admin']),
  deletePermission
);

module.exports = router;
