const pool = require('../db/connection');

async function listarPendentes(clinicaId) {
  const { rows } = await pool.query(
    `SELECT * FROM triagens WHERE clinica_id = $1 AND status = 'Pendente' ORDER BY criado_em DESC`,
    [clinicaId]
  );
  return rows;
}

async function contarPendentes(clinicaId) {
  const { rows } = await pool.query(
    `SELECT COUNT(*) FROM triagens WHERE clinica_id = $1 AND status = 'Pendente'`,
    [clinicaId]
  );
  return Number(rows[0].count);
}

async function criar({ clinicaId, pacienteNome, pacienteTelefone, servico }) {
  const { rows } = await pool.query(
    `INSERT INTO triagens (clinica_id, paciente_nome, paciente_telefone, servico, status)
     VALUES ($1, $2, $3, $4, 'Pendente')
     RETURNING *`,
    [clinicaId, pacienteNome, pacienteTelefone, servico]
  );
  return rows[0];
}

async function buscarPorId(id, clinicaId) {
  const { rows } = await pool.query(
    'SELECT * FROM triagens WHERE id = $1 AND clinica_id = $2',
    [id, clinicaId]
  );
  return rows[0];
}

async function atualizarStatus(id, clinicaId, status) {
  const { rows } = await pool.query(
    `UPDATE triagens SET status = $1 WHERE id = $2 AND clinica_id = $3 RETURNING *`,
    [status, id, clinicaId]
  );
  return rows[0];
}

module.exports = { listarPendentes, contarPendentes, criar, buscarPorId, atualizarStatus };
