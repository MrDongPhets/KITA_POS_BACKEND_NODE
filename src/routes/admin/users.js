const express = require('express');
const router = express.Router();
const { getUsers } = require('../../controllers/admin/usersController');

// Future: Add user management endpoints
router.get('/', getUsers);

module.exports = router;