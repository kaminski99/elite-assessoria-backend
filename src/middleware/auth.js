const jwt = require('jsonwebtoken');

// Protege rotas administrativas (dashboard, painel da clínica).
// Exige um token JWT válido emitido em POST /api/login.
function autenticar(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ erro: 'Token não fornecido. Faça login em /api/login.' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.clinicaId = payload.clinica_id;
    next();
  } catch (err) {
    return res.status(401).json({ erro: 'Token inválido ou expirado. Faça login novamente.' });
  }
}

// Proteção opcional para as rotas usadas pela Lanna (bot de WhatsApp), que não
// faz login como uma clínica. Se LANNA_API_KEY estiver definida no ambiente,
// a rota passa a exigir o header "x-lanna-key" com o mesmo valor. Se a
// variável não estiver definida, a rota permanece aberta (comportamento padrão).
function verificarChaveLanna(req, res, next) {
  const chaveEsperada = process.env.LANNA_API_KEY;
  if (!chaveEsperada) {
    return next();
  }

  const chaveRecebida = req.headers['x-lanna-key'];
  if (chaveRecebida !== chaveEsperada) {
    return res.status(401).json({ erro: 'Chave de integração inválida ou ausente' });
  }

  next();
}

module.exports = { autenticar, verificarChaveLanna };
