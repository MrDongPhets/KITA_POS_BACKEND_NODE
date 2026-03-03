// src/routes/client/recipes.js
const express = require('express');
const router = express.Router();
const {
  getProductRecipe,
  saveProductRecipe,
  checkRecipeAvailability
} = require('../../controllers/client/recipesController');

// Recipe routes
router.get('/:product_id', getProductRecipe);
router.post('/:product_id', saveProductRecipe);
router.get('/:product_id/availability', checkRecipeAvailability);

module.exports = router;