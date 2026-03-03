// src/routes/staff/auth.js - Updated with logout
const express = require('express');
const router = express.Router();
const { 
  staffLogin, 
  staffLogout,
  verifyStaffToken 
} = require('../../controllers/staff/staffAuthController');
const { authenticateToken } = require('../../middleware/auth');

// Public routes
router.post('/login', staffLogin);

// Protected routes
router.post('/logout', authenticateToken, staffLogout);
router.get('/verify', authenticateToken, verifyStaffToken);

module.exports = router;