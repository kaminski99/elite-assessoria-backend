const pool = require('../db/connection');

async function listarPorClinica(clinicaId) {
  const { rows } = await pool.query(
    'SELECT * FROM pacientes WHERE clinica_id = $1 ORDER BY nome',
    [clinicaId]
  );
  return rows;
}

async function buscarPorId(id, clinicaId) {
  const { rows } = await pool.query(
    'SELECT * FROM pacientes WHERE id = $1 AND clinica_id = $2',
    [id, clinicaId]
  );
  return rows[0];
}

// Cria o paciente na primeira vez (status "Novo") e, em agendamentos
// seguintes, apenas atualiza os dados e marca como "Ativo".
async function criarOuAtualizar({ clinicaId, nome, telefone, convenio }) {
  const { rows } = await pool.query(
    `INSERT INTO pacientes (clinica_id, nome, telefone, convenio, status)
     VALUES ($1, $2, $3, $4, 'Novo')
     ON CONFLICT (clinica_id, telefone)
     DO UPDATE SET nome = EXCLUDED.nome,
                   convenio = COALESCE(EXCLUDED.convenio, pacientes.convenio),
                   status = 'Ativo'
     RETURNING *`,
    [clinicaId, nome, telefone, convenio || null]
  );
  return rows[0];
}

module.exports = { listarPorClinica, buscarPorId, criarOuAtualizar };
