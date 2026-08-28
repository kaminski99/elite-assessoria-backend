const express = require('express');
const router = express.Router();
const asyncHandler = require('../utils/asyncHandler');
const ctrl = require('../controllers/authController');

router.post('/login', asyncHandler(ctrl.login));
router.post('/clinicas', asyncHandler(ctrl.registrar));

module.exports = router;
