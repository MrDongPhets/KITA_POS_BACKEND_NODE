const express = require('express');
const router = express.Router();
const { searchProducts, getProductsByCategory, calculatePrice } = require('../../controllers/pos/posController');

// GET /pos/products/search
router.get('/search', searchProducts);

// GET /pos/products/category
router.get('/category', getProductsByCategory);

// POST /pos/products/calculate-price
router.post('/calculate-price', calculatePrice);

module.exports = router;