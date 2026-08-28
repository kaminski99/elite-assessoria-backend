const pool = require('../db/connection');

async function criar({ clinicaId, pacienteNome, pacienteTelefone, tipo, mensagem }) {
  const { rows } = await pool.query(
    `INSERT INTO conversas (clinica_id, paciente_nome, paciente_telefone, tipo, mensagem)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [clinicaId, pacienteNome, pacienteTelefone, tipo || null, mensagem || null]
  );
  return rows[0];
}

async function contarPorClinicaEData(clinicaId, data) {
  const { rows } = await pool.query(
    `SELECT COUNT(*) FROM conversas WHERE clinica_id = $1 AND criado_em::date = $2`,
    [clinicaId, data]
  );
  return Number(rows[0].count);
}

module.exports = { criar, contarPorClinicaEData };
