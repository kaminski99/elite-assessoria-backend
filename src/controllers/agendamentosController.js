const agendamentoModel = require('../models/agendamentoModel');
const pacienteModel = require('../models/pacienteModel');

// seg-sex: 08h-18h · sáb: 08h-12h · dom: fechado
const JANELA_POR_DIA = {
  0: null,
  1: [8, 18],
  2: [8, 18],
  3: [8, 18],
  4: [8, 18],
  5: [8, 18],
  6: [8, 12],
};

function diaDaSemana(dataStr) {
  const [y, m, d] = dataStr.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

function gerarHorarios(dataStr) {
  const janela = JANELA_POR_DIA[diaDaSemana(dataStr)];
  if (!janela) return [];
  const [inicio, fim] = janela;
  const horarios = [];
  for (let h = inicio; h < fim; h++) {
    horarios.push(String(h).padStart(2, '0') + ':00');
  }
  return horarios;
}

function dataValida(dataStr) {
  return /^\d{4}-\d{2}-\d{2}$/.test(dataStr) && !Number.isNaN(new Date(`${dataStr}T00:00:00Z`).getTime());
}

function horaValida(horaStr) {
  return /^\d{2}:\d{2}$/.test(horaStr);
}

// GET /api/disponibilidade?data=&clinica_id=  (pública — usada pela Lanna)
async function disponibilidade(req, res) {
  const { data, clinica_id: clinicaId } = req.query;

  if (!data || !clinicaId) {
    return res.status(400).json({ erro: 'Os parâmetros data e clinica_id são obrigatórios' });
  }
  if (!dataValida(data)) {
    return res.status(400).json({ erro: 'Formato de data inválido. Use AAAA-MM-DD' });
  }

  const horariosDoDia = gerarHorarios(data);
  if (horariosDoDia.length === 0) {
    return res.json({
      data,
      clinica_id: Number(clinicaId),
      horarios_disponiveis: [],
      mensagem: 'Clínica fechada nesta data',
    });
  }

  const ocupados = await agendamentoModel.horariosOcupados(clinicaId, data);
  const disponiveis = horariosDoDia.filter((h) => !ocupados.includes(h));

  res.json({ data, clinica_id: Number(clinicaId), horarios_disponiveis: disponiveis });
}

// POST /api/agendar  (pública — usada pela Lanna)
async function agendar(req, res) {
  const { clinica_id, paciente_nome, paciente_telefone, servico, convenio, data, hora, origem } = req.body;

  if (!clinica_id || !paciente_nome || !paciente_telefone || !servico || !data || !hora) {
    return res.status(400).json({
      erro: 'Os campos clinica_id, paciente_nome, paciente_telefone, servico, data e hora são obrigatórios',
    });
  }
  if (!dataValida(data)) {
    return res.status(400).json({ erro: 'Formato de data inválido. Use AAAA-MM-DD' });
  }
  if (!horaValida(hora)) {
    return res.status(400).json({ erro: 'Formato de hora inválido. Use HH:MM' });
  }

  const horariosDoDia = gerarHorarios(data);
  if (!horariosDoDia.includes(hora)) {
    return res.status(400).json({ erro: 'Horário fora do funcionamento da clínica nesta data' });
  }

  const conflito = await agendamentoModel.buscarConflito(clinica_id, data, hora);
  if (conflito) {
    return res.status(409).json({ erro: 'Este horário já está ocupado' });
  }

  const agendamento = await agendamentoModel.criar({
    clinicaId: clinica_id,
    pacienteNome: paciente_nome,
    pacienteTelefone: paciente_telefone,
    servico,
    convenio,
    data,
    hora,
    origem: origem || 'lanna',
  });

  await pacienteModel.criarOuAtualizar({
    clinicaId: clinica_id,
    nome: paciente_nome,
    telefone: paciente_telefone,
    convenio,
  });

  res.status(201).json(agendamento);
}

// GET /api/agendamentos?data=  (protegida — clinica_id vem do token)
async function listar(req, res) {
  const { data } = req.query;
  const agendamentos = await agendamentoModel.listarPorClinicaEData(req.clinicaId, data);
  res.json(agendamentos);
}

// PUT /api/agendamentos/:id/confirmar  (protegida)
async function confirmar(req, res) {
  const atualizado = await agendamentoModel.atualizarStatus(req.params.id, req.clinicaId, 'Confirmado');
  if (!atualizado) {
    return res.status(404).json({ erro: 'Agendamento não encontrado' });
  }
  res.json(atualizado);
}

// PUT /api/agendamentos/:id/cancelar  (protegida)
async function cancelar(req, res) {
  const atualizado = await agendamentoModel.atualizarStatus(req.params.id, req.clinicaId, 'Cancelado');
  if (!atualizado) {
    return res.status(404).json({ erro: 'Agendamento não encontrado' });
  }
  res.json(atualizado);
}

module.exports = {
  disponibilidade,
  agendar,
  listar,
  confirmar,
  cancelar,
  // exportados para reuso no controller de triagens (aprovar cria um agendamento)
  gerarHorarios,
  dataValida,
  horaValida,
};
