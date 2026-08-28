const agendamentoModel = require('../models/agendamentoModel');
const triagemModel = require('../models/triagemModel');
const conversaModel = require('../models/conversaModel');

// GET /api/dashboard?data=  (protegida — clinica_id vem do token)
async function resumo(req, res) {
  const { data } = req.query;
  if (!data) {
    return res.status(400).json({ erro: 'O parâmetro data é obrigatório' });
  }

  const contagemPorStatus = await agendamentoModel.contarPorClinicaEData(req.clinicaId, data);
  const totalDoDia = contagemPorStatus.reduce((soma, r) => soma + Number(r.count), 0);
  const canceladas = contagemPorStatus.find((r) => r.status === 'Cancelado');
  const consultasHoje = totalDoDia - (canceladas ? Number(canceladas.count) : 0);

  const confirmadas = contagemPorStatus.find((r) => r.status === 'Confirmado');
  const taxaConfirmacao =
    consultasHoje > 0
      ? Math.round(((confirmadas ? Number(confirmadas.count) : 0) / consultasHoje) * 100)
      : 0;

  const atendidosIa = await conversaModel.contarPorClinicaEData(req.clinicaId, data);
  const pacientesFila = await triagemModel.contarPendentes(req.clinicaId);

  res.json({
    consultas_hoje: consultasHoje,
    atendidos_ia: atendidosIa,
    pacientes_fila: pacientesFila,
    taxa_confirmacao: taxaConfirmacao,
  });
}

module.exports = { resumo };
