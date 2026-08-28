const triagemModel = require('../models/triagemModel');
const agendamentoModel = require('../models/agendamentoModel');
const pacienteModel = require('../models/pacienteModel');
const { gerarHorarios, dataValida, horaValida } = require('./agendamentosController');

// GET /api/triagens  (protegida — lista as pendentes da clínica do token)
async function listar(req, res) {
  const triagens = await triagemModel.listarPendentes(req.clinicaId);
  res.json(triagens);
}

// POST /api/triagens  (pública — usada pela Lanna quando o lead não confirma horário)
async function criar(req, res) {
  const { clinica_id, paciente_nome, paciente_telefone, servico } = req.body;

  if (!clinica_id || !paciente_nome || !paciente_telefone || !servico) {
    return res.status(400).json({
      erro: 'Os campos clinica_id, paciente_nome, paciente_telefone e servico são obrigatórios',
    });
  }

  const triagem = await triagemModel.criar({
    clinicaId: clinica_id,
    pacienteNome: paciente_nome,
    pacienteTelefone: paciente_telefone,
    servico,
  });

  res.status(201).json(triagem);
}

// PUT /api/triagens/:id/aprovar  (protegida)
// Body: { data, hora } — horário escolhido pela clínica para o agendamento.
async function aprovar(req, res) {
  const { id } = req.params;
  const { data, hora } = req.body;

  const triagem = await triagemModel.buscarPorId(id, req.clinicaId);
  if (!triagem) {
    return res.status(404).json({ erro: 'Triagem não encontrada' });
  }
  if (triagem.status !== 'Pendente') {
    return res.status(400).json({ erro: 'Esta triagem já foi processada' });
  }
  if (!data || !hora) {
    return res.status(400).json({ erro: 'Os campos data e hora são obrigatórios para aprovar a triagem' });
  }
  if (!dataValida(data)) {
    return res.status(400).json({ erro: 'Formato de data inválido. Use AAAA-MM-DD' });
  }
  if (!horaValida(hora)) {
    return res.status(400).json({ erro: 'Formato de hora inválido. Use HH:MM' });
  }
  if (!gerarHorarios(data).includes(hora)) {
    return res.status(400).json({ erro: 'Horário fora do funcionamento da clínica nesta data' });
  }

  const conflito = await agendamentoModel.buscarConflito(req.clinicaId, data, hora);
  if (conflito) {
    return res.status(409).json({ erro: 'Este horário já está ocupado' });
  }

  const agendamento = await agendamentoModel.criar({
    clinicaId: req.clinicaId,
    pacienteNome: triagem.paciente_nome,
    pacienteTelefone: triagem.paciente_telefone,
    servico: triagem.servico,
    data,
    hora,
    origem: 'triagem',
  });

  await pacienteModel.criarOuAtualizar({
    clinicaId: req.clinicaId,
    nome: triagem.paciente_nome,
    telefone: triagem.paciente_telefone,
  });

  const triagemAtualizada = await triagemModel.atualizarStatus(id, req.clinicaId, 'Aprovada');

  res.json({ triagem: triagemAtualizada, agendamento });
}

module.exports = { listar, criar, aprovar };
