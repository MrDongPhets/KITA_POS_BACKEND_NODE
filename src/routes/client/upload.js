// src/routes/client/upload.js - Upload routes
const express = require('express');
const router = express.Router();
const { uploadImage, deleteImage, upload } = require('../../controllers/client/uploadController');
const { authenticateToken, requireClient } = require('../../middleware/auth');

// Apply authentication middleware to all routes
router.use(authenticateToken);
router.use(requireClient);

// POST /client/upload/image - Upload product image
router.post('/image', upload.single('file'), uploadImage);

// DELETE /client/upload/image/:filename - Delete uploaded image
router.delete('/image/:filename', deleteImage);

module.exports = router;