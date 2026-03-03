const express = require('express');
const router = express.Router();
const { createStaff, listStaff, updateStaff, deleteStaff } = require('../../controllers/staff/staffManageController');
const { authenticateToken } = require('../../middleware/auth');
const { isManager } = require('../../middleware/permissions');

// All routes require authentication
router.use(authenticateToken);

// Create new staff (managers only)
router.post('/create', isManager, createStaff);

// Get all staff
router.get('/list', listStaff);

// Update staff (managers only)
router.put('/:id', isManager, updateStaff);

// Delete staff (managers only)
router.delete('/:id', isManager, deleteStaff);

module.exports = router;