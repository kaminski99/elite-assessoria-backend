require('dotenv').config();

const express = require('express');
const cors = require('cors');

const authRoutes = require('./src/routes/auth');
const agendamentosRoutes = require('./src/routes/agendamentos');
const pacientesRoutes = require('./src/routes/pacientes');
const triagensRoutes = require('./src/routes/triagens');
const conversasRoutes = require('./src/routes/conversas');
const dashboardRoutes = require('./src/routes/dashboard');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ status: 'ok', servico: 'Elite Assessoria API' });
});

app.use('/api', authRoutes);
app.use('/api', agendamentosRoutes);
app.use('/api', pacientesRoutes);
app.use('/api', triagensRoutes);
app.use('/api', conversasRoutes);
app.use('/api', dashboardRoutes);

// 404 para rotas não mapeadas
app.use((req, res) => {
  res.status(404).json({ erro: 'Rota não encontrada' });
});

// Middleware de erro — sempre por último
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ erro: 'Erro interno do servidor' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
