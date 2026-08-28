const pool = require('../db/connection');

async function listarPorClinicaEData(clinicaId, data) {
  const params = [clinicaId];
  let query = 'SELECT * FROM agendamentos WHERE clinica_id = $1';
  if (data) {
    params.push(data);
    query += ' AND data = $2';
  }
  query += ' ORDER BY data, hora';
  const { rows } = await pool.query(query, params);
  return rows;
}

async function buscarConflito(clinicaId, data, hora) {
  const { rows } = await pool.query(
    `SELECT id FROM agendamentos
     WHERE clinica_id = $1 AND data = $2 AND hora = $3 AND status != 'Cancelado'`,
    [clinicaId, data, hora]
  );
  return rows[0];
}

async function horariosOcupados(clinicaId, data) {
  const { rows } = await pool.query(
    `SELECT hora FROM agendamentos
     WHERE clinica_id = $1 AND data = $2 AND status != 'Cancelado'`,
    [clinicaId, data]
  );
  return rows.map((r) => r.hora.slice(0, 5));
}

async function criar({ clinicaId, pacienteNome, pacienteTelefone, servico, convenio, data, hora, origem }) {
  const { rows } = await pool.query(
    `INSERT INTO agendamentos
       (clinica_id, paciente_nome, paciente_telefone, servico, convenio, data, hora, status, origem)
     VALUES ($1, $2, $3, $4, $5, $6, $7, 'Pendente', $8)
     RETURNING *`,
    [clinicaId, pacienteNome, pacienteTelefone, servico, convenio || null, data, hora, origem || 'painel']
  );
  return rows[0];
}

async function atualizarStatus(id, clinicaId, status) {
  const { rows } = await pool.query(
    `UPDATE agendamentos SET status = $1 WHERE id = $2 AND clinica_id = $3 RETURNING *`,
    [status, id, clinicaId]
  );
  return rows[0];
}

async function porTelefone(clinicaId, telefone) {
  const { rows } = await pool.query(
    `SELECT * FROM agendamentos WHERE clinica_id = $1 AND paciente_telefone = $2
     ORDER BY data DESC, hora DESC`,
    [clinicaId, telefone]
  );
  return rows;
}

async function contarPorClinicaEData(clinicaId, data) {
  const { rows } = await pool.query(
    `SELECT status, COUNT(*) FROM agendamentos WHERE clinica_id = $1 AND data = $2 GROUP BY status`,
    [clinicaId, data]
  );
  return rows;
}

module.exports = {
  listarPorClinicaEData,
  buscarConflito,
  horariosOcupados,
  criar,
  atualizarStatus,
  porTelefone,
  contarPorClinicaEData,
};
