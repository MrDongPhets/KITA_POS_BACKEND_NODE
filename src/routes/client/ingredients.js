// src/routes/client/ingredients.js
const express = require('express');
const router = express.Router();
const {
  getIngredients,
  getIngredient,
  createIngredient,
  updateIngredient,
  deleteIngredient,
  updateIngredientStock,
  getIngredientMovements
} = require('../../controllers/client/ingredientsController');

// Ingredients CRUD routes
router.get('/', getIngredients);
router.get('/movements', getIngredientMovements);
router.get('/:id', getIngredient);
router.post('/', createIngredient);
router.put('/:id', updateIngredient);
router.delete('/:id', deleteIngredient);
router.patch('/:id/stock', updateIngredientStock);

module.exports = router;