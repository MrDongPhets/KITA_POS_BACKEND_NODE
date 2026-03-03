const express = require('express');
const router = express.Router();
const { registerCompany } = require('../../controllers/auth/registerController');

router.post('/register-company', registerCompany);

module.exports = router;