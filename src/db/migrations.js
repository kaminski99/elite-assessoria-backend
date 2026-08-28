const pool = require('./connection');

const statements = [
  `CREATE TABLE IF NOT EXISTS clinicas (
     id SERIAL PRIMARY KEY,
     nome TEXT NOT NULL,
     plano TEXT NOT NULL DEFAULT 'Básico',
     whatsapp TEXT,
     senha_hash TEXT NOT NULL,
     criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
   )`,

  `CREATE TABLE IF NOT EXISTS pacientes (
     id SERIAL PRIMARY KEY,
     clinica_id INTEGER NOT NULL REFERENCES clinicas(id) ON DELETE CASCADE,
     nome TEXT NOT NULL,
     telefone TEXT NOT NULL,
     convenio TEXT,
     status TEXT NOT NULL DEFAULT 'Novo',
     criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
     UNIQUE (clinica_id, telefone)
   )`,

  `CREATE TABLE IF NOT EXISTS agendamentos (
     id SERIAL PRIMARY KEY,
     clinica_id INTEGER NOT NULL REFERENCES clinicas(id) ON DELETE CASCADE,
     paciente_nome TEXT NOT NULL,
     paciente_telefone TEXT NOT NULL,
     servico TEXT NOT NULL,
     convenio TEXT,
     data DATE NOT NULL,
     hora TIME NOT NULL,
     status TEXT NOT NULL DEFAULT 'Pendente',
     origem TEXT NOT NULL DEFAULT 'painel',
     criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
   )`,

  `CREATE INDEX IF NOT EXISTS idx_agendamentos_clinica_data ON agendamentos (clinica_id, data)`,

  `CREATE TABLE IF NOT EXISTS triagens (
     id SERIAL PRIMARY KEY,
     clinica_id INTEGER NOT NULL REFERENCES clinicas(id) ON DELETE CASCADE,
     paciente_nome TEXT NOT NULL,
     paciente_telefone TEXT NOT NULL,
     servico TEXT NOT NULL,
     status TEXT NOT NULL DEFAULT 'Pendente',
     criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
   )`,

  `CREATE TABLE IF NOT EXISTS conversas (
     id SERIAL PRIMARY KEY,
     clinica_id INTEGER NOT NULL REFERENCES clinicas(id) ON DELETE CASCADE,
     paciente_nome TEXT NOT NULL,
     paciente_telefone TEXT NOT NULL,
     tipo TEXT,
     mensagem TEXT,
     criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
   )`,
];

async function runMigrations() {
  for (const sql of statements) {
    await pool.query(sql);
  }
  console.log('Migrações executadas com sucesso.');
}

if (require.main === module) {
  runMigrations()
    .then(() => pool.end())
    .catch((err) => {
      console.error('Erro ao rodar migrações:', err);
      process.exit(1);
    });
}

module.exports = { runMigrations };
