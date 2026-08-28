const express = require('express');
const router = express.Router();
const asyncHandler = require('../utils/asyncHandler');
const { autenticar } = require('../middleware/auth');
const ctrl = require('../controllers/dashboardController');

router.get('/dashboard', autenticar, asyncHandler(ctrl.resumo));

module.exports = router;
