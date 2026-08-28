const express = require('express');
const router = express.Router();
const asyncHandler = require('../utils/asyncHandler');
const { autenticar, verificarChaveLanna } = require('../middleware/auth');
const ctrl = require('../controllers/agendamentosController');

// Rotas públicas usadas pela Lanna
router.get('/disponibilidade', verificarChaveLanna, asyncHandler(ctrl.disponibilidade));
router.post('/agendar', verificarChaveLanna, asyncHandler(ctrl.agendar));

// Rotas protegidas (painel da clínica)
router.get('/agendamentos', autenticar, asyncHandler(ctrl.listar));
router.put('/agendamentos/:id/confirmar', autenticar, asyncHandler(ctrl.confirmar));
router.put('/agendamentos/:id/cancelar', autenticar, asyncHandler(ctrl.cancelar));

module.exports = router;
