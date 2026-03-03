// src/routes/client/categories.js - WITH SWAGGER DOCUMENTATION
const express = require('express');
const router = express.Router();
const { 
  getCategories, 
  getCategory, 
  createCategory, 
  updateCategory, 
  deleteCategory 
} = require('../../controllers/client/categoriesController');

/**
 * @swagger
 * tags:
 *   name: Client - Categories
 *   description: Product category management for organizing inventory
 */

/**
 * @swagger
 * /client/categories:
 *   get:
 *     tags: [Client - Categories]
 *     summary: Get all categories for the company
 *     description: Retrieve all categories across all stores belonging to the authenticated user's company, including product count for each category
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of categories retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 categories:
 *                   type: array
 *                   items:
 *                     allOf:
 *                       - $ref: '#/components/schemas/Category'
 *                       - type: object
 *                         properties:
 *                           product_count:
 *                             type: integer
 *                             example: 15
 *                             description: Number of products in this category
 *                 count:
 *                   type: integer
 *                   example: 8
 *                   description: Total number of categories
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   example: "2025-01-20T10:30:00Z"
 *             example:
 *               categories:
 *                 - id: "550e8400-e29b-41d4-a716-446655440000"
 *                   name: "Electronics"
 *                   description: "Electronic devices and accessories"
 *                   color: "#3B82F6"
 *                   icon: "zap"
 *                   store_id: "store_main_123"
 *                   is_active: true
 *                   product_count: 25
 *                   created_at: "2025-01-15T08:00:00Z"
 *                 - id: "660e8400-e29b-41d4-a716-446655440111"
 *                   name: "Clothing"
 *                   description: "Apparel and fashion items"
 *                   color: "#EF4444"
 *                   icon: "shirt"
 *                   store_id: "store_main_123"
 *                   is_active: true
 *                   product_count: 42
 *                   created_at: "2025-01-16T09:30:00Z"
 *               count: 2
 *               timestamp: "2025-01-20T10:30:00Z"
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Failed to fetch categories"
 *               code: "CATEGORIES_ERROR"
 */
router.get('/', getCategories);

/**
 * @swagger
 * /client/categories/{id}:
 *   get:
 *     tags: [Client - Categories]
 *     summary: Get a specific category by ID
 *     description: Retrieve detailed information about a single category, including its products
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Category UUID
 *         example: "550e8400-e29b-41d4-a716-446655440000"
 *     responses:
 *       200:
 *         description: Category details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 category:
 *                   allOf:
 *                     - $ref: '#/components/schemas/Category'
 *                     - type: object
 *                       properties:
 *                         products:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: string
 *                                 format: uuid
 *                               name:
 *                                 type: string
 *                               sku:
 *                                 type: string
 *                               default_price:
 *                                 type: number
 *                         product_count:
 *                           type: integer
 *             example:
 *               category:
 *                 id: "550e8400-e29b-41d4-a716-446655440000"
 *                 name: "Electronics"
 *                 description: "Electronic devices and accessories"
 *                 color: "#3B82F6"
 *                 icon: "zap"
 *                 store_id: "store_main_123"
 *                 is_active: true
 *                 products:
 *                   - id: "770e8400-e29b-41d4-a716-446655440222"
 *                     name: "Wireless Mouse"
 *                     sku: "ELEC-MOUSE-001"
 *                     default_price: 25.99
 *                   - id: "880e8400-e29b-41d4-a716-446655440333"
 *                     name: "USB Cable"
 *                     sku: "ELEC-CABLE-002"
 *                     default_price: 9.99
 *                 product_count: 2
 *                 created_at: "2025-01-15T08:00:00Z"
 *       404:
 *         description: Category not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Category not found"
 *               code: "CATEGORY_NOT_FOUND"
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       500:
 *         description: Server error
 */
router.get('/:id', getCategory);

