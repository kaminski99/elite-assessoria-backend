const pool = require('../db/connection');

async function buscarPorId(id) {
  const { rows } = await pool.query('SELECT * FROM clinicas WHERE id = $1', [id]);
  return rows[0];
}

async function criar({ nome, plano, whatsapp, senhaHash }) {
  const { rows } = await pool.query(
    `INSERT INTO clinicas (nome, plano, whatsapp, senha_hash)
     VALUES ($1, $2, $3, $4)
     RETURNING id, nome, plano, whatsapp, criado_em`,
    [nome, plano || 'Básico', whatsapp || null, senhaHash]
  );
  return rows[0];
}

module.exports = { buscarPorId, criar };
