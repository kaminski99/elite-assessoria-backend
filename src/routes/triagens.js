const express = require('express');
const router = express.Router();
const asyncHandler = require('../utils/asyncHandler');
const { autenticar, verificarChaveLanna } = require('../middleware/auth');
const ctrl = require('../controllers/triagensController');

router.get('/triagens', autenticar, asyncHandler(ctrl.listar));
router.post('/triagens', verificarChaveLanna, asyncHandler(ctrl.criar));
router.put('/triagens/:id/aprovar', autenticar, asyncHandler(ctrl.aprovar));

module.exports = router;
