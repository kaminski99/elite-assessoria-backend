const pacienteModel = require('../models/pacienteModel');
const agendamentoModel = require('../models/agendamentoModel');

// GET /api/pacientes  (protegida — clinica_id vem do token)
async function listar(req, res) {
  const pacientes = await pacienteModel.listarPorClinica(req.clinicaId);
  res.json(pacientes);
}

// GET /api/pacientes/:id/historico  (protegida)
async function historico(req, res) {
  const paciente = await pacienteModel.buscarPorId(req.params.id, req.clinicaId);
  if (!paciente) {
    return res.status(404).json({ erro: 'Paciente não encontrado' });
  }

  const agendamentos = await agendamentoModel.porTelefone(req.clinicaId, paciente.telefone);
  res.json({ paciente, agendamentos });
}

module.exports = { listar, historico };
