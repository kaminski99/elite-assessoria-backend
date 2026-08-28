const express = require('express');
const router = express.Router();
const asyncHandler = require('../utils/asyncHandler');
const { autenticar } = require('../middleware/auth');
const ctrl = require('../controllers/pacientesController');

router.get('/pacientes', autenticar, asyncHandler(ctrl.listar));
router.get('/pacientes/:id/historico', autenticar, asyncHandler(ctrl.historico));

module.exports = router;
