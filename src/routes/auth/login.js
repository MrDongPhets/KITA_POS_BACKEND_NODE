const express = require('express');
const router = express.Router();
const { 
  clientLogin, 
  superAdminLogin, 
  logout 
} = require('../../controllers/auth/loginController');

router.post('/login', clientLogin);
router.post('/super-admin/login', superAdminLogin);
router.post('/logout', logout);

module.exports = router;