const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const clinicaModel = require('../models/clinicaModel');

async function login(req, res) {
  const { clinica_id, senha } = req.body;

  if (!clinica_id || !senha) {
    return res.status(400).json({ erro: 'Os campos clinica_id e senha são obrigatórios' });
  }

  const clinica = await clinicaModel.buscarPorId(clinica_id);
  if (!clinica) {
    return res.status(401).json({ erro: 'Clínica não encontrada' });
  }

  const senhaValida = await bcrypt.compare(senha, clinica.senha_hash);
  if (!senhaValida) {
    return res.status(401).json({ erro: 'Senha incorreta' });
  }

  const token = jwt.sign({ clinica_id: clinica.id }, process.env.JWT_SECRET, { expiresIn: '24h' });

  res.json({
    token,
    clinica: { id: clinica.id, nome: clinica.nome, plano: clinica.plano },
  });
}

// Rota auxiliar (não pedida no escopo original, mas necessária: sem ela
// nenhuma clínica existiria para fazer login). Cria a clínica com senha
// já em hash, pronta para autenticar em /api/login.
async function registrar(req, res) {
  const { nome, plano, whatsapp, senha } = req.body;

  if (!nome || !senha) {
    return res.status(400).json({ erro: 'Os campos nome e senha são obrigatórios' });
  }
  if (senha.length < 6) {
    return res.status(400).json({ erro: 'A senha deve ter pelo menos 6 caracteres' });
  }

  const senhaHash = await bcrypt.hash(senha, 10);
  const clinica = await clinicaModel.criar({ nome, plano, whatsapp, senhaHash });
  res.status(201).json(clinica);
}

module.exports = { login, registrar };
