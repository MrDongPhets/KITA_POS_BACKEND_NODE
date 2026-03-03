const express = require('express');
const router = express.Router();
const { createTransferRequest, getTransfers, approveTransfer, completeTransfer, rejectTransfer } = require('../../controllers/client/transferController');

// POST /client/inventory-transfer/request
router.post('/transfers', createTransferRequest);
router.get('/transfers', getTransfers);
router.patch('/transfers/:id/approve', approveTransfer);
router.patch('/transfers/:id/complete', completeTransfer);
router.patch('/transfers/:id/reject', rejectTransfer);

module.exports = router;