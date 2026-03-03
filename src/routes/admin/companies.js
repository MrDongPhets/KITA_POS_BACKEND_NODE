const express = require('express');
const router = express.Router();
const { getCompanies } = require('../../controllers/admin/companiesController');

router.get('/', getCompanies);

module.exports = router;