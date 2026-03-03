// src/routes/auth/index.js - With Swagger API Documentation
const express = require('express');
const router = express.Router();

// Import route handlers
const { 
  clientLogin, 
  superAdminLogin, 
  logout 
} = require('../../controllers/auth/loginController');
const { registerCompany } = require('../../controllers/auth/registerController');
const { authenticateToken } = require('../../middleware/auth');
const { verifyToken, cleanup } = require('../../controllers/auth/verifyController');

/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: User authentication and authorization endpoints
 */

/**
 * @swagger
 * /auth/login:
 *   post:
 *     tags: [Authentication]
 *     summary: Client user login
 *     description: Authenticate a client user and receive JWT token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: manager@demobakery.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: password123
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   description: JWT authentication token
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *                 company:
 *                   $ref: '#/components/schemas/Company'
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 */
router.post('/login', clientLogin);

/**
 * @swagger
 * /auth/super-admin/login:
 *   post:
 *     tags: [Authentication]
 *     summary: Super admin login
 *     description: Authenticate a super admin user with elevated privileges
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: admin@system.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: superadmin123
 *     responses:
 *       200:
 *         description: Super admin login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   description: JWT authentication token
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                     email:
 *                       type: string
 *                     full_name:
 *                       type: string
 *                     role:
 *                       type: string
 *                       example: super_admin
 *       401:
 *         description: Invalid credentials or not a super admin
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/super-admin/login', superAdminLogin);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     tags: [Authentication]
 *     summary: Logout user
 *     description: Logout current user and invalidate token
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Logout successful
 *       401:
 *         description: Unauthorized - Invalid or missing token
 */
router.post('/logout', logout);

/**
 * @swagger
 * /auth/register-company:
 *   post:
 *     tags: [Authentication]
 *     summary: Register new company
 *     description: Register a new company with owner account and initial subscription
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - company
 *               - user
 *             properties:
 *               company:
 *                 type: object
 *                 required:
 *                   - name
 *                   - email
 *                 properties:
 *                   name:
 *                     type: string
 *                     example: My Business Store
 *                     description: Company/Business name
 *                   email:
 *                     type: string
 *                     format: email
 *                     example: business@example.com
 *                     description: Company contact email
 *                   phone:
 *                     type: string
 *                     example: "+63 912 345 6789"
 *                     description: Company phone number
 *                   address:
 *                     type: string
 *                     example: "123 Main Street, Manila, Philippines"
 *                     description: Company address
 *               user:
 *                 type: object
 *                 required:
 *                   - full_name
 *                   - email
 *                   - password
 *                 properties:
 *                   full_name:
 *                     type: string
 *                     example: Juan Dela Cruz
 *                     description: Owner's full name
 *                   email:
 *                     type: string
 *                     format: email
 *                     example: juan@example.com
 *                     description: Owner's email (login credential)
 *                   password:
 *                     type: string
 *                     format: password
 *                     example: SecurePassword123!
 *                     description: Owner's password (min 6 characters)
 *               subscription:
 *                 type: object
 *                 properties:
 *                   plan:
 *                     type: string
 *                     enum: [trial, basic, pro, enterprise]
 *                     default: trial
 *                     example: trial
 *                     description: Subscription plan (defaults to trial)
 *     responses:
 *       201:
 *         description: Company registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 company:
 *                   $ref: '#/components/schemas/Company'
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *                 message:
 *                   type: string
 *                   example: Company registered successfully
 *       400:
 *         description: Invalid input or company already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 */
router.post('/register-company', registerCompany);

/**
 * @swagger
 * /auth/verify:
 *   get:
 *     tags: [Authentication]
 *     summary: Verify JWT token
 *     description: Validate current JWT token and return user information
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Token is valid
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *                 company:
 *                   $ref: '#/components/schemas/Company'
 *       401:
 *         description: Invalid or expired token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Invalid or expired token
 *       500:
 *         description: Server error
 */
router.get('/verify', authenticateToken, verifyToken);

/**
 * @swagger
 * /auth/cleanup:
 *   post:
 *     tags: [Authentication]
 *     summary: Cleanup expired sessions
 *     description: Remove expired authentication sessions and tokens (admin function)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cleanup successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Expired sessions cleaned up
 *                 cleaned:
 *                   type: integer
 *                   example: 5
 *                   description: Number of sessions removed
 *       401:
 *         description: Unauthorized
 */
router.post('/cleanup', authenticateToken, cleanup);

module.exports = router;