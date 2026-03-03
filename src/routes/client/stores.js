// src/routes/client/stores.js - WITH SWAGGER DOCUMENTATION
const express = require('express');
const router = express.Router();
const { getStores, requestStore } = require('../../controllers/client/storesController');

/**
 * @swagger
 * tags:
 *   name: Client - Stores
 *   description: Store management endpoints for multi-location businesses
 */

/**
 * @swagger
 * /client/stores:
 *   get:
 *     tags: [Client - Stores]
 *     summary: Get all stores for the authenticated company
 *     description: Retrieve all stores belonging to the authenticated user's company, including pending, active, and inactive stores
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of stores retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 stores:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Store'
 *                 count:
 *                   type: integer
 *                   example: 3
 *                   description: Total number of stores
 *             example:
 *               stores:
 *                 - id: "store_1234567890_abc123"
 *                   name: "Main Branch"
 *                   address: "123 Main St, City"
 *                   phone: "+1234567890"
 *                   company_id: "550e8400-e29b-41d4-a716-446655440000"
 *                   status: "active"
 *                   is_active: true
 *                   created_at: "2025-01-15T10:30:00Z"
 *                   settings: 
 *                     description: "Main retail location"
 *                 - id: "store_0987654321_xyz789"
 *                   name: "Downtown Branch"
 *                   address: "456 Center Ave, City"
 *                   phone: "+0987654321"
 *                   company_id: "550e8400-e29b-41d4-a716-446655440000"
 *                   status: "pending"
 *                   is_active: false
 *                   created_at: "2025-01-20T14:15:00Z"
 *               count: 2
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Invalid or expired token"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Failed to fetch stores"
 *               code: "STORES_ERROR"
 */
router.get('/', getStores);

/**
 * @swagger
 * /client/stores/request:
 *   post:
 *     tags: [Client - Stores]
 *     summary: Request a new store (requires admin approval)
 *     description: Submit a request to create a new store location. The store will be created with 'pending' status and requires super admin approval before becoming active
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
 *               - address
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 255
 *                 description: Store name
 *                 example: "Westside Branch"
 *               address:
 *                 type: string
 *                 minLength: 1
 *                 description: Full store address
 *                 example: "789 West Street, City, State 12345"
 *               phone:
 *                 type: string
 *                 description: Store contact phone number
 *                 example: "+1234567890"
 *               description:
 *                 type: string
 *                 description: Additional notes or description about the store
 *                 example: "New branch opening in the west district"
 *           example:
 *             name: "Westside Branch"
 *             address: "789 West Street, City, State 12345"
 *             phone: "+1234567890"
 *             description: "New branch targeting west district customers"
 *     responses:
 *       201:
 *         description: Store request submitted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Store request submitted successfully"
 *                 store:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: "store_1234567890_abc123"
 *                     name:
 *                       type: string
 *                       example: "Westside Branch"
 *                     status:
 *                       type: string
 *                       enum: [pending]
 *                       example: "pending"
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *                       example: "2025-01-20T15:30:00Z"
 *             example:
 *               message: "Store request submitted successfully"
 *               store:
 *                 id: "store_1234567890_abc123"
 *                 name: "Westside Branch"
 *                 status: "pending"
 *                 created_at: "2025-01-20T15:30:00Z"
 *       400:
 *         description: Validation error - Missing required fields
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Store name and address are required"
 *               code: "VALIDATION_ERROR"
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
 *               error: "Failed to submit store request"
 *               code: "STORE_REQUEST_ERROR"
 */
router.post('/request', requestStore);

module.exports = router;