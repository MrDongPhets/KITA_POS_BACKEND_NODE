// src/routes/staff/permissions.js
const express = require('express');
const router = express.Router();
const {
  getRolePermissions,
  updateStaffRole,
  verifyManagerOverride,
  logActivity,
  getActivityLogs,
  changePasscode
} = require('../../controllers/staff/staffPermissionsController');
const { authenticateToken } = require('../../middleware/auth');
const { isManager, isSupervisor } = require('../../middleware/permissions');

// All routes require authentication
router.use(authenticateToken);

// Get role permissions matrix (all authenticated staff can view)
router.get('/roles', getRolePermissions);

// Update staff role (managers only)
router.put('/role/:staff_id', isManager, updateStaffRole);

// Verify manager override for restricted actions
router.post('/manager-override', verifyManagerOverride);

// Log staff activity
router.post('/log-activity', logActivity);

// Get activity logs (managers and supervisors)
router.get('/activity-logs', isSupervisor, getActivityLogs);

// Change own passcode (any staff)
router.post('/change-passcode', changePasscode);

module.exports = router;