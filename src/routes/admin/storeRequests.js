// src/routes/admin/storeRequests.js
const express = require('express');
const router = express.Router();
const { 
  getStoreRequests, 
  approveStore, 
  rejectStore 
} = require('../../controllers/admin/storeRequestsController');

// GET /admin/store-requests
router.get('/', getStoreRequests);

// POST /admin/store-requests/approve
router.post('/approve', approveStore);

// POST /admin/store-requests/reject
router.post('/reject', rejectStore);

module.exports = router;