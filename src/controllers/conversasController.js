const conversaModel = require('../models/conversaModel');

// POST /api/conversas  (pública — usada pela Lanna para registrar cada interação)
async function criar(req, res) {
  const { clinica_id, paciente_nome, paciente_telefone, tipo, mensagem } = req.body;

  if (!clinica_id || !paciente_nome || !paciente_telefone) {
    return res.status(400).json({
      erro: 'Os campos clinica_id, paciente_nome e paciente_telefone são obrigatórios',
    });
  }

  const conversa = await conversaModel.criar({
    clinicaId: clinica_id,
    pacienteNome: paciente_nome,
    pacienteTelefone: paciente_telefone,
    tipo,
    mensagem,
  });

  res.status(201).json(conversa);
}

module.exports = { criar };