/**
 * @swagger
 * /client/categories:
 *   post:
 *     tags: [Client - Categories]
 *     summary: Create a new category
 *     description: Create a new product category for organizing inventory. Category names must be unique within each store.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 255
 *                 description: Category name (must be unique per store)
 *                 example: "Beverages"
 *               description:
 *                 type: string
 *                 description: Optional category description
 *                 example: "Soft drinks, juices, and bottled water"
 *               color:
 *                 type: string
 *                 pattern: '^#[0-9A-Fa-f]{6}$'
 *                 default: "#3B82F6"
 *                 description: Hex color code for category display
 *                 example: "#10B981"
 *               icon:
 *                 type: string
 *                 default: "folder"
 *                 description: Icon identifier for category display
 *                 example: "coffee"
 *               store_id:
 *                 type: string
 *                 description: Store ID (optional - uses first store if not provided)
 *                 example: "store_main_123"
 *           example:
 *             name: "Beverages"
 *             description: "All types of drinks and beverages"
 *             color: "#10B981"
 *             icon: "coffee"
 *             store_id: "store_main_123"
 *     responses:
 *       201:
 *         description: Category created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Category created successfully"
 *                 category:
 *                   allOf:
 *                     - $ref: '#/components/schemas/Category'
 *                     - type: object
 *                       properties:
 *                         product_count:
 *                           type: integer
 *                           example: 0
 *             example:
 *               message: "Category created successfully"
 *               category:
 *                 id: "550e8400-e29b-41d4-a716-446655440000"
 *                 name: "Beverages"
 *                 description: "All types of drinks and beverages"
 *                 color: "#10B981"
 *                 icon: "coffee"
 *                 store_id: "store_main_123"
 *                 is_active: true
 *                 product_count: 0
 *                 created_at: "2025-01-20T11:00:00Z"
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             examples:
 *               missing_name:
 *                 value:
 *                   error: "Category name is required"
 *                   code: "VALIDATION_ERROR"
 *               no_store:
 *                 value:
 *                   error: "No store found for this company"
 *                   code: "NO_STORE_ERROR"
 *               invalid_store:
 *                 value:
 *                   error: "Invalid store selected"
 *                   code: "INVALID_STORE"
 *       409:
 *         description: Duplicate category name
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Category name already exists in this store"
 *               code: "CATEGORY_EXISTS"
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       500:
 *         description: Server error
 */
router.post('/', createCategory);

/**
 * @swagger
 * /client/categories/{id}:
 *   put:
 *     tags: [Client - Categories]
 *     summary: Update a category
 *     description: Update an existing category's information. All fields are optional - only provided fields will be updated.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Category UUID
 *         example: "550e8400-e29b-41d4-a716-446655440000"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Updated category name
 *                 example: "Hot Beverages"
 *               description:
 *                 type: string
 *                 description: Updated category description
 *                 example: "Coffee, tea, and hot chocolate"
 *               color:
 *                 type: string
 *                 pattern: '^#[0-9A-Fa-f]{6}$'
 *                 description: Updated hex color code
 *                 example: "#F59E0B"
 *               icon:
 *                 type: string
 *                 description: Updated icon identifier
 *                 example: "mug-hot"
 *               is_active:
 *                 type: boolean
 *                 description: Category active status
 *                 example: true
 *           example:
 *             name: "Hot Beverages"
 *             description: "Coffee, tea, and hot chocolate"
 *             color: "#F59E0B"
 *             icon: "mug-hot"
 *     responses:
 *       200:
 *         description: Category updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Category updated successfully"
 *                 category:
 *                   allOf:
 *                     - $ref: '#/components/schemas/Category'
 *                     - type: object
 *                       properties:
 *                         product_count:
 *                           type: integer
 *             example:
 *               message: "Category updated successfully"
 *               category:
 *                 id: "550e8400-e29b-41d4-a716-446655440000"
 *                 name: "Hot Beverages"
 *                 description: "Coffee, tea, and hot chocolate"
 *                 color: "#F59E0B"
 *                 icon: "mug-hot"
 *                 store_id: "store_main_123"
 *                 is_active: true
 *                 product_count: 12
 *                 updated_at: "2025-01-20T14:30:00Z"
 *       404:
 *         description: Category not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Category not found"
 *               code: "CATEGORY_NOT_FOUND"
 *       409:
 *         description: Duplicate category name
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Category name already exists in this store"
 *               code: "CATEGORY_EXISTS"
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       500:
 *         description: Server error
 */
router.put('/:id', updateCategory);

/**
 * @swagger
 * /client/categories/{id}:
 *   delete:
 *     tags: [Client - Categories]
 *     summary: Delete (deactivate) a category
 *     description: Soft delete a category by setting is_active to false. Cannot delete categories that have active products - products must be moved or deleted first.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Category UUID
 *         example: "550e8400-e29b-41d4-a716-446655440000"
 *     responses:
 *       200:
 *         description: Category deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Category deleted successfully"
 *                 category_name:
 *                   type: string
 *                   example: "Old Electronics"
 *             example:
 *               message: "Category deleted successfully"
 *               category_name: "Old Electronics"
 *       400:
 *         description: Category has active products
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                 code:
 *                   type: string
 *                   example: "CATEGORY_HAS_PRODUCTS"
 *                 product_count:
 *                   type: integer
 *                   description: Number of products in this category
 *             example:
 *               error: "Cannot delete category with 15 products. Please move or delete the products first."
 *               code: "CATEGORY_HAS_PRODUCTS"
 *               product_count: 15
 *       404:
 *         description: Category not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Category not found"
 *               code: "CATEGORY_NOT_FOUND"
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       500:
 *         description: Server error
 */
router.delete('/:id', deleteCategory);

module.exports = router;