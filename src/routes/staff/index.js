// src/routes/staff/index.js - Updated with permissions routes
const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../../middleware/auth');

const authRoutes = require('./auth');
const manageRoutes = require('./manage');
const permissionsRoutes = require('./permissions'); // NEW

// Public staff routes (login)
router.use('/auth', authRoutes);

// Protected staff routes
router.use('/manage', manageRoutes);
router.use('/permissions', permissionsRoutes); // NEW

module.exports = router;