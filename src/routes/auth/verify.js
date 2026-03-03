const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../../middleware/auth');
const { verifyToken, cleanup } = require('../../controllers/auth/verifyController');

router.get('/verify', authenticateToken, verifyToken);
router.post('/cleanup', authenticateToken, cleanup);

module.exports = router;