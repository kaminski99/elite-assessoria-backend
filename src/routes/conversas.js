const express = require('express');
const router = express.Router();
const asyncHandler = require('../utils/asyncHandler');
const { verificarChaveLanna } = require('../middleware/auth');
const ctrl = require('../controllers/conversasController');

router.post('/conversas', verificarChaveLanna, asyncHandler(ctrl.criar));

module.exports = router;
