const express = require('express');
const router = express.Router();
const { getUserStats, getSubscriptionStats } = require('../../controllers/admin/statsController');

router.get('/users', getUserStats);
router.get('/subscriptions', getSubscriptionStats);

module.exports = router;